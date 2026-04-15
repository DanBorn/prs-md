"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/docs", label: "Getting Started", icon: "01" },
  { href: "/docs/web", label: "Web Dashboard", icon: "WEB", group: "Guides" },
  { href: "/docs/cli", label: "CLI", icon: ">_" },
  { href: "/docs/mcp", label: "MCP / IDE", icon: "MCP" },
];

export function DocsSidebar() {
  const pathname = usePathname();

  const items = NAV.reduce<Array<(typeof NAV)[number] & { showGroup: boolean }>>(
    (acc, item) => {
      const prevGroup = acc.at(-1)?.group;
      return [...acc, { ...item, showGroup: !!(item.group && item.group !== prevGroup) }];
    },
    []
  );

  return (
    <>
      {/* ── Mobile: horizontal scroll strip ── */}
      <nav
        className="docs-mobile-nav -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 md:hidden"
        aria-label="Docs navigation"
      >
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active}
              className="docs-mobile-tab flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-xs font-medium whitespace-nowrap transition-colors"
            >
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded font-mono text-[7px] font-black opacity-60">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Desktop: vertical sidebar ── */}
      <nav className="hidden w-44 shrink-0 md:block" aria-label="Docs navigation">
        <div className="sticky top-20 space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <div key={item.href}>
                {item.showGroup && (
                  <p
                    className="mt-5 mb-2 px-3 font-mono text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {item.group}
                  </p>
                )}
                <Link
                  href={item.href}
                  data-active={active}
                  className="sidebar-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-mono text-xs font-medium transition-colors"
                >
                  <span
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[8px] font-black opacity-60"
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
