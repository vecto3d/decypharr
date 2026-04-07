package web

import (
	"embed"
	"io/fs"
	"net/http"
	"os"
	"strings"
)

//go:embed frontend/*
var frontendEmbed embed.FS

// frontendHandler serves the Next.js static export.
// It tries to serve the exact file first, then falls back to {path}.html
// for client-side routing (e.g. /dashboard -> /dashboard.html).
func frontendHandler() http.Handler {
	fsys, err := fs.Sub(frontendEmbed, "frontend")
	if err != nil {
		// Fallback: no frontend embedded (dev mode)
		return http.NotFoundHandler()
	}

	fileServer := http.FileServer(http.FS(fsys))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if path == "/" {
			path = "/index.html"
		}

		// Strip leading slash for fs lookup
		clean := strings.TrimPrefix(path, "/")

		// Try exact file first
		if f, err := fs.Stat(fsys, clean); err == nil && !f.IsDir() {
			fileServer.ServeHTTP(w, r)
			return
		}

		// Try path.html (Next.js static export convention)
		htmlPath := clean + ".html"
		if _, err := fs.Stat(fsys, htmlPath); err == nil {
			r.URL.Path = "/" + htmlPath
			fileServer.ServeHTTP(w, r)
			return
		}

		// Try path/index.html (directory index)
		indexPath := clean + "/index.html"
		if _, err := fs.Stat(fsys, indexPath); err == nil {
			r.URL.Path = "/" + indexPath
			fileServer.ServeHTTP(w, r)
			return
		}

		// Fallback to index.html for client-side routing
		r.URL.Path = "/index.html"
		fileServer.ServeHTTP(w, r)
	})
}

// HasFrontend checks if the embedded frontend exists
func HasFrontend() bool {
	entries, err := fs.ReadDir(frontendEmbed, "frontend")
	if err != nil {
		return false
	}
	return len(entries) > 0
}

// FrontendDevMode checks if we should skip embedded frontend (dev uses next dev)
func FrontendDevMode() bool {
	return os.Getenv("FRONTEND_DEV") == "1"
}
