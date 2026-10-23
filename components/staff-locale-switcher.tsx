"use client";

import { useEffect } from "react";
import { syncStaffLocale } from "@/app/mediator/actions/locale";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/components/locale-provider";

/** Locale switcher that syncs preferredLocale for mediator/admin users. */
export function StaffLocaleSwitcher() {
  const { locale } = useLocale();

  useEffect(() => {
    void syncStaffLocale(locale);
  }, [locale]);

  return <LocaleSwitcher />;
}
