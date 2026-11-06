#!/usr/bin/env bash
# Health check for the live site at gianlucacaico.com.
# Usage (from the repo root): bash tools/health.sh
# Prints PASS / FAIL / WARN per check and exits non-zero if anything failed.

cd "$(dirname "$0")/.." || exit 1
SITE="https://gianlucacaico.com"
fails=0; warns=0
pass(){ echo "PASS  $1"; }
fail(){ echo "FAIL  $1"; fails=$((fails+1)); }
warn(){ echo "WARN  $1"; warns=$((warns+1)); }
TMP=$(mktemp -d)
bust="?health=$(date +%s)"   # skip any cached copy

# 1. Main domain loads over HTTPS
code=$(curl -s -o "$TMP"/health-home.html -w '%{http_code}' -m 30 "$SITE/$bust")
[ "$code" = "200" ] && pass "gianlucacaico.com loads over HTTPS (200)" || fail "gianlucacaico.com returned $code"

# 2. www redirects to the main domain
r=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -m 30 "https://www.gianlucacaico.com/")
case "$r" in 30*" https://gianlucacaico.com/"*) pass "www.gianlucacaico.com redirects to gianlucacaico.com";; *) fail "www.gianlucacaico.com gave: $r";; esac

# 3. Plain http is upgraded to https (the sandbox reaches http only through its proxy tunnel)
r=$(curl -s -p -x "${HTTPS_PROXY:-}" -o /dev/null -w '%{http_code} %{redirect_url}' -m 30 "http://gianlucacaico.com/" 2>/dev/null)
case "$r" in 30*" https://gianlucacaico.com/"*) pass "http:// redirects to https://";; *) warn "Could not confirm http to https redirect (got: $r)";; esac

# 4. Link preview tags are present
for tag in 'name="description"' 'rel="canonical"' 'property="og:title"' 'property="og:description"' 'property="og:image"' 'property="og:url"' 'name="twitter:card"' 'name="twitter:image"'; do
  grep -q "$tag" "$TMP"/health-home.html && pass "Link preview tag present: $tag" || fail "Missing link preview tag: $tag"
done

# 5. Link preview image loads and is a JPEG
img=$(grep -o 'property="og:image" content="[^"]*"' "$TMP"/health-home.html | sed 's/.*content="//;s/"$//')
r=$(curl -s -o /dev/null -w '%{http_code} %{content_type}' -m 30 "${img:-$SITE/assets/og-image.jpg}")
case "$r" in "200 image/jpeg"*) pass "Link preview image loads ($img)";; *) fail "Link preview image problem: $r";; esac

# 6. Project files are not public
for f in CLAUDE.md CLAUDE CLAUDE.html _config.yml .gitignore tools/preview.js tools/health.sh tools/package.json .claude/skills/publish/SKILL.md; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 30 "$SITE/$f")
  [ "$code" = "404" ] && pass "Not public: /$f" || fail "/$f is publicly reachable ($code)"
done

# 7. Live page matches what is on main in the repo
git fetch -q origin main 2>/dev/null
if git show origin/main:index.html > "$TMP"/health-repo.html 2>/dev/null; then
  if cmp -s "$TMP"/health-home.html "$TMP"/health-repo.html; then pass "Live page matches index.html on main"
  else warn "Live page differs from index.html on main (a deploy may still be in progress)"; fi
fi

# 8. CNAME is intact
[ "$(git show origin/main:CNAME 2>/dev/null | tr -d '[:space:]')" = "gianlucacaico.com" ] && pass "CNAME file is intact" || fail "CNAME file is missing or changed"

# 9. Content rule: no em dashes in the page
n=$(grep -o $'\xe2\x80\x94''\|&mdash;\|&#8212;' "$TMP"/health-home.html | wc -l)
[ "$n" = "0" ] && pass "No em dashes on the live page" || fail "$n em dash(es) on the live page"

# 10. Every view renders, images load, no script errors
node tools/check-views.js "$SITE/" && pass "All views render with images and no script errors" || fail "One or more views have problems (see above)"

echo
echo "Summary: $fails failed, $warns warnings"
[ "$fails" = "0" ]
