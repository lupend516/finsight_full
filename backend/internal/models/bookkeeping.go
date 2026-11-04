package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ─────────────────────────────────────────
// Transaction — одна транзакция (доход или расход)
// ─────────────────────────────────────────

type Transaction struct {
	ID          primitive.ObjectID  `bson:"_id,omitempty"       json:"id"`
	CompanyID   primitive.ObjectID  `bson:"company_id"          json:"company_id"`
	Date        time.Time           `bson:"date"                json:"date"`
	Description string              `bson:"description"         json:"description"`
	Amount      float64             `bson:"amount"              json:"amount"`   // + доход, - расход
	Type        string              `bson:"type"                json:"type"`     // income | expense
	Category    string              `bson:"category"            json:"category"`
	CategoryID  *primitive.ObjectID `bson:"category_id,omitempty" json:"category_id,omitempty"`
	Status      string              `bson:"status"              json:"status"`      // categorized | needs-review | uncategorized
	Confidence  int                 `bson:"confidence"          json:"confidence"`  // 0-100
	SourceFile  string              `bson:"source_file,omitempty" json:"source_file,omitempty"`
	// Поля для зарплаты
	Month       int    `bson:"month,omitempty"        json:"month,omitempty"`
	Year        int    `bson:"year,omitempty"         json:"year,omitempty"`
	// Поля для продаж
	ProductName string  `bson:"product_name,omitempty" json:"product_name,omitempty"`
	Quantity    float64 `bson:"quantity,omitempty"     json:"quantity,omitempty"`
	// Банк и переводы
	Bank        string              `bson:"bank,omitempty"         json:"bank,omitempty"`
	// Ссылка на товар (для расчёта себестоимости в ОПиУ)
	ProductID   *primitive.ObjectID `bson:"product_id,omitempty"   json:"product_id,omitempty"`
	CreatedAt   time.Time `bson:"created_at"           json:"created_at"`
	UpdatedAt   time.Time `bson:"updated_at"           json:"updated_at"`
}

// ─────────────────────────────────────────
// Category — категория расходов/доходов
// ─────────────────────────────────────────

type Category struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CompanyID  primitive.ObjectID `bson:"company_id"    json:"company_id"`
	Name       string             `bson:"name"          json:"name"`
	Type       string             `bson:"type"          json:"type"`      // income | expense | both
	Color      string             `bson:"color"         json:"color"`
	Icon       string             `bson:"icon"          json:"icon"`
	Keywords   []string           `bson:"keywords"      json:"keywords"`  // ключевые слова для автокатегоризации
	IsDefault  bool               `bson:"is_default"    json:"is_default"`
	// PnlSection — секция в ОПиУ: "variable" | "fixed" | "below" | "" (авто по ключевым словам)
	PnlSection string             `bson:"pnl_section,omitempty" json:"pnl_section,omitempty"`
	CreatedAt  time.Time          `bson:"created_at"    json:"created_at"`
}

// ─────────────────────────────────────────
// ParsedRow — строка из загруженного файла
// ─────────────────────────────────────────

type ParsedRow struct {
	Date        string  `json:"date"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
	Type        string  `json:"type"` // income | expense
}
