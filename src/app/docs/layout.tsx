import type { Metadata } from "next";
import { DocsSidebar } from "./docs-sidebar";

export const metadata: Metadata = {
  title: "Docs — PRs.md",
  description: "User guides for PRs.md — the Turing Test for Pull Requests.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex flex-col md:flex-row max-w-5xl gap-6 md:gap-12 px-4 py-8 md:py-12">
      <DocsSidebar />
      <article className="min-w-0 flex-1">{children}</article>
    </div>
  );
}
