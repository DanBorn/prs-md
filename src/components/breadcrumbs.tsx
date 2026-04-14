interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex items-center gap-1.5 font-mono text-xs"
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <span style={{ color: "var(--color-text-dim)" }}>/</span>
          )}
          {item.href ? (
            <a
              href={item.href}
              className="breadcrumb-link transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span
              className="truncate max-w-[200px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
