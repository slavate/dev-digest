# client — insights

Non-obvious lessons that the code and README don't tell you. Maintained by `/engineering-insights`
(`.claude/skills/engineering-insights/`); read it before working here.
**Append-only:** insert new lines directly under a section heading (newest first); never edit or
delete existing ones — correct with a new `Supersedes YYYY-MM-DD: …` line. Pruning is a manual monthly review.
Entry: `- YYYY-MM-DD — <what, concrete> — <path + symbol> — <what to do>`

## What Works

## What Doesn't Work

## Codebase Patterns

- 2026-11-21 — User correction: the PR-list Findings popover must list ALL of the PR's counted findings and scroll, not a top-3 preview (the mockup showed 3, but the user wants to scroll) — `PrFindingsSummary.findings` (server `modules/pulls/findings-summary.ts` `summarizeFindings`, no cap) → `PRRow` → `FindingsSummary` — don't reintroduce a preview limit; keep `overscrollBehavior: "contain"` so wheel at the list's end doesn't scroll the page (which closes the popover).

- 2026-11-21 — Popovers over the PR list must be `position: fixed` (from the trigger's `getBoundingClientRect`), because the table card `tableCard` in `app/repos/[repoId]/pulls/styles.ts` has `overflow: hidden` and clips absolute children on the bottom rows — reuse `pulls/_components/FindingsSummary` (counts + popover, shared by the PR list and the Timeline) instead of building another.

- 2026-11-20 — The "current repo" (URL > last used in `localStorage["dd-repo"]` > first) is resolved only in `RepoProvider` — `src/lib/repo-context.tsx` `useActiveRepo()` — pages needing a default repo must read `activeRepo` from it, never `useRepos().data[0]` (that was the "always opens the first repo" bug in `app/page.tsx`).

- 2026-11-20 — `vendor/shared` differs from the server copy in 5 files (adapters, eval-ci, knowledge, productionize, trace) — check with `diff -r server/src/vendor/shared client/src/vendor/shared`.

## Tool & Library Notes

- 2026-11-21 — `messages/en/prReview.json` has the same keys in several namespaces (`filesCount` in both `smartDiff` and `list`), so text-anchored inserts silently hit the wrong block — edit it as JSON: it round-trips byte-exact with `json.dumps(obj, indent=2, ensure_ascii=False) + "\n"`.

## Recurring Errors & Fixes

- 2026-11-21 — Next dev badge "1 Issue" = React warning "Updating borderColor … borderLeftColor": `borderColor`/`border` are shorthands, so changing them on rerender next to `borderLeft*` warns — `FindingCard/styles.ts` `s.card` (now per-side `borderTopColor`/`borderRightColor`/`borderBottomColor`) — for state-dependent borders use per-side longhands; check with `agent-browser console`, unit tests don't show it.

- 2026-11-20 — Adding a required field to a `vendor/shared` contract makes typed test fixtures fail with a misleading TS2719 "Two different types with this name exist, but they are unrelated" — e.g. `RunHistory.test.tsx` `run()` fixture (`RunSummary`) — the real cause is the missing field: add it to the fixture defaults.

## Session Notes

## Open Questions
