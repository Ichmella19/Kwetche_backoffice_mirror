"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, BellDot, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/presentation/components/ui/dropdown-menu";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { useRealtime } from "@/presentation/hooks";
import { dashboardService } from "@/presentation/services/dashboard";
import { ROUTES } from "@/lib/constants";
import {
  INBOX_KIND_LABELS,
  InboxItemKind,
  routeForInboxItem,
} from "@/lib/enums";
import type { InboxItem, InboxResponse } from "@/lib/types";

const POLL_MS = 30_000;
const PREVIEW_LIMIT = 8;

function relativeAge(iso: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const min = Math.floor((Date.now() - t) / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} j`;
}

function kindVariant(kind: string): "danger" | "warning" | "info" | "neutral" {
  switch (kind) {
    case InboxItemKind.KYC_IDENTITY:
    case InboxItemKind.RECOUVREMENT:
      return "danger";
    case InboxItemKind.WALLET_TX:
    case InboxItemKind.KYC_N2:
      return "warning";
    case InboxItemKind.SUPPORT:
      return "info";
    default:
      return "neutral";
  }
}

export function InboxBell() {
  const [data, setData] = useState<InboxResponse | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const fresh = await dashboardService.getInbox(20);
      setData(fresh);
    } catch {
      // ignore — gardé silencieux : si l'agent n'a pas la permission ou
      // si l'API est temporairement KO, on n'affiche juste rien.
    }
  }, []);

 useEffect(() => {
  const t0 = setTimeout(() => {
    void refresh();
  }, 0);

  const t = setInterval(() => {
    void refresh();
  }, POLL_MS);

  return () => {
    clearTimeout(t0);
    clearInterval(t);
  };
}, [refresh]);

  // Refresh immédiat sur événements realtime pertinents.
  useRealtime(
    [
      "support.ticket.created",
      "support.ticket.updated",
      "kyc.identity.submitted",
      "kyc.document.submitted",
      "recouvrement.case.assigned",
      "wallet.transaction.updated",
    ],
    () => {
      void refresh();
    },
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const preview = useMemo(() => items.slice(0, PREVIEW_LIMIT), [items]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Inbox staff (${total} à traiter)`}
          className="relative"
        >
          {total > 0 ? <BellDot /> : <Bell />}
          {total > 0 ? (
            <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold leading-none text-danger-foreground">
              {total > 99 ? "99+" : total}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-96 max-w-[calc(100vw-2rem)] p-0"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div>
            <p className="text-sm font-semibold">À traiter</p>
            <p className="text-xs text-muted">
              {total === 0
                ? "Tout est à jour."
                : `${total} élément${total > 1 ? "s" : ""}`}
            </p>
          </div>
          <Button asChild size="sm" variant="ghost" onClick={() => setOpen(false)}>
            <Link href={ROUTES.INBOX}>Voir tout</Link>
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {preview.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              Aucune tâche en attente.
            </p>
          ) : (
            <ul className="divide-y">
              {preview.map((item) => (
                <InboxRow
                  key={`${item.kind}-${item.user_id}-${item.ref_id ?? ""}`}
                  item={item}
                  onSelect={() => setOpen(false)}
                />
              ))}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InboxRow({
  item,
  onSelect,
}: {
  item: InboxItem;
  onSelect: () => void;
}) {
  return (
    <li>
      <Link
        href={routeForInboxItem(item)}
        onClick={onSelect}
        className="flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-muted-soft"
      >
        <Badge variant={kindVariant(item.kind)} className="shrink-0">
          {INBOX_KIND_LABELS[item.kind] ?? item.kind}
        </Badge>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.subject}</p>
          <p className="truncate text-xs text-muted">{item.user_label}</p>
        </div>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs text-muted">
          <Clock className="size-3" />
          {relativeAge(item.since)}
        </span>
      </Link>
    </li>
  );
}
