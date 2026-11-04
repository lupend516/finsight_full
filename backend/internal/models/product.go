package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Product — товар/услуга компании с себестоимостью
type Product struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"      json:"id"`
	CompanyID    primitive.ObjectID `bson:"company_id"         json:"company_id"`
	Name         string             `bson:"name"               json:"name"`
	SKU          string             `bson:"sku,omitempty"      json:"sku,omitempty"`
	CostPrice    float64            `bson:"cost_price"         json:"cost_price"`    // себестоимость единицы
	SellingPrice float64            `bson:"selling_price"      json:"selling_price"` // цена продажи
	Unit         string             `bson:"unit,omitempty"     json:"unit,omitempty"` // шт, кг, услуга...
	IsActive     bool               `bson:"is_active"          json:"is_active"`
	CreatedAt    time.Time          `bson:"created_at"         json:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at"         json:"updated_at"`
}
