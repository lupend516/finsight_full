package handlers

import (
	"finsight-backend/internal/models"
	"finsight-backend/internal/services"
	"finsight-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

// ─────────────────────────────────────────
// Members
// ─────────────────────────────────────────

// GET /api/companies/:id/members
func GetMembers(c *gin.Context) {
	companyID := c.Param("id")

	members, err := services.GetMembers(companyID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.OK(c, members)
}

// PUT /api/companies/:id/members/:userId/role
func UpdateMemberRole(c *gin.Context) {
	companyID := c.Param("id")
	targetUserID := c.Param("userId")
	requesterID := c.GetString("user_id")

	var body struct {
		Role models.Role `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	err := services.UpdateMemberRole(companyID, targetUserID, requesterID, body.Role)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.OKMsg(c, "Role updated successfully")
}

// DELETE /api/companies/:id/members/:userId
func RemoveMember(c *gin.Context) {
	companyID := c.Param("id")
	targetUserID := c.Param("userId")
	requesterID := c.GetString("user_id")

	err := services.RemoveMember(companyID, targetUserID, requesterID)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.OKMsg(c, "Member removed successfully")
}

// ─────────────────────────────────────────
// Invitations
// ─────────────────────────────────────────

// POST /api/companies/:id/invite
func InviteUser(c *gin.Context) {
	companyID := c.Param("id")
	inviterID := c.GetString("user_id")

	var input services.InviteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	invitation, link, err := services.InviteUser(companyID, inviterID, input)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Created(c, gin.H{
		"invitation":  invitation,
		"invite_link": link,
		"message":     "Invitation sent. Share the link with the user.",
	})
}

// GET /api/companies/:id/invitations
func GetInvitations(c *gin.Context) {
	companyID := c.Param("id")

	invitations, err := services.GetCompanyInvitations(companyID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.OK(c, invitations)
}

// DELETE /api/companies/:id/invitations/:invId
func RevokeInvitation(c *gin.Context) {
	companyID := c.Param("id")
	invitationID := c.Param("invId")

	err := services.RevokeInvitation(invitationID, companyID)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.OKMsg(c, "Invitation revoked")
}

// POST /api/invitations/accept
// Принять приглашение по токену (не требует companyID, юзер уже залогинен)
func AcceptInvitation(c *gin.Context) {
	userID := c.GetString("user_id")

	var body struct {
		Token string `json:"token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	err := services.AcceptInvitation(body.Token, userID)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.OKMsg(c, "Successfully joined the company")
}

// GET /api/invitations/verify/:token
// Проверить токен без авторизации (для лендинга приглашения)
func VerifyInviteToken(c *gin.Context) {
	token := c.Param("token")

	invitation, _, err := services.GetInvitationByToken(token)
	if err != nil {
		utils.NotFound(c, "Invitation not found or expired")
		return
	}

	company, err := services.GetCompany(invitation.CompanyID.Hex())
	if err != nil {
		utils.NotFound(c, "Company not found")
		return
	}

	utils.OK(c, gin.H{
		"email":        invitation.Email,
		"role":         invitation.Role,
		"company_name": company.Name,
		"expires_at":   invitation.ExpiresAt,
	})
}
