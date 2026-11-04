package handlers

import (
	"finsight-backend/internal/models"
	"finsight-backend/internal/services"
	"finsight-backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// GET /api/companies/:id/employees
func GetEmployees(c *gin.Context) {
	companyID := c.Param("id")
	list, err := services.GetEmployees(companyID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, list)
}

// POST /api/companies/:id/employees
func CreateEmployee(c *gin.Context) {
	companyID := c.Param("id")
	var body models.Employee
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	emp, err := services.CreateEmployee(companyID, body)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Created(c, emp)
}

// PUT /api/companies/:id/employees/:empId
func UpdateEmployee(c *gin.Context) {
	companyID := c.Param("id")
	empID := c.Param("empId")

	var body struct {
		FirstName string  `json:"first_name"`
		LastName  string  `json:"last_name"`
		Position  string  `json:"position"`
		Salary    float64 `json:"salary"`
		KPI       float64 `json:"kpi"`
		IsActive  *bool   `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	updates := bson.M{}
	if body.FirstName != "" {
		updates["first_name"] = body.FirstName
	}
	if body.LastName != "" {
		updates["last_name"] = body.LastName
	}
	if body.Position != "" {
		updates["position"] = body.Position
	}
	if body.Salary > 0 {
		updates["salary"] = body.Salary
	}
	if body.KPI >= 0 {
		updates["kpi"] = body.KPI
	}
	if body.IsActive != nil {
		updates["is_active"] = *body.IsActive
	}

	emp, err := services.UpdateEmployee(companyID, empID, updates)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, emp)
}

// DELETE /api/companies/:id/employees/:empId
func DeleteEmployee(c *gin.Context) {
	companyID := c.Param("id")
	empID := c.Param("empId")
	if err := services.DeleteEmployee(companyID, empID); err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OKMsg(c, "deleted")
}
