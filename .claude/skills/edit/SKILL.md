---
name: edit
description: Change copy or layout on gianlucacaico.com. Finds the exact text, shows current and proposed wording side by side, renders previews, then waits for approval. Never publishes.
argument-hint: "<what to change, e.g. 'make the work page intro shorter'>"
---

Requested change: $ARGUMENTS

Follow CLAUDE.md, especially the Working agreement and Content rules.

1. **Find it.** Search `index.html` for the exact text or component. If it appears in more than one place (for example a post title appears in the post, the blog index, the homepage "Latest thinking" and a next-post card), list every place and change them consistently. Note the view and section each one is in.
2. **Check the request.** If it is ambiguous, involves a fact, client name, figure, result or role you cannot verify, or is a design decision with more than one reasonable answer, ask before drafting. A newly named client with figures or outcomes must be confirmed as cleared to share.
3. **Draft.** Apply the content rules: Australian English, no em dashes, the site's voice, no overclaiming, no dated figures in metadata or evergreen copy. For layout changes, reuse existing components and design tokens; do not invent new styles.
4. **Show the wording side by side**, for every place it changes:

   | Where | Current | Proposed |
   |---|---|---|
   | Home, Outcomes section | ... | ... |

   Keep it readable on a phone. For layout changes, describe the change in one plain sentence.
5. **Make the edit** in the working copy only, then run `node tools/preview.js <view> --section <id>` for each affected place (and `node tools/check-views.js` against a local server if structure changed). Send the screenshots with SendUserFile.
6. **Stop and wait for approval.** Say: "Reply 'approved' and run /publish to put this live, or tell me what to change." Do not commit or push. If changes are requested, revise and repeat steps 4 to 6.
