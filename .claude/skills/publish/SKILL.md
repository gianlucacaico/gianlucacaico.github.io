---
name: publish
description: Put an approved change live on gianlucacaico.com by merging its pull request, then wait for the GitHub Pages deployment, verify the change on the live site and report back. Only run when Gianluca has explicitly approved the change.
disable-model-invocation: true
argument-hint: "[optional: pull request number or note about what was approved]"
---

Note from Gianluca: $ARGUMENTS

Follow "How changes flow" in CLAUDE.md. Merging the pull request is what puts a change live.

1. **Confirm approval.** Gianluca must have explicitly approved this exact change in this conversation after seeing the wording and previews (or he tapped Merge himself in GitHub). If not, show what would go live and ask. Never proceed on assumed approval.
2. **Find the pull request.** `gh api "repos/gianlucacaico/gianlucacaico.github.io/pulls?state=open" --jq '.[] | {number, title, branch: .head.ref, html_url}'`. (The `gh pr` commands are blocked in these sessions; use `gh api` as shown.) If there is none yet, commit and open one as CLAUDE.md describes. If it is already merged (he tapped Merge himself), skip to step 5.
3. **Check what is about to ship** with `git fetch origin main && git diff origin/main...<branch>` (or `gh api repos/gianlucacaico/gianlucacaico.github.io/pulls/<number> -H 'Accept: application/vnd.github.diff'`):
   - only the approved change is included (one change per pull request; if anything unrelated is mixed in, stop and ask);
   - `CNAME` is unchanged and the link preview tags in `_includes/head.html` are intact;
   - no em dashes: `grep -rc $'\xe2\x80\x94' index.html _includes _layouts assets/css assets/js` (the em dash character) finds none, and none in the title or description;
   - no `.nojekyll` file, and any new non-site file is listed under `exclude:` in `_config.yml`;
   - `tools/node_modules` and `tools/previews` are not included.
   If `main` has moved on and the pull request cannot merge cleanly, rebase the branch onto `origin/main`, re-render previews, and ask for approval again if anything visible changed.
4. **Merge** as one commit: `gh api -X PUT repos/gianlucacaico/gianlucacaico.github.io/pulls/<number>/merge -f merge_method=squash -f commit_title="<plain-English title> (#<number>)" -f commit_message="<one-line summary plus any attribution lines the session requires>"`. No em dashes. Leave the branch in place: these sessions cannot delete branches on GitHub, and merged branches are harmless.
5. **Wait for the deployment.** Get the merge commit with `gh api repos/gianlucacaico/gianlucacaico.github.io/pulls/<number> --jq .merge_commit_sha`, then poll `gh run list -R gianlucacaico/gianlucacaico.github.io -L 3` until the "pages build and deployment" run for that commit shows `completed` (usually about a minute). If it fails, say so plainly and show the reason from `gh run view <id> -R gianlucacaico/gianlucacaico.github.io --log-failed`.
6. **Verify live.** Run `bash tools/health.sh` (it confirms the live page matches `main`), confirm the new wording is on the live page (`curl -s "https://gianlucacaico.com/?v=$(date +%s)" | grep -c "<new wording>"`), and run `node tools/preview.js <changed view> [--section <id>] --live`. Send the live screenshots with SendUserFile.
7. **Report back** in plain language: what went live, the pull request link, the health result, and how to undo it ("tap Revert on the pull request page, or ask me to roll it back").
