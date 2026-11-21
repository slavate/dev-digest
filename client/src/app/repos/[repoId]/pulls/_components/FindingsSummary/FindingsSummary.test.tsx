import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { FindingPreview } from "@devdigest/shared";
import messages from "../../../../../../../messages/en/prReview.json";
import { FindingsSummary } from "./FindingsSummary";
import { countBySeverity, sortForPreview } from "./helpers";
import { CLOSE_DELAY_MS } from "./constants";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const preview = (severity: FindingPreview["severity"], confidence: number, title: string): FindingPreview => ({
  severity,
  confidence,
  title,
  category: "bug",
  file: "src/a.ts",
  start_line: 12,
  end_line: 14,
  rationale: `${title} rationale`,
});

const FIVE = [
  preview("WARNING", 0.86, "w86"),
  preview("CRITICAL", 0.79, "c79"),
  preview("SUGGESTION", 0.99, "s99"),
  preview("CRITICAL", 0.98, "c98"),
  preview("WARNING", 0.5, "w50"),
];

function renderSummary(counts = countBySeverity(FIVE), findings = FIVE, title = "5 findings in this run") {
  return render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      <FindingsSummary counts={counts} findings={findings} title={title} />
    </NextIntlClientProvider>,
  );
}

const trigger = (label = "Findings: 2 critical, 2 warning, 1 suggestion") => screen.getByLabelText(label);

describe("FindingsSummary", () => {
  it("shows only non-zero levels, with an accessible label for all three", () => {
    renderSummary({ CRITICAL: 0, WARNING: 0, SUGGESTION: 1 }, [preview("SUGGESTION", 0.9, "s")]);
    const el = trigger("Findings: 0 critical, 0 warning, 1 suggestion");
    expect(el).toHaveTextContent(/^1$/);
  });

  it("renders nothing when every count is zero", () => {
    const { container } = renderSummary({ CRITICAL: 0, WARNING: 0, SUGGESTION: 0 }, []);
    expect(container).toBeEmptyDOMElement();
  });

  it("hover lists every finding (no cap) sorted by severity, then confidence", () => {
    renderSummary();
    fireEvent.mouseEnter(trigger());
    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent("5 findings in this run");
    const titles = ["c98", "c79", "w86", "w50", "s99"].map((t) => tip.textContent!.indexOf(t));
    expect(titles.every((i) => i >= 0)).toBe(true);
    expect([...titles].sort((a, b) => a - b)).toEqual(titles);
    expect(tip).toHaveTextContent("src/a.ts:12-14");
  });

  it("stays open while the pointer moves into the popover, closes after leaving it", () => {
    vi.useFakeTimers();
    renderSummary();
    fireEvent.mouseEnter(trigger());
    fireEvent.mouseLeave(trigger());
    fireEvent.mouseEnter(screen.getByRole("tooltip"));
    act(() => vi.advanceTimersByTime(CLOSE_DELAY_MS * 2));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByRole("tooltip"));
    act(() => vi.advanceTimersByTime(CLOSE_DELAY_MS * 2));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("opens on focus and closes on Escape", () => {
    renderSummary();
    fireEvent.focus(trigger());
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("sortForPreview orders severity first, then confidence", () => {
    expect(sortForPreview(FIVE).map((f) => f.title)).toEqual(["c98", "c79", "w86", "w50", "s99"]);
  });
});
