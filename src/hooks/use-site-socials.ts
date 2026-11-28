"use client";

import { useState, useEffect, useCallback } from "react";
import { SITE_CONFIG, SiteSocials } from "@/config/site";

export const SOCIALS_UPDATED_EVENT = "thezango:socials-updated";

export function useSiteSocials(): SiteSocials {
  const [socials, setSocials] = useState<SiteSocials>(SITE_CONFIG.socials);

  const loadSocials = useCallback(async () => {
    try {
      const res = await fetch("/api/site-socials", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data.socials) {
          setSocials(data.socials);
        }
      }
    } catch {
      // keep default SITE_CONFIG.socials fallback
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSocials();
    }, 0);

    const handleUpdated = (e: Event) => {
      const custom = e as CustomEvent<SiteSocials>;
      if (custom.detail) {
        setSocials(custom.detail);
      } else {
        void loadSocials();
      }
    };

    window.addEventListener(SOCIALS_UPDATED_EVENT, handleUpdated);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(SOCIALS_UPDATED_EVENT, handleUpdated);
    };
  }, [loadSocials]);

  return socials;
}

