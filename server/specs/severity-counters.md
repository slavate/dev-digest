# Severity counters — server (колонка Findings у списку PR)

UI-частина → [`client/specs/severity-counters.md`](../../client/specs/severity-counters.md), частина 2.
Частина 1 (лічильники в розгорнутому прогоні) сервер не чіпає, бо дані вже приходять з `GET /pulls/:id/reviews`.

## Мета
`GET /repos/:id/pulls` (список PR) віддає для кожного PR підсумок знахідок: кількість за severity
і всі враховані знахідки для спливного вікна (воно прокручується). Без N+1 і без викликів моделі.

## Рішення
| Питання | Рішення |
|---|---|
| Які рев'ю рахуємо | **Останнє рев'ю кожного агента** (`reviews.kind = 'review'`, найновіше `created_at` на `(pr_id, agent_id)`). Повторний прогін агента замінює його попередні знахідки, а не додається до них. `agent_id = NULL` вважаємо одним «агентом». |
| Dismissed | **Не рахуємо** (`findings.dismissed_at IS NULL`). Список показує те, що ще відкрите. |
| Рівні | Тільки `Severity` з контракту: `CRITICAL`, `WARNING`, `SUGGESTION`. Інші значення в БД ігноруємо. |
| PR без жодного рев'ю | `findings_summary = null` → у UI `—` |
| Рев'ю є, знахідок 0 | нулі, `total = 0`, `top = []` → у UI `—` (як #460 на макеті) |
| Знахідки для спливного вікна | **усі** враховані (вікно прокручується), сортування: severity (CRITICAL → SUGGESTION), далі `confidence` за спаданням. Спершу було top 3; змінено 2026-11-21 на прохання юзера |
| Розмір відповіді | `rationale` обрізаємо до 240 символів на сервері, а в UI клемпимо до 2 рядків |

Score-кільце не змінюється: воно, як і раніше, бере останнє рев'ю PR. Лічильник blockers на сторінці PR теж не змінюється.

## Контракт (`@devdigest/shared`, **обидві** копії, `contracts/platform.ts`)
```ts
export const FindingPreview = z.object({
  severity: Severity,           // з contracts/findings (перевірити, що імпорт не дає циклу)
  title: z.string(),
  category: z.string(),
  file: z.string(),
  start_line: z.number().int(),
  end_line: z.number().int(),
  confidence: z.number(),
  rationale: z.string(),        // ≤ 240 символів
});
export const PrFindingsSummary = z.object({
  CRITICAL: z.number().int(),
  WARNING: z.number().int(),
  SUGGESTION: z.number().int(),
  total: z.number().int(),
  findings: z.array(FindingPreview), // усі враховані, відсортовані
});
// PrMeta += (тільки list-ендпоінт, як score / cost_usd)
findings_summary: PrFindingsSummary.nullish(),
```

## Зміни
1. **`modules/pulls/findings-summary.ts`** (нове, чисті функції без БД, щоб тестувати unit-тестами):
   - `latestReviewPerAgent(rows: {id, prId, agentId}[] /* newest-first */): Map<reviewId, prId>`;
   - `summarizeFindings(rows: FindingRow[]): PrFindingsSummary`, де `FindingRow` має severity, title, category, file, startLine, endLine, confidence, rationale.
   - `RATIONALE_PREVIEW_MAX = 240`.
2. **`modules/pulls/routes.ts`** (list-хендлер):
   - Наявний запит score отримує ще поля `id` і `agentId`. Порядок newest-first уже є, тож score-логіка без змін.
   - Додаємо один запит:
     `select … from findings where review_id in (latest-per-agent ids) and dismissed_at is null`.
     Результат групуємо в JS за `prId` → `summarizeFindings`.
   - У результат: `findings_summary: summaryByPr.get(r.id) ?? (reviewed ? zeroSummary : null)`.
   - Прибираємо застарілий коментар «per-severity FINDINGS breakdown is intentionally not surfaced on the list».
   Разом +1 IN-запит на весь список, без N+1. Міграцій і змін схеми немає.

## Тести
- **Unit** `findings-summary.test.ts`:
  - `latestReviewPerAgent`: два рев'ю агента A → береться новіше; агент B окремо; два рев'ю з `agentId = null` → одне.
  - `summarizeFindings`: лічильники й `total`; невідомий severity ігнорується; `findings` містить усі
    знахідки, відсортовані (CRITICAL 0.79 після CRITICAL 0.98, WARNING після обох); `rationale` ≤ 240.
- **Integration** (`test/*.it.test.ts`, патерн `appWith()` + `setupRepoAndPr()` з `INSIGHTS.md`, рядки вставляємо напряму):
  - PR: агент A, старе рев'ю (CRITICAL), нове рев'ю (WARNING + dismissed CRITICAL); агент B (SUGGESTION)
    → `{ CRITICAL: 0, WARNING: 1, SUGGESTION: 1, total: 2 }`, у `findings` WARNING іде першим.
  - PR без рев'ю → `findings_summary: null`; рев'ю без знахідок → нулі й `findings: []`.
  - `score` і `cost_usd` у тій самій відповіді не змінились.

## Acceptance
- [ ] `GET /repos/:id/pulls` має `findings_summary` для кожного PR, а лічильники збігаються з
      останніми рев'ю кожного агента без dismissed.
- [ ] Повторний прогін агента не подвоює числа.
- [ ] Кількість SQL-запитів хендлера не залежить від кількості PR.
