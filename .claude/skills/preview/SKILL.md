---
name: preview
description: Render mobile (390px) and desktop (1280px) screenshots of a page or section of gianlucacaico.com and show them. Use when asked to preview, screenshot or show how something looks.
argument-hint: "[home | work | blog | blog/<slug> | all] [section] [live]"
---

Render previews for: $ARGUMENTS

1. If `tools/node_modules` is missing, run `cd tools && npm install` first.
2. Work out the view and optional section from the request. Views: `home`, `work`, `blog`, `blog/<slug>` (one per file in `_posts`), `all`. Sections on home: `record`, `practice`, `spotlight`, `stack`, `timeline`, `credentials`, `writing`, `contact` (footer). Plain words are fine ("the outcomes stats" means `--section record`). If nothing is given, preview `home`.
3. Add `--live` if Gianluca asks about the live site; otherwise preview the local working copy (which includes any unpublished changes).
4. Run `node tools/preview.js <view> [--section <id>] [--full] [--live]`. Use `--full` when he asks for the whole page.
5. Send the screenshots with SendUserFile (mobile first, then desktop), with a one-line caption saying what they show and whether it is the local draft or the live site.
6. Report any WARN lines from the tool in plain language (for example "the font did not load").
