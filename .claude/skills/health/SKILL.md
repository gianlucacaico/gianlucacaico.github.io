---
name: health
description: Check that gianlucacaico.com is healthy. Confirms the site loads on the main domain and www, HTTPS works, link preview tags and image are present, CLAUDE.md and project files are not public, and every view renders with no broken images or script errors.
---

1. If `tools/node_modules` is missing, run `cd tools && npm install` first.
2. Run `bash tools/health.sh`.
3. Report in plain language, outcome first: "All good: N checks passed" or "N problems found". For each FAIL or WARN, explain in one sentence what it means for visitors and what you suggest. Do not change anything without approval.
4. If the live site cannot be reached at all from this session, it may be the session's network settings rather than the site; read the environment network documentation and say so.
