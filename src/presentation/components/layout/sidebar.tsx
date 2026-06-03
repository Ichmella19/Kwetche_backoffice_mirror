"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  PiggyBank,
  Scale,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/presentation/contexts/auth-context";
import { Brand } from "./brand";
import { APP_VERSION, ROUTES } from "@/lib/constants";
import { Grant } from "@/lib/enums";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Grant requis (super_admin contourne). Absent = visible par tous les admins. */
  grant?: Grant;
}

const NAV: NavItem[] = [
  { label: "Tableau de bord", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Analytics", href: ROUTES.ANALYTICS, icon: LineChart },
  {
    label: "Utilisateurs",
    href: ROUTES.USERS,
    icon: Users,
    grant: Grant.USER_READ,
  },
  {
    label: "Équipe staff",
    href: ROUTES.STAFF,
    icon: Shield,
    grant: Grant.USER_READ,
  },
  {
    label: "Vérification KYC",
    href: ROUTES.KYC,
    icon: ShieldCheck,
    grant: Grant.KYC_REVIEW,
  },
  {
    label: "Portefeuilles",
    href: ROUTES.WALLETS,
    icon: Wallet,
    grant: Grant.WALLET_READ,
  },
  {
    label: "Tontines",
    href: ROUTES.TONTINES,
    icon: PiggyBank,
    grant: Grant.TONTINE_READ,
  },
  {
    label: "Recouvrement",
    href: ROUTES.RECOUVREMENT,
    icon: Scale,
    grant: Grant.RECOUVREMENT_READ,
  },
  {
    label: "Support",
    href: ROUTES.SUPPORT,
    icon: LifeBuoy,
    grant: Grant.SUPPORT_READ,
  },
  {
    label: "Paramètres",
    href: ROUTES.SETTINGS,
    icon: SlidersHorizontal,
    grant: Grant.SETTINGS_WRITE,
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { hasGrant } = useAuth();

  const items = NAV.filter((item) => !item.grant || hasGrant(item.grant));

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href={ROUTES.DASHBOARD} onClick={onNavigate}>
          <Brand />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-muted hover:bg-muted-soft hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-xs text-muted">Kwetche · version {APP_VERSION}</p>
      </div>
    </div>
  );
}
