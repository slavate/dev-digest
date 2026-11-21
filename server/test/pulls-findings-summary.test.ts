import { describe, it, expect } from 'vitest';
import {
  latestReviewPerAgent,
  summarizeFindings,
  RATIONALE_PREVIEW_MAX,
  type FindingRow,
} from '../src/modules/pulls/findings-summary.js';

const row = (severity: string, confidence: number, title = `${severity}-${confidence}`): FindingRow => ({
  severity,
  category: 'bug',
  title,
  file: 'a.ts',
  startLine: 1,
  endLine: 2,
  confidence,
  rationale: 'why',
});

describe('latestReviewPerAgent', () => {
  it('keeps the newest review per (pr, agent); null agents form one group', () => {
    const picked = latestReviewPerAgent([
      { id: 'a-new', prId: 'p1', agentId: 'A' },
      { id: 'b', prId: 'p1', agentId: 'B' },
      { id: 'a-old', prId: 'p1', agentId: 'A' },
      { id: 'n-new', prId: 'p1', agentId: null },
      { id: 'n-old', prId: 'p1', agentId: null },
      { id: 'a-p2', prId: 'p2', agentId: 'A' },
    ]);
    expect([...picked.keys()]).toEqual(['a-new', 'b', 'n-new', 'a-p2']);
    expect(picked.get('a-p2')).toBe('p2');
  });
});

describe('summarizeFindings', () => {
  it('counts per severity and ignores unknown levels', () => {
    const s = summarizeFindings([row('CRITICAL', 0.9), row('WARNING', 0.9), row('WARNING', 0.5), row('INFO', 1)]);
    expect(s).toMatchObject({ CRITICAL: 1, WARNING: 2, SUGGESTION: 0, total: 3 });
  });

  it('lists every finding, by severity then confidence', () => {
    const s = summarizeFindings([
      row('WARNING', 0.86, 'w'),
      row('CRITICAL', 0.79, 'c79'),
      row('SUGGESTION', 0.99, 's'),
      row('CRITICAL', 0.98, 'c98'),
    ]);
    expect(s.findings.map((f) => f.title)).toEqual(['c98', 'c79', 'w', 's']);
  });

  it('trims long rationale', () => {
    const s = summarizeFindings([{ ...row('CRITICAL', 1), rationale: 'x'.repeat(500) }]);
    expect(s.findings[0]!.rationale.length).toBe(RATIONALE_PREVIEW_MAX);
  });

  it('returns zeros for no findings', () => {
    expect(summarizeFindings([])).toEqual({ CRITICAL: 0, WARNING: 0, SUGGESTION: 0, total: 0, findings: [] });
  });
});
