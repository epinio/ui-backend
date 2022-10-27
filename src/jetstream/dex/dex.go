package dex

import (
	"context"
	"crypto/tls"
	"net/http"
	"net/url"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/pkg/errors"
	"golang.org/x/oauth2"

	epinio_utils "github.com/epinio/ui-backend/src/jetstream/plugins/epinio/utils"
	jInterfaces "github.com/epinio/ui-backend/src/jetstream/repository/interfaces"
)

const (
	clientID     = "epinio-ui"
	clientSecret = "jetstream-dex-epinio-ui" // Should match dex config for client
)

var (
	DefaultScopes = []string{oidc.ScopeOpenID, oidc.ScopeOfflineAccess, "profile", "email", "groups", "audience:server:client_id:epinio-api"}
)

// OIDCProvider wraps an oidc.Provider and its Configuration
type OIDCProvider struct {
	Issuer   string
	Endpoint *url.URL
	Provider *oidc.Provider
	Config   *oauth2.Config
	P        jInterfaces.PortalProxy
}

func createContext(p jInterfaces.PortalProxy, defaultCtx context.Context) (context.Context, error) {
	epinioCnsi, err := epinio_utils.FindEpinioEndpoint(p)

	if err != nil {
		return nil, err
	}

	if epinioCnsi.SkipSSLValidation {
		// https://github.com/golang/oauth2/issues/187#issuecomment-227811477
		tr := &http.Transport{
			Proxy:           http.ProxyFromEnvironment,
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}
		sslcli := &http.Client{Transport: tr}
		newctx := context.TODO()
		return context.WithValue(newctx, oauth2.HTTPClient, sslcli), nil
	}

	return defaultCtx, nil
}

// NewOIDCProviderWithEndpoint construct an OIDCProvider fetching its configuration from the endpoint URL
func NewOIDCProviderWithEndpoint(p jInterfaces.PortalProxy, ctx context.Context, authEndpoint, uiUrl string) (*OIDCProvider, error) {
	issuer := authEndpoint
	endpoint, err := url.Parse(authEndpoint)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse auth endpoint")
	}

	newCtx, err := createContext(p, ctx)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create context")
	}

	provider, err := oidc.NewProvider(newCtx, issuer)
	if err != nil {
		return nil, errors.Wrap(err, "creating the provider")
	}

	lastIndex := len(uiUrl) - 1
	safeUiUrl := uiUrl
	if lastIndex == strings.LastIndex(uiUrl, "/") {
		safeUiUrl = uiUrl[:lastIndex]
	}

	config := &oauth2.Config{
		Endpoint:     provider.Endpoint(),
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  safeUiUrl + "/verify-auth",
		Scopes:       DefaultScopes,
	}

	return &OIDCProvider{
		Issuer:   issuer,
		Endpoint: endpoint,
		Provider: provider,
		Config:   config,
		P:        p,
	}, nil
}

// AuthCodeURLWithPKCE will return an URL that can be used to obtain an auth code, and a code_verifier string.
// The code_verifier is needed to implement the PKCE auth flow, since this is going to be used by our CLI
// Ref: https://www.oauth.com/oauth2-servers/pkce/
func (pc *OIDCProvider) AuthCodeURLWithPKCE(state string) (string, string) {
	codeVerifier := NewCodeVerifier()

	authCodeURL := pc.Config.AuthCodeURL(
		state,
		oauth2.SetAuthURLParam("code_verifier", codeVerifier.Value),
		oauth2.SetAuthURLParam("code_challenge", codeVerifier.ChallengeS256()),
		oauth2.SetAuthURLParam("code_challenge_method", "S256"),
	)

	return authCodeURL, codeVerifier.Value
}

// ExchangeWithPKCE will exchange the authCode with a token, checking if the codeVerifier is valid
func (pc *OIDCProvider) ExchangeWithPKCE(ctx context.Context, authCode, codeVerifier string) (*oauth2.Token, error) {

	newCtx, err := createContext(pc.P, ctx)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create context")
	}

	token, err := pc.Config.Exchange(newCtx, authCode, oauth2.SetAuthURLParam("code_verifier", codeVerifier))
	if err != nil {
		return nil, errors.Wrap(err, "exchanging code for token")
	}
	return token, nil
}

// Verify will verify the token, and it will return an oidc.IDToken
func (pc *OIDCProvider) Verify(ctx context.Context, rawIDToken string) (*oidc.IDToken, error) {
	newCtx, err := createContext(pc.P, ctx)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create context")
	}

	keySet := oidc.NewRemoteKeySet(newCtx, pc.Endpoint.String()+"/keys")
	verifier := oidc.NewVerifier(pc.Issuer, keySet, &oidc.Config{ClientID: pc.Config.ClientID})

	token, err := verifier.Verify(newCtx, rawIDToken)
	if err != nil {
		return nil, errors.Wrap(err, "verifying rawIDToken")
	}
	return token, nil
}

func (pc OIDCProvider) GetConfig() *oauth2.Config {
	return pc.Config
}
