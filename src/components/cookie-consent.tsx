"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const CONSENT_KEY = "prs-cookie-consent";

type ConsentValue = "all" | "essential" | null;

function getStoredConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CONSENT_KEY);
  if (v === "all" || v === "essential") return v;
  return null;
}

function setStoredConsent(value: "all" | "essential") {
  localStorage.setItem(CONSENT_KEY, value);
  // Also set a cookie so server-side can read it (e.g. for future SSR gating)
  document.cookie = `${CONSENT_KEY}=${value};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

/**
 * Enable or disable Google Analytics based on consent.
 * When declining, we set the GA opt-out window property and
 * remove any existing GA cookies.
 */
function applyAnalyticsConsent(consent: "all" | "essential") {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  const win = window as unknown as Record<string, unknown>;

  if (consent === "all") {
    if (typeof window !== "undefined" && "gtag" in window) {
      (win.gtag as (...args: unknown[]) => void)(
        "consent", "update", { analytics_storage: "granted" }
      );
    }
  } else {
    // Opt out: set the disable property and purge cookies
    if (gaId) {
      win[`ga-disable-${gaId}`] = true;
    }
    for (const name of ["_ga", "_gid", "_gat"]) {
      document.cookie = `${name}=;path=/;max-age=0`;
      document.cookie = `${name}=;path=/;domain=.${window.location.hostname};max-age=0`;
    }
    if (typeof window !== "undefined" && "gtag" in window) {
      (win.gtag as (...args: unknown[]) => void)(
        "consent", "update", { analytics_storage: "denied" }
      );
    }
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  // Lazy initializer reads localStorage once on mount — avoids setState-in-effect
  const [consent, setConsent] = useState<ConsentValue>(getStoredConsent);

  useEffect(() => {
    if (consent) {
      // Already have a stored preference — apply it silently
      applyAnalyticsConsent(consent);
    } else {
      // No consent yet — show the banner after a short delay for UX
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [consent]);

  const accept = useCallback((value: "all" | "essential") => {
    setStoredConsent(value);
    setConsent(value);
    applyAnalyticsConsent(value);
    setVisible(false);
  }, []);

  // Already consented or not yet showing
  if (!visible || consent) return null;

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="cookie-banner-inner">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            We use cookies for authentication and optionally for analytics.{" "}
            <Link href="/cookies" className="link-neon">
              Learn more
            </Link>
          </p>
        </div>

        <div className="cookie-banner-actions">
          <button
            onClick={() => accept("essential")}
            className="btn-outline rounded-lg px-3 py-2 font-mono text-xs transition-all"
          >
            Essential only
          </button>
          <button
            onClick={() => accept("all")}
            className="btn-primary rounded-lg px-3 py-2 font-mono text-xs font-bold transition-all"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
