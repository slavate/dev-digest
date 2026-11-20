# client — insights

Non-obvious lessons that the code and README don't tell you. Maintained by `/engineering-insights`
(`.claude/skills/engineering-insights/`); read it before working here.
**Append-only:** insert new lines directly under a section heading (newest first); never edit or
delete existing ones — correct with a new `Supersedes YYYY-MM-DD: …` line. Pruning is a manual monthly review.
Entry: `- YYYY-MM-DD — <what, concrete> — <path + symbol> — <what to do>`

## What Works

## What Doesn't Work

## Codebase Patterns

- 2026-11-20 — `vendor/shared` differs from the server copy in 5 files (adapters, eval-ci, knowledge, productionize, trace) — check with `diff -r server/src/vendor/shared client/src/vendor/shared`.

## Tool & Library Notes

## Recurring Errors & Fixes

- 2026-11-20 — Adding a required field to a `vendor/shared` contract makes typed test fixtures fail with a misleading TS2719 "Two different types with this name exist, but they are unrelated" — e.g. `RunHistory.test.tsx` `run()` fixture (`RunSummary`) — the real cause is the missing field: add it to the fixture defaults.

## Session Notes

## Open Questions
