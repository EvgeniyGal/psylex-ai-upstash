"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useHelp } from "@/components/help/help-provider";
import { useLocale } from "@/components/locale-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/mediator/rooms", key: "navRooms" as const, icon: "gavel" },
  { href: "/mediator/calendar", key: "navCalendar" as const, icon: "calendar_month" },
];

export function MediatorSidebar() {
  const pathname = usePathname();
  const { admin, portal } = useLocale();
  const { openHelp } = useHelp();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-hair bg-surface-container py-stack-md">
      <div className="mb-10 px-6">
        <div className="flex items-center gap-3">
          <Image alt="PsyLex" className="h-7 w-auto" height={28} src="/logo.webp" unoptimized width={28} />
          <span className="wordmark font-display text-[17px] text-ink">PsyLex</span>
        </div>
        <p className="mt-1 text-label-md uppercase text-ink-soft">
          {admin.mediatorConsole}
        </p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-all",
                active
                  ? "border-l-4 border-law bg-law-fill text-on-tertiary"
                  : "text-ink-soft hover:bg-paper hover:text-ink",
              )}
              href={item.href}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-body-md">{admin[item.key]}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 px-4">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full border border-hair px-4 py-3 text-ink-soft transition-colors hover:bg-paper hover:text-ink"
          onClick={openHelp}
          type="button"
        >
          <span className="material-symbols-outlined">help_outline</span>
          <span className="text-body-md">{portal.helpTitle}</span>
        </button>
        <div className="flex justify-center rounded-full border border-hair py-3">
          <LocaleSwitcher />
        </div>
        <button
          className="btn-secondary flex w-full items-center justify-center gap-2 px-4 py-3"
          onClick={() => signOut({ callbackUrl: "/login" })}
          type="button"
        >
          <span className="material-symbols-outlined">logout</span>
          {admin.logout}
        </button>
      </div>
    </aside>
  );
}
