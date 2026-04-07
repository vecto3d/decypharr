#!/bin/sh
# Build the Next.js frontend as a static export and copy to Go embed directory
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$ROOT_DIR/frontend"
EMBED_DIR="$ROOT_DIR/pkg/web/frontend"

echo "Building Next.js frontend..."
cd "$FRONTEND_DIR"
npm ci --no-audit
BUILD_MODE=export npx next build

echo "Copying static export to embed directory..."
rm -rf "$EMBED_DIR"
cp -r "$FRONTEND_DIR/out" "$EMBED_DIR"

echo "Frontend build complete: $(find "$EMBED_DIR" -type f | wc -l) files"
