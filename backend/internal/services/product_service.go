package services

import (
	"context"
	"fmt"
	"time"

	"finsight-backend/internal/database"
	"finsight-backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetProducts(companyID string) ([]models.Product, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, fmt.Errorf("invalid company id")
	}
	ctx := context.Background()
	cursor, err := database.Collection("products").Find(ctx, bson.M{"company_id": objID, "is_active": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var products []models.Product
	cursor.All(ctx, &products)
	if products == nil {
		products = []models.Product{}
	}
	return products, nil
}

func CreateProduct(companyID string, p models.Product) (*models.Product, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, fmt.Errorf("invalid company id")
	}
	p.ID = primitive.NewObjectID()
	p.CompanyID = objID
	p.IsActive = true
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	_, err = database.Collection("products").InsertOne(context.Background(), p)
	return &p, err
}

func UpdateProduct(productID string, updates bson.M) (*models.Product, error) {
	objID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		return nil, fmt.Errorf("invalid product id")
	}
	updates["updated_at"] = time.Now()
	ctx := context.Background()
	_, err = database.Collection("products").UpdateOne(
		ctx,
		bson.M{"_id": objID},
		bson.M{"$set": updates},
	)
	if err != nil {
		return nil, err
	}
	var p models.Product
	err = database.Collection("products").FindOne(ctx, bson.M{"_id": objID}).Decode(&p)
	return &p, err
}

func DeleteProduct(productID string) error {
	objID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		return fmt.Errorf("invalid product id")
	}
	_, err = database.Collection("products").UpdateOne(
		context.Background(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"is_active": false, "updated_at": time.Now()}},
	)
	return err
}
