package services

import (
	"context"
	"errors"
	"time"

	"finsight-backend/internal/config"
	"finsight-backend/internal/database"
	"finsight-backend/internal/models"
	"finsight-backend/pkg/utils"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type RegisterInput struct {
	Email     string `json:"email"      binding:"required,email"`
	Password  string `json:"password"   binding:"required,min=8"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name"  binding:"required"`
}

type LoginInput struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User         models.UserPublic `json:"user"`
	AccessToken  string            `json:"access_token"`
	RefreshToken string            `json:"refresh_token"`
}

// Register — создаёт нового пользователя
func Register(input RegisterInput) (*AuthResponse, error) {
	ctx := context.Background()
	col := database.Collection("users")

	// Проверяем что email не занят
	count, err := col.CountDocuments(ctx, bson.M{"email": input.Email})
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("email already registered")
	}

	// Хешируем пароль
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	user := models.User{
		ID:           primitive.NewObjectID(),
		Email:        input.Email,
		PasswordHash: string(hash),
		FirstName:    input.FirstName,
		LastName:     input.LastName,
		IsVerified:   false,
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	_, err = col.InsertOne(ctx, user)
	if err != nil {
		return nil, err
	}

	// Генерируем токены
	accessToken, err := utils.GenerateToken(user.ID, user.Email, nil, "")
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:         user.ToPublic(),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// Login — проверяет credentials и возвращает токены
func Login(input LoginInput) (*AuthResponse, error) {
	ctx := context.Background()
	col := database.Collection("users")

	var user models.User
	err := col.FindOne(ctx, bson.M{"email": input.Email}).Decode(&user)
	if err != nil {
		// Не раскрываем что именно не так — email или пароль
		return nil, errors.New("invalid credentials")
	}

	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	// Проверяем пароль
	if err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Обновляем last_login_at
	now := time.Now()
	_, _ = col.UpdateOne(ctx,
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{"last_login_at": now, "updated_at": now}},
	)
	user.LastLoginAt = &now

	// Получаем активную компанию и роль юзера (если есть)
	var companyID *primitive.ObjectID
	var role string

	if user.CurrentCompany != nil {
		member, err := GetMember(*user.CurrentCompany, user.ID)
		if err == nil {
			companyID = &member.CompanyID
			role = string(member.Role)
		}
	}

	accessToken, err := utils.GenerateToken(user.ID, user.Email, companyID, role)
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:         user.ToPublic(),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// GetUserByID — получает пользователя по ID
func GetUserByID(id string) (*models.User, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	ctx := context.Background()
	var user models.User
	err = database.Collection("users").FindOne(ctx, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		return nil, errors.New("user not found")
	}

	return &user, nil
}

// UpdateProfile — обновляет профиль пользователя
func UpdateProfile(userID string, updates bson.M) (*models.User, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	updates["updated_at"] = time.Now()
	ctx := context.Background()

	_, err = database.Collection("users").UpdateOne(ctx,
		bson.M{"_id": objID},
		bson.M{"$set": updates},
	)
	if err != nil {
		return nil, err
	}

	return GetUserByID(userID)
}

// RefreshAccessToken — validates a refresh token and issues new access + refresh tokens
func RefreshAccessToken(refreshTokenStr string) (*AuthResponse, error) {
	parsed, err := jwt.ParseWithClaims(
		refreshTokenStr,
		&jwt.RegisteredClaims{},
		func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("invalid signing method")
			}
			return []byte(config.App.JWTSecret + "-refresh"), nil
		},
	)
	if err != nil || !parsed.Valid {
		return nil, errors.New("invalid or expired refresh token")
	}

	claims, ok := parsed.Claims.(*jwt.RegisteredClaims)
	if !ok || claims.Subject == "" {
		return nil, errors.New("invalid refresh token claims")
	}

	user, err := GetUserByID(claims.Subject)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	var companyID *primitive.ObjectID
	var role string

	if user.CurrentCompany != nil {
		member, err := GetMember(*user.CurrentCompany, user.ID)
		if err == nil {
			companyID = &member.CompanyID
			role = string(member.Role)
		}
	}

	accessToken, err := utils.GenerateToken(user.ID, user.Email, companyID, role)
	if err != nil {
		return nil, err
	}

	newRefreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:         user.ToPublic(),
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

// ChangePassword — меняет пароль
func ChangePassword(userID, oldPassword, newPassword string) error {
	user, err := GetUserByID(userID)
	if err != nil {
		return err
	}

	if err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	if len(newPassword) < 8 {
		return errors.New("new password must be at least 8 characters")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	ctx := context.Background()
	_, err = database.Collection("users").UpdateOne(ctx,
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{
			"password_hash": string(hash),
			"updated_at":    time.Now(),
		}},
	)

	return err
}
