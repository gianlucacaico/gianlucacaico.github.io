---
name: publish
description: Put an approved change live on gianlucacaico.com by merging its pull request, then wait for the GitHub Pages deployment, verify the change on the live site and report back. Only run when Gianluca has explicitly approved the change.
disable-model-invocation: true
argument-hint: "[optional: pull request number or note about what was approved]"
---

Note from Gianluca: $ARGUMENTS

Follow "How changes flow" in CLAUDE.md. Merging the pull request is what puts a change live.

1. **Confirm approval.** Gianluca must have explicitly approved this exact change in this conversation after seeing the wording and previews (or he tapped Merge himself in GitHub). If not, show what would go live and ask. Never proceed on assumed approval.
2. **Find the pull request.** `gh pr list -R gianlucacaico/gianlucacaico.github.io --state open`, or `gh pr view --json number,url,state,headRefName` on the current branch. If there is none yet, commit and open one as CLAUDE.md describes. If it is already merged (he tapped Merge himself), skip to step 5.
3. **Check what is about to ship** with `gh pr diff <number>`:
   - only the approved change is included (one change per pull request; if anything unrelated is mixed in, stop and ask);
   - `CNAME` is unchanged and the link preview tags in `<head>` are intact;
   - no em dashes: `grep -c $'\xe2\x80\x94' index.html` (the em dash character) is 0, and none in the title or description;
   - no `.nojekyll` file, and any new non-site file is listed under `exclude:` in `_config.yml`;
   - `tools/node_modules` and `tools/previews` are not included.
   If `main` has moved on and the pull request cannot merge cleanly, rebase the branch onto `origin/main`, re-render previews, and ask for approval again if anything visible changed.
4. **Merge** as one commit: `gh pr merge <number> -R gianlucacaico/gianlucacaico.github.io --squash --delete-branch --subject "<plain-English title>" --body "<one-line summary plus any attribution lines the session requires>"`. No em dashes.
5. **Wait for the deployment.** Get the merge commit with `gh pr view <number> -R gianlucacaico/gianlucacaico.github.io --json mergeCommit`, then poll `gh run list -R gianlucacaico/gianlucacaico.github.io -L 3` until the "pages build and deployment" run for that commit shows `completed` (usually about a minute). If it fails, say so plainly and show the reason from `gh run view <id> -R gianlucacaico/gianlucacaico.github.io --log-failed`.
6. **Verify live.** Run `bash tools/health.sh` (it confirms the live page matches `main`), confirm the new wording is on the live page (`curl -s "https://gianlucacaico.com/?v=$(date +%s)" | grep -c "<new wording>"`), and run `node tools/preview.js <changed view> [--section <id>] --live`. Send the live screenshots with SendUserFile.
7. **Report back** in plain language: what went live, the pull request link, the health result, and how to undo it ("tap Revert on the pull request page, or ask me to roll it back").
