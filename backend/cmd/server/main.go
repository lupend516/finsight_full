package main

import (
	"log"
	"net/http"

	"finsight-backend/internal/config"
	"finsight-backend/internal/database"
	"finsight-backend/internal/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Загружаем конфиг из .env
	cfg := config.Load()

	// 2. Подключаемся к MongoDB
	database.Connect(cfg.MongoURI)
	defer database.Disconnect()

	// 3. Gin режим
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// 4. CORS middleware
	r.Use(corsMiddleware(cfg.FrontendURL))

	// 5. Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "finsight-backend",
			"version": "1.0.0",
		})
	})

	// 6. Все маршруты API
	handlers.SetupRoutes(r)

	// 7. Запуск сервера
	addr := ":" + cfg.Port
	log.Printf("🚀 FinSight backend running on http://localhost%s", addr)
	log.Printf("📦 MongoDB: connected")
	log.Printf("🌐 CORS allowed for: %s", cfg.FrontendURL)

	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal("Server error:", err)
	}
}

func corsMiddleware(frontendURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", frontendURL)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
