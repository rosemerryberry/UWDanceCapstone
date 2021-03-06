package handlers

import (
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/Pallinder/go-randomdata"
	"github.com/gorilla/mux"

	"github.com/BKellogg/UWDanceCapstone/servers/gateway/notify"
	"github.com/BKellogg/UWDanceCapstone/servers/gateway/permissions"

	"github.com/BKellogg/UWDanceCapstone/servers/gateway/middleware"
	"github.com/BKellogg/UWDanceCapstone/servers/gateway/models"
)

// AnnouncementsHandler handles requests related to announcements resource.
func (ctx *AnnouncementContext) AnnouncementsHandler(w http.ResponseWriter, r *http.Request, u *models.User) *middleware.HTTPError {
	switch r.Method {
	case "GET":
		if !ctx.permChecker.UserCan(u, permissions.SeeAnnouncements) {
			return permissionDenied()
		}
		page, httperr := getPageParam(r)
		if httperr != nil {
			return httperr
		}
		includeDeleted := getIncludeDeletedParam(r)
		announcements, numPages, dberr := ctx.Store.GetAllAnnouncements(page, includeDeleted, getStringParam(r, "user"), getStringParam(r, "type"))
		if dberr != nil {
			return HTTPError(dberr.Message, dberr.HTTPStatus)
		}
		sort.Slice(announcements, func(i, j int) bool {
			return !announcements[i].CreatedAt.Before(announcements[j].CreatedAt)
		})
		return respond(w, models.PaginateNumAnnouncementResponses(announcements, page, numPages), http.StatusOK)
	case "POST":
		if !ctx.permChecker.UserCan(u, permissions.SendAnnouncements) {
			return permissionDenied()
		}

		na := &models.NewAnnouncement{}
		if err := receive(r, na); err != nil {
			return err
		}
		na.UserID = u.ID
		announcement, dberr := ctx.Store.InsertAnnouncement(na)
		if dberr != nil {
			return HTTPError(dberr.Message, dberr.HTTPStatus)
		}
		wse := notify.NewWebSocketEvent(-1, notify.EventTypeAnnouncement,
			announcement.AsAnnouncementResponse(u))
		ctx.Notifier.Notify(wse)
		return respond(w, announcement, http.StatusCreated)
	default:
		return methodNotAllowed()
	}
}

// AnnouncementTypeHandler handles general requests to the announcement types resource.
func (ctx *AuthContext) AnnouncementTypesHandler(w http.ResponseWriter, r *http.Request, u *models.User) *middleware.HTTPError {
	switch r.Method {
	case "GET":
		if !ctx.permChecker.UserCan(u, permissions.SeeAnnouncementTypes) {
			return permissionDenied()
		}
		announcementTypes, err := ctx.store.GetAnnouncementTypes(getIncludeDeletedParam(r))
		if err != nil {
			return HTTPError(err.Message, err.HTTPStatus)
		}
		return respond(w, announcementTypes, http.StatusOK)
	case "POST":
		if !ctx.permChecker.UserCan(u, permissions.CreateAnnouncementTypes) {
			return permissionDenied()
		}
		announcementType := &models.AnnouncementType{}
		if err := receive(r, announcementType); err != nil {
			return err
		}
		announcementType.CreatedBy = int(u.ID)
		if err := ctx.store.InsertAnnouncementType(announcementType); err != nil {
			return HTTPError(err.Message, err.HTTPStatus)
		}
		return respond(w, announcementType, http.StatusCreated)
	default:
		return methodNotAllowed()
	}
}

// SpecificAnnouncementHandler handles requests for a specific announcement
func (ctx *AnnouncementContext) SpecificAnnouncementHandler(w http.ResponseWriter, r *http.Request, u *models.User) *middleware.HTTPError {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return unparsableIDGiven()
	}
	switch r.Method {
	case "DELETE":
		if !ctx.permChecker.UserCan(u, permissions.DeleteAnnouncements) {
			return permissionDenied()
		}

		dberr := ctx.Store.DeleteAnnouncementByID(id)
		if dberr != nil {
			return middleware.HTTPErrorFromDBErrorContext(dberr, "error deleting announcement")
		}
		return respondWithString(w, "announcement deleted", http.StatusOK)
	default:
		return methodNotAllowed()
	}
}

// DummyAnnouncementHandler handles requests made to make a dummy announcement. Creates a dummy
// announcement and sends it over the context's notifier.
func (ctx *AnnouncementContext) DummyAnnouncementHandler(w http.ResponseWriter, r *http.Request, u *models.User) *middleware.HTTPError {
	if !ctx.permChecker.UserCan(u, permissions.SendAnnouncements) {
		return permissionDenied()
	}
	dummyUser := &models.User{
		FirstName: randomdata.FirstName(randomdata.RandomGender),
		LastName:  randomdata.LastName(),
		Email:     randomdata.Email(),
		RoleID:    randomdata.Number(0, 100),
		Active:    true,
	}
	wsa := &models.AnnouncementResponse{
		ID:        0,
		CreatedAt: time.Now(),
		CreatedBy: dummyUser,
		Message:   randomdata.Letters(randomdata.Number(10, 75)),
		IsDeleted: false,
	}
	ctx.Notifier.Notify(notify.NewWebSocketEvent(-1, notify.EventTypeAnnouncement, wsa))
	return respondWithString(w,
		"Randomly generated announcement send over the announcement websocket. This announcement was not persisted to the database",
		http.StatusCreated)
}
