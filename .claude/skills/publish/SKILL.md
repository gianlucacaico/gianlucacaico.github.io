---
name: publish
description: Put an approved change live on gianlucacaico.com. Commits with a plain-English message, pushes to main, waits for the GitHub Pages deployment, verifies the change on the live site and reports back. Only run when Gianluca has explicitly approved the change.
disable-model-invocation: true
argument-hint: "[optional note about what was approved]"
---

Note from Gianluca: $ARGUMENTS

1. **Confirm approval.** Gianluca must have explicitly approved this exact change in this conversation after seeing the wording and previews. If he has not, show what would be published and ask. Do not proceed on assumed approval.
2. **Check what is about to ship.** Run `git status` and `git diff --stat`. Confirm:
   - only the approved change is included (one change per commit; if unrelated changes are mixed in, stop and ask);
   - `CNAME` is unchanged and the link preview tags in `<head>` are intact;
   - no em dashes: `grep -c $'\xe2\x80\x94' index.html` (the em dash character) and the commit message;
   - no `.nojekyll` file, and any new non-site file is listed under `exclude:` in `_config.yml`;
   - `tools/node_modules` and `tools/previews` are not staged.
3. **Commit** to `main` with a plain-English message that says what changed for a reader of the site (for example "Shorten the Work page introduction"), no em dashes, followed by any attribution lines the session requires.
4. **Push**: `git fetch origin main`, rebase if needed, then `git push -u origin main` (retry up to 4 times on network errors with 2s, 4s, 8s, 16s waits).
5. **Wait for the deployment**: poll `gh run list -R gianlucacaico/gianlucacaico.github.io -L 3` until the "pages build and deployment" run for the new commit shows `completed` (usually about a minute). If it fails, say so plainly and show the reason from `gh run view <id> --log-failed`.
6. **Verify live**: run `bash tools/health.sh` (it confirms the live page matches `main`), then `node tools/preview.js <changed view> [--section <id>] --live` and check the new wording is visible. Send the live screenshots with SendUserFile.
7. **Report back** in plain language: what went live, the commit link (https://github.com/gianlucacaico/gianlucacaico.github.io/commit/<sha>), the health result, and how to undo it if needed ("ask me to roll back this change").
