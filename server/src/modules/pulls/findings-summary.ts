import type { FindingPreview, PrFindingsSummary, Severity } from '@devdigest/shared';

export const RATIONALE_PREVIEW_MAX = 240;

const SEVERITY_RANK: Record<Severity, number> = { CRITICAL: 0, WARNING: 1, SUGGESTION: 2 };

/**
 * Newest review per (PR, agent). `rows` must be newest-first. A re-run of an agent
 * supersedes its older reviews; reviews with no agent count as one "agent".
 * Returns reviewId → prId for the reviews that count.
 */
export function latestReviewPerAgent(
  rows: { id: string; prId: string; agentId: string | null }[],
): Map<string, string> {
  const seen = new Set<string>();
  const out = new Map<string, string>();
  for (const r of rows) {
    const key = `${r.prId}:${r.agentId ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.set(r.id, r.prId);
  }
  return out;
}

export interface FindingRow {
  severity: string;
  category: string;
  title: string;
  file: string;
  startLine: number;
  endLine: number;
  confidence: number;
  rationale: string;
}

/** Per-severity counts + every finding (severity, then confidence) for one PR's hover popover. */
export function summarizeFindings(rows: FindingRow[]): PrFindingsSummary {
  const counts: Record<Severity, number> = { CRITICAL: 0, WARNING: 0, SUGGESTION: 0 };
  const known = rows.filter((f): f is FindingRow & { severity: Severity } => f.severity in SEVERITY_RANK);
  for (const f of known) counts[f.severity] += 1;
  const findings: FindingPreview[] = [...known]
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.confidence - a.confidence)
    .map((f) => ({
      severity: f.severity,
      category: f.category as FindingPreview['category'],
      title: f.title,
      file: f.file,
      start_line: f.startLine,
      end_line: f.endLine,
      confidence: f.confidence,
      rationale:
        f.rationale.length > RATIONALE_PREVIEW_MAX
          ? `${f.rationale.slice(0, RATIONALE_PREVIEW_MAX - 1)}…`
          : f.rationale,
    }));
  return { ...counts, total: known.length, findings };
}
