---
name: navigate
description: Sweep gianlucacaico.com and its design system for navigation and usability. Maps every page of both sites at phone and desktop size, runs a heuristic review of the key journeys, recommends clean-up, and drafts breadcrumbs, footer site maps and cross-site links as previews. Never publishes; every approved fix becomes its own review page.
argument-hint: "[optional focus, e.g. 'posts', 'design system', 'footer', 'live']"
---

Focus: $ARGUMENTS (none means both sites, every page)

Follow CLAUDE.md, especially the Working agreement, "Navigation standard" and "How changes flow". This skill orchestrates the sub tasks below and reports back. It changes nothing on either site: each fix it recommends goes through `/edit` on its own branch, one change per pull request.

## 1. Map (automatic)

Run `node tools/nav-map.js --shots`. Add `--ds ../design-system` when the design system repo is checked out next to this one, so its unpublished changes count too, or `--live` to sweep the live sites. It crawls both sites as one space, from both front doors and the sitemap, at 390px and 1280px, and prints PASS / WARN / FAIL / INFO under four questions: where am I, where can I go, how do I get back, and labels and tap targets. It saves the full map to `tools/previews/nav/map.json` and the top and end of every page to `tools/previews/nav/shots/`.

Any FAIL is a bug (a broken link, an in-page link with no target, a page with no way home): list those first.

## 2. Heuristic review (judgement)

Look at the screenshots, phone first, and walk these journeys:

- **First visit:** homepage, Work, get in touch.
- **Shared link:** land on a post from LinkedIn, read it, go to the next post, then Work or contact.
- **Hiring or buying:** homepage, career timeline, credentials, contact.
- **Design system visitor:** land on `/design-system/workflows` from a link, work out where it sits, reach gianlucacaico.com.
- **Between the sites:** from any page of gianlucacaico.com, find the design system through the footer, and come back the same way.
- **Lost:** a missing address, the "page not found" page, back on track.

Score each finding against these heuristics (Nielsen's ten, applied to navigation), with a severity: **3** blocks or misleads, **2** slows down or confuses, **1** polish.

- **Where am I?** The menu marks the current page; inner pages show their place; the title and address agree.
- **Where can I go?** A next step on every page, no dead ends, the footer works as a map, key pages within two taps.
- **How do I get back?** Home and the parent page are one tap away from every page.
- **Consistency:** the same place has the same name in menus, trails and footers, in both sites; one breadcrumb component.
- **Plain labels:** link text says where it goes; section links use the heading they jump to.
- **Recovery:** links never break, in-page links land, the 404 page offers a way on.
- **Accessibility:** tap targets at least 24px (aim for 44), menus labelled, `aria-current` used.
- **Restraint:** nothing added that the menu already does well; no duplicate links competing.

Use the map's numbers as evidence ("2 taps", "22px tall"), never a hunch.

## 3. Clean-up recommendations

From the map and the review, list the small fixes: broken or duplicate links, small tap targets, labels that do not match headings, address mismatches, a missing "current page" marker. One line each: what, where, why, severity, and which repo it belongs to.

## 4. Proposals (drafted, not applied)

Check the design system's decision log (`_data/decisions.yml` in gianlucacaico/design-system) and "Known content notes" here first. A proposal that reverses a logged decision is a question for Gianluca, not a draft. Then draft what the review supports, using the rules in "Navigation standard":

- **Breadcrumbs:** only on pages two levels down or in the other site, where they add something the menu does not. One component on both sites, plus breadcrumb data for search results.
- **Footer site map:** the space's main pages, the homepage sections by their headings, and the newest posts, filled in automatically.
- **Cross-site links:** each site's footer links to the other (decision, November 2026). A link between them anywhere else needs Gianluca's explicit approval.
- **Anything else** the review turns up (a sticky menu on a long page, a clearer 404), as long as it reuses existing components and tokens.

Draft in a throwaway copy, never on a branch that is up for review: `git worktree add --detach <scratchpad>/nav-mock`, and the same for the design system. Build both, then render each proposal as Current and Proposed, phone and desktop. Save each repo's draft as a patch file so an approved proposal can be applied as is.

## 5. Report

Outcome first: how many FAIL and WARN, and the three findings that matter most. Then a table that reads on a phone:

| Finding | Where | Severity | Fix | Repo |
|---|---|---|---|---|

Then the proposals with their previews (send with SendUserFile, phone first), each with its wording as Current / Proposed. Then the decisions needed, as short questions with a recommended answer.

## 6. Stop and wait

Say: "Nothing has changed on either site. Tell me which of these to make." On approval, each approved item becomes its own change on its own branch through `/edit` (one change per pull request). A new navigation component (a breadcrumb, a footer map) is then added to the design system's kit, demo and workflow library in its own pull request there. Re-run `node tools/nav-map.js` on each branch and quote the finding it clears.

## Guardrails

- Never publishes, merges or pushes to `main`. `/publish` does that, after approval.
- Never adds a link between the two sites outside their footers, or a page or folder called `design-system` here, without Gianluca's explicit approval.
- Never touches `CNAME`, the link preview tags in `_includes/head.html`, or anything to do with DNS or email.
- Reuses existing components and tokens; labels reuse existing headings. Australian English, no em dashes.
- Flags rather than fixes anything outside navigation it happens to notice, in "Known content notes".

## Running as an agent

Steps 1 to 5 need no decisions, so they can run unattended, for example as a monthly sweep or after a new post or page merges. Inputs: an optional focus. Outputs: `map.json`, the screenshots, the report, the previews and the patch files. It always stops at step 6: an agent version reports and asks, it never applies.
