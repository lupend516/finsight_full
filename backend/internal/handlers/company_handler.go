package handlers

import (
	"finsight-backend/internal/services"
	"finsight-backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// POST /api/companies
func CreateCompany(c *gin.Context) {
	userID := c.GetString("user_id")

	var input services.CreateCompanyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	company, err := services.CreateCompany(userID, input)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Created(c, company)
}

// GET /api/companies
func GetMyCompanies(c *gin.Context) {
	userID := c.GetString("user_id")

	companies, err := services.GetUserCompanies(userID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.OK(c, companies)
}

// GET /api/companies/:id
func GetCompany(c *gin.Context) {
	companyID := c.Param("id")

	company, err := services.GetCompany(companyID)
	if err != nil {
		utils.NotFound(c, err.Error())
		return
	}

	utils.OK(c, company)
}

// PUT /api/companies/:id
func UpdateCompany(c *gin.Context) {
	companyID := c.Param("id")

	var body struct {
		// Basic info
		Name    string `json:"name"`
		Country string `json:"country"`
		Currency string `json:"currency"`
		LogoURL  string `json:"logo_url"`
		// Business Profile (Step 1)
		BusinessCategory string `json:"business_category"`
		AnnualRevenue    string `json:"annual_revenue"`
		BusinessAge      string `json:"business_age"`
		Employees        string `json:"employees"`
		UserRole         string `json:"user_role"`
		// Business Model (Step 2)
		SalesType      string   `json:"sales_type"`
		SalesChannels  []string `json:"sales_channels"`
		ProductsCount  string   `json:"products_count"`
		AverageCheck   string   `json:"average_check"`
		SalesFrequency string   `json:"sales_frequency"`
		Seasonality    *bool    `json:"seasonality"`
		// Accounting & Tax (Step 3)
		AccountingSystem string `json:"accounting_system"`
		TaxSystem        string `json:"tax_system"`
		// Financial Goals (Step 4)
		FinancialGoals []string `json:"financial_goals"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	updates := bson.M{}
	if body.Name != "" {
		updates["name"] = body.Name
	}
	if body.Country != "" {
		updates["country"] = body.Country
	}
	if body.Currency != "" {
		updates["currency"] = body.Currency
	}
	if body.LogoURL != "" {
		updates["logo_url"] = body.LogoURL
	}
	if body.BusinessCategory != "" {
		updates["business_category"] = body.BusinessCategory
	}
	if body.AnnualRevenue != "" {
		updates["annual_revenue"] = body.AnnualRevenue
	}
	if body.BusinessAge != "" {
		updates["business_age"] = body.BusinessAge
	}
	if body.Employees != "" {
		updates["employees"] = body.Employees
	}
	if body.UserRole != "" {
		updates["user_role"] = body.UserRole
	}
	if body.SalesType != "" {
		updates["sales_type"] = body.SalesType
	}
	if body.SalesChannels != nil {
		updates["sales_channels"] = body.SalesChannels
	}
	if body.ProductsCount != "" {
		updates["products_count"] = body.ProductsCount
	}
	if body.AverageCheck != "" {
		updates["average_check"] = body.AverageCheck
	}
	if body.SalesFrequency != "" {
		updates["sales_frequency"] = body.SalesFrequency
	}
	if body.Seasonality != nil {
		updates["seasonality"] = body.Seasonality
	}
	if body.AccountingSystem != "" {
		updates["accounting_system"] = body.AccountingSystem
	}
	if body.TaxSystem != "" {
		updates["tax_system"] = body.TaxSystem
	}
	if body.FinancialGoals != nil {
		updates["financial_goals"] = body.FinancialGoals
	}

	if len(updates) == 0 {
		utils.BadRequest(c, "No fields to update")
		return
	}

	company, err := services.UpdateCompany(companyID, updates)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.OK(c, company)
}

// POST /api/companies/:id/switch
// Переключает активную компанию пользователя
func SwitchCompany(c *gin.Context) {
	userID := c.GetString("user_id")
	companyID := c.Param("id")

	// Проверяем что юзер является участником
	companies, err := services.GetUserCompanies(userID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	found := false
	for _, co := range companies {
		if co.ID.Hex() == companyID {
			found = true
			break
		}
	}

	if !found {
		utils.Forbidden(c, "You are not a member of this company")
		return
	}

	// Обновляем current_company
	_, err = services.UpdateProfile(userID, bson.M{"current_company_str": companyID})
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.OKMsg(c, "Switched company successfully")
}
