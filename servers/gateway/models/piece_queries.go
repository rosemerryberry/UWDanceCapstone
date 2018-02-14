package models

import "database/sql"

// InsertNewPiece inserts the given NewPieve into the database and returns the
// created Piece, or an error if one occured.
func (store *Database) InsertNewPiece(newPiece *NewPiece) (*Piece, error) {
	result, err := store.DB.Exec(`INSERT INTO Pieces (PieceName, ShowID, IsDeleted) VALUES (?, ?, ?)`,
		newPiece.Name, newPiece.ShowID, false)
	if err != nil {
		return nil, err
	}
	pieceID, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}
	piece := &Piece{
		ID:     int(pieceID),
		Name:   newPiece.Name,
		ShowID: newPiece.ShowID,
	}
	return piece, nil
}

// GetPieceByID returns the show with the given ID.
func (store *Database) GetPieceByID(id int, includeDeleted bool) (*Piece, error) {
	piece := &Piece{}
	err := store.DB.QueryRow(`SELECT * FROM Pieces P WHERE P.PieceID = ? AND P.IsDeleted = FALSE`, id).Scan(
		&piece.ID, &piece.Name,
		&piece.ShowID, &piece.IsDeleted)
	if err != nil {
		piece = nil
	}
	if err == sql.ErrNoRows {
		err = nil
	}
	return piece, err
}

// DeletePieceByID marks the piece with the given ID as deleted.
func (store *Database) DeletePieceByID(id int) error {
	_, err := store.DB.Exec(`UPDATE Pieces SET IsDeleted = ? WHERE PieceID = ?`, true, id)
	return err
}

// GetPiecesByUserID gets all pieces the given user is in.
func (store *Database) GetPiecesByUserID(id, page int, includeDeleted bool) ([]*Piece, error) {
	offset := getSQLPageOffset(page)
	query := `SELECT DISTINCT P.PieceID, P.PieceName, P.ShowID, 
	P.IsDeleted FROM Pieces P 
	JOIN UserPiece UP ON P.PieceID = UP.PieceID 
	WHERE UP.UserID = ?`
	if !includeDeleted {
		query += ` AND UP.IsDeleted = false`
	}
	query += ` LIMIT 25 OFFSET ?`
	return handlePiecesFromDatabase(store.DB.Query(query, id, offset))
}

// GetPiecesByShowID gets all pieces that are associated with the given show ID.
func (store *Database) GetPiecesByShowID(id, page int, includeDeleted bool) ([]*Piece, error) {
	offset := getSQLPageOffset(page)
	query := `SELECT * FROM Pieces P Where P.ShowID = ?`
	if !includeDeleted {
		query += ` AND P.IsDeleted = false`
	}
	query += ` LIMIT 25 OFFSET ?`
	return handlePiecesFromDatabase(store.DB.Query(query, id, offset))
}

// GetPiecesByAuditionID gets all pieces in the given audition.
func (store *Database) GetPiecesByAuditionID(id, page int, includeDeleted bool) ([]*Piece, error) {
	offset := getSQLPageOffset(page)
	query := `SELECT P.PieceID, P.PieceName, P.ShowID, P.IsDeleted FROM Pieces P
	JOIN Shows S ON P.ShowID = S.ShowID
	WHERE S.AuditionID = ?`
	if !includeDeleted {
		query += ` AND P.IsDeleted = FALSE AND S.IsDeleted = FALSE`
	}
	query += ` LIMIT 25 OFFSET ?`
	return handlePiecesFromDatabase(store.DB.Query(query, id, offset))
}

// handlePiecesFromDatabase compiles the given result and err into a slice of pieces or an error.
func handlePiecesFromDatabase(result *sql.Rows, err error) ([]*Piece, error) {
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	pieces := make([]*Piece, 0)
	for result.Next() {
		piece := &Piece{}
		if err = result.Scan(&piece.ID, &piece.Name, &piece.ShowID, &piece.IsDeleted); err != nil {
			return nil, err
		}
		pieces = append(pieces, piece)
	}
	return pieces, nil
}