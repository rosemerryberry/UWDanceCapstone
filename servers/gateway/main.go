package main

import (
	"log"
	"net/http"
	"os"

	_ "github.com/go-sql-driver/mysql"

	"github.com/BKellogg/UWDanceCapstone/servers/gateway/constants"
	"github.com/BKellogg/UWDanceCapstone/servers/gateway/handlers"
	"github.com/BKellogg/UWDanceCapstone/servers/gateway/middleware"

	"github.com/BKellogg/UWDanceCapstone/servers/gateway/models"
	"github.com/BKellogg/UWDanceCapstone/servers/gateway/sessions"
)

func main() {
	// Gateway server environment variables
	addr := getRequiredENVOrExit("ADDR", ":443")
	tlsKey := getRequiredENVOrExit("TLSKEY", "")
	tlsCert := getRequiredENVOrExit("TLSCERT", "")
	sessionKey := getRequiredENVOrExit("SESSIONKEY", "")

	// MYSQL Database environment variables
	mySQLPass := getRequiredENVOrExit("MYSQLPASS", "")
	mySQLAddr := getRequiredENVOrExit("MYSQLADDR", "")
	mySQLDBName := getRequiredENVOrExit("MYSQLDBNAME", "DanceDB")

	// Redis Database environment variables
	redisAddr := getRequiredENVOrExit("REDISADDR", "")

	// Open connections to the databases
	db, err := models.NewDatabase("root", mySQLPass, mySQLAddr, mySQLDBName)
	if err != nil {
		log.Fatalf("error connecting to database: %v", err)
	}
	defer db.DB.Close()
	redis := sessions.NewRedisStore(nil, constants.DefaultSessionDuration, redisAddr)
	defer redis.Client.Close()

	authContext := handlers.NewAuthContext(sessionKey, redis, db)

	standardMux := http.NewServeMux()
	standardMux.HandleFunc(constants.UsersPath, authContext.UserSignUpHandler)
	standardMux.HandleFunc(constants.SessionsPath, authContext.UserSignInHandler)

	// Handlers that require an authenticated user
	standardMux.Handle(constants.AllUsersPath, middleware.NewAuthorizer(authContext.AllUsersHandler, authContext.SessionKey, authContext.SessionsStore))
	standardMux.Handle(constants.SpecificUserPath, middleware.NewAuthorizer(authContext.SpecificUserHandler, authContext.SessionKey, authContext.SessionsStore))
	standardMux.Handle(constants.MailPath, middleware.NewAuthorizer(handlers.MailHandler, authContext.SessionKey, authContext.SessionsStore))

	loggedMux := middleware.NewLogger(standardMux, db)

	log.Printf("Gateway listening at %s...\n", addr)
	log.Fatal(http.ListenAndServeTLS(addr, tlsCert, tlsKey, loggedMux))
}

// Gets the value of env from the environment or defaults it to the given
// def. Exits the process if env and def are not set
func getRequiredENVOrExit(env, def string) string {
	if envVal := os.Getenv(env); len(envVal) != 0 {
		return envVal
	}
	if len(def) != 0 {
		log.Printf("no value for %s, defaulting to %s\n", env, def)
		return def
	}
	log.Fatalf("no value for %s and no default set. Please set a value for %s\n", env, env)
	return ""
}
