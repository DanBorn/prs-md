import type { Metadata } from "next";
import { DocsSidebar } from "./docs-sidebar";

export const metadata: Metadata = {
  title: "Docs — PRs.md",
  description: "User guides for PRs.md — the Turing Test for Pull Requests.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="md:flex md:gap-12">
        <DocsSidebar />
        <article className="min-w-0 flex-1">{children}</article>
      </div>
    </div>
  );
}
