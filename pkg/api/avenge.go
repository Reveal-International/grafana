package api

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
)

// AvengeServer All objects in go are simple struct like C
type AvengeServer struct {
	cfg *setting.Cfg
}

// NewAvengeServer Creates a new avenge server
func NewAvengeServer(cfg *setting.Cfg) *AvengeServer {
	return &AvengeServer{cfg: cfg}
}

func (a *AvengeServer) SetAvengeHeaders(req *http.Request, user *models.SignedInUser) {
	req.Header.Set("X-Grafana-User", user.Login)
	req.Header.Set("X-Grafana-Org-Id", strconv.FormatInt(user.OrgId, 10))
	req.Header.Set("X-Grafana-Ext-Org-Name", user.OrgName)
	req.Header.Set("X-Grafana-Ext-User-Name", user.Name)
	req.Header.Set("X-Grafana-Ext-User-Email", user.Email)
	req.Header.Set("X-Grafana-Ext-User-Id", strconv.FormatInt(user.UserId, 10))
	req.Header.Set("X-Grafana-Ext-User-Agent", req.UserAgent())
	req.Header.Set("X-Grafana-Ext-Remote-Addr", req.RemoteAddr)
	req.Header.Set("X-Grafana-Ext-Admin", strconv.FormatBool(user.IsGrafanaAdmin))
	req.Header.Set("X-Grafana-Ext-Org-Role", string(user.OrgRole))
	if len(a.cfg.LoginCookieName) > 0 {
		cookie, err := req.Cookie(a.cfg.LoginCookieName)
		if err == nil {
			val, _ := url.QueryUnescape(cookie.Value)
			req.Header.Set("X-Grafana-Ext-Session-Id", val)
		}
	}
}

// Handler This methods handles the proxying off the request - Note is associated with the struct above
func (a *AvengeServer) Handler(c *models.ReqContext) {
	proxyPath := c.Params("*")
	target := a.cfg.ExtAvengeUrl
	if len(target) == 0 {
		target = "http://localhost:8080"
	}
	avengeUrl, _ := url.Parse(target)
	director := func(req *http.Request) {
		req.URL.Scheme = avengeUrl.Scheme
		req.URL.Host = avengeUrl.Host
		req.Host = avengeUrl.Host

		req.URL.Path = util.JoinURLFragments(avengeUrl.Path, proxyPath)

		a.SetAvengeHeaders(req, c.SignedInUser)

		c.Logger.Debug("Avenge reverse proxying request", "proxyPath", proxyPath, "request", req)

		// clear cookie headers
		req.Header.Del("Cookie")
		req.Header.Del("Set-Cookie")
		req.Header.Del("Authorization")
	}
	// This does all the heavy lifting for reverse proxying..
	proxy := &httputil.ReverseProxy{Director: director}
	proxy.ServeHTTP(c.Resp, c.Req.Request)
}
