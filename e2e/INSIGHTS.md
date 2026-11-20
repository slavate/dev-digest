# e2e — insights

Non-obvious lessons that the code and README don't tell you. Maintained by `/engineering-insights`
(`.claude/skills/engineering-insights/`); read it before working here.
**Append-only:** insert new lines directly under a section heading (newest first); never edit or
delete existing ones — correct with a new `Supersedes YYYY-MM-DD: …` line. Pruning is a manual monthly review.
Entry: `- YYYY-MM-DD — <what, concrete> — <path + symbol> — <what to do>`

## What Works

## What Doesn't Work

## Codebase Patterns

- 2026-11-20 — `specs/` was already taken by flow files, so this package has no separate feature-spec folder; put e2e feature specs in the owning module's `specs/`.

## Tool & Library Notes

## Recurring Errors & Fixes

- 2026-11-20 — `npm i -g agent-browser` fails with EACCES when the npm prefix is root-owned `/usr/local` — `run.ts` `BIN` — install with `npm i -g --prefix ~/.npm-global agent-browser` and run `AGENT_BROWSER_BIN=~/.npm-global/bin/agent-browser ../scripts/e2e.sh` (the env var passes through `e2e.sh`); no sudo needed.

## Session Notes

## Open Questions

- 2026-11-20 — Flows 04 and 05 fail on `main` too (`open the PR row` → `find text … click` fails), while 02 passes; 04/05 click right after `wait --url /pulls` without the `wait --text <PR title>` step that 02 has — `specs/04-pr-findings.flow.json`, `specs/05-pr-diff.flow.json` — likely a race; try adding that wait step before blaming app code.
