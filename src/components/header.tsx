"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "./logo";

// Replace with real Stripe payment link once generated
const DONATE_URL = "#donate";

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        <Link href="/" className="group">
          <Logo />
        </Link>

        <nav className="flex items-center gap-1 md:gap-2">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-1">
                <Link href="/dashboard" className="nav-link rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors">dashboard</Link>
                <Link href="/about" className="nav-link rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors">about</Link>
                <Link href="/docs" className="nav-link rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors">docs</Link>
                <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="donate-link flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  donate
                </a>
              </div>

              {/* User menu */}
              <div className="relative ml-1" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="user-pill flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors"
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt=""
                      width={28}
                      height={28}
                      className="rounded-full ring-1 ring-white/10"
                    />
                  ) : (
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-[10px] font-bold"
                      style={{
                        background: "var(--color-surface-raised)",
                        color: "var(--color-neon)",
                      }}
                    >
                      {(username ?? "?")[0].toUpperCase()}
                    </span>
                  )}
                  {username && (
                    <span
                      className="hidden md:inline font-mono text-xs font-medium"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {username}
                    </span>
                  )}
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    className="ml-0.5 transition-transform"
                    style={{
                      color: "var(--color-text-dim)",
                      transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
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
                </button>

                {menuOpen && (
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
                )}
              </div>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-1">
                <Link href="/about" className="nav-link rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors">about</Link>
                <Link href="/docs" className="nav-link rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors">docs</Link>
                <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="donate-link flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  donate
                </a>
                <button onClick={() => signIn("github", { callbackUrl: "/dashboard" })} className="nav-link rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors">Sign in</button>
                <button onClick={() => signIn("github", { callbackUrl: "/accept-terms" })} className="btn-primary rounded-md px-4 py-1.5 font-mono text-xs font-bold transition-all">Sign up</button>
              </div>
            </>
          )}

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-md transition-colors hover:bg-white/5 ml-1" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileNavOpen && (
        <div className="md:hidden border-t p-4 flex flex-col gap-2" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-surface)" }}>
          {user ? (
            <>
              <Link href="/dashboard" className="nav-link rounded-md px-3 py-2 font-mono text-sm font-medium transition-colors" onClick={() => setMobileNavOpen(false)}>dashboard</Link>
              <Link href="/about" className="nav-link rounded-md px-3 py-2 font-mono text-sm font-medium transition-colors" onClick={() => setMobileNavOpen(false)}>about</Link>
              <Link href="/docs" className="nav-link rounded-md px-3 py-2 font-mono text-sm font-medium transition-colors" onClick={() => setMobileNavOpen(false)}>docs</Link>
              <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="donate-link flex items-center gap-1.5 rounded-md px-3 py-2 font-mono text-sm font-medium transition-colors" onClick={() => setMobileNavOpen(false)}>
                donate
              </a>
            </>
          ) : (
            <>
              <Link href="/about" className="nav-link rounded-md px-3 py-2 font-mono text-sm font-medium transition-colors" onClick={() => setMobileNavOpen(false)}>about</Link>
              <Link href="/docs" className="nav-link rounded-md px-3 py-2 font-mono text-sm font-medium transition-colors" onClick={() => setMobileNavOpen(false)}>docs</Link>
              <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="donate-link flex items-center gap-1.5 rounded-md px-3 py-2 font-mono text-sm font-medium transition-colors" onClick={() => setMobileNavOpen(false)}>
                donate
              </a>
              <button onClick={() => { signIn("github", { callbackUrl: "/dashboard" }); setMobileNavOpen(false); }} className="nav-link text-left rounded-md px-3 py-2 font-mono text-sm font-medium transition-colors">Sign in</button>
              <button onClick={() => { signIn("github", { callbackUrl: "/accept-terms" }); setMobileNavOpen(false); }} className="btn-primary text-left rounded-md px-3 py-2 font-mono text-sm font-bold transition-all mt-2 w-fit">Sign up</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
