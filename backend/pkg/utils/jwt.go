package utils

import (
	"errors"
	"time"

	"finsight-backend/internal/config"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type JWTClaims struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	CompanyID string `json:"company_id,omitempty"`
	Role      string `json:"role,omitempty"`
	jwt.RegisteredClaims
}

// GenerateToken — создаёт access token (24 часа)
func GenerateToken(userID primitive.ObjectID, email string, companyID *primitive.ObjectID, role string) (string, error) {
	claims := JWTClaims{
		UserID: userID.Hex(),
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "finsight",
		},
	}

	if companyID != nil {
		claims.CompanyID = companyID.Hex()
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.App.JWTSecret))
}

// GenerateRefreshToken — создаёт refresh token (7 дней)
func GenerateRefreshToken(userID primitive.ObjectID) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   userID.Hex(),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Issuer:    "finsight-refresh",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.App.JWTSecret + "-refresh"))
}

// ParseToken — парсит и валидирует JWT
func ParseToken(tokenStr string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(config.App.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
