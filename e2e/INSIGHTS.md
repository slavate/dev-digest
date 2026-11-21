# e2e — insights

Non-obvious lessons that the code and README don't tell you. Maintained by `/engineering-insights`
(`.claude/skills/engineering-insights/`); read it before working here.
**Append-only:** insert new lines directly under a section heading (newest first); never edit or
delete existing ones — correct with a new `Supersedes YYYY-MM-DD: …` line. Pruning is a manual monthly review.
Entry: `- YYYY-MM-DD — <what, concrete> — <path + symbol> — <what to do>`

## What Works

- 2026-11-21 — Demo videos: `agent-browser --session demo record start <file>.mp4 --cursor` … `record stop` records client-side navigation in one take, but needs `ffmpeg` on PATH (`brew install ffmpeg`); against the dev stack the PR list opens on the "Needs review" filter and a real PR's detail loads slowly (GitHub sync) — click "All" first and `wait --text "Agent runs"` instead of fixed pauses; script kept outside the repo.

## What Doesn't Work

## Codebase Patterns

- 2026-11-20 — `specs/` was already taken by flow files, so this package has no separate feature-spec folder; put e2e feature specs in the owning module's `specs/`.

## Tool & Library Notes

- 2026-11-21 — `find label "<aria-label>" hover` matches a non-form element by its `aria-label` and works for hover-only UI — `specs/08-pr-list-findings.flow.json` — give hover triggers a descriptive `aria-label` and target them this way; the seed has no `agent_runs`, so Timeline run rows can't be e2e-tested without extending `server/src/db/seed.ts`.

- 2026-11-21 — `find text "1 WARNING" click` failed with no reason printed when the text sat in a button inside a row whose combined text also contains it; `find role button click --name "1 WARNING"` worked — `specs/04-pr-findings.flow.json` (severity counter step) — to click a button, use a role locator, not `find text`.

## Recurring Errors & Fixes

- 2026-11-21 — Supersedes 2026-11-20 open question: the `open the PR row` failure is the race — adding `wait --text "Add rate limiting to public API endpoints"` before the click made flow 04 pass — `specs/04-pr-findings.flow.json` — flow 05 (`specs/05-pr-diff.flow.json`) still lacks that step and still fails; add it there.

- 2026-11-20 — `npm i -g agent-browser` fails with EACCES when the npm prefix is root-owned `/usr/local` — `run.ts` `BIN` — install with `npm i -g --prefix ~/.npm-global agent-browser` and run `AGENT_BROWSER_BIN=~/.npm-global/bin/agent-browser ../scripts/e2e.sh` (the env var passes through `e2e.sh`); no sudo needed.

## Session Notes

## Open Questions

- 2026-11-20 — Flows 04 and 05 fail on `main` too (`open the PR row` → `find text … click` fails), while 02 passes; 04/05 click right after `wait --url /pulls` without the `wait --text <PR title>` step that 02 has — `specs/04-pr-findings.flow.json`, `specs/05-pr-diff.flow.json` — likely a race; try adding that wait step before blaming app code.
