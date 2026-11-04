package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI    string
	JWTSecret   string
	Port        string
	Env         string
	FrontendURL string
}

var App *Config

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found, using environment variables")
	}

	App = &Config{
		MongoURI:    getEnv("MONGO_URI", "mongodb://localhost:27017/finsight"),
		JWTSecret:   getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		Port:        getEnv("PORT", "5000"),
		Env:         getEnv("ENV", "development"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
	}

	return App
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
