package handlers

import (
	"finsight-backend/internal/services"
	"finsight-backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// POST /api/auth/register
func Register(c *gin.Context) {
	var input services.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	result, err := services.Register(input)
	if err != nil {
		if err.Error() == "email already registered" {
			utils.Conflict(c, err.Error())
			return
		}
		utils.InternalError(c, err.Error())
		return
	}

	utils.Created(c, result)
}

// POST /api/auth/login
func Login(c *gin.Context) {
	var input services.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	result, err := services.Login(input)
	if err != nil {
		utils.Unauthorized(c, err.Error())
		return
	}

	utils.OK(c, result)
}

// GET /api/auth/me
func Me(c *gin.Context) {
	userID := c.GetString("user_id")

	user, err := services.GetUserByID(userID)
	if err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	utils.OK(c, user.ToPublic())
}

// PUT /api/auth/me
func UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	var body struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Avatar    string `json:"avatar"`
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
	if body.Avatar != "" {
		updates["avatar"] = body.Avatar
	}

	if len(updates) == 0 {
		utils.BadRequest(c, "No fields to update")
		return
	}

	user, err := services.UpdateProfile(userID, updates)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.OK(c, user.ToPublic())
}

// POST /api/auth/refresh
func Refresh(c *gin.Context) {
	var body struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "refresh_token is required")
		return
	}

	result, err := services.RefreshAccessToken(body.RefreshToken)
	if err != nil {
		utils.Unauthorized(c, err.Error())
		return
	}

	utils.OK(c, result)
}

// PUT /api/auth/change-password
func ChangePassword(c *gin.Context) {
	userID := c.GetString("user_id")

	var body struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if err := services.ChangePassword(userID, body.OldPassword, body.NewPassword); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.OKMsg(c, "Password changed successfully")
}
