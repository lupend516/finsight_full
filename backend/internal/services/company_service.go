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

// ─────────────────────────────────────────
// Company
// ─────────────────────────────────────────

type CreateCompanyInput struct {
	Name     string `json:"name"     binding:"required"`
	Industry string `json:"industry"`
	Country  string `json:"country"`
	Currency string `json:"currency"`
}

// CreateCompany — создаёт компанию и добавляет юзера как owner
func CreateCompany(ownerID string, input CreateCompanyInput) (*models.Company, error) {
	ownerObjID, err := primitive.ObjectIDFromHex(ownerID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	ctx := context.Background()
	now := time.Now()

	currency := input.Currency
	if currency == "" {
		currency = "USD"
	}

	company := models.Company{
		ID:        primitive.NewObjectID(),
		Name:      input.Name,
		Industry:  input.Industry,
		Country:   input.Country,
		Currency:  currency,
		OwnerID:   ownerObjID,
		IsActive:  true,
		Plan:      "free",
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err = database.Collection("companies").InsertOne(ctx, company)
	if err != nil {
		return nil, err
	}

	// Добавляем создателя как owner
	member := models.CompanyMember{
		ID:          primitive.NewObjectID(),
		CompanyID:   company.ID,
		UserID:      ownerObjID,
		Role:        models.RoleOwner,
		Permissions: models.RolePermissions[models.RoleOwner],
		JoinedAt:    now,
		IsActive:    true,
	}
	_, err = database.Collection("company_members").InsertOne(ctx, member)
	if err != nil {
		return nil, err
	}

	// Устанавливаем как текущую компанию
	_, _ = database.Collection("users").UpdateOne(ctx,
		bson.M{"_id": ownerObjID},
		bson.M{"$set": bson.M{
			"current_company": company.ID,
			"updated_at":      now,
		}},
	)

	return &company, nil
}

// GetCompany — получает компанию по ID
func GetCompany(companyID string) (*models.Company, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, errors.New("invalid company id")
	}

	ctx := context.Background()
	var company models.Company
	err = database.Collection("companies").FindOne(ctx, bson.M{"_id": objID}).Decode(&company)
	if err != nil {
		return nil, errors.New("company not found")
	}

	return &company, nil
}

// GetUserCompanies — получает все компании юзера
func GetUserCompanies(userID string) ([]models.Company, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	ctx := context.Background()

	// Находим все memberships юзера
	cursor, err := database.Collection("company_members").Find(ctx, bson.M{
		"user_id":   objID,
		"is_active": true,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var members []models.CompanyMember
	if err = cursor.All(ctx, &members); err != nil {
		return nil, err
	}

	if len(members) == 0 {
		return []models.Company{}, nil
	}

	// Собираем ID компаний
	companyIDs := make([]primitive.ObjectID, 0, len(members))
	for _, m := range members {
		companyIDs = append(companyIDs, m.CompanyID)
	}

	// Получаем компании
	cursor2, err := database.Collection("companies").Find(ctx, bson.M{
		"_id":       bson.M{"$in": companyIDs},
		"is_active": true,
	})
	if err != nil {
		return nil, err
	}
	defer cursor2.Close(ctx)

	var companies []models.Company
	if err = cursor2.All(ctx, &companies); err != nil {
		return nil, err
	}

	return companies, nil
}

// UpdateCompany — обновляет данные компании
func UpdateCompany(companyID string, updates bson.M) (*models.Company, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, errors.New("invalid company id")
	}

	updates["updated_at"] = time.Now()
	ctx := context.Background()

	_, err = database.Collection("companies").UpdateOne(ctx,
		bson.M{"_id": objID},
		bson.M{"$set": updates},
	)
	if err != nil {
		return nil, err
	}

	return GetCompany(companyID)
}

// ─────────────────────────────────────────
// Members & Roles
// ─────────────────────────────────────────

// GetMembers — список участников компании
func GetMembers(companyID string) ([]models.CompanyMemberWithUser, error) {
	objID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, errors.New("invalid company id")
	}

	ctx := context.Background()
	cursor, err := database.Collection("company_members").Find(ctx, bson.M{
		"company_id": objID,
		"is_active":  true,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var members []models.CompanyMember
	if err = cursor.All(ctx, &members); err != nil {
		return nil, err
	}

	// Обогащаем данными пользователей
	result := make([]models.CompanyMemberWithUser, 0, len(members))
	for _, m := range members {
		user, err := GetUserByID(m.UserID.Hex())
		if err != nil {
			continue
		}
		result = append(result, models.CompanyMemberWithUser{
			CompanyMember: m,
			User:          user.ToPublic(),
		})
	}

	return result, nil
}

// GetMember — получает одного участника
func GetMember(companyID, userID primitive.ObjectID) (*models.CompanyMember, error) {
	ctx := context.Background()
	var member models.CompanyMember
	err := database.Collection("company_members").FindOne(ctx, bson.M{
		"company_id": companyID,
		"user_id":    userID,
		"is_active":  true,
	}).Decode(&member)
	if err != nil {
		return nil, errors.New("member not found")
	}
	return &member, nil
}

// UpdateMemberRole — меняет роль участника
func UpdateMemberRole(companyID, targetUserID, requesterID string, newRole models.Role) error {
	compObjID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return errors.New("invalid company id")
	}

	targetObjID, err := primitive.ObjectIDFromHex(targetUserID)
	if err != nil {
		return errors.New("invalid user id")
	}

	requesterObjID, _ := primitive.ObjectIDFromHex(requesterID)

	// Нельзя менять роль самому себе
	if targetObjID == requesterObjID {
		return errors.New("cannot change your own role")
	}

	// Нельзя менять роль owner
	targetMember, err := GetMember(compObjID, targetObjID)
	if err != nil {
		return err
	}
	if targetMember.Role == models.RoleOwner {
		return errors.New("cannot change owner role")
	}

	perms := models.RolePermissions[newRole]
	if perms == nil {
		return errors.New("invalid role")
	}

	ctx := context.Background()
	_, err = database.Collection("company_members").UpdateOne(ctx,
		bson.M{"company_id": compObjID, "user_id": targetObjID},
		bson.M{"$set": bson.M{
			"role":        newRole,
			"permissions": perms,
		}},
	)

	return err
}

// RemoveMember — удаляет участника из компании
func RemoveMember(companyID, targetUserID, requesterID string) error {
	compObjID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return errors.New("invalid company id")
	}

	targetObjID, err := primitive.ObjectIDFromHex(targetUserID)
	if err != nil {
		return errors.New("invalid user id")
	}

	requesterObjID, _ := primitive.ObjectIDFromHex(requesterID)

	if targetObjID == requesterObjID {
		return errors.New("cannot remove yourself")
	}

	// Нельзя удалить owner
	targetMember, err := GetMember(compObjID, targetObjID)
	if err != nil {
		return err
	}
	if targetMember.Role == models.RoleOwner {
		return errors.New("cannot remove company owner")
	}

	ctx := context.Background()
	_, err = database.Collection("company_members").UpdateOne(ctx,
		bson.M{"company_id": compObjID, "user_id": targetObjID},
		bson.M{"$set": bson.M{"is_active": false}},
	)

	return err
}
