import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { PrMeta } from "@/lib/types";
import messages from "../../../../../../../messages/en/prReview.json";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { PRRow } from "./PRRow";

afterEach(cleanup);

const PR: PrMeta = {
  id: "p1",
  number: 482,
  title: "Add rate limiting",
  author: "marisa.koch",
  branch: "feat/rl",
  base: "main",
  head_sha: "abc",
  additions: 10,
  deletions: 2,
  files_count: 1,
  status: "needs_review",
  score: 61,
  cost_usd: null,
  findings_summary: null,
};

const renderRow = (pr: PrMeta) =>
  render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      <PRRow pr={pr} repoId="r1" />
    </NextIntlClientProvider>,
  );

const finding = (severity: "CRITICAL" | "WARNING" | "SUGGESTION", title: string) => ({
  severity,
  category: "security" as const,
  title,
  file: "src/config.ts",
  start_line: 12,
  end_line: 12,
  confidence: 0.98,
  rationale: "why",
});

describe("PRRow — Findings column", () => {
  it("shows a dash when the PR was never reviewed or has no open findings", () => {
    renderRow(PR);
    renderRow({ ...PR, findings_summary: { CRITICAL: 0, WARNING: 0, SUGGESTION: 0, total: 0, findings: [] } });
    expect(screen.queryByLabelText(/^Findings:/)).not.toBeInTheDocument();
  });

  it("the popover lists every finding of the PR, not just the top few", () => {
    const all = [
      finding("CRITICAL", "c1"), finding("CRITICAL", "c2"),
      finding("WARNING", "w1"), finding("WARNING", "w2"),
      finding("SUGGESTION", "s1"), finding("SUGGESTION", "s2"),
    ];
    renderRow({ ...PR, findings_summary: { CRITICAL: 2, WARNING: 2, SUGGESTION: 2, total: 6, findings: all } });
    fireEvent.mouseEnter(screen.getByLabelText("Findings: 2 critical, 2 warning, 2 suggestion"));
    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent("6 findings");
    for (const f of all) expect(tip).toHaveTextContent(f.title);
  });
});
