package config

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

// LoadEnvFile reads a .env file and sets environment variables.
// Variables already set in the environment are NOT overwritten.
// Supports: KEY=VALUE, KEY="VALUE", KEY='VALUE', # comments, blank lines.
func LoadEnvFile(dir string) {
	paths := []string{
		filepath.Join(dir, ".env"),
		".env",
	}

	for _, path := range paths {
		if err := loadEnv(path); err == nil {
			return // loaded successfully
		}
	}
}

func loadEnv(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Split on first '='
		idx := strings.IndexByte(line, '=')
		if idx < 1 {
			continue
		}

		key := strings.TrimSpace(line[:idx])
		val := strings.TrimSpace(line[idx+1:])

		// Strip surrounding quotes
		if len(val) >= 2 {
			if (val[0] == '"' && val[len(val)-1] == '"') ||
				(val[0] == '\'' && val[len(val)-1] == '\'') {
				val = val[1 : len(val)-1]
			}
		}

		// Don't overwrite existing env vars
		if _, exists := os.LookupEnv(key); !exists {
			os.Setenv(key, val)
		}
	}

	return scanner.Err()
}

// Env reads an environment variable with a fallback default.
func Env(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

// EnvBool reads a boolean environment variable.
func EnvBool(key string, fallback bool) bool {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback
	}
	switch strings.ToLower(v) {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	}
	return fallback
}
