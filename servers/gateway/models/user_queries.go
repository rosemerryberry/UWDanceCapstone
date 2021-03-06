package models

import (
	"database/sql"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/BKellogg/UWDanceCapstone/servers/gateway/appvars"
)

// UserIsInPiece returns true if the given user is in the given piece or an error if one occurred.
func (store *Database) UserIsInPiece(userID, pieceID int) (bool, *DBError) {
	result, err := store.db.Query(`SELECT * FROM UserPiece UP WHERE UP.UserID = ? AND UP.PieceID = ? AND UP.IsDeleted = ?`,
		userID, pieceID, false)
	if result == nil {
		return false, NewDBError(fmt.Sprintf("error determining if user is in piece: %v", err), http.StatusInternalServerError)
	}
	defer result.Close()
	return result.Next(), nil
}

// UserIsInAudition returns true if the given user is in the given audition or an error if one occurred.
func (store *Database) UserIsInAudition(userID, audID int) (bool, *DBError) {
	result, err := store.db.Query(`SELECT * FROM UserAudition UP WHERE UP.UserID = ? AND UP.AuditionID = ? AND UP.IsDeleted = ?`,
		userID, audID, false)
	if result == nil {
		return false, NewDBError(fmt.Sprintf("error determining if user is in audition: %v", err), http.StatusInternalServerError)
	}
	defer result.Close()
	return result.Next(), nil
}

// AddUserToPiece adds the given user to the given piece.
func (store *Database) AddUserToPiece(userID, pieceID int, markInvite bool, inviteStatus string) *DBError {
	_, dberr := store.GetPieceByID(pieceID, false)
	if dberr != nil {
		return dberr
	}
	addTime := time.Now()
	exists, dberr := store.UserIsInPiece(userID, pieceID)
	if dberr != nil {
		return dberr
	}
	if exists {
		return NewDBError("user is already in this piece", http.StatusBadRequest)
	}

	tx, err := store.db.Begin()
	if err != nil {
		return NewDBError(fmt.Sprintf("error beginning transaction: %v", err), http.StatusInternalServerError)
	}
	defer tx.Rollback()

	_, err = tx.Exec(`INSERT INTO UserPiece (UserID, PieceID, CreatedAt, IsDeleted) VALUES (?, ?, ?, ?)`,
		userID, pieceID, addTime, false)
	if err != nil {
		return NewDBError(fmt.Sprintf("error isnerting user piece link: %v", err), http.StatusInternalServerError)
	}

	if markInvite {
		if inviteStatus != appvars.CastStatusAccepted && inviteStatus != appvars.CastStatusDeclined {
			return NewDBError("invalid invite status provided", http.StatusBadRequest)
		}
		_, err := tx.Exec(`UPDATE UserPiecePending UPP SET UPP.Status = ?
				WHERE UPP.UserID = ?
				AND UPP.PieceID = ?
				AND UPP.IsDeleted = FALSE
				AND UPP.Status = ?`, inviteStatus, userID, pieceID, appvars.CastStatusPending)
		if err != nil {
			return NewDBError(fmt.Sprintf("error updating user piece invite: %v", err), http.StatusInternalServerError)
		}
		if err = tx.Commit(); err != nil {
			return NewDBError(fmt.Sprintf("error committing transaction: %v", err), http.StatusInternalServerError)
		}
	}
	return nil
}

// ChangeUserRole sets the role of the given user ID to role.
// Returns an error if one occurred.
func (store *Database) ChangeUserRole(userID int, roleName string) *DBError {
	tx, err := store.db.Begin()
	if err != nil {
		return NewDBError(fmt.Sprintf("error beginning transaction: %v", err), http.StatusInternalServerError)
	}
	defer tx.Rollback()

	rows, err := tx.Query(`SELECT * FROM Role R WHERE R.RoleName = ?`, roleName)
	if err != nil {
		return NewDBError(fmt.Sprintf("error querying role: %v", err), http.StatusInternalServerError)
	}
	role := &Role{}
	if rows.Next() {
		err = rows.Scan(&role.ID, &role.Name, &role.DisplayName, &role.Level, &role.IsDeleted)
		if err != nil {
			return NewDBError(fmt.Sprintf("error scanning row into role: %v", err), http.StatusInternalServerError)
		}
	} else {
		return NewDBError(appvars.ErrNoRoleFound, http.StatusNotFound)
	}
	rows.Close()

	rows, err = tx.Query(`SELECT * FROM Users U Where U.UserID = ?`, userID)
	if err != nil {
		return NewDBError(fmt.Sprintf("error querying for user: %v", err), http.StatusInternalServerError)
	}
	if !rows.Next() {
		return NewDBError(appvars.ErrNoUserFound, http.StatusNotFound)
	}
	rows.Close()

	_, err = tx.Exec(`UPDATE Users U SET U.RoleID = ? WHERE U.UserID = ?`, role.ID, userID)
	if err != nil {
		return NewDBError(fmt.Sprintf("error updating user: %v", err), http.StatusInternalServerError)
	}

	if err = tx.Commit(); err != nil {
		return NewDBError(fmt.Sprintf("error committing transation: %v", err), http.StatusInternalServerError)
	}
	return nil
}

// RemoveUserFromPiece removes the given user from the given piece.
func (store *Database) RemoveUserFromPiece(userID, pieceID int) *DBError {
	_, dberr := store.GetPieceByID(pieceID, false)
	if dberr != nil {
		return dberr
	}
	_, err := store.db.Exec(`UPDATE UserPiece UP SET UP.IsDeleted = ? WHERE UP.UserID = ? AND UP.PieceID = ?`,
		true, userID, pieceID)
	if err != nil {
		return NewDBError(fmt.Sprintf("error removing user from piece: %v", err), http.StatusInternalServerError)
	}
	return nil
}

// AddUserToAudition adds the given user to the given audition. Returns an error
// if one occurred.
func (store *Database) AddUserToAudition(userID, audID, creatorID, numShows int, availability *WeekTimeBlock, comment string) *DBError {
	audition, dberr := store.GetAuditionByID(audID, false)
	if dberr != nil {
		return dberr
	}
	if audition == nil {
		return NewDBError(appvars.ErrAuditionDoesNotExist, http.StatusNotFound)
	}

	addTime := time.Now()
	exists, dberr := store.UserIsInAudition(userID, audID)
	if dberr != nil {
		return dberr
	}
	if exists {
		return NewDBError(appvars.ErrUserAlreadyInAudition, http.StatusBadRequest)
	}

	dayMap, err := availability.ToSerializedDayMap()
	if err != nil {
		return NewDBError(err.Error(), http.StatusBadRequest)
	}

	tx, err := store.db.Begin()
	if err != nil {
		return NewDBError(fmt.Sprintf("error beginning transaction: %v", err), http.StatusInternalServerError)
	}
	defer tx.Rollback()

	_, dberr = txGetUser(tx, userID)
	if dberr != nil {
		return dberr
	}

	regNum, dberr := txGetNextAuditionRegNumber(tx, audID)
	if dberr != nil {
		return dberr
	}

	res, err := tx.Exec(`INSERT INTO UserAuditionAvailability
		(Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, CreatedAt, IsDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		dayMap["sun"], dayMap["mon"], dayMap["tues"], dayMap["wed"], dayMap["thurs"], dayMap["fri"], dayMap["sat"], addTime, false)
	if err != nil {
		return NewDBError(fmt.Sprintf("error inserting user audition availability: %v", err), http.StatusInternalServerError)
	}
	availID, err := res.LastInsertId()
	if err != nil {
		return NewDBError(fmt.Sprintf("error getting insert ID of new availability: %v", err), http.StatusInternalServerError)
	}
	res, err = tx.Exec(`INSERT INTO UserAudition
		(AuditionID, UserID, AvailabilityID, RegNum, NumShows, CreatedBy, CreatedAt, IsDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		audID, userID, availID, regNum, numShows, creatorID, addTime, false)
	if err != nil {
		return NewDBError(fmt.Sprintf("error inserting user audition: %v", err), http.StatusInternalServerError)
	}
	userAudID, err := res.LastInsertId()
	if err != nil {
		return NewDBError(fmt.Sprintf("error retrieving last insert id: %v", err), http.StatusInternalServerError)
	}
	if len(comment) > 0 {
		_, err = tx.Exec(`INSERT INTO UserAuditionComment (UserAuditionID, Comment, CreatedAt, CreatedBy, IsDeleted) VALUES (?, ?, ?, ?, ?)`,
			userAudID, comment, addTime, creatorID, false)
		if err != nil {
			return NewDBError(fmt.Sprintf("error inserting user audition comment: %v", err), http.StatusInternalServerError)
		}
	}
	if err = tx.Commit(); err != nil {
		return NewDBError(fmt.Sprintf("error committing transaction: %v", err), http.StatusInternalServerError)
	}
	return nil
}

// RemoveUserFromPiece removes the given user from the given audition.
func (store *Database) RemoveUserFromAudition(userID, audID int) *DBError {
	_, dberr := store.GetAuditionByID(audID, false)
	if dberr != nil {
		return dberr
	}
	_, err := store.db.Exec(`UPDATE UserAudition UP SET UP.IsDeleted = ? WHERE UP.UserID = ? AND UP.AuditionID = ?`,
		true, userID, audID)
	if err != nil {
		return NewDBError(fmt.Sprintf("error removing user from audition: %v", err), http.StatusInternalServerError)
	}
	return nil
}

// GetAllUsers returns a slice of users of every user in the database, active or not.
// Returns an error if one occurred
func (store *Database) GetAllUsers(page int, includeInactive bool) ([]*User, int, *DBError) {
	sqlStmnt := &SQLStatement{
		Cols:  "*",
		Table: "Users U",
		Page:  page,
	}
	if !includeInactive {
		sqlStmnt.Where += `U.Active = TRUE`
	}

	return store.processUserQuery(sqlStmnt)
}

// ContainsUser returns true if this database contains a user with the same
// email as the given newUser object. Returns an error if one occurred
func (store *Database) ContainsUser(newUser *NewUserRequest) (bool, *DBError) {
	user, err := store.GetUserByEmail(newUser.Email, true)
	if err != nil {
		if err.HTTPStatus == http.StatusNotFound {
			return false, nil
		}
		return false, err
	}
	return user != nil, nil
}

// InsertNewUser inserts the given new user into the store
// and populates the ID field of the user
func (store *Database) InsertNewUser(user *User) *DBError {
	tx, err := store.db.Begin()
	if err != nil {
		return NewDBError(fmt.Sprintf("error beginning transaction: %v", err), http.StatusInternalServerError)
	}
	defer tx.Rollback()

	res, err := tx.Query(`SELECT R.RoleID FROM Role R WHERE R.RoleName = ?`, appvars.RoleDancer)
	if err != nil {
		if err == sql.ErrNoRows {
			return NewDBError(fmt.Sprintf("no role found with name %s", appvars.RoleDancer), http.StatusNotFound)
		}
		return NewDBError(fmt.Sprintf("error retrieving role from database: %v", err), http.StatusInternalServerError)
	}
	if !res.Next() {
		return NewDBError(fmt.Sprintf("no role found with name %s", appvars.RoleDancer), http.StatusNotFound)
	}
	role := &Role{}
	if err = res.Scan(&role.ID); err != nil {
		return NewDBError(fmt.Sprintf("error scanning result into role: %v", err), http.StatusInternalServerError)
	}
	res.Close()

	result, err := tx.Exec(
		`INSERT INTO Users (FirstName, LastName, Email, Bio, PassHash, RoleID, Active, CreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		user.FirstName, user.LastName, user.Email, "", user.PassHash, role.ID, true, user.CreatedAt)
	if err != nil {
		return NewDBError(fmt.Sprintf("error inserting user: %v", err), http.StatusInternalServerError)
	}
	user.ID, err = result.LastInsertId()
	if err != nil {
		return NewDBError(fmt.Sprintf("error retrieving last insert id: %v", err), http.StatusInternalServerError)
	}
	if err = tx.Commit(); err != nil {
		return NewDBError(fmt.Sprintf("error commiting transaction: %v", err), http.StatusInternalServerError)
	}
	user.RoleID = int(role.ID)
	return nil
}

// GetUserByID gets the user with the given id, if it exists and it is active.
// returns an error if the lookup failed
// TODO: Test this
func (store *Database) GetUserByID(id int, includeInactive bool) (*User, *DBError) {
	query := `SELECT * FROM Users U WHERE U.UserID =?`
	if !includeInactive {
		query += ` AND U.Active = true`
	}
	user := &User{}
	err := store.db.QueryRow(
		query, id).Scan(
		&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.Bio, &user.PassHash, &user.RoleID, &user.Active, &user.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, NewDBError("no user found with the given id", http.StatusNotFound)
		}
		return nil, NewDBError(fmt.Sprintf("error retrieving user from database: %v", err), http.StatusInternalServerError)
	}
	return user, nil
}

// GetUserByEmail gets the user with the given email, if it exists.
// returns an error if the lookup failed
// TODO: Test this
func (store *Database) GetUserByEmail(email string, includeInactive bool) (*User, *DBError) {
	query := `SELECT * FROM Users U WHERE U.Email =?`
	if !includeInactive {
		query += ` AND U.Active = true`
	}
	user := &User{}
	err := store.db.QueryRow(
		query,
		email).Scan(
		&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.Bio, &user.PassHash, &user.RoleID, &user.Active, &user.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, NewDBError("no user found with the given email", http.StatusNotFound)
		}
		return nil, NewDBError(fmt.Sprintf("error retrieving user from database: %v", err), http.StatusInternalServerError)
	}
	return user, nil
}

// UpdateUserByID updates the user with the given ID to match the values
// of newValues. Returns an error if one occurred.
func (store *Database) UpdateUserByID(userID int, updates *UserUpdates, includeInactive bool) *DBError {
	query := `
		UPDATE Users U SET 
		U.FirstName = COALESCE(NULLIF(?, ''), FirstName),
		U.LastName = COALESCE(NULLIF(?, ''), LastName),
		U.Bio = COALESCE(NULLIF(?, ''), Bio)
		WHERE U.UserID = ?`
	if !includeInactive {
		query += ` AND U.Active = true`
	}
	_, err := store.db.Exec(query, updates.FirstName, updates.LastName, updates.Bio, userID)
	if err != nil {
		return NewDBError(fmt.Sprintf("error updating user: %v", err), http.StatusInternalServerError)
	}
	return nil
}

// DeactivateUserByID marks the user with the given userID as inactive. Returns
// an error if one occurred.
func (store *Database) DeactivateUserByID(userID int) *DBError {
	return store.changeUserActivation(userID, false)
}

// ActivateUserByID marks the user with the given userID as active. Returns
// an error if one occurred.
func (store *Database) ActivateUserByID(userID int) *DBError {
	return store.changeUserActivation(userID, true)
}

// changeUserActivation changes the given user's activation status to
// match the given active status. Returns an error if one occurred.
func (store *Database) changeUserActivation(userID int, active bool) *DBError {
	tx, err := store.db.Begin()
	if err != nil {
		return NewDBError(fmt.Sprintf("error beginning transaction: %v", err), http.StatusInternalServerError)
	}
	defer tx.Rollback()

	result, err := tx.Exec(`UPDATE Users SET Active = ? WHERE UserID = ?`, active, userID)
	if err != nil {
		return NewDBError(fmt.Sprintf("error changing user activation by id: %v", err), http.StatusInternalServerError)
	}
	numRows, err := result.RowsAffected()
	if err != nil {
		return NewDBError(fmt.Sprintf("error retrieving rows affected %v", err), http.StatusInternalServerError)
	}
	if numRows == 0 {
		return NewDBError("no user exists with the given id with a different activation than provided", http.StatusNotFound)
	}
	if err = tx.Commit(); err != nil {
		return NewDBError(fmt.Sprintf("error committing transaction: %v", err), http.StatusInternalServerError)
	}
	return nil
}

// TODO: Modularize these GetUsersByX functions...

// GetUsersByAuditionID returns a slice of users that are in the given audition, if any.
// Returns an error if one occurred.
func (store *Database) GetUsersByAuditionID(id, page int, includeDeleted bool) ([]*User, *DBError) {
	tx, err := store.db.Begin()
	if err != nil {
		return nil, NewDBError(fmt.Sprintf("error beginning transaction: %v", err), http.StatusInternalServerError)
	}
	defer tx.Rollback()

	offset := getSQLPageOffset(page)
	result, err := tx.Query(`
		SELECT DISTINCT U.UserID, U.FirstName, U.LastName, U.Email, U.Bio, U.PassHash, U.RoleID, U.Active, U.CreatedAt FROM Users U
		JOIN UserAudition UA ON U.UserID = UA.UserID
		WHERE UA.AuditionID = ? AND UA.IsDeleted = false
		LIMIT 25 OFFSET ?`, id, offset)
	users, dberr := handleUsersFromDatabase(result, err)
	if dberr != nil {
		return nil, dberr
	}
	if err = tx.Commit(); err != nil {
		return nil, NewDBError(fmt.Sprintf("error committing transaction: %v", err), http.StatusInternalServerError)
	}
	return users, nil
}

// GetUsersByShowID returns a slice of users that are in the given show, if any.
// Returns an error if one occurred.
func (store *Database) GetUsersByShowID(id, page int, includeDeleted bool) ([]*User, int, *DBError) {
	sqlStmnt := &SQLStatement{
		Cols:  `DISTINCT U.UserID, U.FirstName, U.LastName, U.Email, U.Bio, U.PassHash, U.RoleID, U.Active, U.CreatedAt`,
		Table: `Users U`,
		Join:  `JOIN UserPiece UP ON U.UserID = UP.UserID JOIN Pieces P ON UP.PieceID = P.PieceID`,
		Where: `P.ShowID = ? AND UP.IsDeleted = false`,
		Page:  page,
	}

	return store.processUserQuery(sqlStmnt, id)
}

// GetUsersByPieceID returns a slice of users that are in the given piece, if any, as well
// as the current choreographer for that that piece if it exists.
// Returns an error if one occurred.
func (store *Database) GetUsersByPieceID(id, page int, includeDeleted bool) ([]*User, *User, int, *DBError) {
	sqlStmnt := &SQLStatement{
		Cols:  `DISTINCT U.UserID, U.FirstName, U.LastName, U.Email, U.Bio, U.PassHash, U.RoleID, U.Active, U.CreatedAt`,
		Table: `Users U`,
		Join:  `JOIN UserPiece UP ON UP.UserID = U.UserID`,
		Where: `UP.PieceID = ? AND UP.IsDeleted = FALSE`,
		Page:  page,
	}

	users, numPages, dberr := store.processUserQuery(sqlStmnt, id)
	if dberr != nil {
		return nil, nil, 0, dberr
	}
	query := `SELECT DISTINCT U.UserID, U.FirstName, U.LastName, U.Email, U.Bio, U.PassHash, U.RoleID, U.Active, U.CreatedAt FROM Users U
	JOIN Pieces P On P.ChoreographerID = U.UserID
	WHERE P.PieceID = ?`
	chor, dberr := handleUsersFromDatabase(store.db.Query(query, id))
	if dberr != nil {
		return nil, nil, 0, dberr
	}
	var chorToReturn *User
	if len(chor) > 0 {
		chorToReturn = chor[0]
	}
	return users, chorToReturn, numPages, nil
}

// UpdatePasswordByID changes the user with the given IDs passhash to the given
// byte slice representing the new passhash.
func (store *Database) UpdatePasswordByID(id int, passHash []byte) error {
	query := `UPDATE Users SET PassHash = ? WhERE UserID = ?`
	_, err := store.db.Query(query, passHash, id)
	return err
}

// getUserRoleLevel gets the role level of the given user.
// Returns an error if one occurred.
func (store *Database) getUserRoleLevel(userID int64) (int, error) {
	rows, err := store.db.Query(`
		SELECT RoleLevel FROM Role R
			JOIN Users U ON U.RoleID = R.RoleID
			WHERE U.UserID = ?`, userID)
	if err != nil {
		return -1, err
	}
	defer rows.Close()
	if !rows.Next() {
		return -1, sql.ErrNoRows
	}
	role := 0
	if err = rows.Scan(&role); err != nil {
		return -1, err
	}
	return role, nil
}

// SearchForUsers returns a slice of users that match any of the given filters.
// Returns a DBError if one occurred.
func (store *Database) SearchForUsers(email, firstName, lastName string, page int) ([]*User, int, *DBError) {
	sqlStmnt := &SQLStatement{
		Cols:  "*",
		Table: "Users U",
		Where: `1 = 1 AND U.Email LIKE ? AND U.FirstName LIKE ? AND U.LastName LIKE ? AND U.Active = TRUE`,
		Page:  page,
	}
	return store.processUserQuery(sqlStmnt, "%"+email+"%", "%"+firstName+"%", "%"+lastName+"%")
}

// handleUsersFromDatabase compiles the given result and err into a slice of users or an error.
func handleUsersFromDatabase(result *sql.Rows, err error) ([]*User, *DBError) {
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, NewDBError("no users found", http.StatusNotFound)
		}
		return nil, NewDBError(fmt.Sprintf("error retrieving users from database: %v", err), http.StatusInternalServerError)
	}
	defer result.Close()
	users := make([]*User, 0)
	for result.Next() {
		u := &User{}
		if err = result.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.Bio, &u.PassHash,
			&u.RoleID, &u.Active, &u.CreatedAt); err != nil {
			return nil, NewDBError(fmt.Sprintf("error scanning result into role: %v", err), http.StatusInternalServerError)
		}
		users = append(users, u)
	}
	return users, nil
}

// processUserQuery runs the query with the given args and returns a slice of users
// that matched that query as well as the number of pages of users that matched
// that query. Returns a DBError if an error occurred.
func (store *Database) processUserQuery(sqlStmt *SQLStatement, args ...interface{}) ([]*User, int, *DBError) {
	users, dberr := handleUsersFromDatabase(store.db.Query(sqlStmt.BuildQuery(), args...))
	if dberr != nil {
		return nil, 0, dberr
	}
	numResults := 0
	rows, err := store.db.Query(sqlStmt.BuildCountQuery(), args...)
	if err != nil {
		return nil, 0, NewDBError(fmt.Sprintf("error querying for number of results: %v", err), http.StatusInternalServerError)
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, 0, NewDBError("count query returned no results", http.StatusInternalServerError)
	}
	if err = rows.Scan(&numResults); err != nil {
		return nil, 0, NewDBError(fmt.Sprintf("error scanning rows into num results: %v", err), http.StatusInternalServerError)
	}
	return users, int(math.Ceil(float64(numResults) / 25.0)), nil
}
