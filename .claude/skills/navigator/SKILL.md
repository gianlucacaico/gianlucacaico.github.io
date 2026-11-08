---
name: navigator
description: Start the navigation agent, which sweeps gianlucacaico.com and its design system and reports findings and drafted fixes for decisions. Only Gianluca starts it, by typing /navigator; Claude never runs it on its own.
disable-model-invocation: true
argument-hint: "[optional focus, e.g. 'design system', 'posts', 'working copy']"
---

Gianluca has asked for the navigation agent to run. Focus: $ARGUMENTS (none means both live sites, every page)

1. **Start the `navigator` agent** with the focus as its task. Claude Code asks Gianluca to approve the launch first (the "ask" rule for `Agent(navigator)` in `.claude/settings.json`). If he declines, stop and say that nothing ran.
2. **While it runs**, say in one line that the sweep is under way. Change nothing on either site.
3. **When it reports back**, send its preview images with SendUserFile (phone first), then give its report as written: outcome first, the table, the proposals, the decisions needed.
4. **Stop.** Nothing changes until Gianluca decides. Each item he approves becomes its own change through `/edit` (with its own review page in the design system for anything there), and goes live only through `/publish` after his approval.
