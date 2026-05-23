"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { label: "Identité (N1)", href: ROUTES.KYC },
  { label: "Documents (N2/N3)", href: ROUTES.KYC_DOCUMENTS },
];

/** Sous-navigation entre la revue identité et la revue documents. */
export function KycTabs() {
  const pathname = usePathname();
  return (
    <div className="flex w-fit gap-1 rounded-lg border border-border bg-surface p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted hover:bg-muted-soft hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
