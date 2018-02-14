package models

// NewAudition defines the informtion required for a new audition
// submitted to the server
type NewAudition struct {
	Name     string `json:"name"`
	Date     string `json:"date"`
	Time     string `json:"time"`
	Location string `json:"location"`
	Quarter  string `json:"quarter"`
	Year     int    `json:"year"`
}

// Audition defines the information needed for an audition within
// the system
type Audition struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Date      string `json:"date"`
	Time      string `json:"time"`
	Location  string `json:"location"`
	Quarter   string `json:"quarter"`
	Year      int    `json:"year"`
	IsDeleted bool   `json:"isDeleted"`
}