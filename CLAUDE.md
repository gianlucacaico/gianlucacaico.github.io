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
5. **One change at a time.** Every view still lives in `index.html`, so parallel pull requests that both edit it can conflict. If another pull request is open, finish it first or rebase onto `main` after it merges, then re-preview.

## Hosting and deploy facts

- Repo: `gianlucacaico/gianlucacaico.github.io` (personal account, not Bound). Default branch `main`.
- Live at https://gianlucacaico.com, HTTPS enforced. `www` redirects to the main domain.
- GitHub Pages deploys automatically from `main` via the default "pages build and deployment" workflow (Jekyll on). A push is live in about a minute. Check progress with `gh run list -R gianlucacaico/gianlucacaico.github.io -L 3`.
- Pages serves with `cache-control: max-age=600`, so add a query string such as `?v=<timestamp>` when checking a fresh deploy.
- The site is built by Jekyll: `index.html` (front matter `layout: default`) is wrapped in `_layouts/default.html`, which pulls in `_includes/head.html`, `nav.html` and `footer.html`. Never write `{{` or `{%` in copy, because Jekyll treats them as template code. Folders starting with `_` (`_layouts`, `_includes`) are never published as-is.
- Jekyll turns loose `.md` files into public pages, so every new non-site file must be added to `exclude:` in `_config.yml` (dot-folders such as `.claude/` are already excluded).
- Domain registered at Squarespace, which hosts DNS. Email on Google Workspace. Hands off.
- Cloud sessions should use the **gianlucacaico.github.io** environment, which allows `gianlucacaico.com` and `www.gianlucacaico.com`. The Default environment blocks them, so live checks would fail there.

### Files

| Path | What it is | Published? |
|---|---|---|
| `index.html` | All the views: home, work, blog and every post (~93KB) | Yes (built) |
| `_layouts/default.html` | The page shell: wraps every page with the head, nav, footer and script | Used in build |
| `_includes/head.html` | Title, meta description, canonical, Open Graph and Twitter link preview tags, fonts, stylesheet link | Used in build |
| `_includes/nav.html` | Desktop floating nav and mobile tab bar | Used in build |
| `_includes/footer.html` | Contact footer shared by every view | Used in build |
| `assets/css/site.css` | All styles and design tokens | Yes |
| `assets/js/site.js` | All interactions and the router | Yes |
| `CNAME` | `gianlucacaico.com`. Never touch | Used by Pages |
| `assets/og-image.jpg` | 1200x630 link preview image | Yes |
| `assets/img/` | Site photos as webp: `avatar`, `portrait`, `facilitating`, `personal` | Yes |
| `_config.yml` | Tells Pages what not to publish | No |
| `CLAUDE.md` | This manual | No (excluded) |
| `tools/` | Preview and health-check scripts | No (excluded) |
| `.claude/skills/` | Project slash commands | No (dot-folder) |

## Tools

Run from the repo root. The tools build the site with GitHub Pages' own Jekyll first (`bash tools/build.sh`, output in `tools/_site/`), so previews show exactly what GitHub will publish. In a fresh session the first build installs the builder and a local copy of the Inter font (a minute or two) unless the environment's setup script already has.

- `node tools/preview.js [view...] [--section ID] [--full] [--only mobile|desktop] [--live]`
  Screenshots at 390px (mobile) and 1280px (desktop), saved to `tools/previews/` (git-ignored). Views: `home`, `work`, `blog`, `blog/<slug>`, or `all`. `--section` takes a section id (`writing`, `record`, `timeline`...) or any CSS selector. `--live` shoots the live site. Inter is served from a local copy so the font always renders; the tool warns if it does not, or if the expected view is not showing. Motion is reduced so screenshots are stable.
  The mobile tab bar is fixed to the bottom of the screen, so it appears over section screenshots, as it would on a phone.
- `bash tools/health.sh`: checks the live site (domain, www, http to https, link preview tags and image, project files not public, every published file matches `main` as built by Jekyll, CNAME intact, no em dashes, every view renders with images and no script errors).
- `node tools/check-views.js [url | local]`: the view check on its own. `local` builds and checks the working copy.
- `bash tools/build.sh [source] [destination]`: build the site exactly as GitHub Pages does (Jekyll 3.10 via the `github-pages` gem in `tools/Gemfile`, installed to `tools/vendor/`).
- `node tools/compare.js [--base <git ref>] [--after <folder>] [views...]`: before-and-after proof. Screenshots every view of `main` and of the working copy (or a built folder such as `_site`) at both sizes, full page, and reports any pixel that differs, saving red difference images to `tools/previews/compare/`. Run it for every change meant to leave the look unchanged, and quote its result in the pull request.
- `tools/lib.js`: shared helpers (local server, local Inter, view list) used by the tools above.

To show previews to Gianluca, send the PNGs with the SendUserFile tool (mobile first).

## Architecture of the site

Phase 2 (approved: option A, Jekyll, no CMS) is restructuring the site in steps, each its own pull request proven pixel-identical with `tools/compare.js`. Step 1 (images moved to `assets/img/`) and step 2 (shared layout, styles and code in their own files) are done. Update this section as each step lands.

The built page has these parts, in this order (source file in brackets). Find things by searching for the ids or classes below, not by line number (line numbers drift).

1. `<head>` (`_includes/head.html`): title, meta description, canonical, Open Graph and Twitter tags (all pointing at `assets/og-image.jpg`), Google Fonts Inter (400 to 800), then the stylesheet `assets/css/site.css`.
2. `<header class="topbar">` (`_includes/nav.html`): floating desktop nav capsule (glass). Links carry `data-nav="home|work|blog"`.
3. `<nav class="tabbar">` (`_includes/nav.html`): floating mobile tab bar (shown under 760px), same `data-nav` links plus Contact.
4. `<main id="view-home" data-view="home">` (`index.html`, as are items 5 to 7), with sections:
   - `.hero`: eyebrow, h1 with `.grad-word`, `.lede`, CTA row, portrait (`.hero-photo`, glass `.name-tag`), `.brands` "Partnered with" list. The hero h1 ("Over 14 years...") is the one place a dated figure is allowed.
   - `.pov` (dark): facilitating photo plus approach statement.
   - `#record`: "Outcomes I've driven" stat grid (`.record dl > dt/dd`).
   - `#practice`: "What I help with", the EXD agentic design thinking model. Three `.practice-points`, an interactive model (`.m-node` pills and diamonds) controlling `.m-panel`s with Outcome / Human gate / Agentic lane `.m-lane`s.
   - `#spotlight`: Dynamic blueprinting four-step tabs (`.fw-step` / `.fw-panel`), `.ev-outcomes`, `.ev-quote`.
   - `#stack`: Tech ecosystem orbit (`.orbit-node` buttons with `data-name/phase/step/role`).
   - `#timeline`: Career timeline (`.tl-row`), Bound engagements in `.bracket` with filter `.seg` and `<details class="eng" data-tags="ai growth platform">` cards, earlier roles in `.tl-more`, `.parallel` freelance row.
   - `#credentials`: two `.cred-group`s plus `.personal` (photo and outside-work line).
   - `#writing`: "Latest thinking", the two newest posts as `.writing article` rows.
5. `<main id="view-work" data-view="work" hidden>`: `.page-head` with the animated `#ix` "From one insight to production" panel, then a filter `.seg.work-filter` (counts in `<small>`) and `.work-grid` of `.work-card`s (`data-industry="fs|health|energy|sport|saas"`, `--art` gradient token, "Request the case study" mailto link).
6. `<main id="view-blog" data-view="blog" hidden>`: `.page-head`, one `.post-feature` (featured, newest post), `.writing.post-list` (other recent posts), `h2.archive-head` "From the archive" and `.writing.post-list.archive`.
7. One `<main id="post-<slug>" data-view="post" data-title="<Short title> | Gianluca Caico" hidden>` per post, newest first: dynamic-blueprinting, human-centred-transformation, t-shaped-skillset, video-games-ux.
8. `<footer class="site" id="contact">` (`_includes/footer.html`): dark footer, avatar, email, phone, LinkedIn, `.fine` line. Shared by every view.
9. `assets/js/site.js`, loaded at the end, with small self-contained blocks: engagement filter, EXD model, blueprinting tabs, "add a note" demo, orbit, work filter, glass lens positioning, nav dark-mode detection, the **router**, and the `#ix` animation.

### Routing (hash routes)

- `#/` home, `#/work`, `#/blog`, `#/blog/<slug>` shows `<main id="post-<slug>">`. An unknown slug falls back to the blog index.
- Any other hash (`#contact`, `#timeline`, `#practice`) scrolls to that id; non-contact ids switch to home first. `#contact` stays on the current view.
- The router shows one `main[data-view]` at a time, sets `aria-current` on matching `data-nav` links (posts count as "blog") and sets `document.title` from `data-title`.
- **Adding a post needs no router change**: the id `post-<slug>` is enough.
- Every view shares the one set of link preview tags in `<head>`, so posts do not get their own link previews today (Phase 2 plan addresses this).

### How a blog post is wired in (all five places)

1. **The post view**: a new `<main id="post-<slug>" data-view="post" data-title="..." hidden>` copied from an existing post. Structure: `header.article-head` (glass `.back` link, h1, `.article-meta` with the `av-sm` avatar, author line, `<time datetime>`, read time, `.post-tags`), then `.prose` body, `.author` bio box, `.next-post` card, `.article-foot` buttons. Place it in date order among the other post `main`s (newest first).
2. **Blog index card** (`#view-blog`): the newest post is the `.post-feature`. When a new post becomes newest, it takes the feature slot and the previous feature moves to the top of `.writing.post-list` as an `article` (`time`, h3 link, summary `p`, `.post-tags.small` with `li.rt` read time). Older pieces that are not recent go under "From the archive".
3. **Homepage "Latest thinking"** (`#writing`): shows the two newest posts. Add the new one at the top and drop the oldest of the two.
4. **Next-post links**: a chain from newest to oldest. The new post's `.next-post` points at the previous newest. The oldest post (`video-games-ux`) has a "Back to the latest" card that must be re-pointed at the new newest post (title, date, read time).
5. **Checks**: `node tools/preview.js blog/<slug> --full`, `node tools/preview.js blog`, `node tools/preview.js home --section writing`, then `node tools/check-views.js local`.

Images: photos live in `assets/img/` and are linked with absolute paths (`/assets/img/avatar.webp`). The avatar appears in the nav, the mobile id row, every post's meta line and author box, and the footer, all pointing at the same file. New images go in `assets/img/` as webp; discuss any new image with Gianluca first.

### Reusable components (use these, do not invent new ones)

- Buttons: `.btn-pill` (violet primary), `.btn-ghost` (glass secondary).
- Glass material: `.glass` (and `.on-dark`), with `.lens` for the sliding highlight in `.seg` and nav.
- Section scaffold: `section.bordered > .wrap > .section-head (h2 + .count) + .section-intro`.
- Segmented filter: `.seg.glass` with buttons `aria-pressed`, plus a `.filter-status` line.
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

None at the moment. Add anything spotted but not yet confirmed with Gianluca here.
