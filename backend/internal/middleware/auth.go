package middleware

import (
	"strings"

	"finsight-backend/internal/models"
	"finsight-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

// AuthRequired — проверяет JWT и кладёт claims в контекст
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "Authorization header required")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			utils.Unauthorized(c, "Invalid authorization format. Use: Bearer <token>")
			c.Abort()
			return
		}

		claims, err := utils.ParseToken(parts[1])
		if err != nil {
			utils.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		// Кладём данные в контекст для хендлеров
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("company_id", claims.CompanyID)
		c.Set("user_role", claims.Role)

		c.Next()
	}
}

// RequireRole — проверяет что у юзера нужная роль
func RequireRole(roles ...models.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			utils.Forbidden(c, "Role not found in context")
			c.Abort()
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			utils.Forbidden(c, "Invalid role format")
			c.Abort()
			return
		}

		for _, r := range roles {
			if models.Role(roleStr) == r {
				c.Next()
				return
			}
		}

		utils.Forbidden(c, "Insufficient permissions for this action")
		c.Abort()
	}
}

// RequirePermission — проверяет конкретное право
func RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			utils.Forbidden(c, "Role not found")
			c.Abort()
			return
		}

		role := models.Role(userRole.(string))
		perms, ok := models.RolePermissions[role]
		if !ok {
			utils.Forbidden(c, "Unknown role")
			c.Abort()
			return
		}

		for _, p := range perms {
			if p == permission {
				c.Next()
				return
			}
		}

		utils.Forbidden(c, "You don't have permission: "+permission)
		c.Abort()
	}
}
