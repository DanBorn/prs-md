import type { Metadata } from "next";
import { DocsSidebar } from "./docs-sidebar";

export const metadata: Metadata = {
  title: "Docs — PRs.md",
  description: "User guides for PRs.md — the Turing Test for Pull Requests.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl gap-12 px-4 py-12">
      <DocsSidebar />
      <article className="min-w-0 flex-1">{children}</article>
    </div>
  );
}
