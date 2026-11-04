# FinSight

**FinSight** is a financial-management platform for small and medium-sized businesses. It helps owners turn bank statements into organised transactions, financial dashboards, P&L reporting, and practical business insights.

## Highlights

- Secure registration and JWT-based authentication
- Company profiles, team roles, invitations, and account settings
- CSV, Excel, and PDF bank-statement upload
- Transaction parsing, rule-based categorisation, review workflow, and custom categories
- Financial dashboard with income, expenses, profit, cash-flow, and category charts
- Product, employee, sales, bookkeeping, and P&L modules
- Business-intelligence forecasts based on historical transaction data
- Fraud-monitoring and AI-assistant user interfaces

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Go, Gin |
| Database | MongoDB Atlas |
| Authentication | JWT, bcrypt |

## Architecture

```text
React + Vite frontend (localhost:3000)
                |
                | REST API
                v
Go + Gin backend (localhost:5001)
                |
                v
MongoDB Atlas
```

## Local setup

### Prerequisites

- Node.js LTS
- Go 1.24+
- MongoDB Atlas cluster

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
```

Set the following values in `backend/.env`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/finsight?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
PORT=5001
ENV=development
FRONTEND_URL=http://localhost:3000
```

Generate a secure JWT secret locally:

```bash
openssl rand -hex 32
```

Run the backend:

```bash
go mod download
go run cmd/server/main.go
```

### 2. Configure and run the frontend

```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Security

- Never commit `.env` files, MongoDB passwords, JWT secrets, or GitHub tokens.
- The repository includes `.env.example` files with placeholders only.
- Before publishing or deploying, use a new MongoDB password and JWT secret.

## Current status

The end-to-end local workflow has been verified: account registration, company onboarding, MongoDB connection, statement upload, transaction processing, and dashboard visualisation.

The current forecasting, AI-assistant, and fraud-monitoring modules are interface and heuristic-driven features. Production AI and anomaly-detection services are planned next.

## Roadmap

- Production-grade AI analysis and anomaly detection services
- Bank and accounting-system integrations
- Email delivery for team invitations
- Automated tests, CI/CD, Docker, and production deployment
- Exportable financial reports

## Author

Sultanbay Tazhibayev
