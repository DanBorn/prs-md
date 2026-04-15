"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { initMixpanel, identify } from "@/lib/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (token) {
      initMixpanel(token);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      identify(session.user.id);
    }
  }, [session?.user?.id]);

  return <>{children}</>;
}
