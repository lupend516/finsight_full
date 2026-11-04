package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"finsight-backend/internal/database"
	"finsight-backend/internal/models"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func bg() context.Context { return context.Background() }

type InviteInput struct {
	Email string      `json:"email" binding:"required,email"`
	Role  models.Role `json:"role"  binding:"required"`
}

// InviteUser — создаёт приглашение и возвращает ссылку
func InviteUser(companyID, inviterID string, input InviteInput) (*models.Invitation, string, error) {
	compObjID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, "", errors.New("invalid company id")
	}

	inviterObjID, err := primitive.ObjectIDFromHex(inviterID)
	if err != nil {
		return nil, "", errors.New("invalid inviter id")
	}

	// Валидируем роль
	if _, ok := models.RolePermissions[input.Role]; !ok {
		return nil, "", errors.New("invalid role")
	}

	// Нельзя приглашать как owner
	if input.Role == models.RoleOwner {
		return nil, "", errors.New("cannot invite as owner")
	}

	// Проверяем нет ли уже активного приглашения
	count, _ := database.Collection("invitations").CountDocuments(bg(), bson.M{
		"company_id": compObjID,
		"email":      input.Email,
		"status":     models.InvitationPending,
	})
	if count > 0 {
		return nil, "", errors.New("invitation already sent to this email")
	}

	// Проверяем не является ли юзер уже участником
	userCol := database.Collection("users")
	var existingUser models.User
	if err := userCol.FindOne(bg(), bson.M{"email": input.Email}).Decode(&existingUser); err == nil {
		member, _ := GetMember(compObjID, existingUser.ID)
		if member != nil {
			return nil, "", errors.New("user is already a member of this company")
		}
	}

	token := uuid.New().String()

	invitation := models.Invitation{
		ID:        primitive.NewObjectID(),
		CompanyID: compObjID,
		Email:     input.Email,
		Role:      input.Role,
		Token:     token,
		Status:    models.InvitationPending,
		InvitedBy: inviterObjID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 дней
		CreatedAt: time.Now(),
	}

	_, err = database.Collection("invitations").InsertOne(bg(), invitation)
	if err != nil {
		return nil, "", err
	}

	// В реальном проекте здесь отправляем email
	// Пока возвращаем ссылку как строку
	inviteLink := fmt.Sprintf("http://localhost:3000/invite?token=%s", token)

	return &invitation, inviteLink, nil
}

// GetInvitationByToken — находит активное приглашение по токену
func GetInvitationByToken(token string) (*models.Invitation, bool, error) {
	var inv models.Invitation
	err := database.Collection("invitations").FindOne(bg(), bson.M{
		"token":  token,
		"status": models.InvitationPending,
	}).Decode(&inv)
	if err != nil {
		return nil, false, errors.New("invitation not found")
	}

	if time.Now().After(inv.ExpiresAt) {
		_, _ = database.Collection("invitations").UpdateOne(bg(),
			bson.M{"_id": inv.ID},
			bson.M{"$set": bson.M{"status": models.InvitationExpired}},
		)
		return nil, true, errors.New("invitation has expired")
	}

	return &inv, false, nil
}

// AcceptInvitation — принимает приглашение по токену
func AcceptInvitation(token, userID string) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user id")
	}

	inv, _, err := GetInvitationByToken(token)
	if err != nil {
		return err
	}

	user, err := GetUserByID(userID)
	if err != nil {
		return err
	}
	if user.Email != inv.Email {
		return errors.New("this invitation is for a different email address")
	}

	now := time.Now()

	member := models.CompanyMember{
		ID:          primitive.NewObjectID(),
		CompanyID:   inv.CompanyID,
		UserID:      userObjID,
		Role:        inv.Role,
		Permissions: models.RolePermissions[inv.Role],
		InvitedBy:   &inv.InvitedBy,
		JoinedAt:    now,
		IsActive:    true,
	}

	_, err = database.Collection("company_members").InsertOne(bg(), member)
	if err != nil {
		return errors.New("failed to add member to company")
	}

	_, _ = database.Collection("invitations").UpdateOne(bg(),
		bson.M{"_id": inv.ID},
		bson.M{"$set": bson.M{
			"status":      models.InvitationAccepted,
			"accepted_at": now,
		}},
	)

	if user.CurrentCompany == nil {
		_, _ = database.Collection("users").UpdateOne(bg(),
			bson.M{"_id": userObjID},
			bson.M{"$set": bson.M{
				"current_company": inv.CompanyID,
				"updated_at":      now,
			}},
		)
	}

	return nil
}

// RevokeInvitation — отзывает приглашение
func RevokeInvitation(invitationID, companyID string) error {
	invObjID, err := primitive.ObjectIDFromHex(invitationID)
	if err != nil {
		return errors.New("invalid invitation id")
	}

	compObjID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return errors.New("invalid company id")
	}

	result, err := database.Collection("invitations").UpdateOne(bg(),
		bson.M{
			"_id":        invObjID,
			"company_id": compObjID,
			"status":     models.InvitationPending,
		},
		bson.M{"$set": bson.M{"status": models.InvitationRevoked}},
	)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return errors.New("invitation not found")
	}

	return nil
}

// GetCompanyInvitations — список приглашений компании
func GetCompanyInvitations(companyID string) ([]models.Invitation, error) {
	compObjID, err := primitive.ObjectIDFromHex(companyID)
	if err != nil {
		return nil, errors.New("invalid company id")
	}

	cursor, err := database.Collection("invitations").Find(bg(), bson.M{
		"company_id": compObjID,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(bg())

	var invitations []models.Invitation
	if err = cursor.All(bg(), &invitations); err != nil {
		return nil, err
	}

	return invitations, nil
}
