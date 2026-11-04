package handlers

import (
	"bytes"
	"fmt"
	"io"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"finsight-backend/internal/models"
	"finsight-backend/internal/services"
	"finsight-backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ─────────────────────────────────────────
// POST /api/companies/:id/upload
// Загрузка и парсинг файла (CSV / XLSX / PDF)
// ─────────────────────────────────────────

func UploadFile(c *gin.Context) {
	companyID := c.Param("id")

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "file is required")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".csv" && ext != ".xlsx" && ext != ".xls" && ext != ".pdf" {
		utils.BadRequest(c, "unsupported file type. Use CSV, XLSX or PDF")
		return
	}

	// Читаем файл в память
	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, file); err != nil {
		utils.InternalError(c, "failed to read file")
		return
	}

	// Загружаем категории компании для автокатегоризации
	cats, _ := services.GetCategories(companyID)
	if len(cats) == 0 {
		// Создаём дефолтные категории
		objID, _ := primitive.ObjectIDFromHex(companyID)
		_ = services.CreateDefaultCategories(objID)
		cats, _ = services.GetCategories(companyID)
	}

	// Парсинг в зависимости от типа файла
	var rows []models.ParsedRow
	switch ext {
	case ".csv":
		rows, err = services.ParseCSV(bytes.NewReader(buf.Bytes()))
	case ".xlsx", ".xls":
		rows, err = services.ParseExcel(bytes.NewReader(buf.Bytes()))
	case ".pdf":
		rows, err = services.ParsePDF(bytes.NewReader(buf.Bytes()))
	}

	if err != nil {
		utils.BadRequest(c, fmt.Sprintf("parse error: %s", err.Error()))
		return
	}
	if len(rows) == 0 {
		utils.BadRequest(c, "no transactions found in file")
		return
	}

	// Конвертируем строки → транзакции с автокатегоризацией
	txns, err := services.RowsToTransactions(companyID, rows, header.Filename, cats)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	// Сохраняем в MongoDB
	if err := services.SaveTransactions(txns); err != nil {
		utils.InternalError(c, "failed to save transactions")
		return
	}

	utils.OK(c, gin.H{
		"parsed":       len(rows),
		"saved":        len(txns),
		"filename":     header.Filename,
		"transactions": txns,
	})
}

// ─────────────────────────────────────────
// GET /api/companies/:id/transactions
// ─────────────────────────────────────────

func GetTransactions(c *gin.Context) {
	companyID := c.Param("id")

	filter := bson.M{}
	if t := c.Query("type"); t != "" {
		filter["type"] = t
	}
	if cat := c.Query("category"); cat != "" {
		filter["category"] = cat
	}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if search := c.Query("search"); search != "" {
		filter["description"] = bson.M{"$regex": search, "$options": "i"}
	}

	page, limit := 1, 100
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if l := c.Query("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 && v <= 500 {
			limit = v
		}
	}

	txns, total, err := services.GetTransactionsPaginated(companyID, filter, page, limit)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.OK(c, gin.H{
		"transactions": txns,
		"total":        total,
		"page":         page,
		"limit":        limit,
	})
}

// GET /api/companies/:id/bookkeeping/dashboard
func GetDashboardStatsHandler(c *gin.Context) {
	companyID := c.Param("id")
	stats, err := services.GetDashboardStats(companyID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, stats)
}

// ─────────────────────────────────────────
// POST /api/companies/:id/transactions
// Ручное добавление транзакции
// ─────────────────────────────────────────

func CreateTransaction(c *gin.Context) {
	companyID := c.Param("id")

	var body struct {
		Date        string  `json:"date"`
		Description string  `json:"description" binding:"required"`
		Amount      float64 `json:"amount"      binding:"required"`
		Type        string  `json:"type"`
		Category    string  `json:"category"`
		Month       int     `json:"month"`
		Year        int     `json:"year"`
		ProductName string  `json:"product_name"`
		Quantity    float64 `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	txType := body.Type
	if txType == "" {
		if body.Amount > 0 {
			txType = "income"
		} else {
			txType = "expense"
		}
	}

	date := time.Now()
	if body.Date != "" {
		if t, err := time.Parse("2006-01-02", body.Date); err == nil {
			date = t
		}
	}

	category := body.Category
	status := "categorized"
	confidence := 100
	if category == "" {
		// Автокатегоризация
		cats, _ := services.GetCategories(companyID)
		category, _, confidence, status = services.Categorize(body.Description, body.Amount, cats)
	}

	month := body.Month
	year := body.Year
	if month == 0 {
		month = int(date.Month())
	}
	if year == 0 {
		year = date.Year()
	}

	t := models.Transaction{
		Date:        date,
		Description: body.Description,
		Amount:      body.Amount,
		Type:        txType,
		Category:    category,
		Status:      status,
		Confidence:  confidence,
		Month:       month,
		Year:        year,
		ProductName: body.ProductName,
		Quantity:    body.Quantity,
	}

	created, err := services.CreateTransaction(companyID, t)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Created(c, created)
}

// ─────────────────────────────────────────
// PUT /api/companies/:id/transactions/:txId
// ─────────────────────────────────────────

func UpdateTransaction(c *gin.Context) {
	txID := c.Param("txId")

	var body struct {
		Description string  `json:"description"`
		Amount      float64 `json:"amount"`
		Type        string  `json:"type"`
		Category    string  `json:"category"`
		Status      string  `json:"status"`
		Month       int     `json:"month"`
		Year        int     `json:"year"`
		ProductName string  `json:"product_name"`
		ProductID   string  `json:"product_id"`
		Quantity    float64 `json:"quantity"`
		Bank        string  `json:"bank"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	updates := bson.M{}
	if body.Description != "" {
		updates["description"] = body.Description
	}
	if body.Amount != 0 {
		updates["amount"] = body.Amount
	}
	// Type is set explicitly — supports income | expense | transfer_in | transfer_out
	if body.Type != "" {
		updates["type"] = body.Type
	} else if body.Amount != 0 {
		if body.Amount > 0 {
			updates["type"] = "income"
		} else {
			updates["type"] = "expense"
		}
	}
	if body.Category != "" {
		updates["category"] = body.Category
		updates["status"] = "categorized"
		updates["confidence"] = 100
	}
	if body.Status != "" {
		updates["status"] = body.Status
	}
	if body.Month > 0 {
		updates["month"] = body.Month
	}
	if body.Year > 0 {
		updates["year"] = body.Year
	}
	if body.ProductName != "" {
		updates["product_name"] = body.ProductName
	}
	if body.Quantity > 0 {
		updates["quantity"] = body.Quantity
	}
	if body.Bank != "" {
		updates["bank"] = body.Bank
	}
	if body.ProductID != "" {
		if oid, err := primitive.ObjectIDFromHex(body.ProductID); err == nil {
			updates["product_id"] = oid
		}
	}

	t, err := services.UpdateTransaction(txID, updates)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, t)
}

// ─────────────────────────────────────────
// POST /api/companies/:id/transactions/auto-categorize
// Применить категорию ко всем транзакциям с похожим описанием
// ─────────────────────────────────────────

func AutoCategorizeByDescription(c *gin.Context) {
	companyID := c.Param("id")

	var body struct {
		Description string `json:"description" binding:"required"`
		Category    string `json:"category"    binding:"required"`
		Type        string `json:"type"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	count, err := services.AutoCategorizeByDescription(companyID, body.Description, body.Category, body.Type)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, gin.H{"updated": count})
}

// ─────────────────────────────────────────
// DELETE /api/companies/:id/transactions/:txId
// ─────────────────────────────────────────

func DeleteTransaction(c *gin.Context) {
	txID := c.Param("txId")
	if err := services.DeleteTransaction(txID); err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OKMsg(c, "transaction deleted")
}

// ─────────────────────────────────────────
// GET /api/companies/:id/bookkeeping/stats
// ─────────────────────────────────────────

func GetBookkeepingStats(c *gin.Context) {
	companyID := c.Param("id")
	stats, err := services.GetBookkeepingStats(companyID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, stats)
}

// ─────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────

// GET /api/companies/:id/categories
func GetCategories(c *gin.Context) {
	companyID := c.Param("id")
	cats, err := services.GetCategories(companyID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, cats)
}

// POST /api/companies/:id/categories
func CreateCategory(c *gin.Context) {
	companyID := c.Param("id")
	var body bson.M
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	cat, err := services.CreateCategory(companyID, body)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Created(c, cat)
}

// PUT /api/companies/:id/categories/:catId
func UpdateCategory(c *gin.Context) {
	catID := c.Param("catId")
	var body bson.M
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	cat, err := services.UpdateCategory(catID, body)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, cat)
}

// DELETE /api/companies/:id/categories/:catId
func DeleteCategory(c *gin.Context) {
	catID := c.Param("catId")
	if err := services.DeleteCategory(catID); err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OKMsg(c, "category deleted")
}

// POST /api/companies/:id/categories/init — создать дефолтные категории
func InitDefaultCategories(c *gin.Context) {
	companyID := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		utils.BadRequest(c, "invalid company id")
		return
	}
	// Не создаём если уже есть
	existing, _ := services.GetCategories(companyID)
	if len(existing) > 0 {
		utils.OK(c, existing)
		return
	}
	if err := services.CreateDefaultCategories(objID); err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	cats, _ := services.GetCategories(companyID)
	utils.Created(c, cats)
}
