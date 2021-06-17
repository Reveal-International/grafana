package api

import (
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
	"net/http"
	"net/http/httputil"
	"net/url"
)

// AvengeServer All objects in go are simple struct like C
type AvengeServer struct {
	cfg *setting.Cfg
}

// NewAvengeServer Creates a new avenge server
func NewAvengeServer(cfg *setting.Cfg) *AvengeServer {
	return &AvengeServer{cfg: cfg}
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

		c.Logger.Info("Avenge reverse proxying request", "proxyPath", proxyPath, "request", req)

		// clear cookie headers
		req.Header.Del("Cookie")
		req.Header.Del("Set-Cookie")
		req.Header.Del("Authorization")
	}
	// This does all the heavy lifting for reverse proxying..
	proxy := &httputil.ReverseProxy{Director: director}
	proxy.ServeHTTP(c.Resp, c.Req.Request)
}
