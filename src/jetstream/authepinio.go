package main

import (
	"database/sql"
	// "encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"math"
	"net/http"
	"net/url"
	// "strings"
	// "time"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo/v4"

	// "github.com/epinio/ui-backend/src/jetstream/crypto"
	"github.com/epinio/ui-backend/src/jetstream/plugins/epinio/rancherproxy"
	// "github.com/epinio/ui-backend/src/jetstream/plugins/epinio"
	// rancherApi "github.com/epinio/ui-backend/src/jetstream/plugins/epinio/rancherproxy/api"

	"github.com/epinio/ui-backend/src/jetstream/repository/interfaces"
	// "github.com/epinio/ui-backend/src/jetstream/repository/localusers"
)

//More fields will be moved into here as global portalProxy struct is phased out
type epinioAuth struct {
	databaseConnectionPool *sql.DB
	// localUserScope         string
	// consoleAdminScope      string
	p                      *portalProxy
}

func (a *epinioAuth) ShowConfig(config *interfaces.ConsoleConfig) {
	log.Infof("... Epinio Auth              : %s", true) // TODO: RC
	// log.Infof("... Local User Scope        : %s", config.LocalUserScope)
}

const (
	tempUserName = "WOOPWOOP" // TODO: RC store username in session (as user_id??)
	tempUserGuid = "tempUserName"
)

//Login provides Local-auth specific Stratos login
func (a *epinioAuth) Login(c echo.Context) error {

	//This check will remain in until auth is factored down into its own package
	if interfaces.AuthEndpointTypes[a.p.Config.ConsoleConfig.AuthEndpointType] != interfaces.Epinio {
		err := interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"Epinio Login is not enabled",
			"Epinio Login is not enabled")
		return err
	}


	// authString := fmt.Sprintf("%s:%s", auth.Username, auth.Password)
	// base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))
    // Perform the login and fetch session values if successful
	userGUID, username, err := a.epinioLogin(c)
	// userGUID := tempUserGuid
	// username := tempUserName

	if err != nil {
		//Login failed, return response.
		resp := &rancherproxy.LoginErrorRes{
			Type:      "error",
			BasetType: "error",
			Code:      "Unauthorized",
			Status:    401,// TODO: RC
			Message:   err.Error(),
		}

		if jsonString, err := json.Marshal(resp); err == nil {
			c.Response().Status = 401// TODO: RC
			c.Response().Header().Set("Content-Type", "application/json")
			c.Response().Write(jsonString)
		}

		return nil
	}

	err = a.generateLoginSuccessResponse(c, userGUID, username)

	return err
}

//Logout provides Local-auth specific Stratos login
func (a *epinioAuth) Logout(c echo.Context) error {
	return a.logout(c)
}

//GetUsername gets the user name for the specified local user
func (a *epinioAuth) GetUsername(userid string) (string, error) {
	log.Debug("GetUsername")

	return tempUserName, nil; // TODO: RC

	// localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(a.databaseConnectionPool)
	// if err != nil {
	// 	log.Errorf("Database error getting repo for Local users: %v", err)
	// 	return "", err
	// }

	// localUser, err := localUsersRepo.FindUser(userid)
	// if err != nil {
	// 	log.Errorf("Error fetching username for local user %s: %v", userid, err)
	// 	return "", err
	// }

	// return localUser.Username, nil
}

//GetUser gets the user guid for the specified local user
func (a *epinioAuth) GetUser(userGUID string) (*interfaces.ConnectedUser, error) {
	log.Debug("GetUser")

	// localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(a.databaseConnectionPool)
	// if err != nil {
	// 	log.Errorf("Database error getting repo for Local users: %v", err)
	// 	return nil, err
	// }

	// user, err := localUsersRepo.FindUser(userGUID)
	// if err != nil {
	// 	return nil, err
	// }

	// uaaAdmin := (user.Scope == a.p.Config.ConsoleConfig.ConsoleAdminScope)
	uaaAdmin := false

	var scopes []string
	scopes = make([]string, 3)
	// scopes[0] = "stratos.admin" // user.Scope // TODO: RC
	scopes[0] = "password.write"
	scopes[1] = "scim.write"

	connectedUser := &interfaces.ConnectedUser{
		GUID:   tempUserGuid,
		Name:   tempUserName,
		Admin:  uaaAdmin,
		Scopes: scopes,
	}

	return connectedUser, nil
}

func (a *epinioAuth) BeforeVerifySession(c echo.Context) {}

// TODO: RC Run through this file an error non-implemented methods (check with local auth)
// VerifySession

//VerifySession verifies the session the specified local user, currently just verifies user exists
func (a *epinioAuth) VerifySession(c echo.Context, sessionUser string, sessionExpireTime int64) error {
	return nil
}

// func (a *epinioAuth) getEpinioPlugin() (*epinio.Epinio, error) {
// 	epinioPlugin := a.p.GetPlugin("epinio")// TODO: RC Neil how to export const EndpointType from plugin
// 	if epinioPlugin == nil {
// 		return nil, errors.New("Could not find epinio plugin")
// 	}

// 	epinio, ok := epinioPlugin.GetEndpointPlugin().(epinio.Epinio)
// 	if !ok {
// 		return nil, errors.New("Could not find Epinio plugin interface")
// 	}

// 	return &epinio, nil
// }

//epinioLogin verifies local user credentials against our DB
func (a *epinioAuth) epinioLogin(c echo.Context) (string, string, error) {
	log.Debug("doLocalLogin")

	username, password, err := a.getRancherUsernameAndPassword(c)
	if err != nil {
		return "", "", err
	}

	if err := a.verifyEpinioCreds(username, password); err != nil {
		return "", "", err
	}

	// User guid, user name, err
	return username, username, nil
}

func (a *epinioAuth) getRancherUsernameAndPassword(c echo.Context) (string, string, error) {
	defer c.Request().Body.Close()
	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		return "", "", err
	}

	var params rancherproxy.LoginParams
	log.Error("GetRancherUsernameAndPassword: %+v", body)
	if err = json.Unmarshal(body, &params); err != nil {
		return "", "", err
	}

	username := params.Username
	password := params.Password

	if len(username) == 0 || len(password) == 0 {
		return "", username, errors.New("Username and/or password required")
	}

	c.Set("rancher_username", username)
	c.Set("rancher_password", password)

	return username, password, nil;
}

func (a *epinioAuth) verifyEpinioCreds(username, password string) (error) {
	log.Debug("verifyEpinioCreds")

	endpoints, err := a.p.ListEndpoints()
	if err != nil {
		msg := "Failed to fetch list of endpoints: %+v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	var epinioEndpoint *interfaces.CNSIRecord
	for _, e := range endpoints {
		if e.CNSIType == "epinio" { // TODO: RC un-hardcode
			epinioEndpoint = e
			break;
		}
	}

	if epinioEndpoint == nil {
		msg := "Failed to find an epinio endpoint"
		log.Error(msg)
		return fmt.Errorf(msg)
	}
	// var epinioApiUrl *url.URL

	credsUrl := fmt.Sprintf("%s/api/v1/info", epinioEndpoint.APIEndpoint.String())

	req, err := http.NewRequest("GET", credsUrl, nil)
	if err != nil {
		msg := "Failed to create request to verify epinio creds: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	req.SetBasicAuth(url.QueryEscape(username), url.QueryEscape(password))
	// req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)

	var h = a.p.GetHttpClientForRequest(req, epinioEndpoint.SkipSSLValidation)
	res, err := h.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing verify epinio creds - response: %v, error: %v", res, err)
		return interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()

	return nil

}
//////////

// TODO: RC REMOVE
// func (e *epinioAuth) saveAuthToken(key string, t interfaces.TokenRecord) error {
// 	log.Debug("saveAuthToken")

// 	tokenRepo, err := e.p.GetStoreFactory().TokenStore()
// 	if err != nil {
// 		return fmt.Errorf("Database error getting repo for Epinio token: %v", err)
// 	}

// 	err = tokenRepo.SaveAuthToken(key, t, e.p.Config.EncryptionKeyInBytes)
// 	if err != nil {
// 		return fmt.Errorf("Database error saving Epinio token: %v", err)
// 	}

// 	return nil
// }

//generateLoginSuccessResponse
func (e *epinioAuth) generateLoginSuccessResponse(c echo.Context, userGUID string, username string) error {
	log.Debug("generateLoginSuccessResponse")

	var err error
	var expiry int64
	expiry = math.MaxInt64

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = userGUID
	sessionValues["exp"] = expiry

	// Ensure that login disregards cookies from the request
	req := c.Request()
	req.Header.Set("Cookie", "")
	if err = e.p.setSessionValues(c, sessionValues); err != nil {
		return err
	}

	//Makes sure the client gets the right session expiry time
	if err = e.p.handleSessionExpiryHeader(c); err != nil {
		return err
	}

	// err = e.saveAuthToken(userGUID, *token)
	// if err != nil {
	// 	return err
	// }

	err = e.p.ExecuteLoginHooks(c)
	if err != nil {
		log.Warnf("Login hooks failed: %v", err)
	}

	resp := &interfaces.LoginRes{
		Account:     username,
		TokenExpiry: expiry,// TODO: RC wire in
		APIEndpoint: nil,
		Admin:       false,
	}

	if jsonString, err := json.Marshal(resp); err == nil {
		// Add XSRF Token
		e.p.ensureXSRFToken(c)
		c.Response().Header().Set("Content-Type", "application/json")
		c.Response().Write(jsonString)
	}

	return err
}

//logout
func (a *epinioAuth) logout(c echo.Context) error {
	// TODO: RC Test properly
	log.Debug("logout")

	a.p.removeEmptyCookie(c)

	// Remove the XSRF Token from the session
	a.p.unsetSessionValue(c, XSRFTokenSessionName)

	err := a.p.clearSession(c)
	if err != nil {
		log.Errorf("Unable to clear session: %v", err)
	}

	// Send JSON document
	resp := &LogoutResponse{
		IsSSO: a.p.Config.SSOLogin,
	}

	return c.JSON(http.StatusOK, resp)
}
