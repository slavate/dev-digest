/* Root — sends the user to the last-used repo's PR list (else the first), or onboarding if no repos. */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useRepos } from "../lib/hooks";
import { useActiveRepo } from "../lib/repo-context";
import { AppShell } from "../components/app-shell";
import { PageContainer } from "../components/page-shell";
import { EmptyState, Button, Skeleton } from "@devdigest/ui";

export default function HomePage() {
  const router = useRouter();
  const { data: repos, isLoading, isError } = useRepos();
  const { activeRepo } = useActiveRepo();

  React.useEffect(() => {
    if (activeRepo) router.replace(`/repos/${activeRepo.id}/pulls`);
  }, [activeRepo, router]);

  return (
    <AppShell crumb={[{ label: "DevDigest" }]}>
      <PageContainer title="Welcome to DevDigest" subtitle="Local-first AI PR review">
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
            <Skeleton height={20} width={240} />
            <Skeleton height={48} />
            <Skeleton height={48} />
          </div>
        ) : isError || !repos || repos.length === 0 || !activeRepo ? (
          <EmptyState
            icon="GitBranch"
            title="No repositories yet"
            body="Add a repository to start reviewing pull requests. Set your API keys once in Settings → API Keys."
            cta="Add repository"
            onCta={() => router.push("/onboarding")}
          />
        ) : (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: 14 }}>Taking you to your repository…</p>
            <Button kind="primary" onClick={() => router.push(`/repos/${activeRepo.id}/pulls`)}>
              Open {activeRepo.full_name}
            </Button>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
