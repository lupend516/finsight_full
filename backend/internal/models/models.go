package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ─────────────────────────────────────────
// Роли пользователей внутри компании
// ─────────────────────────────────────────

type Role string

const (
	RoleOwner      Role = "owner"      // Владелец — полный доступ
	RoleAdmin      Role = "admin"      // Администратор — почти всё, кроме удаления компании
	RoleAccountant Role = "accountant" // Бухгалтер — данные и отчёты, без настроек
	RoleAnalyst    Role = "analyst"    // Аналитик — только чтение отчётов
	RoleViewer     Role = "viewer"     // Наблюдатель — только просмотр дашборда
)

// Права по ролям
var RolePermissions = map[Role][]string{
	RoleOwner: {
		"company:manage", "users:manage", "users:invite",
		"data:read", "data:write", "data:delete",
		"reports:read", "reports:export",
		"audit:manage", "settings:manage", "billing:manage",
		"fraud:read", "ai:use",
	},
	RoleAdmin: {
		"company:manage", "users:manage", "users:invite",
		"data:read", "data:write", "data:delete",
		"reports:read", "reports:export",
		"audit:manage", "settings:manage",
		"fraud:read", "ai:use",
	},
	RoleAccountant: {
		"data:read", "data:write",
		"reports:read", "reports:export",
		"audit:manage", "ai:use",
	},
	RoleAnalyst: {
		"data:read",
		"reports:read", "reports:export",
		"fraud:read", "ai:use",
	},
	RoleViewer: {
		"data:read",
		"reports:read",
	},
}

// ─────────────────────────────────────────
// User — пользователь системы
// ─────────────────────────────────────────

type User struct {
	ID             primitive.ObjectID `bson:"_id,omitempty"       json:"id"`
	Email          string             `bson:"email"               json:"email"`
	PasswordHash   string             `bson:"password_hash"       json:"-"` // никогда не возвращаем в JSON
	FirstName      string             `bson:"first_name"          json:"first_name"`
	LastName       string             `bson:"last_name"           json:"last_name"`
	Avatar         string             `bson:"avatar,omitempty"    json:"avatar,omitempty"`
	IsVerified     bool               `bson:"is_verified"         json:"is_verified"`
	IsActive       bool               `bson:"is_active"           json:"is_active"`
	CurrentCompany *primitive.ObjectID `bson:"current_company,omitempty" json:"current_company,omitempty"`
	CreatedAt      time.Time          `bson:"created_at"          json:"created_at"`
	UpdatedAt      time.Time          `bson:"updated_at"          json:"updated_at"`
	LastLoginAt    *time.Time         `bson:"last_login_at,omitempty" json:"last_login_at,omitempty"`
}

// Публичный профиль (без чувствительных полей)
type UserPublic struct {
	ID          primitive.ObjectID  `json:"id"`
	Email       string              `json:"email"`
	FirstName   string              `json:"first_name"`
	LastName    string              `json:"last_name"`
	Avatar      string              `json:"avatar,omitempty"`
	IsVerified  bool                `json:"is_verified"`
	IsActive    bool                `json:"is_active"`
	CreatedAt   time.Time           `json:"created_at"`
	LastLoginAt *time.Time          `json:"last_login_at,omitempty"`
}

func (u *User) ToPublic() UserPublic {
	return UserPublic{
		ID:          u.ID,
		Email:       u.Email,
		FirstName:   u.FirstName,
		LastName:    u.LastName,
		Avatar:      u.Avatar,
		IsVerified:  u.IsVerified,
		IsActive:    u.IsActive,
		CreatedAt:   u.CreatedAt,
		LastLoginAt: u.LastLoginAt,
	}
}

// ─────────────────────────────────────────
// Company — компания (tenant)
// ─────────────────────────────────────────

type Company struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name"          json:"name"`
	Industry    string             `bson:"industry"      json:"industry"`
	Country     string             `bson:"country"       json:"country"`
	Currency    string             `bson:"currency"      json:"currency"` // USD, EUR, KZT...
	OwnerID     primitive.ObjectID `bson:"owner_id"      json:"owner_id"`
	LogoURL     string             `bson:"logo_url,omitempty" json:"logo_url,omitempty"`
	IsActive    bool               `bson:"is_active"     json:"is_active"`
	Plan        string             `bson:"plan"          json:"plan"` // free, starter, pro, enterprise
	CreatedAt   time.Time          `bson:"created_at"    json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at"    json:"updated_at"`

	// ── Business Profile (Шаг 1 аудита) ──────────────────────────────
	BusinessCategory string `bson:"business_category,omitempty" json:"business_category,omitempty"`
	AnnualRevenue    string `bson:"annual_revenue,omitempty"    json:"annual_revenue,omitempty"`
	BusinessAge      string `bson:"business_age,omitempty"      json:"business_age,omitempty"`
	Employees        string `bson:"employees,omitempty"         json:"employees,omitempty"`
	UserRole         string `bson:"user_role,omitempty"         json:"user_role,omitempty"`

	// ── Business Model (Шаг 2 аудита) ────────────────────────────────
	SalesType      string   `bson:"sales_type,omitempty"      json:"sales_type,omitempty"`
	SalesChannels  []string `bson:"sales_channels,omitempty"  json:"sales_channels,omitempty"`
	ProductsCount  string   `bson:"products_count,omitempty"  json:"products_count,omitempty"`
	AverageCheck   string   `bson:"average_check,omitempty"   json:"average_check,omitempty"`
	SalesFrequency string   `bson:"sales_frequency,omitempty" json:"sales_frequency,omitempty"`
	Seasonality    *bool    `bson:"seasonality,omitempty"     json:"seasonality,omitempty"`

	// ── Accounting & Tax (Шаг 3 аудита) ──────────────────────────────
	AccountingSystem string `bson:"accounting_system,omitempty" json:"accounting_system,omitempty"`
	TaxSystem        string `bson:"tax_system,omitempty"        json:"tax_system,omitempty"`

	// ── Financial Goals (Шаг 4 аудита) ───────────────────────────────
	FinancialGoals []string `bson:"financial_goals,omitempty" json:"financial_goals,omitempty"`
}

// ─────────────────────────────────────────
// CompanyMember — связь юзера и компании с ролью
// ─────────────────────────────────────────

type CompanyMember struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CompanyID   primitive.ObjectID `bson:"company_id"    json:"company_id"`
	UserID      primitive.ObjectID `bson:"user_id"       json:"user_id"`
	Role        Role               `bson:"role"          json:"role"`
	Permissions []string           `bson:"permissions"   json:"permissions"`
	InvitedBy   *primitive.ObjectID `bson:"invited_by,omitempty" json:"invited_by,omitempty"`
	JoinedAt    time.Time          `bson:"joined_at"     json:"joined_at"`
	IsActive    bool               `bson:"is_active"     json:"is_active"`
}

// CompanyMember с вложенными данными о пользователе (для ответа API)
type CompanyMemberWithUser struct {
	CompanyMember `bson:",inline"`
	User          UserPublic `json:"user"`
}

// ─────────────────────────────────────────
// Invitation — приглашение в компанию
// ─────────────────────────────────────────

type InvitationStatus string

const (
	InvitationPending  InvitationStatus = "pending"
	InvitationAccepted InvitationStatus = "accepted"
	InvitationExpired  InvitationStatus = "expired"
	InvitationRevoked  InvitationStatus = "revoked"
)

type Invitation struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CompanyID   primitive.ObjectID `bson:"company_id"    json:"company_id"`
	Email       string             `bson:"email"         json:"email"`
	Role        Role               `bson:"role"          json:"role"`
	Token       string             `bson:"token"         json:"token"` // уникальный токен ссылки
	Status      InvitationStatus   `bson:"status"        json:"status"`
	InvitedBy   primitive.ObjectID `bson:"invited_by"    json:"invited_by"`
	ExpiresAt   time.Time          `bson:"expires_at"    json:"expires_at"`
	AcceptedAt  *time.Time         `bson:"accepted_at,omitempty" json:"accepted_at,omitempty"`
	CreatedAt   time.Time          `bson:"created_at"    json:"created_at"`
}
