"use client";

import { use, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Coins,
  Crown,
  Download,
  Hash,
  Megaphone,
  Paperclip,
  PiggyBank,
  Receipt,
  ShieldAlert,
  Sparkles,
  Trophy,
  UserMinus,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { ErrorState } from "@/presentation/components/shared/error";
import { ConfirmDialog } from "@/presentation/components/shared/confirm-dialog";
import { NotifyMembersDialog } from "@/presentation/components/tontine/notify-members-dialog";
import { TontineAccountsPanel } from "@/presentation/components/tontine/tontine-accounts-panel";
import {
  Avatar,
  AvatarFallback,
} from "@/presentation/components/ui/avatar";
import { Badge, type BadgeProps } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Field } from "@/presentation/components/ui/field";
import { Input } from "@/presentation/components/ui/input";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";
import { useAsync, useRealtime, useToast } from "@/presentation/hooks";
import { tontineService } from "@/presentation/services/tontine";
import { userService } from "@/presentation/services/user";
import { ROUTES } from "@/lib/constants";
import {
  CAUTION_STATUS_LABELS,
  TONTINE_DRAW_MODE_LABELS,
  TONTINE_FREQUENCY_LABELS,
  TONTINE_MEMBER_STATUS_LABELS,
  TONTINE_PAYOUT_STATUS_LABELS,
  TONTINE_STATUS_LABELS,
  TONTINE_TYPE_LABELS,
  TontineMemberStatus,
  TontinePayoutStatus,
  TontineStatus,
} from "@/lib/enums";
import {
  formatCurrency,
  formatDate,
  fullName,
  getInitials,
} from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type {
  TontineDetail,
  TontineWithdrawalRequest,
  User,
} from "@/lib/types";

// ── Couleurs ─────────────────────────────────────────────────────────────
const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  [TontineStatus.DRAFT]: "neutral",
  [TontineStatus.OPEN]: "info",
  [TontineStatus.PENDING_START]: "warning",
  [TontineStatus.ACTIVE]: "success",
  [TontineStatus.COMPLETED]: "secondary",
  [TontineStatus.CANCELLED]: "danger",
};

const MEMBER_STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  [TontineMemberStatus.ACTIVE]: "success",
  [TontineMemberStatus.DEFAULTED]: "danger",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TontineDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const fetchDetail = useCallback(() => tontineService.detail(id), [id]);
  const { data, isLoading, error, execute } =
    useAsync<TontineDetail>(fetchDetail);

  // Refresh live : un autre agent agit, le scheduler avance un cycle, un
  // user s'inscrit/se désiste → on recharge le détail.
  useRealtime(["tontine.updated"], (event) => {
    const payload = event.data as { tontine_id?: string } | null;
    if (!payload || payload.tontine_id === id) void execute();
  });

  // ── Résolution des noms d'utilisateurs (créateur + membres) ───────────
  // On fait Promise.allSettled pour qu'un utilisateur introuvable ne casse
  // pas l'affichage des autres.
  const userIdsKey = useMemo(() => {
    if (!data) return "";
    const ids = new Set<string>();
    if (data.tontine.created_by) ids.add(data.tontine.created_by);
    for (const m of data.members) ids.add(m.user_id);
    for (const p of data.payouts ?? []) ids.add(p.beneficiary_user_id);
    return Array.from(ids).sort().join(",");
  }, [data]);

  const fetchUsers = useCallback(async () => {
    if (!userIdsKey) return new Map<string, User>();
    const ids = userIdsKey.split(",");
    const results = await Promise.allSettled(
      ids.map((uid) => userService.getUser(uid)),
    );
    const map = new Map<string, User>();
    for (const r of results) if (r.status === "fulfilled") map.set(r.value.id, r.value);
    return map;
  }, [userIdsKey]);

  const { data: usersById } = useAsync<Map<string, User>>(fetchUsers);

  const fetchWithdrawals = useCallback(
    () => tontineService.listWithdrawals(id),
    [id],
  );
  const { data: withdrawals, execute: reloadWithdrawals } =
    useAsync<TontineWithdrawalRequest[]>(fetchWithdrawals);

  // Recharge la table des désistements quand un user se désiste.
  useRealtime(["tontine.updated"], (event) => {
    const payload = event.data as {
      tontine_id?: string;
      member_withdrawn?: string;
    } | null;
    if (payload?.tontine_id === id && payload.member_withdrawn) {
      void reloadWithdrawals();
    }
  });

  const nameFor = (userId: string | null | undefined): string => {
    if (!userId) return "—";
    const u = usersById?.get(userId);
    return u
      ? fullName(u.first_name, u.last_name)
      : `${userId.slice(0, 8)}…`;
  };

  // ── États UI (actions / dialogs) ──────────────────────────────────────
  const [busy, setBusy] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [postponeDate, setPostponeDate] = useState("");
  const [cancelStep, setCancelStep] = useState<0 | 1 | 2>(0);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    label: string;
    description: string;
    fn: () => Promise<void>;
  } | null>(null);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await tontineService.exportMembers(id);
    } catch (err) {
      toast.error("Export impossible", getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  };

  // ── États conditionnels ────────────────────────────────────────────────
  if (error) {
    return <ErrorState message={getErrorMessage(error)} onRetry={execute} />;
  }
  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const t = data.tontine;
  const memberCount = t.member_count ?? data.members.length;
  const fillPercent = t.max_members
    ? Math.min(100, Math.round((memberCount / t.max_members) * 100))
    : 0;

  const isDraft = t.status === TontineStatus.DRAFT;
  const isOpenOrPending =
    t.status === TontineStatus.OPEN || t.status === TontineStatus.PENDING_START;
  const canCancel =
    t.status === TontineStatus.OPEN ||
    t.status === TontineStatus.PENDING_START ||
    t.status === TontineStatus.ACTIVE;

  // ── Helper : nom du bénéficiaire d'un cycle ──────────────────────────
  const beneficiaryName = (memberId: string | null): string => {
    if (!memberId) return "—";
    const member = data.members.find((m) => m.id === memberId);
    return member ? nameFor(member.user_id) : `${memberId.slice(0, 8)}…`;
  };

  return (
    <div className="space-y-6">
      {/* ── Fil d'Ariane + actions ──────────────────────────────────────── */}
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted">
        <Link href={ROUTES.TONTINES}>
          <ArrowLeft />
          Retour à la liste
        </Link>
      </Button>

      <PageHeader
        title={t.name}
        description={t.description ?? undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            {isDraft && (
              <>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    router.push(`${ROUTES.TONTINES}/${id}/edit`)
                  }
                >
                  Modifier
                </Button>
                <Button
                  disabled={busy}
                  onClick={() =>
                    setConfirmAction({
                      label: "Publier",
                      description:
                        "Ouvre les inscriptions. Visible des utilisateurs.",
                      fn: () =>
                        run(
                          () => tontineService.publish(id),
                          "Tontine publiée.",
                        ),
                    })
                  }
                >
                  Publier
                </Button>
              </>
            )}
            {isOpenOrPending && (
              <>
                <Button
                  disabled={busy}
                  onClick={() =>
                    setConfirmAction({
                      label: "Démarrer",
                      description:
                        "Lance la tontine avec les membres inscrits.",
                      fn: () =>
                        run(
                          () => tontineService.start(id),
                          "Tontine démarrée.",
                        ),
                    })
                  }
                >
                  Démarrer
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setPostponeOpen(true)}
                >
                  Reporter
                </Button>
              </>
            )}
            {!isDraft && (
              <>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setNotifyOpen(true)}
                >
                  <Megaphone className="size-4" />
                  Notifier
                </Button>
                <Button
                  variant="outline"
                  disabled={exporting}
                  isLoading={exporting}
                  onClick={exportCsv}
                >
                  <Download className="size-4" />
                  Exporter CSV
                </Button>
              </>
            )}
            {canCancel && (
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => setCancelStep(1)}
              >
                Annuler
              </Button>
            )}
          </div>
        }
      />

      {/* ── Bandeau de tags (statut, type, fréquence, KYC, créateur) ─── */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={STATUS_VARIANT[t.status] ?? "neutral"}>
          {TONTINE_STATUS_LABELS[t.status] ?? t.status}
        </Badge>
        <Badge variant="outline">
          {TONTINE_TYPE_LABELS[t.type] ?? t.type}
        </Badge>
        <Badge variant="outline">
          {TONTINE_FREQUENCY_LABELS[t.frequency] ?? t.frequency}
        </Badge>
        <Badge variant="outline">KYC niveau {t.required_kyc_level}</Badge>
        {t.created_by && (
          <Link
            href={`${ROUTES.USERS}/${t.created_by}`}
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            title="Voir le créateur"
          >
            <Crown className="size-4 text-primary" />
            Créée par&nbsp;
            <span className="font-medium text-foreground">
              {nameFor(t.created_by)}
            </span>
          </Link>
        )}
      </div>

      {/* ── Stats principales ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BigStat
          label="Cotisation"
          value={formatCurrency(t.contribution_amount, t.currency)}
          hint={`par ${TONTINE_FREQUENCY_LABELS[t.frequency] ?? "cycle"}`}
          icon={Coins}
          tone="primary"
        />
        <BigStat
          label="Caution"
          value={formatCurrency(t.caution_amount, t.currency)}
          hint={`Pénalité ${t.cancellation_penalty_rate}%`}
          icon={ShieldAlert}
          tone="warning"
        />
        <MembersStat
          count={memberCount}
          max={t.max_members}
          percent={fillPercent}
        />
        <BigStat
          label="Cycle en cours"
          value={
            t.current_cycle_index
              ? `${t.current_cycle_index}/${t.total_rounds ?? "—"}`
              : "—"
          }
          hint={
            t.start_date
              ? `Démarrage : ${formatDate(t.start_date)}`
              : "Pas encore démarrée"
          }
          icon={CalendarDays}
          tone="secondary"
        />
      </div>

      {/* ── Configuration + Trésorerie ─────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <KV label="Type" value={TONTINE_TYPE_LABELS[t.type] ?? t.type} />
            <KV
              label="Mode de tirage"
              value={TONTINE_DRAW_MODE_LABELS[t.draw_mode] ?? t.draw_mode}
            />
            <KV
              label="Fenêtre d'annulation"
              value={`${t.cancellation_window_days} j`}
            />
            <KV
              label="Bonus loyauté"
              value={
                t.loyalty_bonus_enabled
                  ? `${t.loyalty_bonus_rate}%`
                  : "Désactivé"
              }
            />
            <KV
              label="1er tour plateforme"
              value={t.platform_takes_first_round ? "Oui" : "Non"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4 text-accent" />
              Trésorerie
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <KV
              label="Fond de réserve"
              value={formatCurrency(t.reserve_fund, t.currency)}
            />
            <KV
              label="Fond caution"
              value={formatCurrency(t.caution_fund, t.currency)}
            />
            <KV
              label="Total cycles"
              value={t.total_rounds ? String(t.total_rounds) : "—"}
            />
            <KV label="Devise" value={t.currency} />
          </CardContent>
        </Card>
      </div>

      {/* ── Comptes internes (pot / réserve / cautions) + relevé ─────── */}
      <TontineAccountsPanel
        tontineId={id}
        accounts={data.accounts}
        currency={t.currency}
      />

      {/* ── Membres ─────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="size-5 text-secondary" />
            Membres
            <Badge variant="neutral">{data.members.length}</Badge>
          </h2>
        </div>

        <Card>
          <CardContent className="p-0">
            {data.members.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">
                Aucun membre inscrit pour le moment.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Caution</TableHead>
                    <TableHead className="text-center">Tour</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.members.map((m) => {
                    const u = usersById?.get(m.user_id);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <Link
                            href={`${ROUTES.USERS}/${m.user_id}`}
                            className="flex items-center gap-3 transition-colors hover:text-primary"
                          >
                            <Avatar className="size-9">
                              <AvatarFallback className="text-xs">
                                {u
                                  ? getInitials(u.first_name, u.last_name)
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {nameFor(m.user_id)}
                              </p>
                              {u?.phone && (
                                <p className="truncate text-xs text-muted">
                                  {u.country_code} {u.phone}
                                </p>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              MEMBER_STATUS_VARIANT[m.status] ?? "neutral"
                            }
                          >
                            {TONTINE_MEMBER_STATUS_LABELS[m.status] ??
                              m.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {formatCurrency(m.caution_amount, t.currency)}
                            </span>
                            <span className="text-xs text-muted">
                              {CAUTION_STATUS_LABELS[m.caution_status] ??
                                m.caution_status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {m.payout_order ? (
                            <span className="inline-flex size-7 items-center justify-center rounded-full bg-secondary-soft text-xs font-semibold text-secondary-soft-foreground">
                              {m.payout_order}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Cycles ──────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Hash className="size-5 text-primary" />
            Cycles
            <Badge variant="neutral">{data.cycles.length}</Badge>
          </h2>
        </div>

        <Card>
          <CardContent className="p-0">
            {data.cycles.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">
                Pas encore de cycles. Ils apparaîtront au démarrage.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cycles.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-center font-semibold text-muted">
                        {c.index}
                      </TableCell>
                      <TableCell>{formatDate(c.due_date)}</TableCell>
                      <TableCell>
                        {c.is_platform_round ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                            <PiggyBank className="size-4" />
                            Plateforme
                          </span>
                        ) : c.beneficiary_member_id ? (
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <Trophy className="size-4 text-accent" />
                            {beneficiaryName(c.beneficiary_member_id)}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={c.status === "closed" ? "success" : "info"}
                        >
                          {c.status === "closed" ? "Clôturé" : "Ouvert"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Versements ──────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Receipt className="size-5 text-primary" />
            Versements
            <Badge variant="neutral">{data.payouts?.length ?? 0}</Badge>
          </h2>
          <p className="text-xs text-muted">
            Cagnottes versées (ou différées) aux bénéficiaires.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {!data.payouts || data.payouts.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">
                Aucun versement pour le moment. Ils apparaîtront à la clôture
                de chaque cycle.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...data.payouts]
                    .sort((a, b) => {
                      const da = a.paid_at ? Date.parse(a.paid_at) : 0;
                      const db = b.paid_at ? Date.parse(b.paid_at) : 0;
                      return db - da;
                    })
                    .map((p) => {
                      const u = usersById?.get(p.beneficiary_user_id);
                      const variant: BadgeProps["variant"] =
                        p.status === TontinePayoutStatus.PAID
                          ? "success"
                          : p.status ===
                              TontinePayoutStatus.PENDING_DEBT_RESOLUTION
                            ? "warning"
                            : p.status === TontinePayoutStatus.CANCELLED ||
                                p.status === TontinePayoutStatus.SUSPENDED
                              ? "danger"
                              : "info";
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <Link
                              href={`${ROUTES.USERS}/${p.beneficiary_user_id}`}
                              className="flex items-center gap-3 transition-colors hover:text-primary"
                            >
                              <Avatar className="size-8">
                                <AvatarFallback className="text-xs">
                                  {u
                                    ? getInitials(u.first_name, u.last_name)
                                    : "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">
                                  {nameFor(p.beneficiary_user_id)}
                                </p>
                                {u?.phone && (
                                  <p className="truncate text-xs text-muted">
                                    {u.country_code} {u.phone}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(p.amount, t.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={variant}>
                              {TONTINE_PAYOUT_STATUS_LABELS[p.status] ??
                                p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted">
                            {p.paid_at ? formatDate(p.paid_at) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Désistements ────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <UserMinus className="size-5 text-danger" />
            Désistements
            <Badge variant="neutral">{withdrawals?.length ?? 0}</Badge>
          </h2>
          <p className="text-xs text-muted">
            Demandes envoyées par les inscrits avant le démarrage.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {!withdrawals || withdrawals.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">
                Aucune demande de désistement.
              </p>
            ) : (
              <div className="divide-y">
                {withdrawals.map((w) => (
                  <div key={w.id} className="space-y-2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Link
                        href={`${ROUTES.USERS}/${w.user_id}`}
                        className="flex items-center gap-3 transition-colors hover:text-primary"
                      >
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {w.user
                              ? getInitials(w.user.first_name, w.user.last_name)
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {w.user
                              ? fullName(w.user.first_name, w.user.last_name)
                              : `${w.user_id.slice(0, 8)}…`}
                          </p>
                          {w.user?.phone && (
                            <p className="truncate text-xs text-muted">
                              {w.user.country_code} {w.user.phone}
                            </p>
                          )}
                        </div>
                      </Link>
                      <div className="flex flex-wrap items-center gap-2">
                        {w.in_penalty_window ? (
                          <Badge variant="danger">Fenêtre pénalité</Badge>
                        ) : (
                          <Badge variant="secondary">Hors fenêtre</Badge>
                        )}
                        <span className="text-xs text-muted">
                          {formatDate(w.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-md bg-muted/40 p-3 text-sm">
                      <p className="mb-1 text-xs font-medium uppercase text-muted">
                        Motif
                      </p>
                      <p className="whitespace-pre-wrap text-foreground">
                        {w.reason}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                      <div>
                        <span className="text-xs text-muted">Caution : </span>
                        <span className="font-medium">
                          {formatCurrency(w.caution_amount, t.currency)}
                        </span>
                      </div>
                      {w.penalty_amount > 0 && (
                        <div>
                          <span className="text-xs text-muted">
                            Pénalité retenue :{" "}
                          </span>
                          <span className="font-medium text-danger">
                            −{formatCurrency(w.penalty_amount, t.currency)}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-muted">Remboursé : </span>
                        <span className="font-medium text-success">
                          {formatCurrency(w.refunded_amount, t.currency)}
                        </span>
                      </div>
                      {w.supporting_document_url && (
                        <a
                          href={w.supporting_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <Paperclip className="size-3.5" />
                          Voir la pièce jointe
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Dialogs ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.label ?? ""}
        description={confirmAction?.description ?? ""}
        confirmLabel={confirmAction?.label ?? "Confirmer"}
        isLoading={busy}
        onConfirm={() => confirmAction && void confirmAction.fn()}
      />

      <ConfirmDialog
        open={postponeOpen}
        onOpenChange={setPostponeOpen}
        title="Reporter le démarrage"
        description="Choisissez la nouvelle date de démarrage."
        confirmLabel="Reporter"
        isLoading={busy}
        onConfirm={() => {
          if (!postponeDate) {
            toast.error("Date requise", "Choisissez une date.");
            return;
          }
          void run(
            () => tontineService.postpone(id, postponeDate),
            "Date reportée.",
          ).then(() => setPostponeOpen(false));
        }}
      >
        <Field label="Nouvelle date" htmlFor="postpone-date" required>
          <Input
            id="postpone-date"
            type="date"
            value={postponeDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setPostponeDate(e.target.value)}
          />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={cancelStep === 1}
        onOpenChange={(open) => !open && setCancelStep(0)}
        title="Annuler cette tontine ?"
        description={
          "Action lourde et irréversible : toutes les cautions sont débloquées, " +
          "les cotisations déjà collectées sont remboursées, et la tontine passe " +
          "en statut « annulée »."
        }
        confirmLabel="Je comprends, continuer"
        confirmVariant="danger"
        isLoading={busy}
        onConfirm={() => setCancelStep(2)}
      />

      <ConfirmDialog
        open={cancelStep === 2}
        onOpenChange={(open) => !open && setCancelStep(0)}
        title="Confirmer l'annulation"
        description={`Confirmez l'annulation de « ${t.name} ». Cette action est définitive.`}
        confirmLabel="Annuler la tontine"
        confirmVariant="danger"
        isLoading={busy}
        onConfirm={() => {
          void run(
            () => tontineService.cancel(id),
            "Tontine annulée.",
          ).finally(() => setCancelStep(0));
        }}
      />

      <NotifyMembersDialog
        tontineId={id}
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
      />
    </div>
  );
}

// ── Composants visuels locaux ────────────────────────────────────────────

interface BigStatProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "secondary" | "accent" | "warning";
}

const TONE_BG: Record<BigStatProps["tone"], string> = {
  primary: "bg-primary-soft text-primary-soft-foreground",
  secondary: "bg-secondary-soft text-secondary-soft-foreground",
  accent: "bg-accent-soft text-accent-soft-foreground",
  warning: "bg-warning-soft text-warning",
};

function BigStat({ label, value, hint, icon: Icon, tone }: BigStatProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${TONE_BG[tone]}`}
        >
          <Icon className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted">{label}</p>
          <p className="text-xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-muted">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function MembersStat({
  count,
  max,
  percent,
}: {
  count: number;
  max: number;
  percent: number;
}) {
  const full = percent >= 100;
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-foreground">
            <Users className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted">Membres</p>
            <p className="text-xl font-semibold tracking-tight">
              {count}
              <span className="text-muted"> / {max}</span>
            </p>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted-soft">
          <div
            className={`h-full rounded-full transition-[width] ${
              full ? "bg-accent" : "bg-primary"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-muted">
          {full ? "Capacité atteinte" : `${percent}% rempli`}
        </p>
      </CardContent>
    </Card>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 font-medium text-foreground">{value}</p>
    </div>
  );
}
