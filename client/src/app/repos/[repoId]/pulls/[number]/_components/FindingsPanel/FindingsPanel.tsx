/* FindingsPanel — hide-low-confidence + j/k navigation + FindingCard list,
   wiring the accept/dismiss action hook (A2). */
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Toggle, EmptyState, Icon, SEV } from "@devdigest/ui";
import type { FindingRecord, Severity } from "@devdigest/shared";
import { FindingCard } from "../FindingCard";
import { useFindingAction } from "../../../../../../../lib/hooks/reviews";
import { countBySeverity, SEVERITIES } from "../../../_components/FindingsSummary";
import { KEY_TO_ACTION } from "./constants";
import { visibleFindings } from "./helpers";
import { s } from "./styles";

export function FindingsPanel({
  findings,
  prId,
  repoFullName,
  headSha,
}: {
  findings: FindingRecord[];
  prId: string;
  repoFullName?: string | null;
  headSha?: string | null;
}) {
  const t = useTranslations("prReview");
  const action = useFindingAction();
  const [hideLow, setHideLow] = React.useState(false);
  const [severity, setSeverity] = React.useState<Severity | null>(null);
  const [focusIdx, setFocusIdx] = React.useState(0);

  // Counts follow the list as shown without the severity filter, so they always match the cards.
  const counts = React.useMemo(
    () => countBySeverity(visibleFindings(findings, hideLow)),
    [findings, hideLow],
  );
  const shown = React.useMemo(
    () => visibleFindings(findings, hideLow, severity),
    [findings, hideLow, severity],
  );

  const toggleSeverity = (sev: Severity) => {
    setSeverity((cur) => (cur === sev ? null : sev));
    setFocusIdx(0);
  };

  // j/k navigation + a/d shortcuts on the focused finding (keyboard).
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "j") setFocusIdx((i) => Math.min(i + 1, shown.length - 1));
      else if (e.key === "k") setFocusIdx((i) => Math.max(i - 1, 0));
      else if (KEY_TO_ACTION[e.key] && shown[focusIdx]) {
        action.mutate({ findingId: shown[focusIdx]!.id, action: KEY_TO_ACTION[e.key]!, prId });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shown, focusIdx, action, prId]);

  return (
    <div>
      <div style={s.toolbar}>
        <div role="group" aria-label={t("panel.severityFilter")} style={s.sevGroup}>
          {SEVERITIES.map((sev, i) => {
            const active = severity === sev;
            const SevIcon = Icon[SEV[sev].icon];
            return (
              <React.Fragment key={sev}>
                {i > 0 && <span style={s.sevSep}>·</span>}
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={counts[sev] === 0 && !active}
                  onClick={() => toggleSeverity(sev)}
                  style={{
                    ...s.sevBtn,
                    color: SEV[sev].c,
                    background: active ? SEV[sev].bg : "transparent",
                    borderColor: active ? SEV[sev].c : "transparent",
                    ...(counts[sev] === 0 && !active ? s.sevBtnDisabled : null),
                  }}
                >
                  <SevIcon size={12.5} />
                  {counts[sev]} {sev}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div style={s.toggleGroup}>
          {t("panel.hideLowConfidence")}
          <Toggle on={hideLow} onChange={setHideLow} size={16} />
        </div>
      </div>

      <div style={s.list}>
        {shown.length === 0 ? (
          <EmptyState icon="Filter" title={t("panel.noMatchTitle")} body={t("panel.noMatchBody")} />
        ) : (
          shown.map((f, i) => (
            <FindingCard
              key={f.id}
              f={f}
              focused={i === focusIdx}
              defaultExpanded={i === 0}
              pending={action.isPending}
              repoFullName={repoFullName}
              headSha={headSha}
              onAction={(act) => action.mutate({ findingId: f.id, action: act, prId })}
            />
          ))
        )}
      </div>
    </div>
  );
}
