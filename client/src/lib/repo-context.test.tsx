import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("./hooks", () => ({
  useRepos: () => ({
    data: [
      { id: "r1", full_name: "acme/one" },
      { id: "r2", full_name: "acme/two" },
    ],
    isSuccess: true,
  }),
}));

import { RepoProvider, useActiveRepo } from "./repo-context";

function Active() {
  const { repoId } = useActiveRepo();
  return <span data-testid="active">{repoId}</span>;
}

const renderProvider = () =>
  render(
    <RepoProvider>
      <Active />
    </RepoProvider>,
  );

beforeEach(() => {
  localStorage.clear();
  pathname = "/";
});
afterEach(cleanup);

describe("RepoProvider — last used repo", () => {
  it("uses the stored repo on the root page", () => {
    localStorage.setItem("dd-repo", "r2");
    renderProvider();
    expect(screen.getByTestId("active").textContent).toBe("r2");
  });

  it("falls back to the first repo when the stored one was deleted", () => {
    localStorage.setItem("dd-repo", "gone");
    renderProvider();
    expect(screen.getByTestId("active").textContent).toBe("r1");
  });

  it("remembers a known repo opened by URL", () => {
    pathname = "/repos/r2/pulls";
    renderProvider();
    expect(localStorage.getItem("dd-repo")).toBe("r2");
  });

  it("does not remember an unknown repo id from the URL", () => {
    localStorage.setItem("dd-repo", "r1");
    pathname = "/repos/nope/pulls";
    renderProvider();
    expect(localStorage.getItem("dd-repo")).toBe("r1");
  });
});
