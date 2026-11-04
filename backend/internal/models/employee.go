package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Employee struct {
	ID        primitive.ObjectID `bson:"_id"        json:"id"`
	CompanyID primitive.ObjectID `bson:"company_id" json:"company_id"`
	FirstName string             `bson:"first_name" json:"first_name"`
	LastName  string             `bson:"last_name"  json:"last_name"`
	Position  string             `bson:"position"   json:"position"`  // должность
	Salary    float64            `bson:"salary"     json:"salary"`    // оклад
	KPI       float64            `bson:"kpi"        json:"kpi"`       // % от продаж
	IsActive  bool               `bson:"is_active"  json:"is_active"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}
