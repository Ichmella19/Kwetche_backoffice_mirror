"use client";

import {  useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlarmClock,
  BellRing,
  ChevronDown,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  PiggyBank,
  Receipt,
  Scale,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/presentation/contexts/auth-context";
import { dashboardService } from "@/presentation/services/dashboard";
import { Brand } from "./brand";
import { APP_VERSION, ROUTES } from "@/lib/constants";
import { Grant } from "@/lib/enums";
import { cn } from "@/lib/utils/cn";
import type { DashboardStats } from "@/lib/types";

/** Compteurs de badges alimentés par `/admin/dashboard/stats`. */
type Counters = {
  inbox: number;
  kycN1: number;
  kycN2: number;
  kycN3: number;
  walletTx: number;
  recouvrement: number;
  support: number;
  tontinePendingStart: number;
};

interface NavLeaf {
  kind: "leaf";
  label: string;
  href: string;
  icon: LucideIcon;
  grant?: Grant;
  /** Clé du compteur à afficher en badge (optionnel). */
  badgeKey?: keyof Counters;
}

interface NavGroup {
  kind: "group";
  label: string;
  icon: LucideIcon;
  /** Toutes les sous-routes ; le groupe ouvre si l'une est active. */
  children: NavLeaf[];
  /** Cumul des badges des enfants. */
  badgeKeys?: (keyof Counters)[];
}

interface NavSection {
  /** Libellé en CAPS au-dessus de la section. */
  label: string;
  items: (NavLeaf | NavGroup)[];
}

const SECTIONS: NavSection[] = [
  {
    label: "Pilotage",
    items: [
      {
        kind: "leaf",
        label: "Tableau de bord",
        href: ROUTES.DASHBOARD,
        icon: LayoutDashboard,
      },
      {
        kind: "leaf",
        label: "À traiter",
        href: ROUTES.INBOX,
        icon: Inbox,
        badgeKey: "inbox",
      },
      {
        kind: "leaf",
        label: "Analytics",
        href: ROUTES.ANALYTICS,
        icon: LineChart,
      },
    ],
  },
  {
    label: "Utilisateurs",
    items: [
      {
        kind: "leaf",
        label: "Tous les membres",
        href: ROUTES.USERS,
        icon: Users,
        grant: Grant.USER_READ,
      },
      {
        kind: "leaf",
        label: "KYC — Identité (N1)",
        href: ROUTES.KYC,
        icon: ShieldCheck,
        grant: Grant.KYC_REVIEW,
        badgeKey: "kycN1",
      },
      {
        kind: "leaf",
        label: "KYC — Niveau 2",
        href: ROUTES.KYC_N2,
        icon: ShieldCheck,
        grant: Grant.KYC_REVIEW,
        badgeKey: "kycN2",
      },
      {
        kind: "leaf",
        label: "KYC — Niveau 3",
        href: ROUTES.KYC_N3,
        icon: ShieldCheck,
        grant: Grant.KYC_REVIEW,
        badgeKey: "kycN3",
      },
    ],
  },
  {
    label: "Tontines",
    items: [
      {
        kind: "leaf",
        label: "Toutes les tontines",
        href: ROUTES.TONTINES,
        icon: PiggyBank,
        grant: Grant.TONTINE_READ,
      },
      {
        kind: "leaf",
        label: "À démarrer",
        href: ROUTES.TONTINE_PENDING_START,
        icon: AlarmClock,
        grant: Grant.TONTINE_READ,
        badgeKey: "tontinePendingStart",
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        kind: "group",
        label: "Portefeuilles",
        icon: Wallet,
        badgeKeys: ["walletTx"],
        children: [
          {
            kind: "leaf",
            label: "Soldes & comptes",
            href: ROUTES.WALLETS,
            icon: Wallet,
            grant: Grant.WALLET_READ,
          },
          {
            kind: "leaf",
            label: "Transactions",
            href: ROUTES.WALLET_TRANSACTIONS,
            icon: Receipt,
            grant: Grant.WALLET_READ,
            badgeKey: "walletTx",
          },
          {
            kind: "leaf",
            label: "Comptes plateforme",
            href: ROUTES.WALLET_PLATFORM,
            icon: Wallet,
            grant: Grant.WALLET_READ,
          },
        ],
      },
      {
        kind: "leaf",
        label: "Recouvrement",
        href: ROUTES.RECOUVREMENT,
        icon: Scale,
        grant: Grant.RECOUVREMENT_READ,
        badgeKey: "recouvrement",
      },
    ],
  },
  {
    label: "Relation client",
    items: [
      {
        kind: "leaf",
        label: "Support / Tickets",
        href: ROUTES.SUPPORT,
        icon: LifeBuoy,
        grant: Grant.SUPPORT_READ,
        badgeKey: "support",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        kind: "leaf",
        label: "Équipe staff",
        href: ROUTES.STAFF,
        icon: Shield,
        grant: Grant.USER_READ,
      },
      {
        kind: "leaf",
        label: "Notifications",
        href: ROUTES.NOTIFICATIONS,
        icon: BellRing,
        grant: Grant.NOTIFICATION_SEND,
      },
      {
        kind: "leaf",
        label: "Paramètres",
        href: ROUTES.SETTINGS,
        icon: SettingsIcon,
        grant: Grant.SETTINGS_WRITE,
      },
    ],
  },
];

const REFRESH_MS = 45_000;

function countersFromStats(stats?: DashboardStats | null): Counters {
  if (!stats) {
    return {
      inbox: 0,
      kycN1: 0,
      kycN2: 0,
      kycN3: 0,
      walletTx: 0,
      recouvrement: 0,
      support: 0,
      tontinePendingStart: 0,
    };
  }
  const kycN1 = stats.kyc.pending_identity;
  const kycN2 = stats.kyc.pending_documents_n2;
  const kycN3 = stats.kyc.pending_documents_n3;
  const walletTx = stats.wallet.pending_tx;
  const recouvrement = stats.recouvrement.open_debts;
  const support = stats.support?.open_tickets ?? 0;
  const tontinePendingStart = stats.tontines?.pending_start ?? 0;
  return {
    inbox: kycN1 + kycN2 + kycN3 + walletTx + recouvrement + support,
    kycN1,
    kycN2,
    kycN3,
    walletTx,
    recouvrement,
    support,
    tontinePendingStart,
  };
}

function Badge({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
      {value > 99 ? "99+" : value}
    </span>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { hasGrant } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
 

  useEffect(() => {
  const load = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch {
      // ignore
    }
  };

  void load();

  const id = setInterval(() => {
    void load();
  }, REFRESH_MS);

  return () => clearInterval(id);
}, []);
  const counters = useMemo(() => countersFromStats(stats), [stats]);

  // Filtre récursif par grant.
  const visibleSections = useMemo<NavSection[]>(() => {
    return SECTIONS
      .map<NavSection>((section) => ({
        ...section,
        items: section.items
          .map((item) => {
            if (item.kind === "leaf") {
              return !item.grant || hasGrant(item.grant) ? item : null;
            }
            const kids = item.children.filter(
              (c) => !c.grant || hasGrant(c.grant),
            );
            return kids.length ? { ...item, children: kids } : null;
          })
          .filter((x): x is NavLeaf | NavGroup => x !== null),
      }))
      .filter((section) => section.items.length > 0);
  }, [hasGrant]);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href={ROUTES.DASHBOARD} onClick={onNavigate}>
          <Brand />
        </Link>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {visibleSections.map((section) => (
          <SidebarSection
            key={section.label}
            section={section}
            pathname={pathname ?? ""}
            counters={counters}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-border px-5 py-3 text-xs text-muted">
        v{APP_VERSION}
      </div>
    </div>
  );
}

function SidebarSection({
  section,
  pathname,
  counters,
  onNavigate,
}: {
  section: NavSection;
  pathname: string;
  counters: Counters;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {section.label}
      </div>
      <div className="space-y-0.5">
        {section.items.map((item) =>
          item.kind === "leaf" ? (
            <SidebarLeaf
              key={item.href}
              item={item}
              pathname={pathname}
              counters={counters}
              onNavigate={onNavigate}
            />
          ) : (
            <SidebarGroup
              key={item.label}
              group={item}
              pathname={pathname}
              counters={counters}
              onNavigate={onNavigate}
            />
          ),
        )}
      </div>
    </div>
  );
}

function SidebarLeaf({
  item,
  pathname,
  counters,
  onNavigate,
  inset = false,
}: {
  item: NavLeaf;
  pathname: string;
  counters: Counters;
  onNavigate?: () => void;
  inset?: boolean;
}) {
  const active =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(`${item.href}/`));
  const Icon = item.icon;
  const badge = item.badgeKey ? counters[item.badgeKey] : 0;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        inset && "ml-5",
        active
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-muted/50",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
      <Badge value={badge} />
    </Link>
  );
}

function SidebarGroup({
  group,
  pathname,
  counters,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  counters: Counters;
  onNavigate?: () => void;
}) {
  const anyActive = group.children.some(
    (c) =>
      pathname === c.href ||
      (c.href !== "/" && pathname.startsWith(`${c.href}/`)),
  );
const [manualOpen, setManualOpen] = useState(false);

const open = anyActive || manualOpen;  // Re-sync quand on navigue dans/hors du groupe.
  

  const Icon = group.icon;
  const aggregate = (group.badgeKeys ?? []).reduce(
    (sum, k) => sum + counters[k],
    0,
  );

  return (
    <div>
      <button
        type="button"
      onClick={() => setManualOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          anyActive ? "text-primary" : "text-foreground hover:bg-muted/50",
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{group.label}</span>
        {!open && aggregate > 0 ? <Badge value={aggregate} /> : null}
        <ChevronDown
          className={cn(
            "ml-auto size-4 shrink-0 transition-transform",
            open && "rotate-180",
            !open && aggregate > 0 && "ml-2",
          )}
        />
      </button>
      {open ? (
        <div className="mt-0.5 space-y-0.5">
          {group.children.map((leaf) => (
            <SidebarLeaf
              key={leaf.href}
              item={leaf}
              pathname={pathname}
              counters={counters}
              onNavigate={onNavigate}
              inset
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
