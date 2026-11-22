/* FindingsSummary — per-severity counts (icon + number) with a hover/focus
   popover listing findings. Shared by the PR list (Findings column) and the PR
   page Timeline. The popover is position:fixed so the list's overflow:hidden
   table card can't clip it on the bottom rows. */
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Icon, SEV, CategoryTag, ConfidenceNum, type Category } from "@devdigest/ui";
import type { FindingPreview, Severity } from "@devdigest/shared";
import { lineLabel } from "../../[number]/_components/FindingCard/helpers";
import { CLOSE_DELAY_MS, POPOVER_GAP, POPOVER_MAX_HEIGHT, SEVERITIES } from "./constants";
import { sortForPreview } from "./helpers";
import { s } from "./styles";

export function FindingsSummary({
  counts,
  findings,
  title,
}: {
  counts: Record<Severity, number>;
  /** Findings listed in the popover (sorted here: severity, then confidence). */
  findings: FindingPreview[];
  /** Popover heading, already translated ("6 findings", "5 findings in this run"). */
  title: string;
}) {
  const t = useTranslations("prReview");
  const triggerRef = React.useRef<HTMLSpanElement | null>(null);
  const popRef = React.useRef<HTMLDivElement | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [pos, setPos] = React.useState<React.CSSProperties | null>(null);
  const tipId = React.useId();
  const sorted = React.useMemo(() => sortForPreview(findings), [findings]);

  const cancelClose = () => clearTimeout(closeTimer.current);
  const close = React.useCallback(() => {
    clearTimeout(closeTimer.current);
    setPos(null);
  }, []);
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(close, CLOSE_DELAY_MS);
  };
  const open = () => {
    cancelClose();
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const up = window.innerHeight - r.bottom < POPOVER_MAX_HEIGHT;
    setPos(
      up
        ? { left: r.left, bottom: window.innerHeight - r.top + POPOVER_GAP }
        : { left: r.left, top: r.bottom + POPOVER_GAP },
    );
  };

  React.useEffect(() => {
    if (!pos) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // A fixed popover would detach from its row on page scroll; scrolling inside it is fine.
    const onScroll = (e: Event) => {
      if (!popRef.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [pos, close]);
  React.useEffect(() => () => clearTimeout(closeTimer.current), []);

  if (SEVERITIES.every((sev) => counts[sev] === 0)) return null;

  return (
    <span
      ref={triggerRef}
      tabIndex={0}
      aria-label={t("findingsSummary.ariaLabel", {
        critical: counts.CRITICAL,
        warning: counts.WARNING,
        suggestion: counts.SUGGESTION,
      })}
      aria-describedby={pos ? tipId : undefined}
      onMouseEnter={open}
      onMouseLeave={closeSoon}
      onFocus={open}
      onBlur={close}
      style={s.trigger}
    >
      {SEVERITIES.filter((sev) => counts[sev] > 0).map((sev) => {
        const SevIcon = Icon[SEV[sev].icon];
        return (
          <span key={sev} aria-hidden style={{ ...s.count, color: SEV[sev].c, borderBottomColor: SEV[sev].c }}>
            <SevIcon size={12.5} />
            {counts[sev]}
          </span>
        );
      })}
      {pos && (
        <div
          ref={popRef}
          id={tipId}
          role="tooltip"
          onMouseEnter={cancelClose}
          onMouseLeave={closeSoon}
          style={{ ...s.popover, ...pos }}
        >
          <div style={s.header}>
            <Icon.FileText size={13} />
            {title}
          </div>
          {sorted.map((f, i) => {
            const SevIcon = Icon[SEV[f.severity].icon];
            return (
              <div key={i} style={s.item}>
                <div style={s.itemHead}>
                  <span style={{ ...s.sevIcon, color: SEV[f.severity].c, background: SEV[f.severity].bg }}>
                    <SevIcon size={12} />
                  </span>
                  <span style={s.itemTitle} title={f.title}>
                    {f.title}
                  </span>
                  <CategoryTag category={f.category as Category} />
                </div>
                <div style={s.itemMeta}>
                  <span className="mono" style={s.location}>
                    {f.file}:{lineLabel(f)}
                  </span>
                  <ConfidenceNum value={f.confidence} />
                </div>
                <div style={s.rationale}>{f.rationale}</div>
              </div>
            );
          })}
        </div>
      )}
    </span>
  );
}
