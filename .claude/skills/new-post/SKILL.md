---
name: new-post
description: Add a new blog post to gianlucacaico.com from Gianluca's draft. Wires it into every place a post appears, matches the existing post layout, renders previews, then waits for approval. Never publishes.
argument-hint: "<paste the draft, or describe where it is>"
---

Draft: $ARGUMENTS

Follow CLAUDE.md, especially "How a blog post is wired in", the Working agreement and the Content rules.

1. **Gather the details.** From the draft, or by asking: title, short title for the browser tab, slug (lowercase-with-hyphens, for example `customer-trust-in-ai`), publication date, a one or two sentence summary for the cards, three tags, read time (about 230 words per minute, rounded), and whether it is a new piece or from the archive. If no draft was given, ask for it.
2. **Review the copy before building.** Check Australian English, no em dashes, the voice (bold, strategic, evidence-led, outcome-first, short paragraphs, plain language), and accuracy (no overclaiming authorship, results or roles; the experience design approach builds on the double diamond and human-centred design, and Gianluca helped sharpen its agentic roles rather than creating it). Flag any newly named client with figures or outcomes and ask him to confirm it is cleared to share. Propose any copy changes as a Current / Proposed table and do not apply them without approval. Never invent facts, sources or figures.
3. **Build the post view**: a new `<main id="post-<slug>" data-view="post" data-title="<Short title> | Gianluca Caico" hidden>` copied from an existing post's structure, placed in date order among the post `main`s. Use only existing `.prose` components (`p.lead`, `h2`, `.pull`, `.stat-strip`, `.callout`, `.flow`, `.roles`, `.defs`, `.pairs`, lists, `.source`). Reuse the existing author bio box text unless told otherwise.
4. **Wire it in everywhere:**
   - Blog index: if it is the newest post, it becomes the `.post-feature` and the previous feature moves to the top of `.writing.post-list`. Otherwise add it to the list in date order.
   - Homepage `#writing`: keep the two newest posts.
   - Next-post chain: the new post points to the next older post; the post that now sits just newer than it points to it; the oldest post's "Back to the latest" card points to the newest post.
   - Update any read time, date and title shown on cards so they match the post exactly.
5. **Check and preview.** Run `node tools/preview.js blog/<slug> --full`, `node tools/preview.js blog`, `node tools/preview.js home --section writing`, and `node tools/check-views.js` against a local server (for example `python3 -m http.server` in the repo root, then `node tools/check-views.js http://127.0.0.1:8000/`). Confirm `grep -c $'\xe2\x80\x94' index.html` (the em dash character) is 0. Send the screenshots with SendUserFile.
6. **Summarise** every place that changed in a short list, note that the post shares the homepage link preview for now, then **stop and wait for approval**: "Reply 'approved' and run /publish to put this live, or tell me what to change." Do not commit or push.
