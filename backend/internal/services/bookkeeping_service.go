package services

import (
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"math"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode"

	"finsight-backend/internal/database"
	"finsight-backend/internal/models"

	"github.com/ledongthuc/pdf"
	"github.com/xuri/excelize/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ─────────────────────────────────────────
// Дефолтные категории (создаются для новой компании)
// ─────────────────────────────────────────

var defaultCategories = []struct {
	Name     string
	Type     string
	Color    string
	Icon     string
	Keywords []string
}{
	{
		Name: "Зарплата", Type: "expense", Color: "#6366f1", Icon: "users",
		Keywords: []string{"salary", "payroll", "зарплата", "зп", "оклад", "выплата сотруднику"},
	},
	{
		Name: "Аренда", Type: "expense", Color: "#f59e0b", Icon: "building",
		Keywords: []string{"rent", "аренда", "office rent", "аренда офиса"},
	},
	{
		Name: "Маркетинг", Type: "expense", Color: "#ec4899", Icon: "megaphone",
		Keywords: []string{"marketing", "реклама", "google ads", "facebook ads", "instagram", "таргет", "продвижение"},
	},
	{
		Name: "Программное обеспечение", Type: "expense", Color: "#14b8a6", Icon: "cpu",
		Keywords: []string{"software", "subscription", "adobe", "quickbooks", "xero", "saas", "подписка", "лицензия"},
	},
	{
		Name: "Коммунальные услуги", Type: "expense", Color: "#8b5cf6", Icon: "zap",
		Keywords: []string{"utilities", "electricity", "internet", "phone", "свет", "интернет", "телефон", "коммунальные"},
	},
	{
		Name: "Офисные расходы", Type: "expense", Color: "#64748b", Icon: "briefcase",
		Keywords: []string{"office", "staples", "amazon business", "канцелярия", "офис", "оргтехника"},
	},
	{
		Name: "Транспорт", Type: "expense", Color: "#0ea5e9", Icon: "car",
		Keywords: []string{"transport", "taxi", "uber", "fuel", "такси", "топливо", "бензин", "доставка"},
	},
	{
		Name: "Еда и представительские", Type: "expense", Color: "#f97316", Icon: "coffee",
		Keywords: []string{"lunch", "dinner", "restaurant", "meal", "food", "обед", "ужин", "ресторан", "кафе"},
	},
	{
		Name: "Продажи", Type: "income", Color: "#22c55e", Icon: "trending-up",
		Keywords: []string{"payment from", "invoice", "sale", "продажа", "выручка", "оплата от", "поступление"},
	},
	{
		Name: "Прочие доходы", Type: "income", Color: "#10b981", Icon: "dollar-sign",
		Keywords: []string{"income", "revenue", "доход", "прибыль", "получено"},
	},
}

// ─────────────────────────────────────────
// Categories CRUD
// ─────────────────────────────────────────

func CreateDefaultCategories(companyID primitive.ObjectID) error {
	ctx := context.Background()
	now := time.Now()
	col := database.Collection("categories")

	for _, dc := range defaultCategories {
		cat := models.Category{
			ID:        primitive.NewObjectID(),
			CompanyID: companyID,
			Name:      dc.Name,
			Type:      dc.Type,
			Color:     dc.Color,
			Icon:      dc.Icon,
			Keywords:  dc.Keywords,
			IsDefault: true,
			CreatedAt: now,
		}
		_, err := col.InsertOne(ctx, cat)
		if err != nil {
			return err
		}
	}
	return nil
}

func GetCategories(companyID string) ([]models.Category, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, fmt.Errorf("invalid company id")
	}
	ctx := context.Background()
	cursor, err := database.Collection("categories").Find(ctx, bson.M{"company_id": objID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var cats []models.Category
	cursor.All(ctx, &cats)
	// Ensure Keywords is never nil (Go nil slice marshals to JSON null)
	for i := range cats {
		if cats[i].Keywords == nil {
			cats[i].Keywords = []string{}
		}
	}
	return cats, nil
}

func CreateCategory(companyID string, input bson.M) (*models.Category, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, fmt.Errorf("invalid company id")
	}
	cat := models.Category{
		ID:        primitive.NewObjectID(),
		CompanyID: objID,
		Name:      fmt.Sprintf("%v", input["name"]),
		Type:      fmt.Sprintf("%v", input["type"]),
		Color:     fmt.Sprintf("%v", input["color"]),
		Icon:      fmt.Sprintf("%v", input["icon"]),
		IsDefault: false,
		CreatedAt: time.Now(),
	}
	if kws, ok := input["keywords"].([]interface{}); ok {
		for _, k := range kws {
			cat.Keywords = append(cat.Keywords, fmt.Sprintf("%v", k))
		}
	}
	_, err = database.Collection("categories").InsertOne(context.Background(), cat)
	return &cat, err
}

func UpdateCategory(catID string, input bson.M) (*models.Category, error) {
	objID, err := primitive.ObjectIDFromHex(catID)
	if err != nil {
		return nil, fmt.Errorf("invalid category id")
	}
	ctx := context.Background()
	updates := bson.M{}
	for k, v := range input {
		if v != nil && v != "" {
			updates[k] = v
		}
	}
	_, err = database.Collection("categories").UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": updates})
	if err != nil {
		return nil, err
	}
	var cat models.Category
	database.Collection("categories").FindOne(ctx, bson.M{"_id": objID}).Decode(&cat)
	return &cat, nil
}

func DeleteCategory(catID string) error {
	objID, err := primitive.ObjectIDFromHex(catID)
	if err != nil {
		return fmt.Errorf("invalid category id")
	}
	_, err = database.Collection("categories").DeleteOne(context.Background(), bson.M{"_id": objID})
	return err
}

// ─────────────────────────────────────────
// Transactions CRUD
// ─────────────────────────────────────────

func GetTransactions(companyID string, filter bson.M) ([]models.Transaction, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, fmt.Errorf("invalid company id")
	}
	filter["company_id"] = objID
	ctx := context.Background()
	opts := options.Find().SetSort(bson.M{"date": -1}).SetLimit(10000)
	cursor, err := database.Collection("transactions").Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var txns []models.Transaction
	cursor.All(ctx, &txns)
	return txns, nil
}

func CreateTransaction(companyID string, t models.Transaction) (*models.Transaction, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, fmt.Errorf("invalid company id")
	}
	t.ID = primitive.NewObjectID()
	t.CompanyID = objID
	t.CreatedAt = time.Now()
	t.UpdatedAt = time.Now()
	_, err = database.Collection("transactions").InsertOne(context.Background(), t)
	return &t, err
}

func UpdateTransaction(txID string, updates bson.M) (*models.Transaction, error) {
	objID, err := primitive.ObjectIDFromHex(txID)
	if err != nil {
		return nil, fmt.Errorf("invalid transaction id")
	}
	updates["updated_at"] = time.Now()
	ctx := context.Background()
	_, err = database.Collection("transactions").UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": updates})
	if err != nil {
		return nil, err
	}
	var t models.Transaction
	database.Collection("transactions").FindOne(ctx, bson.M{"_id": objID}).Decode(&t)
	return &t, nil
}

func DeleteTransaction(txID string) error {
	objID, err := primitive.ObjectIDFromHex(txID)
	if err != nil {
		return fmt.Errorf("invalid transaction id")
	}
	_, err = database.Collection("transactions").DeleteOne(context.Background(), bson.M{"_id": objID})
	return err
}

// ─────────────────────────────────────────
// Автокатегоризация
// ─────────────────────────────────────────

func Categorize(description string, amount float64, categories []models.Category) (catName string, catID *primitive.ObjectID, confidence int, status string) {
	descLower := strings.ToLower(description)

	bestScore := 0
	var bestCat *models.Category

	for i := range categories {
		cat := &categories[i]
		// Тип категории должен совпадать с типом транзакции
		txType := "expense"
		if amount > 0 {
			txType = "income"
		}
		if cat.Type != txType && cat.Type != "both" {
			continue
		}

		score := 0
		for _, kw := range cat.Keywords {
			kwLower := strings.ToLower(kw)
			if strings.Contains(descLower, kwLower) {
				// Точное слово — больше очков
				if isWholeWord(descLower, kwLower) {
					score += 20
				} else {
					score += 10
				}
			}
		}
		if score > bestScore {
			bestScore = score
			bestCat = cat
		}
	}

	if bestCat == nil || bestScore == 0 {
		return "Без категории", nil, 0, "uncategorized"
	}

	// Переводим score в confidence 0-100
	conf := int(math.Min(float64(bestScore*5), 100))
	st := "categorized"
	if conf < 70 {
		st = "needs-review"
	}

	id := bestCat.ID
	return bestCat.Name, &id, conf, st
}

func isWholeWord(text, word string) bool {
	idx := strings.Index(text, word)
	if idx == -1 {
		return false
	}
	before := idx == 0 || !unicode.IsLetter(rune(text[idx-1]))
	after := idx+len(word) >= len(text) || !unicode.IsLetter(rune(text[idx+len(word)]))
	return before && after
}

// ─────────────────────────────────────────
// Парсинг CSV
// ─────────────────────────────────────────

func ParseCSV(r io.Reader) ([]models.ParsedRow, error) {
	reader := csv.NewReader(r)
	reader.LazyQuotes = true
	reader.TrimLeadingSpace = true

	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("csv read error: %w", err)
	}
	if len(records) < 2 {
		return nil, fmt.Errorf("file is empty or has only headers")
	}

	headers := records[0]
	dateIdx, descIdx, amtIdx, incomeIdx, expenseIdx := detectColumns(headers)

	var rows []models.ParsedRow
	for _, rec := range records[1:] {
		if len(rec) == 0 {
			continue
		}
		row := extractRow(rec, dateIdx, descIdx, amtIdx, incomeIdx, expenseIdx)
		if row != nil {
			rows = append(rows, *row)
		}
	}
	return rows, nil
}

// ─────────────────────────────────────────
// Парсинг Excel (.xlsx)
// ─────────────────────────────────────────

func ParseExcel(r io.Reader) ([]models.ParsedRow, error) {
	f, err := excelize.OpenReader(r)
	if err != nil {
		return nil, fmt.Errorf("excel open error: %w", err)
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("no sheets found")
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, err
	}
	if len(rows) < 2 {
		return nil, fmt.Errorf("sheet is empty")
	}

	dateIdx, descIdx, amtIdx, incomeIdx, expenseIdx := detectColumns(rows[0])

	var parsed []models.ParsedRow
	for _, row := range rows[1:] {
		p := extractRow(row, dateIdx, descIdx, amtIdx, incomeIdx, expenseIdx)
		if p != nil {
			parsed = append(parsed, *p)
		}
	}
	return parsed, nil
}

// ─────────────────────────────────────────
// Парсинг PDF
// ─────────────────────────────────────────

// reDate matches DD.MM.YY or DD.MM.YYYY at start of text
var reDate = regexp.MustCompile(`^(\d{2}\.\d{2}\.\d{2,4})`)

// reAmount matches optional sign, digits/spaces/commas, then optional currency symbols
// Examples: "- 200,00", "+ 1 245 516,11", "-200.00"
var reAmount = regexp.MustCompile(`([+\-])\s*([\d][\d\s]*[\d][,.][\d]{2})`)

// opTypes are Kaspi Bank operation type words to strip from description
var opTypes = []string{
	"Покупка", "Перевод", "Пополнение", "Снятие", "Разное",
	"покупка", "перевод", "пополнение", "снятие", "разное",
}

func ParsePDF(r io.Reader) ([]models.ParsedRow, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read pdf: %w", err)
	}

	reader, err := pdf.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("pdf open error: %w", err)
	}

	// Collect all text, page by page
	var allLines []string
	for i := 1; i <= reader.NumPage(); i++ {
		page := reader.Page(i)
		if page.V.IsNull() {
			continue
		}
		text, err := page.GetPlainText(nil)
		if err != nil {
			continue
		}
		for _, line := range strings.Split(text, "\n") {
			line = strings.TrimSpace(line)
			if line != "" {
				allLines = append(allLines, line)
			}
		}
	}

	if len(allLines) == 0 {
		return nil, fmt.Errorf("no text found in PDF")
	}

	var rows []models.ParsedRow

	// Merge continuation lines (lines without a leading date) into the previous line
	var merged []string
	for _, line := range allLines {
		if reDate.MatchString(line) {
			merged = append(merged, line)
		} else if len(merged) > 0 {
			// Continuation line (e.g. USD equivalent line) — append to previous
			merged[len(merged)-1] += " " + line
		}
	}

	for _, line := range merged {
		// Must start with a date
		datMatch := reDate.FindString(line)
		if datMatch == "" {
			continue
		}
		dateStr := parseDate(datMatch)

		// Find sign + amount
		amtMatch := reAmount.FindStringSubmatch(line)
		if amtMatch == nil {
			continue
		}
		sign := amtMatch[1]
		// Remove spaces from amount string (thousands separator), replace comma→dot
		amtRaw := strings.ReplaceAll(amtMatch[2], " ", "")
		amtRaw = strings.ReplaceAll(amtRaw, ",", ".")
		amt, err := strconv.ParseFloat(amtRaw, 64)
		if err != nil || amt == 0 {
			continue
		}
		if sign == "-" {
			amt = -amt
		}

		// Description = everything after the amount match, stripped of currency + op words
		amtEnd := strings.Index(line, amtMatch[0]) + len(amtMatch[0])
		desc := ""
		if amtEnd < len(line) {
			desc = strings.TrimSpace(line[amtEnd:])
		}
		// Strip currency symbols
		for _, cur := range []string{"₸", "T", "USD", "$", "€", "₽"} {
			desc = strings.ReplaceAll(desc, cur, "")
		}
		// Strip operation type words
		for _, op := range opTypes {
			if strings.HasPrefix(strings.TrimSpace(desc), op) {
				desc = strings.TrimSpace(desc[len(op):])
				break
			}
		}
		// Strip trailing parenthetical (e.g. "(+ 480,00 USD)")
		if idx := strings.Index(desc, "("); idx >= 0 {
			desc = strings.TrimSpace(desc[:idx])
		}
		desc = strings.TrimSpace(desc)
		if desc == "" {
			// Fallback: use the date + sign as a label
			if sign == "+" {
				desc = "Пополнение"
			} else {
				desc = "Расход"
			}
		}

		txType := "income"
		if amt < 0 {
			txType = "expense"
		}

		rows = append(rows, models.ParsedRow{
			Date:        dateStr,
			Description: desc,
			Amount:      amt,
			Type:        txType,
		})
	}

	if len(rows) == 0 {
		// Debug: show first 800 chars of extracted text to understand the format
		sample := ""
		for i, l := range allLines {
			if i >= 30 {
				break
			}
			sample += fmt.Sprintf("[%d] %q\n", i, l)
		}
		return nil, fmt.Errorf("no transactions found in PDF.\n\nExtracted text sample:\n%s", sample)
	}
	return rows, nil
}

// ─────────────────────────────────────────
// Определение колонок по заголовкам
// ─────────────────────────────────────────

func detectColumns(headers []string) (dateIdx, descIdx, amtIdx, incomeIdx, expenseIdx int) {
	dateIdx, descIdx, amtIdx, incomeIdx, expenseIdx = -1, -1, -1, -1, -1

	dateKws    := []string{"date", "дата", "дату", "period", "период"}
	descKws    := []string{"description", "desc", "name", "назван", "описан", "наименован", "операция", "контрагент"}
	amtKws     := []string{"amount", "сумма", "sum", "total", "итого"}
	incomeKws  := []string{"income", "credit", "приход", "поступлен", "доход", "зачислен"}
	expenseKws := []string{"expense", "debit", "расход", "списан", "трата"}

	for i, h := range headers {
		hl := strings.ToLower(h)
		switch {
		case matchAny(hl, dateKws) && dateIdx == -1:
			dateIdx = i
		case matchAny(hl, descKws) && descIdx == -1:
			descIdx = i
		case matchAny(hl, incomeKws) && incomeIdx == -1:
			incomeIdx = i
		case matchAny(hl, expenseKws) && expenseIdx == -1:
			expenseIdx = i
		case matchAny(hl, amtKws) && amtIdx == -1:
			amtIdx = i
		}
	}
	// Fallback — первые 3 колонки
	if dateIdx == -1 && len(headers) > 0 {
		dateIdx = 0
	}
	if descIdx == -1 && len(headers) > 1 {
		descIdx = 1
	}
	if amtIdx == -1 && incomeIdx == -1 && len(headers) > 2 {
		amtIdx = 2
	}
	return
}

func matchAny(s string, keywords []string) bool {
	for _, k := range keywords {
		if strings.Contains(s, k) {
			return true
		}
	}
	return false
}

func extractRow(rec []string, dateIdx, descIdx, amtIdx, incomeIdx, expenseIdx int) *models.ParsedRow {
	getCell := func(idx int) string {
		if idx >= 0 && idx < len(rec) {
			return strings.TrimSpace(rec[idx])
		}
		return ""
	}

	dateStr := getCell(dateIdx)
	desc    := getCell(descIdx)
	if desc == "" {
		return nil
	}

	// Парсинг даты
	parsedDate := parseDate(dateStr)

	// Парсинг суммы
	var amount float64
	txType := "expense"

	if incomeIdx >= 0 || expenseIdx >= 0 {
		// Отдельные колонки дохода/расхода
		incStr := cleanNumber(getCell(incomeIdx))
		expStr := cleanNumber(getCell(expenseIdx))
		incAmt, _ := strconv.ParseFloat(incStr, 64)
		expAmt, _ := strconv.ParseFloat(expStr, 64)
		if incAmt > 0 {
			amount = incAmt
			txType = "income"
		} else if expAmt > 0 {
			amount = -expAmt
			txType = "expense"
		} else {
			return nil
		}
	} else if amtIdx >= 0 {
		amtStr := cleanNumber(getCell(amtIdx))
		amt, err := strconv.ParseFloat(amtStr, 64)
		if err != nil || amt == 0 {
			return nil
		}
		amount = amt
		if amount > 0 {
			txType = "income"
		} else {
			txType = "expense"
		}
	} else {
		return nil
	}

	return &models.ParsedRow{
		Date:        parsedDate,
		Description: desc,
		Amount:      amount,
		Type:        txType,
	}
}

func parseDate(s string) string {
	if s == "" {
		return time.Now().Format("2006-01-02")
	}
	formats := []string{
		"2006-01-02", "02.01.2006", "01/02/2006", "2006/01/02",
		"02-01-2006", "January 2, 2006", "2 January 2006",
		"02.01.06", "01/02/06",
	}
	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return t.Format("2006-01-02")
		}
	}
	return time.Now().Format("2006-01-02")
}

func cleanNumber(s string) string {
	// Убираем пробелы, валюту, заменяем запятую
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, " ", "")
	s = strings.ReplaceAll(s, ",", ".")
	// Убираем символы валют
	for _, r := range []string{"$", "€", "₸", "₽", "£", "¥"} {
		s = strings.ReplaceAll(s, r, "")
	}
	// Убираем все нецифровые кроме - и .
	var res strings.Builder
	for _, c := range s {
		if c == '-' || c == '.' || (c >= '0' && c <= '9') {
			res.WriteRune(c)
		}
	}
	return res.String()
}

// ─────────────────────────────────────────
// Конвертация ParsedRow → Transaction
// ─────────────────────────────────────────

func RowsToTransactions(companyID string, rows []models.ParsedRow, sourceFile string, categories []models.Category) ([]models.Transaction, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	var txns []models.Transaction

	for _, row := range rows {
		t, _ := time.Parse("2006-01-02", row.Date)
		catName, catID, confidence, status := Categorize(row.Description, row.Amount, categories)

		txn := models.Transaction{
			ID:          primitive.NewObjectID(),
			CompanyID:   objID,
			Date:        t,
			Description: row.Description,
			Amount:      row.Amount,
			Type:        row.Type,
			Category:    catName,
			CategoryID:  catID,
			Status:      status,
			Confidence:  confidence,
			SourceFile:  sourceFile,
			Month:       int(t.Month()),
			Year:        t.Year(),
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		txns = append(txns, txn)
	}
	return txns, nil
}

// AutoCategorizeByDescription — обновляет категорию у всех транзакций компании,
// чьё описание содержит заданную строку (case-insensitive).
// Возвращает количество обновлённых документов.
func AutoCategorizeByDescription(companyID, descMatch, category, txType string) (int, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return 0, fmt.Errorf("invalid company id")
	}
	ctx := context.Background()

	// QuoteMeta экранирует спецсимволы regex: (, ), [, ], ., +, *, ? и др.
	// Используем case-insensitive regex, чтобы совпадать с банковскими описаниями в любом регистре.
	// "^...$" — точное совпадение всей строки, $options:"i" — без учёта регистра.
	safeDesc := "^" + regexp.QuoteMeta(strings.TrimSpace(descMatch)) + "$"
	filter := bson.M{
		"company_id": objID,
		"description": bson.M{
			"$regex":   safeDesc,
			"$options": "i",
		},
	}
	update := bson.M{"$set": bson.M{
		"category":   category,
		"status":     "categorized",
		"confidence": 100,
		"updated_at": time.Now(),
	}}
	if txType != "" {
		update["$set"].(bson.M)["type"] = txType
	}

	res, err := database.Collection("transactions").UpdateMany(ctx, filter, update)
	if err != nil {
		return 0, err
	}
	return int(res.ModifiedCount), nil
}

func SaveTransactions(txns []models.Transaction) error {
	if len(txns) == 0 {
		return nil
	}
	ctx := context.Background()
	docs := make([]interface{}, len(txns))
	for i, t := range txns {
		docs[i] = t
	}
	_, err := database.Collection("transactions").InsertMany(ctx, docs)
	return err
}

// ─────────────────────────────────────────
// Stats для дашборда bookkeeping (легковесные, без загрузки документов)
// ─────────────────────────────────────────

type BookkeepingStats struct {
	TotalTransactions int     `json:"total_transactions"`
	Categorized       int     `json:"categorized"`
	NeedsReview       int     `json:"needs_review"`
	TotalIncome       float64 `json:"total_income"`
	TotalExpenses     float64 `json:"total_expenses"`
}

// ─────────────────────────────────────────
// DashboardStats — всё для дашбордов за 1 MongoDB-запрос ($facet aggregation)
// ─────────────────────────────────────────

type MonthlyStatsPoint struct {
	Year     int     `json:"year"`
	Month    int     `json:"month"`
	Income   float64 `json:"income"`
	Expenses float64 `json:"expenses"`
}

type CategoryStatsPoint struct {
	Name  string  `json:"name"`
	Total float64 `json:"total"`
}

type FlaggedMonthPoint struct {
	Year  int `json:"year"`
	Month int `json:"month"`
	Count int `json:"count"`
}

type DashboardStats struct {
	TotalTransactions    int                  `json:"total_transactions"`
	Categorized          int                  `json:"categorized"`
	NeedsReview          int                  `json:"needs_review"`
	TotalIncome          float64              `json:"total_income"`
	TotalExpenses        float64              `json:"total_expenses"`
	CurrentMonthIncome   float64              `json:"current_month_income"`
	CurrentMonthExpenses float64              `json:"current_month_expenses"`
	Monthly              []MonthlyStatsPoint  `json:"monthly"`
	Categories           []CategoryStatsPoint `json:"categories"`
	FlaggedMonthly       []FlaggedMonthPoint  `json:"flagged_monthly"`
	Flagged              []models.Transaction `json:"flagged"`
	Recent               []models.Transaction `json:"recent"`
}

func GetDashboardStats(companyID string) (*DashboardStats, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, fmt.Errorf("invalid company id")
	}

	now := time.Now()
	curMonth := int(now.Month())
	curYear := now.Year()

	ctx := context.Background()
	col := database.Collection("transactions")

	// $facet — один round-trip вместо загрузки всех документов
	pipeline := bson.A{
		bson.M{"$match": bson.M{"company_id": objID}},
		bson.M{"$facet": bson.M{
			// Суммарные KPI
			"totals": bson.A{
				bson.M{"$group": bson.M{
					"_id":          nil,
					"total":        bson.M{"$sum": 1},
					"categorized":  bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$eq": bson.A{"$status", "categorized"}}, 1, 0}}},
					"needs_review": bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$eq": bson.A{"$status", "needs-review"}}, 1, 0}}},
					"income":       bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$gt": bson.A{"$amount", 0}}, "$amount", 0}}},
					"expenses":     bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$lt": bson.A{"$amount", 0}}, bson.M{"$abs": "$amount"}, 0}}},
					"cur_income":   bson.M{"$sum": bson.M{"$cond": bson.A{
						bson.M{"$and": bson.A{
							bson.M{"$gt": bson.A{"$amount", 0}},
							bson.M{"$eq": bson.A{"$month", curMonth}},
							bson.M{"$eq": bson.A{"$year", curYear}},
						}}, "$amount", 0,
					}}},
					"cur_expenses": bson.M{"$sum": bson.M{"$cond": bson.A{
						bson.M{"$and": bson.A{
							bson.M{"$lt": bson.A{"$amount", 0}},
							bson.M{"$eq": bson.A{"$month", curMonth}},
							bson.M{"$eq": bson.A{"$year", curYear}},
						}}, bson.M{"$abs": "$amount"}, 0,
					}}},
				}},
			},
			// Помесячная динамика (доходы/расходы)
			"monthly": bson.A{
				bson.M{"$match": bson.M{"month": bson.M{"$gt": 0}, "year": bson.M{"$gt": 0}}},
				bson.M{"$group": bson.M{
					"_id":      bson.M{"year": "$year", "month": "$month"},
					"income":   bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$gt": bson.A{"$amount", 0}}, "$amount", 0}}},
					"expenses": bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$lt": bson.A{"$amount", 0}}, bson.M{"$abs": "$amount"}, 0}}},
				}},
				bson.D{{Key: "$sort", Value: bson.D{{Key: "_id.year", Value: 1}, {Key: "_id.month", Value: 1}}}},
			},
			// Топ-8 категорий расходов
			"categories": bson.A{
				bson.M{"$match": bson.M{"amount": bson.M{"$lt": 0}}},
				bson.M{"$group": bson.M{
					"_id":   "$category",
					"total": bson.M{"$sum": bson.M{"$abs": "$amount"}},
				}},
				bson.M{"$sort": bson.M{"total": -1}},
				bson.M{"$limit": 8},
			},
			// Помесячное кол-во флагованных
			"flagged_monthly": bson.A{
				bson.M{"$match": bson.M{"status": "needs-review", "month": bson.M{"$gt": 0}, "year": bson.M{"$gt": 0}}},
				bson.M{"$group": bson.M{
					"_id":   bson.M{"year": "$year", "month": "$month"},
					"count": bson.M{"$sum": 1},
				}},
				bson.D{{Key: "$sort", Value: bson.D{{Key: "_id.year", Value: 1}, {Key: "_id.month", Value: 1}}}},
			},
			// Последние 10 транзакций
			"recent": bson.A{
				bson.M{"$sort": bson.M{"date": -1}},
				bson.M{"$limit": 10},
			},
			// Флагованные транзакции (до 100)
			"flagged": bson.A{
				bson.M{"$match": bson.M{"status": "needs-review"}},
				bson.M{"$sort": bson.M{"date": -1}},
				bson.M{"$limit": 100},
			},
		}},
	}

	cursor, err := col.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []struct {
		Totals []struct {
			Total       int     `bson:"total"`
			Categorized int     `bson:"categorized"`
			NeedsReview int     `bson:"needs_review"`
			Income      float64 `bson:"income"`
			Expenses    float64 `bson:"expenses"`
			CurIncome   float64 `bson:"cur_income"`
			CurExpenses float64 `bson:"cur_expenses"`
		} `bson:"totals"`
		Monthly []struct {
			ID struct {
				Year  int `bson:"year"`
				Month int `bson:"month"`
			} `bson:"_id"`
			Income   float64 `bson:"income"`
			Expenses float64 `bson:"expenses"`
		} `bson:"monthly"`
		Categories []struct {
			Name  string  `bson:"_id"`
			Total float64 `bson:"total"`
		} `bson:"categories"`
		FlaggedMonthly []struct {
			ID struct {
				Year  int `bson:"year"`
				Month int `bson:"month"`
			} `bson:"_id"`
			Count int `bson:"count"`
		} `bson:"flagged_monthly"`
		Recent  []models.Transaction `bson:"recent"`
		Flagged []models.Transaction `bson:"flagged"`
	}

	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	stats := &DashboardStats{
		Monthly:        []MonthlyStatsPoint{},
		Categories:     []CategoryStatsPoint{},
		FlaggedMonthly: []FlaggedMonthPoint{},
		Flagged:        []models.Transaction{},
		Recent:         []models.Transaction{},
	}
	if len(results) == 0 {
		return stats, nil
	}

	r := results[0]
	if len(r.Totals) > 0 {
		t := r.Totals[0]
		stats.TotalTransactions = t.Total
		stats.Categorized = t.Categorized
		stats.NeedsReview = t.NeedsReview
		stats.TotalIncome = t.Income
		stats.TotalExpenses = t.Expenses
		stats.CurrentMonthIncome = t.CurIncome
		stats.CurrentMonthExpenses = t.CurExpenses
	}
	for _, m := range r.Monthly {
		stats.Monthly = append(stats.Monthly, MonthlyStatsPoint{
			Year: m.ID.Year, Month: m.ID.Month,
			Income: m.Income, Expenses: m.Expenses,
		})
	}
	for _, c := range r.Categories {
		stats.Categories = append(stats.Categories, CategoryStatsPoint{Name: c.Name, Total: c.Total})
	}
	for _, fm := range r.FlaggedMonthly {
		stats.FlaggedMonthly = append(stats.FlaggedMonthly, FlaggedMonthPoint{
			Year: fm.ID.Year, Month: fm.ID.Month, Count: fm.Count,
		})
	}
	if r.Recent != nil {
		stats.Recent = r.Recent
	}
	if r.Flagged != nil {
		stats.Flagged = r.Flagged
	}
	return stats, nil
}

// ─────────────────────────────────────────
// Пагинированная выборка транзакций
// ─────────────────────────────────────────

func GetTransactionsPaginated(companyID string, filter bson.M, page, limit int) ([]models.Transaction, int64, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid company id")
	}
	filter["company_id"] = objID
	ctx := context.Background()
	col := database.Collection("transactions")

	total, err := col.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	skip := int64((page - 1) * limit)
	opts := options.Find().
		SetSort(bson.D{{Key: "date", Value: -1}}).
		SetSkip(skip).
		SetLimit(int64(limit))

	cursor, err := col.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var txns []models.Transaction
	cursor.All(ctx, &txns)
	if txns == nil {
		txns = []models.Transaction{}
	}
	return txns, total, nil
}

func GetBookkeepingStats(companyID string) (*BookkeepingStats, error) {
	s, err := GetDashboardStats(companyID)
	if err != nil {
		return nil, err
	}
	return &BookkeepingStats{
		TotalTransactions: s.TotalTransactions,
		Categorized:       s.Categorized,
		NeedsReview:       s.NeedsReview,
		TotalIncome:       s.TotalIncome,
		TotalExpenses:     s.TotalExpenses,
	}, nil
}

// ─────────────────────────────────────────
// ОПиУ — Отчёт о прибылях и убытках (начисление, не кассовый метод)
// ─────────────────────────────────────────

// CategoryAmount — одна строка расходов по конкретной категории клиента.
type CategoryAmount struct {
	Category string  `json:"category"`
	Amount   float64 `json:"amount"`
}

// PnLMonth — динамическая структура: категории берутся из реальных транзакций,
// а не из заранее заданных статей.
type PnLMonth struct {
	Year  int `json:"year"`
	Month int `json:"month"`

	// ── Выручка ──────────────────────────────
	Revenue float64 `json:"revenue"`

	// ── Переменные расходы (динамические категории) ───────────────
	VariableCosts []CategoryAmount `json:"variable_costs"`
	VarTotal      float64          `json:"var_total"`
	// Рассчитывается: Revenue − VarTotal
	GrossProfit float64 `json:"gross_profit"`

	// ── Постоянные расходы (динамические категории) ───────────────
	FixedCosts []CategoryAmount `json:"fixed_costs"`
	FixedTotal float64          `json:"fixed_total"`
	// Рассчитывается: GrossProfit − FixedTotal
	OperatingProfit float64 `json:"operating_profit"`

	// ── Ниже EBITDA (динамические категории) ─────────────────────
	BelowEbitda     []CategoryAmount `json:"below_ebitda"`
	BelowEbitdaTotal float64         `json:"below_ebitda_total"`
	// Рассчитывается: OperatingProfit − BelowEbitdaTotal
	NetProfit float64 `json:"net_profit"`
}

// classifyExpense определяет секцию для категории расходов:
// "variable", "below", или "fixed" (по умолчанию).
func classifyExpense(cat string) string {
	c := strings.ToLower(cat)
	// ── Ниже EBITDA ───────────────────────────────────────────────
	if strings.Contains(c, "амортиз") || strings.Contains(c, "deprec") ||
		strings.Contains(c, "процент") || strings.Contains(c, "кредит") ||
		strings.Contains(c, "loan") || strings.Contains(c, "заём") ||
		strings.Contains(c, "налог") || strings.Contains(c, "tax") ||
		strings.Contains(c, "ндс") || strings.Contains(c, "ндфл") || strings.Contains(c, "нпд") {
		return "below"
	}
	// ── Переменные ────────────────────────────────────────────────
	if strings.Contains(c, "эквайр") || strings.Contains(c, "acquiring") ||
		strings.Contains(c, "маркет") || strings.Contains(c, "реклам") ||
		strings.Contains(c, "market") || strings.Contains(c, "продвижен") ||
		strings.Contains(c, "kpi") || strings.Contains(c, "бонус") ||
		strings.Contains(c, "bonus") || strings.Contains(c, "% от продаж") ||
		strings.Contains(c, "доставк") || strings.Contains(c, "delivery") ||
		strings.Contains(c, "логистик") || strings.Contains(c, "курьер") ||
		strings.Contains(c, "транспорт") {
		return "variable"
	}
	// ── Постоянные (по умолчанию) ─────────────────────────────────
	return "fixed"
}

func GetPnL(companyID string) ([]PnLMonth, error) {
	txns, err := GetTransactions(companyID, bson.M{})
	if err != nil {
		return nil, err
	}
	products, _ := GetProducts(companyID)

	// Индекс товаров по ID и по имени (для расчёта себестоимости COGS)
	type pEntry struct{ CostPrice float64 }
	prodMap := make(map[string]pEntry)
	prodNameMap := make(map[string]pEntry)
	for _, p := range products {
		prodMap[p.ID.Hex()] = pEntry{CostPrice: p.CostPrice}
		prodNameMap[strings.ToLower(p.Name)] = pEntry{CostPrice: p.CostPrice}
	}

	// Загружаем категории компании и строим карту переопределений секций ОПиУ.
	// Если у категории задан pnl_section — он имеет приоритет над keyword-классификацией.
	cats, _ := GetCategories(companyID)
	catSectionOverride := make(map[string]string) // lowercase name → section
	for _, c := range cats {
		if c.PnlSection != "" {
			catSectionOverride[strings.ToLower(c.Name)] = c.PnlSection
		}
	}
	resolveSection := func(catName string) string {
		if s, ok := catSectionOverride[strings.ToLower(catName)]; ok {
			return s
		}
		return classifyExpense(catName)
	}

	// Внутренний аккумулятор на период: категория → сумма, по секциям
	type monthAcc struct {
		Year     int
		Month    int
		Revenue  float64
		COGS     float64            // себестоимость из товаров
		Variable map[string]float64 // категория → сумма
		Fixed    map[string]float64
		Below    map[string]float64
	}
	months := make(map[string]*monthAcc)

	for _, t := range txns {
		// Период начисления
		aMonth := t.Month
		aYear := t.Year
		if aMonth == 0 || aYear == 0 || t.Amount > 0 {
			aMonth = int(t.Date.Month())
			aYear = t.Date.Year()
		}

		key := fmt.Sprintf("%d-%02d", aYear, aMonth)
		if months[key] == nil {
			months[key] = &monthAcc{
				Year: aYear, Month: aMonth,
				Variable: make(map[string]float64),
				Fixed:    make(map[string]float64),
				Below:    make(map[string]float64),
			}
		}
		acc := months[key]

		isIncome := t.Type == "income" || t.Type == "transfer_in" ||
			(t.Amount > 0 && t.Type != "expense" && t.Type != "transfer_out")

		if isIncome {
			acc.Revenue += math.Abs(t.Amount)
			// Себестоимость проданных товаров
			qty := t.Quantity
			if qty <= 0 {
				qty = 1
			}
			if t.ProductID != nil {
				if prod, ok := prodMap[t.ProductID.Hex()]; ok {
					acc.COGS += qty * prod.CostPrice
				}
			} else if t.ProductName != "" {
				if prod, ok := prodNameMap[strings.ToLower(t.ProductName)]; ok {
					acc.COGS += qty * prod.CostPrice
				}
			}
		} else if t.Type != "transfer_out" {
			amt := math.Abs(t.Amount)
			catName := t.Category
			if catName == "" {
				catName = "Без категории"
			}
			section := resolveSection(catName)
			switch section {
			case "variable":
				acc.Variable[catName] += amt
			case "below":
				acc.Below[catName] += amt
			default:
				acc.Fixed[catName] += amt
			}
		}
	}

	// Вспомогательная: map → отсортированный []CategoryAmount
	toSlice := func(m map[string]float64) []CategoryAmount {
		out := make([]CategoryAmount, 0, len(m))
		for cat, amt := range m {
			if amt > 0 {
				out = append(out, CategoryAmount{Category: cat, Amount: amt})
			}
		}
		sort.Slice(out, func(i, j int) bool { return out[i].Category < out[j].Category })
		return out
	}

	result := make([]PnLMonth, 0, len(months))
	for _, acc := range months {
		m := PnLMonth{Year: acc.Year, Month: acc.Month, Revenue: acc.Revenue}

		// Переменные расходы: COGS + категории
		m.VariableCosts = toSlice(acc.Variable)
		if acc.COGS > 0 {
			m.VariableCosts = append([]CategoryAmount{{Category: "Себестоимость (COGS)", Amount: acc.COGS}}, m.VariableCosts...)
		}
		for _, c := range m.VariableCosts {
			m.VarTotal += c.Amount
		}
		m.GrossProfit = m.Revenue - m.VarTotal

		// Постоянные расходы
		m.FixedCosts = toSlice(acc.Fixed)
		for _, c := range m.FixedCosts {
			m.FixedTotal += c.Amount
		}
		m.OperatingProfit = m.GrossProfit - m.FixedTotal

		// Ниже EBITDA
		m.BelowEbitda = toSlice(acc.Below)
		for _, c := range m.BelowEbitda {
			m.BelowEbitdaTotal += c.Amount
		}
		m.NetProfit = m.OperatingProfit - m.BelowEbitdaTotal

		result = append(result, m)
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].Year != result[j].Year {
			return result[i].Year < result[j].Year
		}
		return result[i].Month < result[j].Month
	})
	return result, nil
}
