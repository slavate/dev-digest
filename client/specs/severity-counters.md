# Severity counters — client

Три частини:
1. **Сторінка PR → Agent runs:** лічильники за severity у розгорнутому прогоні та фільтр списку за рівнем. **Готово.**
2. **Список PR:** колонка **Findings** з підсумком знахідок за severity і спливним вікном при наведенні.
   Дані з сервера → [`server/specs/severity-counters.md`](../../server/specs/severity-counters.md).
3. **Сторінка PR → Agent runs → Timeline:** у рядку прогону ті самі іконки-лічильники, а при наведенні
   вікно `N FINDINGS IN THIS RUN` з усіма знахідками прогону. Сервер не змінюється.

Частини 2 і 3 використовують один спільний компонент `FindingsSummary` (див. частину 2).

# Частина 1 — лічильники в прогоні (готово)

## User story
Як юзер я можу:
1. Відкрити PR → вкладка Agent runs → розгорнути прогін і побачити над списком знахідок рядок
   `3 CRITICAL · 5 WARNING · 2 SUGGESTION`.
2. Клікнути по рівню і побачити у списку цього прогону тільки знахідки цього рівня.
3. Зняти фільтр (повторний клік по активному рівню) і повернутися до повного списку.

## Дані
Сервер не змінюється, нового запиту немає. `GET /pulls/:id/reviews` → `usePrReviews(prId)`
(`lib/hooks/reviews.ts`) → `page.tsx` → `FindingsTab` → `ReviewRunAccordion` (один на прогін) →
`FindingsPanel findings={review.findings}`. Рівні беремо з Zod-контракту `Severity`
(`CRITICAL | WARNING | SUGGESTION`). Власних рівнів немає.

## Де
`FindingsPanel` (`app/repos/[repoId]/pulls/[number]/_components/FindingsPanel/`), ліва частина
тулбару, навпроти перемикача «Hide low confidence». Панель монтується тільки в розгорнутому прогоні,
тому фільтр належить одному прогону і скидається, коли прогін згортають.

Не плутати з **blockers** у шапці прогону (`ReviewRunAccordion`): там рахуються CRITICAL-знахідки,
які ще ніхто не відхилив. Ця цифра лишається без змін.

## Поведінка
- Завжди показуємо три рівні в порядку CRITICAL → WARNING → SUGGESTION (`SEVERITIES` у `constants.ts`),
  навіть із нулем (`0 SUGGESTION`). Рівень із нулем неактивний (`disabled`), крім випадку,
  коли він зараз вибраний.
- **Лічильники = список без severity-фільтра.** Рахуємо після «Hide low confidence», тому числа завжди
  збігаються з картками. Відхилені (dismissed) знахідки лишаються і в списку, і в лічильниках.
- Клік по рівню вмикає фільтр. Повторний клік по активному рівню вимикає його. Клік по іншому рівню
  перемикає на нього. Кнопки мають `aria-pressed`, рядок має `role="group"` і
  `aria-label="Filter by severity"`.
- При зміні фільтра `focusIdx` скидається на 0, щоб j/k та a/d діяли на видиму картку.
- Якщо «Hide low confidence» спустошив активний рівень, показуємо наявний `EmptyState` «No findings
  match». Активна кнопка лишається клікабельною, тож фільтр можна зняти.
- Вигляд: текст `{n} {LEVEL}` та іконка з `SEV[level]` (`@devdigest/ui`), колір `SEV.c`. Активний рівень
  має фон `SEV.bg` і рамку кольору рівня. Рівень завжди підписаний текстом, тож не розрізняється
  самим лише кольором. `SeverityBadge` не підходить, бо він рендерить `Critical 3`, а формат вимагає
  `3 CRITICAL`.

## Код
- `helpers.ts`: `visibleFindings(findings, hideLow, severity = null)` (фільтр за рівнем додано
  в наявну функцію) і `countBySeverity(findings)`.
- `FindingsPanel.tsx`: стан `severity`, лічильники, кнопки.
- `styles.ts`: `sevGroup`, `sevSep`, `sevBtn`, `sevBtnDisabled`.
- `messages/en/prReview.json`: `panel.severityFilter`.

## Тести
`FindingsPanel.test.tsx` (vitest + RTL):
- лічильники `2 CRITICAL`, `1 WARNING`, `0 SUGGESTION`; рівень із нулем `disabled`;
- клік WARNING лишає тільки WARNING, `aria-pressed=true`; повторний клік повертає всі картки;
- перемикання CRITICAL → WARNING;
- «Hide low confidence» зменшує лічильник разом зі списком;
- `countBySeverity([])` повертає нулі; `visibleFindings(…, "WARNING")`.

e2e `04-pr-findings.flow.json` (сидований #482: 1 CRITICAL, 1 WARNING): чекаємо `1 CRITICAL`,
клікаємо `role button --name "1 WARNING"`, чекаємо картку «N+1 query in user list endpoint».

## Acceptance
- [ ] У розгорнутому прогоні видно лічильники за трьома рівнями у форматі `3 CRITICAL · 5 WARNING · 2 SUGGESTION`.
- [ ] Числа збігаються з кількістю знахідок кожного рівня у списку цього прогону.
- [ ] Клік по рівню лишає у списку тільки знахідки цього рівня.
- [ ] Фільтр можна зняти й повернутися до повного списку.

## Out of scope (частина 1)
Колонку Findings у списку PR описано в частині 2, іконки в Timeline — у частині 3.

---

# Частина 2 — колонка Findings у списку PR

## User story
Як юзер я можу:
1. Відкрити Pull Requests і в колонці **Findings** кожного PR побачити кількість знахідок за рівнями:
   `ⓘ 2  ⚠ 2  💡 2` (іконка й число кольором рівня, з пунктирним підкресленням).
2. Навести мишку (або сфокусувати клавіатурою) на комірку і побачити спливне вікно: `6 FINDINGS`
   і три найважливіші знахідки.
3. Клікнути по рядку, як і раніше, і перейти на сторінку PR.

## Що рахуємо (вирішено з юзером 2026-11-21)
- Рахуємо **останнє рев'ю кожного агента**. Повторний прогін не подвоює числа.
- **Dismissed не рахуємо.** Ці числа можуть відрізнятися від лічильників частини 1: там рахується
  все, що показано у списку прогону, включно з dismissed.
- Агрегацію робить сервер: `PrMeta.findings_summary` = `{ CRITICAL, WARNING, SUGGESTION, total, findings[] }` (усі враховані знахідки),
  або `null`, якщо PR ще не рев'юили. Клієнт нічого не перераховує.

## Спільний компонент `FindingsSummary` (частини 2 і 3)
Місце: `app/repos/[repoId]/pulls/_components/FindingsSummary/` (`FindingsSummary.tsx`, `.test.tsx`,
`index.ts`, `styles.ts`, `helpers.ts`). Лежить поруч із `RunCostBadge`, бо його, як і `RunCostBadge`,
використовують і список PR, і сторінка PR.

```ts
FindingsSummary({
  counts: Record<Severity, number>,
  findings: FindingPreview[],   // що показати у вікні; FindingRecord структурно сумісний
  title: string,                // заголовок вікна, вже перекладений: "6 findings" / "5 findings in this run"
})
```
- Рендериться тільки при сумі `counts` > 0. Що показати для порожнього стану, вирішує батьківський
  компонент: у списку це `—`, у Timeline старий текст.
- Показуємо тільки рівні з числом > 0, у порядку CRITICAL → WARNING → SUGGESTION:
  `Icon[SEV[sev].icon]` + число, колір `SEV[sev].c`, `border-bottom: 1px dashed` того ж кольору
  (як на обох макетах).
- Тригер має `tabIndex=0` і `aria-label` = `t("findingsSummary.ariaLabel")`, напр.
  «Findings: 2 critical, 2 warning, 2 suggestion», тож severity ніколи не передається лише кольором.
- `helpers.ts`: `sortForPreview(findings)` сортує за severity (CRITICAL → SUGGESTION), далі за `confidence`
  за спаданням. Застосовується до `findings` перед рендером вікна, тож обидва місця мають однаковий порядок.

## Спливне вікно (частина `FindingsSummary`)
- Відкривається на `mouseenter`/`focus` комірки, закривається на `mouseleave`/`blur`/`Escape`/scroll.
  Має `role="tooltip"`, комірка має `aria-describedby`.
- **Позиціювання `position: fixed`** від `getBoundingClientRect()` комірки. `tableCard` має
  `overflow: hidden` і обрізав би `absolute`-вікно в нижніх рядках. Якщо під коміркою не вистачає
  місця (`innerHeight - rect.bottom < 360`), вікно відкривається вгору. Ширина ~480px.
- Вміст (за макетами):
  - Заголовок: іконка + `title` (uppercase, `var(--text-muted)`, 12px) → `6 FINDINGS` / `5 FINDINGS IN THIS RUN`.
  - Пункти — усі `findings` у порядку `sortForPreview`. Кожен пункт: іконка рівня в плашці `SEV.bg`,
    жирний `title`, `CategoryTag` (`@devdigest/ui`); далі рядок `file:start-end` (mono, `var(--accent-text)`)
    + `ConfidenceNum` (`98% conf`); далі `rationale`, обрізаний до 2 рядків (`-webkit-line-clamp: 2`).
  - Пункти розділені `1px var(--border)`. Довгий `title` обрізаємо з `…` в один рядок.
  - **`max-height: 360px; overflow-y: auto`**: у Timeline знахідок може бути багато, тож вікно прокручується
    (як на макеті Timeline).
- Мишку можна перевести з тригера у вікно, і воно не закриється: закриття на `mouseleave` має затримку
  ~150мс, яку скасовує `mouseenter` самого вікна. Без цього вікно Timeline неможливо прокрутити.
- `file:line` — це текст, а не посилання (у PR-рядку немає `repoFullName`). У списку клік у будь-якому місці
  вікна спрацьовує як клік по рядку і відкриває PR. У Timeline рядок не клікабельний, тож клік нічого не робить.
- Нових UI-примітивів у `@devdigest/ui` не додаємо, бо вікно потрібне тільки в цих двох місцях.

## Зміни
- `vendor/shared/contracts/platform.ts`: `FindingPreview`, `PrFindingsSummary`, `PrMeta.findings_summary`
  (разом із серверною копією).
- `pulls/constants.ts`: `COLUMN_KEYS` += `"findings"` **після `score`, перед `status`**. У `GRID` нова
  колонка ~120px між score (60px) і status.
- `PRRow` (між score і status): якщо `pr.findings_summary?.total` > 0, рендеримо
  `<FindingsSummary counts={summary} findings={summary.findings} title={t("list.findingsTitle", { count: summary.total })} />`,
  інакше `—`. Вікно показує `6 FINDINGS` і всі 6 пунктів, а довгий список прокручується
  (`max-height: 360px`, `overscroll-behavior: contain`, щоб прокрутка не переходила на сторінку і не закривала вікно).
- `messages/en/prReview.json`: `list.columns.findings = "Findings"`,
  `list.findingsTitle = "{count, plural, one {# finding} other {# findings}}"`,
  `findingsSummary.ariaLabel = "Findings: {critical} critical, {warning} warning, {suggestion} suggestion"`.
- Колонка Run Review з макета не входить у цю фічу, це окрема задача.

## Тести (частина 2 + спільний компонент)
`FindingsSummary.test.tsx` (vitest + RTL, intl-обгортка як у `FindingsPanel.test.tsx`):
- `{CRITICAL:2, WARNING:2, SUGGESTION:2}` → три лічильники з числами 2;
  `{CRITICAL:0, WARNING:0, SUGGESTION:1}` → видно тільки SUGGESTION (як #477).
- Сума 0 → компонент нічого не рендерить.
- Hover → `role="tooltip"` з переданим `title` і всіма переданими `findings` (тест на 5 пунктів, без
  обрізання до 3) у порядку `sortForPreview`.
- `mouseleave` з тригера, а потім `mouseenter` у вікно (у межах затримки, fake timers) → вікно лишається;
  `mouseleave` з вікна → вікно зникає.
- Focus відкриває вікно, `Escape` закриває.
- `aria-label` тригера містить числа всіх трьох рівнів.
- `sortForPreview`: CRITICAL 0.79 після CRITICAL 0.98, WARNING після обох.

PRRow (у `FindingsSummary.test.tsx` або новий `PRRow.test.tsx`): `findings_summary: null` → `—`,
`total: 0` → `—`; вікно показує `6 findings` і всі 6 заголовків.

e2e — новий flow `e2e/specs/08-pr-list-findings.flow.json`. Сидований #482 має одне рев'ю
з 1 CRITICAL і 1 WARNING.
- `open {BASE}/` → `wait --url /pulls` → `wait --text "Add rate limiting to public API endpoints"`
  (без цього кроку буде гонка, див. `e2e/INSIGHTS.md`).
- Hover на комірку Findings рядка #482 → `wait --text "Hardcoded Stripe secret key in commit"` і
  `wait --text "2 findings"`. Цей текст на сторінці списку з'являється тільки у вікні.
- Локатор для hover: `find label "Findings: 1 critical, 1 warning, 0 suggestion" hover`. `find label`
  знаходить елемент за `aria-label` (перевірено, flow проходить).

## Acceptance (частина 2)
- [ ] У списку PR є колонка Findings між Score і Status; рівні з нулем не показуються; PR без знахідок → `—`.
- [ ] Числа = останні рев'ю кожного агента без dismissed (звірити з сервером на #482).
- [ ] Hover/focus показує `N FINDINGS` і всі знахідки PR (severity → confidence); довгий список прокручується; Escape або відведення мишки закриває.
- [ ] Вікно не обрізається в нижніх рядках таблиці.
- [ ] Клік по рядку, як і раніше, відкриває PR.

## Out of scope (частина 2)
Колонка Run Review у рядку.

---

# Частина 3 — іконки й вікно в Timeline

## User story
Як юзер я можу на вкладці Agent runs у блоці **Timeline**:
1. Побачити під назвою агента в рядку прогону лічильники `⊘ 1  ⚠ 4` (замість тексту `5 finding(s)`).
2. Навести мишку і побачити вікно `5 FINDINGS IN THIS RUN` з **усіма** знахідками цього прогону
   (прокручується, якщо їх багато).

## Дані
Сервер і новий запит не потрібні. `FindingsTab` вже отримує обидва списки: `prRuns: RunSummary[]`
(Timeline) і `runs: ReviewRecord[]` (рев'ю зі знахідками). Їх пов'язує `review.run_id === run.run_id`.

## Що рахуємо
**Усі знахідки рев'ю цього прогону**, включно з dismissed, без урахування «Hide low confidence».
Правило те саме, що в частині 1: числа в Timeline збігаються з лічильниками розгорнутого прогону
в Review runs (на макеті `⊘1 ⚠4` і `1 Critical · 4 W…`). Від частини 2 (список PR, без dismissed,
останнє рев'ю агента) це навмисно відрізняється: там підсумок по PR, тут один конкретний прогін.

## Зміни
- `FindingsTab`: `findingsByRun = useMemo(() => new Map(runs.filter(r => r.run_id).map(r => [r.run_id, r.findings])), [runs])`,
  передаємо в `<RunHistory findingsByRun={findingsByRun} … />`.
- `RunHistory` (новий необов'язковий проп `findingsByRun?: Map<string, FindingRecord[]>`), рядок `settled`:
  - якщо `findingsByRun.get(r.run_id)` не порожній, рендеримо
    `<FindingsSummary counts={countBySeverity(f)} findings={f} title={t("timeline.findingsInRun", { count: f.length })} />`,
    а далі наявний суфікс `· N blockers` (як на першому макеті Timeline: `⊘2 ⚠1 · 2 blockers`);
  - якщо прогін не має пов'язаного рев'ю (рев'ю ще вантажаться, видалене чи старі дані), лишається
    наявний текст `t("runStatus.findings")`, тож нічого не зникає;
  - рядки running / failed / cancelled не змінюються.
- `countBySeverity` (з `FindingsPanel/helpers.ts`) і `SEVERITIES` (з `FindingsPanel/constants.ts`) переносимо
  в `FindingsSummary` і імпортуємо з його `index.ts` в обох місцях, щоб не було двох копій.
- `messages/en/prReview.json`: `timeline.findingsInRun = "{count, plural, one {# finding in this run} other {# findings in this run}}"`.

## Тести (частина 3)
`RunHistory.test.tsx` (наявний; у фікстуру `run()` додати пов'язані знахідки через `findingsByRun`):
- done-прогін із 1 CRITICAL і 4 WARNING → тригер з `aria-label` «Findings: 1 critical, 4 warning, 0 suggestion»;
  текст `5 finding(s)` не рендериться; суфікс blockers лишається.
- Hover → `5 findings in this run` і всі 5 заголовків (без обрізання до 3).
- done-прогін без запису в `findingsByRun` → старий текст `N finding(s)`.
- failed-прогін → жодних лічильників.
- `FindingsPanel.test.tsx` лишається зеленим після перенесення `countBySeverity`.

e2e: сид не створює `agent_runs`, тож у сидованому Timeline немає рядків прогонів. Частина 3
покривається тільки unit-тестами. Додати run у сид — окреме рішення, бо зачепить flow 02/04.

## Acceptance (частина 3)
- [ ] У рядку завершеного прогону в Timeline видно іконки-лічильники за рівнями з числом > 0.
- [ ] Числа = кількість знахідок цього прогону за рівнями = лічильники в його блоці Review runs.
- [ ] Hover/focus показує `N FINDINGS IN THIS RUN` з усіма знахідками; вікно прокручується, і мишку
      можна завести всередину.
- [ ] Прогін без пов'язаного рев'ю, а також failed / running / cancelled виглядають як раніше.
