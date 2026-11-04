package handlers

import (
	"finsight-backend/internal/middleware"
	"finsight-backend/internal/models"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")

	// ─────────────────────────────────────────
	// AUTH — публичные маршруты
	// ─────────────────────────────────────────
	auth := api.Group("/auth")
	{
		auth.POST("/register", Register)
		auth.POST("/login", Login)
		auth.POST("/refresh", Refresh)

		// Защищённые auth-маршруты
		authProtected := auth.Group("")
		authProtected.Use(middleware.AuthRequired())
		{
			authProtected.GET("/me", Me)
			authProtected.PUT("/me", UpdateProfile)
			authProtected.PUT("/change-password", ChangePassword)
		}
	}

	// ─────────────────────────────────────────
	// INVITATIONS — верификация токена (публично)
	// ─────────────────────────────────────────
	invPublic := api.Group("/invitations")
	{
		invPublic.GET("/verify/:token", VerifyInviteToken)
	}

	// ─────────────────────────────────────────
	// Всё ниже требует авторизации
	// ─────────────────────────────────────────
	protected := api.Group("")
	protected.Use(middleware.AuthRequired())
	{
		// INVITATIONS — принять приглашение
		protected.POST("/invitations/accept", AcceptInvitation)

		// COMPANIES
		companies := protected.Group("/companies")
		{
			companies.POST("", CreateCompany)
			companies.GET("", GetMyCompanies)
			companies.GET("/:id", GetCompany)

			// Управление компанией — только owner/admin
			companyAdmin := companies.Group("/:id")
			companyAdmin.Use(middleware.RequireRole(models.RoleOwner, models.RoleAdmin))
			{
				companyAdmin.PUT("", UpdateCompany)
				companyAdmin.POST("/switch", SwitchCompany)

				// Участники
				companyAdmin.GET("/members", GetMembers)
				companyAdmin.PUT("/members/:userId/role", UpdateMemberRole)
				companyAdmin.DELETE("/members/:userId", RemoveMember)

				// Приглашения — только owner/admin с правом users:invite
				companyAdmin.POST("/invite", InviteUser)
				companyAdmin.GET("/invitations", GetInvitations)
				companyAdmin.DELETE("/invitations/:invId", RevokeInvitation)
			}

			// ── BOOKKEEPING (owner / admin / accountant) ──────────────
			bookkeeping := companies.Group("/:id")
			bookkeeping.Use(middleware.AuthRequired())
			{
				// Загрузка файлов
				bookkeeping.POST("/upload", UploadFile)

				// Транзакции
				bookkeeping.GET("/transactions", GetTransactions)
				bookkeeping.POST("/transactions", CreateTransaction)
				bookkeeping.PUT("/transactions/:txId", UpdateTransaction)
				bookkeeping.DELETE("/transactions/:txId", DeleteTransaction)
				bookkeeping.POST("/transactions/auto-categorize", AutoCategorizeByDescription)
				bookkeeping.GET("/bookkeeping/stats", GetBookkeepingStats)
				bookkeeping.GET("/bookkeeping/dashboard", GetDashboardStatsHandler)
				bookkeeping.GET("/bookkeeping/pnl", GetPnL)

				// Товары
				bookkeeping.GET("/products", GetProducts)
				bookkeeping.POST("/products", CreateProduct)
				bookkeeping.PUT("/products/:productId", UpdateProduct)
				bookkeeping.DELETE("/products/:productId", DeleteProduct)

				// Сотрудники
				bookkeeping.GET("/employees", GetEmployees)
				bookkeeping.POST("/employees", CreateEmployee)
				bookkeeping.PUT("/employees/:empId", UpdateEmployee)
				bookkeeping.DELETE("/employees/:empId", DeleteEmployee)

				// Категории
				bookkeeping.GET("/categories", GetCategories)
				bookkeeping.POST("/categories", CreateCategory)
				bookkeeping.POST("/categories/init", InitDefaultCategories)
				bookkeeping.PUT("/categories/:catId", UpdateCategory)
				bookkeeping.DELETE("/categories/:catId", DeleteCategory)
			}
		}
	}
}
