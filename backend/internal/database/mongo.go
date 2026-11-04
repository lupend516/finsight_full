package database

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var DB *mongo.Database

func Connect(uri string) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(uri)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal("❌ MongoDB connect error:", err)
	}

	if err = client.Ping(ctx, nil); err != nil {
		log.Fatal("❌ MongoDB ping failed:", err)
	}

	Client = client
	DB = client.Database("finsight")

	log.Println("✅ Connected to MongoDB Atlas!")

	// Создаём индексы при старте
	createIndexes()
}

func Disconnect() {
	if Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = Client.Disconnect(ctx)
		log.Println("MongoDB disconnected")
	}
}

func Collection(name string) *mongo.Collection {
	return DB.Collection(name)
}

func createIndexes() {
	ctx := context.Background()

	// Уникальный email для users
	usersCol := DB.Collection("users")
	_, err := usersCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    map[string]int{"email": 1},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Println("⚠️  Users email index:", err)
	}

	// Индексы для companies
	companiesCol := DB.Collection("companies")
	_, err = companiesCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]int{"owner_id": 1},
	})
	if err != nil {
		log.Println("⚠️  Companies owner_id index:", err)
	}

	// Индексы для invitations
	invitationsCol := DB.Collection("invitations")
	_, err = invitationsCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    map[string]int{"token": 1},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Println("⚠️  Invitations token index:", err)
	}

	// Индексы для transactions — самые важные для производительности
	txCol := DB.Collection("transactions")
	txIndexes := []mongo.IndexModel{
		{Keys: map[string]int{"company_id": 1, "date": -1}},
		{Keys: map[string]int{"company_id": 1, "type": 1}},
		{Keys: map[string]int{"company_id": 1, "status": 1}},
	}
	_, err = txCol.Indexes().CreateMany(ctx, txIndexes)
	if err != nil {
		log.Println("⚠️  Transactions indexes:", err)
	}

	// Индексы для categories
	catCol := DB.Collection("categories")
	_, err = catCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]int{"company_id": 1},
	})
	if err != nil {
		log.Println("⚠️  Categories company_id index:", err)
	}

	// Индексы для products
	prodCol := DB.Collection("products")
	_, err = prodCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]int{"company_id": 1},
	})
	if err != nil {
		log.Println("⚠️  Products company_id index:", err)
	}

	log.Println("✅ Database indexes ready")
}
