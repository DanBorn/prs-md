"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "./logo";

// Replace with real Stripe payment link once generated
const DONATE_URL = "#donate";

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer when navigating
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  // Close mobile menu on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    if (mobileOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [mobileOpen]);

  const user = session?.user;
  const username =
    (user as { githubUsername?: string } | undefined)?.githubUsername ??
    user?.name ??
    null;

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{
        borderColor: "var(--color-border-subtle)",
        background: "oklch(13% 0.01 260 / 0.8)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="group" onClick={closeMobile}>
          <Logo />
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden items-center gap-1 md:flex">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="nav-link rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors"
              >
                dashboard
              </Link>
              <Link
                href="/about"
                className="nav-link rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors"
              >
                about
              </Link>
              <Link
                href="/docs"
                className="nav-link rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors"
              >
                docs
              </Link>
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="donate-link flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors"
              >
                <HeartIcon />
                donate
              </a>

              {/* User menu */}
              <div className="relative ml-1" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="user-pill flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors"
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  <UserAvatar user={user} username={username} size={28} />
                  {username && (
                    <span
                      className="font-mono text-xs font-medium"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {username}
                    </span>
                  )}
                  <ChevronIcon open={menuOpen} />
                </button>

                {menuOpen && (
                  <UserDropdown username={username} />
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/about"
                className="nav-link rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors"
              >
                about
              </Link>
              <Link
                href="/docs"
                className="nav-link rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors"
              >
                docs
              </Link>
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="donate-link flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors"
              >
                <HeartIcon />
                donate
              </a>
              <button
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                className="nav-link rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => signIn("github", { callbackUrl: "/accept-terms" })}
                className="btn-primary rounded-md px-4 py-1.5 font-mono text-xs font-bold transition-all"
              >
                Sign up
              </button>
            </>
          )}
        </nav>

        {/* ── Mobile hamburger ── */}
        <button
          className="mobile-hamburger relative flex h-9 w-9 items-center justify-center rounded-lg md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          <span className="hamburger-lines" data-open={mobileOpen}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      <div
        className="mobile-drawer md:hidden"
        data-open={mobileOpen}
        aria-hidden={!mobileOpen}
      >
        <div className="mobile-drawer-inner">
          <div className="mx-auto max-w-5xl px-4 pb-6 pt-2">
          {user ? (
            <>
              {/* User info row */}
              <div
                className="mb-4 flex items-center gap-3 rounded-xl px-3 py-3"
                style={{ background: "var(--color-surface)" }}
              >
                <UserAvatar user={user} username={username} size={36} />
                <div className="min-w-0 flex-1">
                  {username && (
                    <p
                      className="truncate font-mono text-sm font-semibold"
                      style={{ color: "var(--color-neon)" }}
                    >
                      @{username}
                    </p>
                  )}
                  <p
                    className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    signed in
                  </p>
                </div>
              </div>

              <nav className="space-y-1">
                <MobileNavLink href="/dashboard" onClick={closeMobile}>
                  dashboard
                </MobileNavLink>
                <MobileNavLink href="/about" onClick={closeMobile}>
                  about
                </MobileNavLink>
                <MobileNavLink href="/docs" onClick={closeMobile}>
                  docs
                </MobileNavLink>
                <MobileNavLink
                  href={DONATE_URL}
                  onClick={closeMobile}
                  external
                  className="donate-link"
                >
                  <HeartIcon /> donate
                </MobileNavLink>
              </nav>

              <div
                className="my-4 border-t"
                style={{ borderColor: "var(--color-border-subtle)" }}
              />

              <button
                onClick={() => { closeMobile(); signOut(); }}
                className="mobile-nav-item flex w-full items-center gap-2.5 rounded-lg px-4 py-3 font-mono text-sm font-medium transition-colors"
                style={{ color: "var(--color-danger)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </>
          ) : (
            <>
              <nav className="space-y-1">
                <MobileNavLink href="/about" onClick={closeMobile}>
                  about
                </MobileNavLink>
                <MobileNavLink href="/docs" onClick={closeMobile}>
                  docs
                </MobileNavLink>
                <MobileNavLink
                  href={DONATE_URL}
                  onClick={closeMobile}
                  external
                  className="donate-link"
                >
                  <HeartIcon /> donate
                </MobileNavLink>
              </nav>

              <div
                className="my-4 border-t"
                style={{ borderColor: "var(--color-border-subtle)" }}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => { closeMobile(); signIn("github", { callbackUrl: "/dashboard" }); }}
                  className="btn-secondary flex-1 rounded-lg px-4 py-2.5 font-mono text-sm font-medium transition-all"
                >
                  Sign in
                </button>
                <button
                  onClick={() => { closeMobile(); signIn("github", { callbackUrl: "/accept-terms" }); }}
                  className="btn-primary flex-1 rounded-lg px-4 py-2.5 font-mono text-sm font-bold transition-all"
                >
                  Sign up
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="mobile-backdrop fixed inset-0 z-[-1] md:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      )}
    </header>
  );
}

/* ── Extracted sub-components ── */

function HeartIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      className="ml-0.5 transition-transform"
      style={{
        color: "var(--color-text-dim)",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserAvatar({
  user,
  username,
  size,
}: {
  user: { image?: string | null };
  username: string | null;
  size: number;
}) {
  if (user.image) {
    return (
      <Image
        src={user.image}
        alt=""
        width={size}
        height={size}
        className="rounded-full ring-1 ring-white/10"
      />
    );
  }
  return (
    <span
      className="flex items-center justify-center rounded-full font-mono text-[10px] font-bold"
      style={{
        width: size,
        height: size,
        background: "var(--color-surface-raised)",
        color: "var(--color-neon)",
      }}
    >
      {(username ?? "?")[0].toUpperCase()}
    </span>
  );
}

function UserDropdown({ username }: { username: string | null }) {
  return (
    <div
      className="user-menu absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border py-1"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      {username && (
        <div
          className="border-b px-3 py-2"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "var(--color-text-dim)" }}
          >
            signed in as
          </p>
          <p
            className="mt-0.5 truncate font-mono text-xs font-semibold"
            style={{ color: "var(--color-neon)" }}
          >
            @{username}
          </p>
        </div>
      )}
      <button
        onClick={() => signOut()}
        className="menu-item flex w-full items-center gap-2 px-3 py-2 font-mono text-xs transition-colors"
        style={{ color: "var(--color-danger)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sign out
      </button>
    </div>
  );
}

function MobileNavLink({
  href,
  onClick,
  external,
  className,
  children,
}: {
  href: string;
  onClick: () => void;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const baseClass =
    "mobile-nav-item flex w-full items-center gap-2.5 rounded-lg px-4 py-3 font-mono text-sm font-medium transition-colors";
  const classes = className ? `${baseClass} ${className}` : baseClass;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={classes}>
      {children}
    </Link>
  );
}
