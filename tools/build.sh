#!/usr/bin/env bash
# Builds the site exactly as GitHub Pages does (same Jekyll version and settings).
# Usage: bash tools/build.sh [source folder] [destination folder]
# Defaults: builds the repo into tools/_site (git-ignored).
# The first run in a fresh session installs the builder (a minute or two).
set -e
TOOLS="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "${1:-$TOOLS/..}" && pwd)"
DEST="${2:-$TOOLS/_site}"
export BUNDLE_GEMFILE="$TOOLS/Gemfile" BUNDLE_PATH="$TOOLS/vendor"
bundle check >/dev/null 2>&1 || bundle install -j4 --quiet
[ -d "$TOOLS/node_modules" ] || (cd "$TOOLS" && npm install --no-audit --no-fund --silent)
bundle exec jekyll build --safe --quiet -s "$SRC" -d "$DEST"
