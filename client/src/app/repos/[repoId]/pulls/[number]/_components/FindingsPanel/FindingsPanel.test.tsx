import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { FindingRecord } from "@devdigest/shared";
import messages from "../../../../../../../../messages/en/prReview.json";

vi.mock("../../../../../../../lib/hooks/reviews", () => ({
  useFindingAction: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { FindingsPanel } from "./FindingsPanel";
import { visibleFindings } from "./helpers";
import { countBySeverity } from "../../../_components/FindingsSummary";

afterEach(cleanup);

const FINDINGS: FindingRecord[] = [
  {
    id: "f1",
    severity: "CRITICAL",
    category: "security",
    title: "Hardcoded secret",
    file: "src/config.ts",
    start_line: 11,
    end_line: 11,
    rationale: "A secret is committed.",
    suggestion: null,
    confidence: 0.95,
    kind: "finding",
    trifecta_components: null,
    evidence: null,
    review_id: "r1",
    accepted_at: null,
    dismissed_at: null,
  },
];

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("FindingsPanel (smoke)", () => {
  it("renders the toolbar + a finding card", () => {
    renderWithIntl(<FindingsPanel findings={FINDINGS} prId="pr1" />);
    expect(screen.getByText("Hide low confidence")).toBeInTheDocument();
    expect(screen.getByText("Hardcoded secret")).toBeInTheDocument();
  });

  it("shows the empty state when nothing matches", () => {
    renderWithIntl(<FindingsPanel findings={[]} prId="pr1" />);
    expect(screen.getByText("No findings match")).toBeInTheDocument();
  });
});

function finding(id: string, severity: FindingRecord["severity"], title: string, confidence = 0.9): FindingRecord {
  return { ...FINDINGS[0]!, id, severity, title, confidence };
}

// 2 CRITICAL (one low-confidence), 1 WARNING, 0 SUGGESTION.
const MIXED: FindingRecord[] = [
  finding("c1", "CRITICAL", "Secret in config"),
  finding("w1", "WARNING", "N+1 query"),
  finding("c2", "CRITICAL", "SSRF in webhook", 0.5),
];

const sevButton = (name: string) =>
  within(screen.getByRole("group", { name: "Filter by severity" })).getByRole("button", { name });

describe("FindingsPanel severity counters", () => {
  it("shows a counter per level that matches the list", () => {
    renderWithIntl(<FindingsPanel findings={MIXED} prId="pr1" />);
    expect(sevButton("2 CRITICAL")).toBeEnabled();
    expect(sevButton("1 WARNING")).toBeEnabled();
    expect(sevButton("0 SUGGESTION")).toBeDisabled();
  });

  it("filters to one level and clears on a second click", () => {
    renderWithIntl(<FindingsPanel findings={MIXED} prId="pr1" />);
    fireEvent.click(sevButton("1 WARNING"));
    expect(sevButton("1 WARNING")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("N+1 query")).toBeInTheDocument();
    expect(screen.queryByText("Secret in config")).not.toBeInTheDocument();
    expect(screen.queryByText("SSRF in webhook")).not.toBeInTheDocument();

    fireEvent.click(sevButton("1 WARNING"));
    expect(sevButton("1 WARNING")).toHaveAttribute("aria-pressed", "false");
    for (const title of ["Secret in config", "N+1 query", "SSRF in webhook"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("switches directly from one level to another", () => {
    renderWithIntl(<FindingsPanel findings={MIXED} prId="pr1" />);
    fireEvent.click(sevButton("2 CRITICAL"));
    fireEvent.click(sevButton("1 WARNING"));
    expect(sevButton("2 CRITICAL")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("N+1 query")).toBeInTheDocument();
    expect(screen.queryByText("Secret in config")).not.toBeInTheDocument();
  });

  it("counts follow the hide-low-confidence filter", () => {
    renderWithIntl(<FindingsPanel findings={MIXED} prId="pr1" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(sevButton("1 CRITICAL")).toBeInTheDocument();
    expect(screen.queryByText("SSRF in webhook")).not.toBeInTheDocument();
  });
});

describe("FindingsPanel helpers", () => {
  it("countBySeverity returns every level, even when empty", () => {
    expect(countBySeverity([])).toEqual({ CRITICAL: 0, WARNING: 0, SUGGESTION: 0 });
    expect(countBySeverity(MIXED)).toEqual({ CRITICAL: 2, WARNING: 1, SUGGESTION: 0 });
  });

  it("visibleFindings keeps only the requested severity", () => {
    expect(visibleFindings(MIXED, false, "WARNING").map((f) => f.id)).toEqual(["w1"]);
    expect(visibleFindings(MIXED, true, "CRITICAL").map((f) => f.id)).toEqual(["c1"]);
  });
});
