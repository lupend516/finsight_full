package handlers

import (
	"finsight-backend/internal/models"
	"finsight-backend/internal/services"
	"finsight-backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// GET /api/companies/:id/products
func GetProducts(c *gin.Context) {
	companyID := c.Param("id")
	products, err := services.GetProducts(companyID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, products)
}

// POST /api/companies/:id/products
func CreateProduct(c *gin.Context) {
	companyID := c.Param("id")
	var body struct {
		Name         string  `json:"name"          binding:"required"`
		SKU          string  `json:"sku"`
		CostPrice    float64 `json:"cost_price"`
		SellingPrice float64 `json:"selling_price"`
		Unit         string  `json:"unit"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	p := models.Product{
		Name:         body.Name,
		SKU:          body.SKU,
		CostPrice:    body.CostPrice,
		SellingPrice: body.SellingPrice,
		Unit:         body.Unit,
	}
	created, err := services.CreateProduct(companyID, p)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Created(c, created)
}

// PUT /api/companies/:id/products/:productId
func UpdateProduct(c *gin.Context) {
	productID := c.Param("productId")
	var body struct {
		Name         string  `json:"name"`
		SKU          string  `json:"sku"`
		CostPrice    float64 `json:"cost_price"`
		SellingPrice float64 `json:"selling_price"`
		Unit         string  `json:"unit"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	updates := bson.M{}
	if body.Name != "" {
		updates["name"] = body.Name
	}
	if body.SKU != "" {
		updates["sku"] = body.SKU
	}
	if body.CostPrice > 0 {
		updates["cost_price"] = body.CostPrice
	}
	if body.SellingPrice > 0 {
		updates["selling_price"] = body.SellingPrice
	}
	if body.Unit != "" {
		updates["unit"] = body.Unit
	}
	updated, err := services.UpdateProduct(productID, updates)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, updated)
}

// DELETE /api/companies/:id/products/:productId
func DeleteProduct(c *gin.Context) {
	productID := c.Param("productId")
	if err := services.DeleteProduct(productID); err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OKMsg(c, "deleted")
}

// GET /api/companies/:id/bookkeeping/pnl
func GetPnL(c *gin.Context) {
	companyID := c.Param("id")
	data, err := services.GetPnL(companyID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.OK(c, data)
}
