# gianlucacaico.com: project manual

Personal website of Gianluca Caico, a design and CX leader (not a developer) who mostly works from a phone.
Explain anything technical in one plain sentence. Never ask him to run code locally.
This file is not published (see `_config.yml`). Keep it current whenever the structure changes.

## Working agreement (the human gate)

- **Nothing goes live without explicit approval.** Before any publish, show the exact current and proposed wording side by side, plus mobile and desktop previews. Approval for one change does not carry over to the next.
- **One change per commit**, with a plain-English commit message. If asked how to roll back, explain it (see "Rolling back").
- **After every publish, verify the change on the live site**, not just in the repo (`bash tools/health.sh` plus a live preview of the changed view).
- **Never delete or edit `CNAME`.** Never remove the link preview tags (meta description, Open Graph, Twitter). Do not touch anything related to DNS or email (Squarespace DNS, Google Workspace, SPF, the GitHub Pages verification TXT record). None of it lives in this repo, and it should never need changing.
- **Never add a `.nojekyll` file.** It switches off the `_config.yml` exclusions and would publish CLAUDE.md and tools/.
- **If unsure about a fact, client detail or design decision, ask.** Do not guess.
- **Every change goes through a pull request.** Merging the pull request is what puts it live, and only happens after explicit approval (via `/publish`, or Gianluca tapping Merge himself). Never push directly to `main`.

## Content rules

- **Australian English** (organisation, centred, programme where already used, colour, prioritise).
- **Never use em dashes** anywhere: copy, metadata, commit messages, code comments. Use a colon, comma, full stop or "to" instead. En dashes (`&ndash;`) are used only in date and number ranges, as on the site today.
- **Voice** for posts and new copy: bold, strategic, evidence-led, outcome-first, short paragraphs, plain language. The `gianluca-thought-leadership-voice` skill, if available, captures this voice.
- **Accuracy over flattery.** The experience design approach builds on the industry-standard double diamond and human-centred design. Gianluca helped Bound's team sharpen the agentic roles within it; he did not create the model. Never overclaim authorship, results or roles.
- **Messaging in metadata and evergreen copy must age well**: no "14 years" or other dated figures there. The homepage hero is the exception; Gianluca reviews it himself.
- **Bylines and bios by date:** posts dated 2025 onwards use the byline "Gianluca Caico, Omnia Enterprise", and their author bio describes Bound as "part of Omnia Enterprise within The Omnia Collective". Posts before 2025 keep the plain "Gianluca Caico" byline and their existing bio.
- **Client confidentiality:** before adding any newly named client with figures or outcomes, flag it and ask him to confirm it is cleared to share. Clients already on the site: NAB, Westpac, Bupa, Generation Life, Protecht, AGL, AFL.

## How changes flow (branches and pull requests)

One conversation, one change, one branch, one pull request.

1. **Branch.** Start from the latest `main`: `git fetch origin main && git checkout -b claude/<short-description> origin/main` (unless the session has already set up a branch for you).
2. **Draft and preview** with `/edit` or `/new-post`: wording table plus mobile and desktop screenshots in the conversation.
3. **Open the review page.** Commit with a plain-English message, push the branch, write the body to a file in the scratchpad, then `gh api repos/gianlucacaico/gianlucacaico.github.io/pulls -f title="<plain-English title>" -f head=<branch> -f base=main -F body=@<body file>`. The `gh pr ...` commands are blocked in these sessions (GitHub GraphQL is not available), so always use `gh api` (GitHub's REST API) for pull requests. The body says, in plain English: what changes, the Current / Proposed wording table, which pages to look at, and "Nothing is live until this is merged." Screenshots stay in the conversation, because GitHub's API cannot attach images. Revisions are pushed to the same branch.
4. **Approve and merge.** After Gianluca approves, `/publish` squash-merges the pull request (one commit per change on `main`), waits for the deploy and verifies the live site. If he taps Merge himself in the GitHub app, still verify live (`/health` plus a live preview).
5. **One change at a time is safest.** Posts are separate files, so a new post and an unrelated edit rarely clash, but two pull requests editing the same page or template can. If another pull request is open on the same file, finish it first or rebase onto `main` after it merges, then re-preview.

## Hosting and deploy facts

- Repo: `gianlucacaico/gianlucacaico.github.io` (personal account, not Bound). Default branch `main`.
- Live at https://gianlucacaico.com, HTTPS enforced. `www` redirects to the main domain.
- GitHub Pages deploys automatically from `main` via the default "pages build and deployment" workflow (Jekyll on). A push is live in about a minute. Check progress with `gh run list -R gianlucacaico/gianlucacaico.github.io -L 3`.
- Pages serves with `cache-control: max-age=600`, so add a query string such as `?v=<timestamp>` when checking a fresh deploy.
- The site is built by Jekyll (GitHub Pages' standard plugins, production mode). Every page uses `_layouts/default.html`, which pulls in `_includes/head.html`, `nav.html` and `footer.html`; posts use `_layouts/post.html` on top. Never write `{{` or `{%` in copy, because Jekyll treats them as template code. Folders starting with `_` (`_layouts`, `_includes`, `_posts`) are never published as-is.
- Addresses: `/` home, `/work`, `/blog/` (note the closing slash: `blog/` is also the folder holding the posts), `/blog/<slug>` for each post, `/sitemap.xml`, `/robots.txt` (both made by the jekyll-sitemap plugin) and `404.html` for missing pages. Old `#/...` addresses are redirected by a one-line script at the top of `_includes/head.html`.
- A post dated in the future is not published until the site is next built after that date (a build happens on every merge to `main`).
- GitHub Pages also publishes `assets/css/style.css` from its default theme. Nothing uses it; leave it.
- Jekyll turns loose `.md` files into public pages, so every new non-site file must be added to `exclude:` in `_config.yml` (dot-folders such as `.claude/` are already excluded).
- `gianlucacaico.com/design-system/` is a separate site: the `gianlucacaico/design-system` repo (the GC kit, a design system reverse engineered from this site, with its docs and playground). GitHub Pages serves it under this domain because this repo owns the domain, so it needs no DNS change. Nothing on this site links to it. Never add a page or folder called `design-system` here, or the two could clash.
- **This site and the design system check each other.** `node tools/drift.js` here compares this site's tokens (and its artwork template) with the design system's published `tokens.json`, and runs in `tools/health.sh` after every publish. The design system's own drift check compares its tokens with this site's live stylesheet. If a change here alters a colour, card art or layout token, or a colour in the artwork, run `node tools/drift.js` before opening the review page. Any DRIFT means one side needs to follow: ask Gianluca which is right, and if it is this site, the design system needs its own follow-up change in its repo.
- Domain registered at Squarespace, which hosts DNS. Email on Google Workspace. Hands off.
- Cloud sessions should use the **gianlucacaico.github.io** environment, which allows `gianlucacaico.com` and `www.gianlucacaico.com`. The Default environment blocks them, so live checks would fail there.

### Files

| Path | What it is | Published? |
|---|---|---|
| `index.html` | Home page: all the homepage sections; "Latest thinking" fills itself from `_posts` | Yes, at `/` |
| `work.html` | Work page | Yes, at `/work` |
| `blog.html` | Blog page: featured post, recent posts and archive, all filled in from `_posts` | Yes, at `/blog/` |
| `_posts/YYYY-MM-DD-<slug>.md` | One file per blog post: details at the top, the text below | Yes, at `/blog/<slug>` |
| `404.html` | "Page not found" page | Shown for missing addresses |
| `_layouts/default.html` | Page shell: head, nav, page content, footer, script | Used in build |
| `_layouts/post.html` | Post page: header, byline, body, author bio, next-post card | Used in build |
| `_includes/head.html` | Title, meta description, canonical, Open Graph and Twitter link preview tags (filled per page), old-address redirect, fonts, stylesheet | Used in build |
| `_includes/nav.html` | Desktop floating nav and mobile tab bar; highlights the current section from the page's `nav:` setting | Used in build |
| `_includes/footer.html` | Contact footer shared by every page | Used in build |
| `_includes/post-row.html` | One row in a post list (homepage and blog page) | Used in build |
| `assets/css/site.css` | All styles and design tokens | Yes |
| `assets/js/site.js` | All interactions (filters, model, tabs, orbit, glass lens, nav) | Yes |
| `assets/img/` | Site photos as webp: `avatar`, `portrait`, `facilitating`, `personal` | Yes |
| `assets/img/blog/` | Each post's artwork, made by `tools/art.js`: `<slug>.webp` (banner), `<slug>-sm.webp` (list thumbnail), `<slug>.jpg` (link preview) | Yes |
| `assets/img/work/` | Each Work page project's pictogram (`<client>.svg`, 240x156), drawn to be cropped by its card | Yes |
| `assets/img/share/` | Link preview images for the Work and Blog pages (`work.jpg`, `blog.jpg`), made by `tools/art.js` | Yes |
| `assets/og-image.jpg` | 1200x630 link preview image (portrait card) for the homepage, and for any page without its own | Yes |
| `CNAME` | `gianlucacaico.com`. Never touch | Used by Pages |
| `_config.yml` | Site settings: address, timezone, default link preview description, post addresses, sitemap, quote handling, files not to publish | No |
| `CLAUDE.md` | This manual | No (excluded) |
| `tools/` | Build, preview, comparison, artwork and health-check scripts | No (excluded) |
| `tools/art/` | Source of the post and page artwork: one HTML file per image, plus shared `art.css` | No (excluded) |
| `.claude/skills/` | Project slash commands: `/edit`, `/new-post`, `/preview`, `/health`, `/publish`, `/navigate` | No (dot-folder) |

## Tools

Run from the repo root. The tools build the site with GitHub Pages' own Jekyll first (`bash tools/build.sh`, output in `tools/_site/`), so previews show exactly what GitHub will publish. In a fresh session the first build installs the builder and a local copy of the Inter font (a minute or two) unless the environment's setup script already has.

- `node tools/preview.js [view...] [--section ID] [--full] [--only mobile|desktop] [--live]`
  Screenshots at 390px (mobile) and 1280px (desktop), saved to `tools/previews/` (git-ignored). Views: `home`, `work`, `blog`, `blog/<slug>`, or `all` (found automatically from `_posts`). `--section` takes a section id (`writing`, `record`, `timeline`...) or any CSS selector. `--live` shoots the live site. Inter is served from a local copy so the font always renders; the tool warns if it does not, or if the expected view is not showing. Motion is reduced so screenshots are stable.
  The mobile tab bar is fixed to the bottom of the screen, so it appears over section screenshots, as it would on a phone.
- `bash tools/health.sh`: checks the live site (domain, www, http to https, link preview tags and image, project files not public, every published file matches `main` as built by Jekyll, CNAME intact, no em dashes, sitemap, still in step with the design system, then the full page check below).
- `node tools/check-views.js [url | local]`: follows every internal link from the homepage and checks each page (right view, images, no script errors, no em dashes, link preview tags pointing at the page's own address, link preview image loads), every in-page link target, every old `#/` redirect and the 404 page. `local` builds and checks the working copy.
- `bash tools/build.sh [source] [destination]`: build the site exactly as GitHub Pages does (Jekyll 3.10 via the `github-pages` gem in `tools/Gemfile`, installed to `tools/vendor/`, run from `tools/` so GitHub's standard plugins load, in production mode). Its output matches the live site byte for byte.
- `node tools/compare.js [--base <git ref>] [--after <folder>] [views...]`: before-and-after proof. Screenshots every view of `main` and of the working copy (or a built folder such as `_site`) at both sizes, full page, and reports any pixel that differs, saving red difference images to `tools/previews/compare/`. Run it for every change meant to leave the look unchanged, and quote its result in the pull request.
- `node tools/art.js [name...]`: turns the artwork in `tools/art/` into images. A post's file (`tools/art/<slug>.html`, `data-kind="post"`) becomes `assets/img/blog/<slug>.webp`, `-sm.webp` and `.jpg`; a page's file (`data-kind="share"`) becomes `assets/img/share/<name>.jpg`. Re-run it after editing any artwork, and re-run `blog` or `work` after adding a post or project if that page's link preview should show it.
- `node tools/drift.js [--live] [--tokens <file or URL>]`: compares this site's `:root` tokens and `tools/art/art.css` with the design system's tokens at gianlucacaico.com/design-system/tokens.json. Prints DRIFT for any token that differs or exists on one side only (exit code 1), and INFO for colours in the stylesheet or pictograms that are not tokens yet. `--live` checks the live stylesheet; `--tokens` compares with another tokens file, such as a design system branch's.
- `node tools/nav-map.js [--ds <folder>] [--live] [--shots]`: the navigation map. Crawls this site and the design system as one space (the design system under `/design-system/`, live by default or a local checkout with `--ds ../design-system`), from both front doors and the sitemap, at 390px and 1280px. Checks every page against the "Navigation standard" below and prints PASS / WARN / FAIL / INFO; FAIL (exit code 1) means a broken link, an in-page link with no target, or a page with no way home. Saves the full map to `tools/previews/nav/map.json` and, with `--shots`, the top and end of every page to `tools/previews/nav/shots/`. The first step of `/navigate`.
- `tools/lib.js`: shared helpers (local server, local Inter, view list) used by the tools above.

To show previews to Gianluca, send the PNGs with the SendUserFile tool (mobile first).

## Architecture of the site

Phase 2 (approved: option A, Jekyll, no CMS) restructured the site in pull requests, each proven pixel-identical with `tools/compare.js`: photos moved to `assets/img/`, shared layout and assets split out, then real pages with clean addresses and one file per post.

Every page is `<!DOCTYPE html>` from `_layouts/default.html`: head (`_includes/head.html`), `<header class="topbar">` desktop nav and `<nav class="tabbar">` mobile tab bar (`_includes/nav.html`, shown under 760px), the page's single `<main data-view>`, the footer `<footer class="site" id="contact">` (`_includes/footer.html`), then `assets/js/site.js`. Find things by searching for the ids or classes below, not by line number.

**Home** (`index.html`, `<main id="view-home">`), sections in order:
- `.hero`: eyebrow, h1 with `.grad-word`, `.lede`, CTA row, portrait (`.hero-photo`, glass `.name-tag`), `.brands` "Partnered with" list. The hero h1 ("Over 14 years...") is the one place a dated figure is allowed.
- `.pov` (dark): facilitating photo plus approach statement.
- `#record`: "Outcomes I've driven" stat grid (`.record dl > dt/dd`).
- `#practice`: "What I help with", the EXD agentic design thinking model. Three `.practice-points`, an interactive model (`.m-node` pills and diamonds) controlling `.m-panel`s with Outcome / Human gate / Agentic lane `.m-lane`s.
- `#spotlight`: Dynamic blueprinting four-step tabs (`.fw-step` / `.fw-panel`), `.ev-outcomes`, `.ev-quote`.
- `#stack`: Tech ecosystem orbit (`.orbit-node` buttons with `data-name/phase/step/role`).
- `#timeline`: Career timeline (`.tl-row`), Bound engagements in `.bracket` with filter `.seg` and `<details class="eng" data-tags="ai growth platform">` cards, earlier roles in `.tl-more`, `.parallel` freelance row.
- `#credentials`: two `.cred-group`s plus `.personal` (photo and outside-work line).
- `#writing`: "Latest thinking", the two newest non-archive posts, generated from `_posts`.

**Work** (`work.html`, `<main id="view-work">`): `.page-head` with the animated `#ix` "From one insight to production" panel, then a filter `.seg.work-filter` (counts in `<small>`) and `.work-grid` of `.work-card`s (`data-industry="fs|health|energy|sport|saas"`; in `.work-art`: the `--art` industry colour, the project's pictogram `img.work-pic` filling the right side, the client name as text in `.big` top left, and the industry and year as plain text in `p.work-meta` bottom left; "Request the case study" mailto link). Case studies can later become their own collection of files in the same way as posts.

**Blog** (`blog.html`, `<main id="view-blog">`): `.page-head`, then generated from `_posts`: the newest non-archive post as `.post-feature` (its artwork fills `.post-art`), the other non-archive posts in `.writing.post-list`, and posts with `archive: true` under "From the archive".

**Posts** (`_posts/*.md` with `_layouts/post.html`, `<main id="post-<slug>">`): `header.article-head` (back link, h1, byline, date, read time, topics, then the post's artwork as a `figure.article-hero` banner), `.prose` body, `.author` bio, `.next-post` card, `.article-foot` buttons.

**Link previews**: `_includes/head.html` fills the title, description, canonical address, Open Graph and Twitter tags for each page. Home uses the site description in `_config.yml`; Work and Blog set `description` in their front matter; posts use their `title` (as og:title), `short_title` (browser tab) and `summary` (description), with `og:type` article. Preview images: each post uses its own artwork (`assets/img/blog/<image>.jpg`, from the post's `image` and `image_alt`); Work and Blog use `share_image` and `share_alt` from their front matter (`assets/img/share/`); the homepage, 404 and anything else use the portrait card `assets/og-image.jpg`.

**Navigation**: real links (`/`, `/work`, `/blog/`, `#contact`). Each page sets `nav: home|work|blog` in its front matter so the nav highlights the right tab (posts get `nav: blog` automatically). Links to homepage sections from other pages use `/#timeline`, `/#practice`.

### Navigation standard

What every page on both sites should do. `node tools/nav-map.js` checks it and `/navigate` (the navigation orchestrator) reviews it: map, heuristic review, clean-up, then drafted proposals such as breadcrumbs and footer site maps, each shown for approval and made as its own change.
- **Where am I?** The menu marks the current page (`aria-current="page"`) at both sizes. Every page has its own title, and its canonical address is the address links use.
- **Where can I go?** Every page offers a next step beyond the menu (no dead ends), contact is one tap away on this site, and each site's main pages are within two taps.
- **How do I get back?** Every page links home, and pages two levels down (posts, the design system's inner pages) link to their parent.
- **Across the two sites:** each site's footer links to the other (decision, November 2026), and the design system's header also links here. A link between them anywhere else is Gianluca's call.
- **Labels and tap targets:** link text says where it goes, the same place keeps the same name, and tap targets on a phone are at least 24px each way (links inside a sentence excepted).

### Adding a blog post (one file)

Create `_posts/YYYY-MM-DD-<slug>.md`. The blog page, homepage "Latest thinking", next-post links, sitemap and link preview all update themselves.

```markdown
---
title: "Full post title"
short_title: "Short title for the browser tab"
date: 2026-11-20
summary: "One or two sentences for cards and link previews."
topics: [Topic one, Topic two, Topic three]
read_time: 4
image: <slug>                    # artwork in assets/img/blog (see "Post artwork" below)
image_alt: "What the artwork shows, in one sentence"
# optional:
# archive: true                 (lists it under "From the archive" with a "From the archive" note)
# author_bio: "Custom bio text" (otherwise the standard bio for the post's date is used)
# extra_link:                   (second button at the foot of the post)
#   label: "See the EXD model"
#   url: /#practice
---
Opening paragraph, styled as the lead.
{: .lead}

## A section heading

Normal paragraphs, **bold**, *italic*, [links](/work), lists with "- " or "1. ".

A pull quote paragraph.
{: .pull}
```

- `{: .lead}`, `{: .pull}` or `{: .source}` on the line after a paragraph gives it that style.
- Rich components (`.stat-strip`, `.callout`, `.flow`, `.roles`, `.defs`, `.pairs`, `.t-fig`) are written as HTML blocks inside the Markdown, copied from an existing post, with a blank line before and after.
- The byline and bio follow the date automatically: 2025 onwards show "Gianluca Caico, Omnia Enterprise" and the Omnia Enterprise bio; earlier posts show the plain byline and older bio.
- Apostrophes and quotes stay exactly as typed (no automatic curly quotes), and `--`/`---` never become dashes. Still never type an em dash.
- Checks: `node tools/preview.js blog/<slug> --full`, `node tools/preview.js blog`, `node tools/preview.js home --section writing`, then `node tools/check-views.js local`.

### Post artwork (banner, thumbnail and link preview)

Every post has one piece of artwork, used three ways: the banner under the post's title, the thumbnail in post lists (and the featured card on the blog page), and the image shown when the post is shared on LinkedIn, iMessage or Slack. They are illustrations drawn in the site's design system (ink background, violet, coral, amber and cyan colour fields, glass panels, Inter), each showing the post's actual idea, never stock photos.

1. Copy the closest existing file in `tools/art/` to `tools/art/<slug>.html` and redraw it for the new post's idea. Use only words, figures and labels that appear in the post. Australian English, no em dashes.
2. Keep the important parts in the middle 80% of the width (the blog page's featured card trims the sides) and keep the bottom-left corner free of text (the "Featured" label sits there).
3. Run `node tools/art.js <slug>`, look at `assets/img/blog/<slug>.jpg`, and adjust until it reads well both full size and as a small thumbnail.
4. Add `image: <slug>` and `image_alt: "..."` to the post's front matter. Show the artwork to Gianluca with the post previews: it is a new image, so it needs his approval like any copy.

A post without `image` still works: it shows no banner or thumbnail, the featured card falls back to the plain gradient, and its link preview uses the portrait card.

**Project pictograms** (Work page cards): each project's key artefact as a pictogram, `assets/img/work/<client>.svg`, drawn directly as SVG on a 240x156 canvas: the right 240px of the card at its full 156px height. It sits in the card as `<img class="work-pic" src="/assets/img/work/<client>.svg" width="240" height="156" alt="">` and the card's edges crop it. Labels under it are plain text (`<p class="work-meta"><span>Industry</span><span>Year</span></p>`), not pills. The rules behind it (chosen by testing several compositions with Gianluca):
- Reading order: client name top left, pictogram's focal point, then the labels. No frame or tile around the pictogram.
- Draw it for the crop: big, with context running off the right, top or bottom edge, and lines fading in from the left. Keep the focal point and anything that carries meaning fully inside the canvas (a half-cut icon reads as a mistake).
- Keep clear: top left of the canvas (x under 60, y under 48) for the client name, and bottom left (x under 110, y over 112) for the labels. The longest name, "Generation Life", is 129px wide at the card's 18px and reaches canvas x 52 on a 335px phone card; check any longer name at phone width.
- One idea per pictogram. White for the main shapes, white at about 20 to 45% for secondary ones, and exactly one accent for the insight (on-dark tints: cyan #3FD3E3, coral #FF8AA0, amber #FFB070), chosen to contrast with the card's colour.
- No words or figures, and only what the card itself says: no client logos, brand colours or numbers that are not already on the card. Any new client still needs Gianluca's confirmation that it is cleared to share.

**Client names** (Work page cards) are text, not logos: `<span class="big">Client</span>`, 18px bold white, top left. Logos were tried and removed because there is no formal permission from the clients. Use a client's logo only with formal permission.

Images: photos live in `assets/img/` and are linked with absolute paths (`/assets/img/avatar.webp`). New images go in `assets/img/` as webp; discuss any new image with Gianluca first. Post artwork lives in `assets/img/blog/` and is made with `tools/art.js` (above).

### Reusable components (use these, do not invent new ones)

- Buttons: `.btn-pill` (violet primary), `.btn-ghost` (glass secondary).
- Glass material: `.glass` (and `.on-dark`), with `.lens` for the sliding highlight in `.seg` and nav.
- Section scaffold: `section.bordered > .wrap > .section-head (h2 + .count) + .section-intro`.
- Segmented filter: `.seg.glass` with buttons `aria-pressed`, plus a `.filter-status` line. It scrolls sideways on phones, so it draws its glass on itself rather than with the `.glass` layers, which would scroll away and leave a hard edge.
- Cards: `.work-card`, `.eng` (details), `.post-feature` (with `.post-art.has-img` when the post has artwork), `.writing article` (`.has-thumb` plus `.row-thumb` when the post has artwork), `.next-post`, `.cred-group`.
- Post banner: `figure.article-hero` (in `_layouts/post.html`).
- Work card art: `img.work-pic` (cropped pictogram, right side) and `p.work-meta` (industry and year as text, separated by a dot) inside `.work-art`.
- Tags and chips: `.post-tags` (violet wash), `.tags` (grey), `.chip`, `.chip-g` (glass on art), `.soon`, `.spot-tag`.
- Post body (`.prose`): `p.lead`, `h2`, `h3`, lists, `.pull` quote, `.stat-strip` (dark dl), `.callout` (dark stat card), `.flow` (step chips with arrows), `.roles` (three cards), `.defs` (definition pairs), `.pairs` (two-column list), `.t-fig`, `.source`, `.archive-note`, `hr`.
- Photos: `.ph` containers with `--pos` focal point; avatars `.av` with sizes `av-xs`, `av-sm`, `av-md`, `av-lg`.
- Dark sections set `data-tone="dark"` so the floating nav switches to light text over them.

### Design tokens (CSS variables in `:root` of `assets/css/site.css`)

| Token | Value | Use |
|---|---|---|
| `--ink` / `--text` | #0A2540 | Headings, body text, dark sections |
| `--paper` | #FFFFFF | Page background |
| `--panel` | #F6F9FC | Soft panels |
| `--muted` | #425466 | Secondary text |
| `--faint` | #8792A2 | Meta text |
| `--muted-on-ink` | #A6B4CC | Secondary text on dark |
| `--violet` | #635BFF | Primary accent, buttons |
| `--violet-deep` | #4B44D6 | Hover, links, eyebrows |
| `--violet-wash` | rgba(99,91,255,0.08) | Tag backgrounds |
| `--coral` | #EB5D76 | Gradient partner, flags |
| `--amber` | #FFA659 | Agentic lane accent |
| `--amber-deep` | #D9822B | Orbit "Artefact" phase |
| `--cyan` | #0E97AA | Orbit "Delivery" phase |
| `--border` | #E3E8EF | Lines and card borders |
| `--border-on-ink` | #233A5C | Borders on dark |
| `--max` | 700px | Max text measure |
| `--art-fs/health/energy/sport/saas` | gradients | Work card art by industry |

Type: Inter 400 to 800, headings 700 with -0.025em tracking. Radius: 999px pills, 12 to 20px cards, 28px hero portrait. Breakpoints: 1000, 900, 760 (mobile nav swap), 640, 520px.

## Rolling back

Every published change is one merged pull request and one commit on `main`. To undo one:
- **From the phone:** open the merged pull request on GitHub and tap **Revert**. That creates a new pull request that undoes the change; merging it puts the previous version back live in about a minute.
- **Or ask Claude:** "roll back <change>". Claude makes a branch with `git revert <commit>`, opens a pull request, and merges it after approval, then verifies live.

Merged pull requests: https://github.com/gianlucacaico/gianlucacaico.github.io/pulls?q=is%3Amerged. Full history: https://github.com/gianlucacaico/gianlucacaico.github.io/commits/main. Never force-push or rewrite history on `main`.

## Known content notes (flagged, not changed)

- The Work and Blog page link preview descriptions were new copy in the clean-addresses pull request; Gianluca approved them there.
- Client logos were tried on the Work page cards and replaced with client names as text: there is no formal permission from the clients to show their logos.

- First navigation sweep (November 2026), awaiting Gianluca's decisions: a breadcrumb trail on posts (Home / Blog / short title) in place of the top "All posts" pill, with breadcrumb data for search results; a footer site map on every page; small tap targets ("All posts" on the homepage is 22px tall). In the design system: the Workflows page never marks itself in the menu and its canonical address ends in `.html`; a matching breadcrumb trail and footer site map; small tap targets in "Follow one change". Drafts live only in the review conversation until approved.

Add anything spotted but not yet confirmed with Gianluca here.
