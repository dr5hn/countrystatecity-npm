# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Status Tracking

All CSC status goes in one shared doc, the **CSC Ecosystem Tracker**. Never create a separate tracker, handover or
status page. If you cannot open the doc (no access or no Claude Docs connector), skip this section.

- Doc: https://claude.ai/code/artifact/3d349193-5909-4e99-9376-849c02dd7b31. Edit it only with the Claude Docs
  connector (read / update / batch). Container: `{"kind":"project","id":"3d349193-5909-4e99-9376-849c02dd7b31"}`.
- This repo's row in *Projects*: "npm packages".
- **Tracker** tab (node `01507658-75c4`) has these sections:
  - *Waiting on you*: the owner's to-dos, as a checklist.
  - *Projects*: one row per repo. Update "Live now" after every deploy.
  - *Open work*: Item | Project | Priority | Status | Next step.
  - *Recently done*: Date | Project | What. Newest first, one line per merge or deploy.
- **Data accuracy** tab (node `3b635a83-1a21`): the countries-states-cities-database data-correctness audit.
- **Rollout log (26–29 Sep)**: history. Don't edit it.
- Dropdowns are set by index:
  - Priority, enum `788341cc-02a9`: 0 High, 1 Medium, 2 Low.
  - Work status, enum `fee57e4e-1681`: 0 Not started, 1 In progress, 2 Waiting on you, 3 Done.
  - Data status, enum `7d0788bc-c449`: 0 Needs decision, 1 In review, 2 Verified, 3 Found, 4 To audit, 5 Done.

Rules:
1. Update the doc after every PR opened or merged, deploy, review round, incident or customer-affecting action,
   as part of finishing that step. Don't wait to be asked.
2. Other sessions edit the doc too. Read it with `{"kind":"view","sinceRev":<your last rev>}` before writing.
   If a guard fails, keep their edit and re-apply yours on top.
3. Change only your own rows. Keep cells short and plain, and link PRs.
4. Anything the owner must do or decide goes in *Waiting on you*. Tick it when it's done.
5. Never put secrets, API keys or customer emails in the doc. Refer to customers by user ID.
