# FinSight Backend Makefile

.PHONY: run build tidy test

## Запустить сервер
run:
	go run cmd/server/main.go

## Собрать бинарник
build:
	go build -o bin/finsight cmd/server/main.go

## Установить зависимости
tidy:
	go mod tidy

## Скачать зависимости
deps:
	go mod download

## Запустить с hot reload (нужен air: go install github.com/air-verse/air@latest)
dev:
	air

## Проверить синтаксис
vet:
	go vet ./...
