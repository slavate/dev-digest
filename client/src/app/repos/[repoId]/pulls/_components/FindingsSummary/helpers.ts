import type { FindingPreview, Severity } from "@devdigest/shared";
import { SEVERITIES } from "./constants";

/** Number of findings per severity; every level is present, even at 0. */
export function countBySeverity(findings: Pick<FindingPreview, "severity">[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { CRITICAL: 0, WARNING: 0, SUGGESTION: 0 };
  for (const f of findings) counts[f.severity] += 1;
  return counts;
}

/** Popover order: severity (CRITICAL first), then confidence, highest first. */
export function sortForPreview<T extends FindingPreview>(findings: T[]): T[] {
  return [...findings].sort(
    (a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) || b.confidence - a.confidence,
  );
}
