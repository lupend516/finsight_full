package services

import (
	"context"
	"errors"
	"time"

	"finsight-backend/internal/database"
	"finsight-backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetEmployees(companyID string) ([]models.Employee, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, errors.New("invalid company id")
	}
	ctx := context.Background()
	cur, err := database.Collection("employees").Find(ctx, bson.M{"company_id": objID})
	if err != nil {
		return nil, err
	}
	var result []models.Employee
	if err = cur.All(ctx, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func CreateEmployee(companyID string, e models.Employee) (*models.Employee, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, errors.New("invalid company id")
	}
	now := time.Now()
	e.ID = primitive.NewObjectID()
	e.CompanyID = objID
	e.IsActive = true
	e.CreatedAt = now
	e.UpdatedAt = now

	ctx := context.Background()
	_, err = database.Collection("employees").InsertOne(ctx, e)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func UpdateEmployee(companyID, employeeID string, updates bson.M) (*models.Employee, error) {
	compID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, errors.New("invalid company id")
	}
	empID, err := primitive.ObjectIDFromHex(employeeID)
	if err != nil {
		return nil, errors.New("invalid employee id")
	}
	updates["updated_at"] = time.Now()
	ctx := context.Background()
	_, err = database.Collection("employees").UpdateOne(ctx,
		bson.M{"_id": empID, "company_id": compID},
		bson.M{"$set": updates},
	)
	if err != nil {
		return nil, err
	}
	var emp models.Employee
	err = database.Collection("employees").FindOne(ctx, bson.M{"_id": empID}).Decode(&emp)
	if err != nil {
		return nil, errors.New("employee not found")
	}
	return &emp, nil
}

func DeleteEmployee(companyID, employeeID string) error {
	compID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return errors.New("invalid company id")
	}
	empID, err := primitive.ObjectIDFromHex(employeeID)
	if err != nil {
		return errors.New("invalid employee id")
	}
	ctx := context.Background()
	_, err = database.Collection("employees").DeleteOne(ctx,
		bson.M{"_id": empID, "company_id": compID},
	)
	return err
}
