package pluginproxy

import (
	"bytes"
	"fmt"
	"github.com/grafana/grafana/pkg/setting"
	"io/ioutil"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"text/template"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/plugins"
)

// interpolateString accepts template data and return a string with substitutions
func interpolateString(text string, data templateData) (string, error) {
	extraFuncs := map[string]interface{}{
		"orEmpty": func(v interface{}) interface{} {
			if v == nil {
				return ""
			}
			return v
		},
	}

	t, err := template.New("content").Funcs(extraFuncs).Parse(text)
	if err != nil {
		return "", fmt.Errorf("could not parse template %s", text)
	}

	var contentBuf bytes.Buffer
	err = t.Execute(&contentBuf, data)
	if err != nil {
		return "", fmt.Errorf("failed to execute template %s", text)
	}

	return contentBuf.String(), nil
}

// addHeaders interpolates route headers and injects them into the request headers
func addHeaders(reqHeaders *http.Header, route *plugins.AppPluginRoute, data templateData) error {
	for _, header := range route.Headers {
		interpolated, err := interpolateString(header.Content, data)
		if err != nil {
			return err
		}
		reqHeaders.Set(header.Name, interpolated)
	}

	return nil
}

// addQueryString interpolates route params and injects them into the request object
func addQueryString(req *http.Request, route *plugins.AppPluginRoute, data templateData) error {
	q := req.URL.Query()
	for _, param := range route.URLParams {
		interpolatedName, err := interpolateString(param.Name, data)
		if err != nil {
			return err
		}

		interpolatedContent, err := interpolateString(param.Content, data)
		if err != nil {
			return err
		}

		q.Add(interpolatedName, interpolatedContent)
	}
	req.URL.RawQuery = q.Encode()

	return nil
}

func setBodyContent(req *http.Request, route *plugins.AppPluginRoute, data templateData) error {
	if route.Body != nil {
		interpolatedBody, err := interpolateString(string(route.Body), data)
		if err != nil {
			return err
		}

		req.Body = ioutil.NopCloser(strings.NewReader(interpolatedBody))
		req.ContentLength = int64(len(interpolatedBody))
	}

	return nil
}

// Set the X-Grafana-User header if needed (and remove if not)
func applyUserHeader(cfg *setting.Cfg, sendUserHeader bool, req *http.Request, user *models.SignedInUser) {
	req.Header.Del("X-Grafana-User")
	if sendUserHeader && !user.IsAnonymous {
		// Reveal: this is duplicated into pkg/api/avenge.go
		req.Header.Set("X-Grafana-User", user.Login)
		req.Header.Set("X-Grafana-Org-Id", strconv.FormatInt(user.OrgId, 10))
		req.Header.Set("X-Grafana-Ext-Org-Id", strconv.FormatInt(user.OrgId, 10))
		req.Header.Set("X-Grafana-Ext-Org-Name", user.OrgName)
		req.Header.Set("X-Grafana-Ext-User-Name", user.Name)
		req.Header.Set("X-Grafana-Ext-User-Email", user.Email)
		req.Header.Set("X-Grafana-Ext-User-Id", strconv.FormatInt(user.UserId, 10))
		req.Header.Set("X-Grafana-Ext-User-Agent", req.UserAgent())
		req.Header.Set("X-Grafana-Ext-Remote-Addr", req.RemoteAddr)
		req.Header.Set("X-Grafana-Ext-Admin", strconv.FormatBool(user.IsGrafanaAdmin))
		req.Header.Set("X-Grafana-Ext-Org-Role", string(user.OrgRole))
		if len(cfg.LoginCookieName) > 0 {
			cookie, err := req.Cookie(cfg.LoginCookieName)
			if err == nil {
				val, _ := url.QueryUnescape(cookie.Value)
				req.Header.Set("X-Grafana-Ext-Session-Id", val)
			}
		}
	}
}
