CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE KEY,
    PassHash BINARY(60) NOT NULL,
    Role VARCHAR(3) NOT NULL,
    Active BOOLEAN NOT NULL
);

CREATE TABLE Auditions (
    AuditionID INT AUTO_INCREMENT PRIMARY KEY
);

CREATE TABLE Shows (
    ShowID INT AUTO_INCREMENT PRIMARY KEY,
    AuditionID INT,
    FOREIGN KEY (AuditionID) REFERENCES Auditions(AuditionID)
);

CREATE TABLE Pieces (
    PieceID INT AUTO_INCREMENT PRIMARY KEY,
    ShowID INT NOT NULL,
    FOREIGN KEY (ShowID) REFERENCES Shows(ShowID)
);

CREATE TABLE UserPiece (
    UserPieceID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    PieceID INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (PieceID) REFERENCES Pieces(PieceID)
);

CREATE TABLE UserAudition (
    UserAuditionID INT AUTO_INCREMENT PRIMARY KEY,
    AuditionID INT NOT NULL,
    UserID INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (AuditionID) REFERENCES Auditions(AuditionID)
);

CREATE TABLE Errors (
    ErrorID INT AUTO_INCREMENT PRIMARY KEY,
    ErrTime DATETIME NOT NULL,
    ErrRemoteAddr VARCHAR (25) NOT NULL,
    ErrRequestMethod VARCHAR (25) NOT NULL,
    ErrRequestURI VARCHAR (100) NOT NULL,
    ErrCode INT NOT NULL,
    ErrMessage VARCHAR(150) NOT NULL
);