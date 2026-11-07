---
name: edit
description: Change copy or layout on gianlucacaico.com. Finds the exact text, shows current and proposed wording side by side, renders previews, then waits for approval. Never publishes.
argument-hint: "<what to change, e.g. 'make the work page intro shorter'>"
---

Requested change: $ARGUMENTS

Follow CLAUDE.md, especially the Working agreement and Content rules.

1. **Find it.** Search the site files for the exact text or component: `index.html` (home), `work.html`, `blog.html`, `_posts/` (each post's text and its title, summary, date and topics at the top), `_layouts/` (post page structure, byline and bio rules), `_includes/` (link preview tags, nav, footer, post list row), `_config.yml` (default link preview description), `assets/css/site.css` (styles) and `assets/js/site.js` (interactions). A post's title or summary lives once in its `_posts` file and appears automatically on the blog page, homepage and next-post cards, so change it there. List every place the change will show. Note the view and section each one is in.
2. **Check the request.** If it is ambiguous, involves a fact, client name, figure, result or role you cannot verify, or is a design decision with more than one reasonable answer, ask before drafting. A newly named client with figures or outcomes must be confirmed as cleared to share.
3. **Draft.** Apply the content rules: Australian English, no em dashes, the site's voice, no overclaiming, no dated figures in metadata or evergreen copy. For layout changes, reuse existing components and design tokens; do not invent new styles.
4. **Show the wording side by side**, for every place it changes:

   | Where | Current | Proposed |
   |---|---|---|
   | Home, Outcomes section | ... | ... |

   Keep it readable on a phone. For layout changes, describe the change in one plain sentence.
5. **Make the edit** on this change's own branch (see "How changes flow" in CLAUDE.md), then run `node tools/preview.js <view> --section <id>` for each affected place (and `node tools/check-views.js local` if structure changed; `node tools/compare.js` if the change should not alter the look elsewhere; `node tools/drift.js` if it changes a colour, card art or layout token, and say in the pull request what the design system will need to follow). Send the screenshots with SendUserFile.
6. **Open the review page.** Commit to this change's branch with a plain-English message, push, and open a pull request (or update the existing one) as described in "How changes flow" in CLAUDE.md. Share the link.
7. **Stop and wait for approval.** Say: "Nothing is live yet. Reply 'approved' and run /publish to put this live, or tell me what to change." Never merge or push to `main` here. If changes are requested, revise, push to the same branch and repeat steps 4 to 7.
