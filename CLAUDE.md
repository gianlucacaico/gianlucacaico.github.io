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
- Addresses: `/` home, `/work`, `/blog/` (note the closing slash: `blog/` is also the folder holding the posts), `/blog/<slug>` for each post, `/system` (design system, under Work), `/kit/gc.css`, `/kit/gc.js` and `/kit/demo` (the kit), `/sitemap.xml`, `/robots.txt` (both made by the jekyll-sitemap plugin) and `404.html` for missing pages. Old `#/...` addresses are redirected by a one-line script at the top of `_includes/head.html`.
- A post dated in the future is not published until the site is next built after that date (a build happens on every merge to `main`).
- GitHub Pages also publishes `assets/css/style.css` from its default theme. Nothing uses it; leave it.
- Jekyll turns loose `.md` files into public pages, so every new non-site file must be added to `exclude:` in `_config.yml` (dot-folders such as `.claude/` are already excluded).
- Domain registered at Squarespace, which hosts DNS. Email on Google Workspace. Hands off.
- Cloud sessions should use the **gianlucacaico.github.io** environment, which allows `gianlucacaico.com` and `www.gianlucacaico.com`. The Default environment blocks them, so live checks would fail there.

### Files

| Path | What it is | Published? |
|---|---|---|
| `index.html` | Home page: all the homepage sections; "Latest thinking" fills itself from `_posts` | Yes, at `/` |
| `work.html` | Work page | Yes, at `/work` |
| `system.html` | Design system page (sub-page of Work): foundations, playground, "Use it anywhere" | Yes, at `/system` |
| `kit/gc.css` | The kit: the site's tokens and components as one portable stylesheet, tokens filled in from `_data/kit.yml` | Yes, at `/kit/gc.css` |
| `kit/gc.js` | The kit's only script: segmented controls and their sliding lens | Yes, at `/kit/gc.js` |
| `kit/demo.html` | Every kit component, loading only the kit. Also what the playground shows | Yes, at `/kit/demo` (not in the sitemap) |
| `_data/kit.yml` | Design tokens for the kit and the design system page (one source for both) | Used in build |
| `blog.html` | Blog page: featured post, recent posts and archive, all filled in from `_posts` | Yes, at `/blog/` |
| `_posts/YYYY-MM-DD-<slug>.md` | One file per blog post: details at the top, the text below | Yes, at `/blog/<slug>` |
| `404.html` | "Page not found" page | Shown for missing addresses |
| `_layouts/default.html` | Page shell: head, nav, page content, footer, script | Used in build |
| `_layouts/post.html` | Post page: header, byline, body, author bio, next-post card | Used in build |
| `_includes/head.html` | Title, meta description, canonical, Open Graph and Twitter link preview tags (filled per page), old-address redirect, fonts, stylesheet | Used in build |
| `_includes/nav.html` | Desktop floating nav and mobile tab bar; highlights the current section from the page's `nav:` setting | Used in build |
| `_includes/footer.html` | Contact footer shared by every page | Used in build |
| `_includes/subnav.html` | Work's sub-navigation, "Projects \| Design system", shown under the intro on `/work` and `/system` | Used in build |
| `_includes/post-row.html` | One row in a post list (homepage and blog page) | Used in build |
| `assets/css/site.css` | All styles and design tokens | Yes |
| `assets/js/site.js` | All interactions (filters, model, tabs, orbit, glass lens, nav) | Yes |
| `assets/img/` | Site photos as webp: `avatar`, `portrait`, `facilitating`, `personal` | Yes |
| `assets/og-image.jpg` | 1200x630 link preview image, used by every page | Yes |
| `CNAME` | `gianlucacaico.com`. Never touch | Used by Pages |
| `_config.yml` | Site settings: address, timezone, default link preview description, post addresses, sitemap, quote handling, files not to publish | No |
| `CLAUDE.md` | This manual | No (excluded) |
| `tools/` | Build, preview, comparison and health-check scripts | No (excluded) |
| `.claude/skills/` | Project slash commands | No (dot-folder) |

## Tools

Run from the repo root. The tools build the site with GitHub Pages' own Jekyll first (`bash tools/build.sh`, output in `tools/_site/`), so previews show exactly what GitHub will publish. In a fresh session the first build installs the builder and a local copy of the Inter font (a minute or two) unless the environment's setup script already has.

- `node tools/preview.js [view...] [--section ID] [--full] [--only mobile|desktop] [--live]`
  Screenshots at 390px (mobile) and 1280px (desktop), saved to `tools/previews/` (git-ignored). Views: `home`, `work`, `system`, `blog`, `blog/<slug>`, or `all` (found automatically from `_posts`). `--section` takes a section id (`writing`, `record`, `timeline`...) or any CSS selector. `--live` shoots the live site. Inter is served from a local copy so the font always renders; the tool warns if it does not, or if the expected view is not showing. Motion is reduced so screenshots are stable.
  The mobile tab bar is fixed to the bottom of the screen, so it appears over section screenshots, as it would on a phone.
- `bash tools/health.sh`: checks the live site (domain, www, http to https, link preview tags and image, project files not public, every published file matches `main` as built by Jekyll, CNAME intact, no em dashes, sitemap, then the full page check below).
- `node tools/check-views.js [url | local]`: follows every internal link from the homepage and checks each page (right view, images, no script errors, no em dashes, link preview tags pointing at the page's own address), every in-page link target, every old `#/` redirect and the 404 page. `local` builds and checks the working copy.
- `bash tools/build.sh [source] [destination]`: build the site exactly as GitHub Pages does (Jekyll 3.10 via the `github-pages` gem in `tools/Gemfile`, installed to `tools/vendor/`, run from `tools/` so GitHub's standard plugins load, in production mode). Its output matches the live site byte for byte.
- `node tools/compare.js [--base <git ref>] [--after <folder>] [views...]`: before-and-after proof. Screenshots every view of `main` and of the working copy (or a built folder such as `_site`) at both sizes, full page, and reports any pixel that differs, saving red difference images to `tools/previews/compare/`. Run it for every change meant to leave the look unchanged, and quote its result in the pull request.
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

**Work** (`work.html`, `<main id="view-work">`): `.page-head` with the Work sub-navigation under the lede (`_includes/subnav.html`) and the animated `#ix` "From one insight to production" panel, then a filter `.seg.work-filter` (counts in `<small>`) and `.work-grid` of `.work-card`s (`data-industry="fs|health|energy|sport|saas"`, `--art` gradient token, "Request the case study" mailto link). Case studies can later become their own collection of files in the same way as posts.

**Blog** (`blog.html`, `<main id="view-blog">`): `.page-head`, then generated from `_posts`: the newest non-archive post as `.post-feature`, the other non-archive posts in `.writing.post-list`, and posts with `archive: true` under "From the archive".

**Posts** (`_posts/*.md` with `_layouts/post.html`, `<main id="post-<slug>">`): `header.article-head` (back link, h1, byline, date, read time, topics), `.prose` body, `.author` bio, `.next-post` card, `.article-foot` buttons.

**Design system** (`system.html`, `<main id="view-system">`, `nav: work`, reached from the Work sub-navigation, which both pages show under their intro): a proof of concept Gianluca asked for "just for fun", to explore a reusable design system. Sections: `.page-head.sys-head`, `#foundations` (colour, type, shape, motion, layout, all generated from `_data/kit.yml`), `#playground` (`.sys-controls` glass panel plus an iframe `.sys-frame` showing `/kit/demo`; the script at the end of `site.js` sends the settings to the frame as messages, and the demo replies with its height so the frame fits it) and `#use` (copyable lines, including the playground's current theme). Page-only styles are the `.sys-*` block at the end of `site.css`.

**The kit** (`kit/`): a distilled, themeable copy of the site's styles, so other pages and prototypes can use the look with one line (`<link rel="stylesheet" href="https://gianlucacaico.com/kit/gc.css">`). Class names match the site. Components use roles rather than raw colours (`--accent`, `--accent-deep`, `--accent-2`, `--surface`, `--strong`, `--accent-ink`...), every radius scales with `--round`, glass blur with `--glass-blur`, and `data-surface="dark"` on `<html>` or any block remaps the neutrals for dark. The kit is separate from `site.css`, so the live site does not run on it yet: when a site token or component changes, update `_data/kit.yml` (and `kit/gc.css` if it is a component) too. Anything served from `/kit/` reaches every page that uses it, so treat kit changes like site changes. `kit/demo.html` must keep its link preview tags and `<main data-view>` so `check-views.js` passes.

**Link previews**: `_includes/head.html` fills the title, description, canonical address, Open Graph and Twitter tags for each page. Home uses the site description in `_config.yml`; Work and Blog set `description` in their front matter; posts use their `title` (as og:title), `short_title` (browser tab) and `summary` (description), with `og:type` article. Every page shares `assets/og-image.jpg` for now.

**Navigation**: real links (`/`, `/work`, `/blog/`, `#contact`). Each page sets `nav: home|work|blog` in its front matter so the nav highlights the right tab (posts get `nav: blog` automatically). Links to homepage sections from other pages use `/#timeline`, `/#practice`.

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

Images: photos live in `assets/img/` and are linked with absolute paths (`/assets/img/avatar.webp`). New images go in `assets/img/` as webp; discuss any new image with Gianluca first.

### Reusable components (use these, do not invent new ones)

- Buttons: `.btn-pill` (violet primary), `.btn-ghost` (glass secondary).
- Glass material: `.glass` (and `.on-dark`), with `.lens` for the sliding highlight in `.seg` and nav.
- Section scaffold: `section.bordered > .wrap > .section-head (h2 + .count) + .section-intro`.
- Segmented filter: `.seg.glass` with buttons `aria-pressed`, plus a `.filter-status` line.
- Sub-navigation: the same `.seg.glass` with links, the current one marked `aria-current="page"` (`.subnav`, in `_includes/subnav.html`). The lens slides under it automatically.
- Cards: `.work-card`, `.eng` (details), `.post-feature`, `.writing article`, `.next-post`, `.cred-group`.
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
- The kit's dark surface values (`--surface`, `--panel`, `--strong`, `--faint`, `--accent-ink` under `[data-surface="dark"]`) are derived from ink and the existing on-dark tokens; the live site has no dark mode of its own.

Add anything spotted but not yet confirmed with Gianluca here.
