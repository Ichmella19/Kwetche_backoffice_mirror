"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  KeySquare,
  Landmark,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
import { DocumentPreview } from "@/presentation/components/kyc";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { Field } from "@/presentation/components/ui/field";
import { Input } from "@/presentation/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/presentation/components/ui/tabs";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useAsync, useToast } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { userService } from "@/presentation/services/user";
import { kycService } from "@/presentation/services/kyc";
import { notificationService } from "@/presentation/services/notification";
import { walletService } from "@/presentation/services/wallet";
import { ROLE_LABELS, ROUTES } from "@/lib/constants";
import {
  CAUTION_STATUS_LABELS,
  DEBT_STATUS_LABELS,
  DEBT_TYPE_LABELS,
  Grant,
  KycRequestStatus,
  kycRequestStatusLabel,
  NotificationChannel,
  NotificationType,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_TYPE_LABELS,
  TONTINE_MEMBER_STATUS_LABELS,
  TONTINE_STATUS_LABELS,
  TONTINE_TYPE_LABELS,
  TontineMemberStatus,
  validationLabel,
  WalletTxStatus,
  WALLET_TX_CATEGORY_LABELS,
  WALLET_TX_STATUS_LABELS,
} from "@/lib/enums";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  fullName,
} from "@/lib/utils/formatters";
import type { KycDocumentRequest, User, WalletUserView } from "@/lib/types";
import type { UserSession } from "@/lib/types";
import type {
  UserDebtEntry,
  UserDebtsResponse,
  UserTontineEntry,
} from "@/core/data/repositories/user/user.repository.impl";
import { getErrorMessage } from "@/lib/utils/helpers";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function UserOverview({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{fullName(user.first_name, user.last_name)}</CardTitle>
            <CardDescription>
              {formatPhone(user.phone, user.country_code)} ·{" "}
              {user.email ?? "email absent"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
            <Badge variant={user.is_desactivate ? "danger" : "success"}>
              {user.is_desactivate ? "Désactivé" : "Actif"}
            </Badge>
            <Badge variant={user.is_verified ? "success" : "warning"}>
              {user.is_verified ? "Vérifié" : "Non vérifié"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Niveau KYC" value={`Niveau ${user.kyc_level}`} />
        <Stat label="Membre depuis" value={formatDate(user.created_at)} />
        <Stat
          label="Dernière connexion"
          value={formatDateTime(user.last_login_at)}
        />
        <Stat label="NPI" value={user.npi_number ?? "Non renseigné"} />
      </CardContent>
    </Card>
  );
}

function IdentityCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identité KYC</CardTitle>
        <CardDescription>
          CIP, selfie et statut de validation niveau 1.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Carte CIP</p>
            <Badge variant="outline">
              {validationLabel(user.cip_validation)}
            </Badge>
          </div>
          <DocumentPreview fileUrl={user.cip_photo} label="Carte CIP" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Selfie</p>
            <Badge variant="outline">
              {validationLabel(user.selfie_validation)}
            </Badge>
          </div>
          <DocumentPreview fileUrl={user.selfie_photo} label="Selfie" />
        </div>
      </CardContent>
    </Card>
  );
}

function requestStatusVariant(status: string) {
  if (status === KycRequestStatus.FULFILLED) return "success" as const;
  if (status === KycRequestStatus.CANCELLED) return "neutral" as const;
  return "warning" as const;
}

function KycRequestsCard({ userId }: { userId: string }) {
  const toast = useToast();
  const { hasGrant } = useAuth();
  const canManage = hasGrant(Grant.KYC_REVIEW);

  const fetchRequests = useMemo(
    () => () => kycService.listRequests(userId),
    [userId],
  );
  const { data, isLoading, execute } = useAsync<KycDocumentRequest[]>(
    fetchRequests,
    false,
  );

  const [level, setLevel] = useState(2);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    execute().catch(() => undefined);
  }, [execute]);

  const create = async () => {
    if (label.trim().length < 2) {
      toast.error("Libellé requis", "Décrivez le document à fournir.");
      return;
    }
    setBusy(true);
    try {
      await kycService.createRequest({
        user_id: userId,
        target_level: level,
        label,
        note,
      });
      toast.success("Demande envoyée à l'utilisateur");
      setLabel("");
      setNote("");
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    setCancelingId(id);
    try {
      await kycService.cancelRequest(id);
      toast.success("Demande annulée");
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents complémentaires</CardTitle>
        <CardDescription>
          Réclamez des pièces supplémentaires (niveau 2/3) à l&apos;utilisateur.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {canManage && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Niveau">
              <div className="flex gap-2">
                {[2, 3].map((l) => (
                  <Button
                    key={l}
                    type="button"
                    size="sm"
                    variant={level === l ? "accent" : "outline"}
                    onClick={() => setLevel(l)}
                  >
                    Niveau {l}
                  </Button>
                ))}
              </div>
            </Field>
            <Field label="Document demandé">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex : Facture SBEE récente"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Note (optionnel)">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Précisions pour l'utilisateur"
                  maxLength={1000}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Button onClick={create} isLoading={busy} disabled={!label.trim()}>
                Réclamer le document
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted">
            Aucune demande pour cet utilisateur.
          </p>
        ) : (
          <div className="space-y-2">
            {data.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {req.label}{" "}
                    <span className="text-xs text-muted">
                      · niv. {req.target_level}
                    </span>
                  </p>
                  {req.note && (
                    <p className="text-xs text-muted">{req.note}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={requestStatusVariant(req.status)}>
                    {kycRequestStatusLabel(req.status)}
                  </Badge>
                  {canManage && req.status === KycRequestStatus.PENDING && (
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={cancelingId === req.id}
                      onClick={() => cancel(req.id)}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function walletTxStatusVariant(status: string) {
  if (status === WalletTxStatus.VALIDATED) return "success" as const;
  if (status === WalletTxStatus.PENDING) return "warning" as const;
  return "danger" as const;
}

function WalletCard({ userId }: { userId: string }) {
  const toast = useToast();
  const { hasGrant } = useAuth();
  const canAdjust = hasGrant(Grant.WALLET_ADJUST);

  const fetchWallet = useMemo(() => () => walletService.getForUser(userId), [userId]);
  const { data, isLoading, error, execute } = useAsync<WalletUserView>(
    fetchWallet,
    false,
  );

  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [txBusyId, setTxBusyId] = useState<string | null>(null);

  useEffect(() => {
    execute().catch(() => undefined);
  }, [execute]);

  if (!hasGrant(Grant.WALLET_READ)) return null;

  const adjust = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Montant invalide", "Indiquez un montant positif.");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Motif requis", "Justifiez l'ajustement.");
      return;
    }
    setBusy(true);
    try {
      await walletService.adjust(userId, { amount: value, direction, reason });
      toast.success("Wallet ajusté");
      setAmount("");
      setReason("");
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const reviewTx = async (txId: string, confirm: boolean) => {
    setTxBusyId(txId);
    try {
      if (confirm) await walletService.confirmTransaction(txId);
      else await walletService.rejectTransaction(txId);
      toast.success(confirm ? "Transaction confirmée" : "Transaction rejetée");
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setTxBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet</CardTitle>
        <CardDescription>Solde, historique et ajustement manuel.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading && !data ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : error || !data ? (
          <p className="text-sm text-muted">{error ?? "Wallet indisponible."}</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Disponible" value={formatCurrency(data.wallet.available)} />
              <Stat label="Total" value={formatCurrency(data.wallet.balance)} />
              <Stat label="Bloqué" value={formatCurrency(data.wallet.locked_balance)} />
            </div>

            {canAdjust && (
              <div className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-2">
                <Field label="Montant (XOF)">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </Field>
                <Field label="Sens">
                  <div className="flex gap-2">
                    {(["credit", "debit"] as const).map((d) => (
                      <Button
                        key={d}
                        type="button"
                        size="sm"
                        variant={direction === d ? "accent" : "outline"}
                        onClick={() => setDirection(d)}
                      >
                        {d === "credit" ? "Créditer" : "Débiter"}
                      </Button>
                    ))}
                  </div>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Motif">
                    <Input value={reason} onChange={(e) => setReason(e.target.value)} />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Button onClick={adjust} isLoading={busy} disabled={!amount || !reason.trim()}>
                    Ajuster le wallet
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Transactions récentes
              </p>
              {data.transactions.length === 0 ? (
                <p className="text-sm text-muted">Aucune transaction.</p>
              ) : (
                data.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {WALLET_TX_CATEGORY_LABELS[tx.category] ?? tx.category}
                        <span
                          className={
                            tx.movement === "credit"
                              ? "ml-2 text-success"
                              : "ml-2 text-danger"
                          }
                        >
                          {tx.movement === "credit" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </p>
                      {tx.description && (
                        <p className="text-xs text-muted">{tx.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={walletTxStatusVariant(tx.status)}>
                        {WALLET_TX_STATUS_LABELS[tx.status] ?? tx.status}
                      </Badge>
                      {canAdjust && tx.status === WalletTxStatus.PENDING && (
                        <>
                          <Button
                            variant="accent"
                            size="sm"
                            isLoading={txBusyId === tx.id}
                            onClick={() => reviewTx(tx.id, true)}
                          >
                            Confirmer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={txBusyId === tx.id}
                            onClick={() => reviewTx(tx.id, false)}
                          >
                            Rejeter
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationSendCard({ userId }: { userId: string }) {
  const toast = useToast();
  const { hasGrant } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<string>(NotificationType.SYSTEM);
  const [channels, setChannels] = useState<string[]>([
    NotificationChannel.IN_APP,
    NotificationChannel.PUSH,
  ]);
  const [busy, setBusy] = useState(false);

  if (!hasGrant(Grant.NOTIFICATION_SEND)) return null;

  const toggleChannel = (c: string) =>
    setChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Champs requis", "Indiquez un titre et un message.");
      return;
    }
    if (channels.length === 0) {
      toast.error("Canal requis", "Choisissez au moins un canal.");
      return;
    }
    setBusy(true);
    try {
      const res = await notificationService.send({
        user_ids: [userId],
        title,
        body,
        type,
        channels,
      });
      toast.success(`Notification envoyée (${res.sent})`);
      setTitle("");
      setBody("");
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envoyer une notification</CardTitle>
        <CardDescription>
          Notification ou rappel multi-canal à cet utilisateur.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Titre">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Message">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
          />
        </Field>
        <Field label="Type">
          <div className="flex flex-wrap gap-2">
            {Object.values(NotificationType).map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={type === t ? "accent" : "outline"}
                onClick={() => setType(t)}
              >
                {NOTIFICATION_TYPE_LABELS[t]}
              </Button>
            ))}
          </div>
        </Field>
        <Field label="Canaux">
          <div className="flex flex-wrap gap-2">
            {Object.values(NotificationChannel).map((c) => (
              <Button
                key={c}
                type="button"
                size="sm"
                variant={channels.includes(c) ? "accent" : "outline"}
                onClick={() => toggleChannel(c)}
              >
                {NOTIFICATION_CHANNEL_LABELS[c]}
              </Button>
            ))}
          </div>
        </Field>
        <Button onClick={send} isLoading={busy} disabled={!title.trim() || !body.trim()}>
          Envoyer
        </Button>
      </CardContent>
    </Card>
  );
}

function SessionsCard({
  sessions,
  isLoading,
  onRevoke,
  onRevokeAll,
  busySessionId,
  isRevokingAll,
}: {
  sessions: UserSession[] | null;
  isLoading: boolean;
  onRevoke: (sessionId: string) => void;
  onRevokeAll: () => void;
  busySessionId: string | null;
  isRevokingAll: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Sessions actives</CardTitle>
            <CardDescription>
              Appareils connectés à ce compte et révocation à distance.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRevokeAll}
            disabled={isLoading || !sessions?.length}
            isLoading={isRevokingAll}
          >
            Tout révoquer
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : !sessions?.length ? (
          <p className="text-sm text-muted">Aucune session active.</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {session.device_name || session.os || "Appareil inconnu"}
                </p>
                <p className="text-sm text-muted">
                  {session.device_ip || "IP inconnue"} ·{" "}
                  {session.app_version || "version inconnue"}
                </p>
                <p className="text-xs text-muted">
                  Dernière activité {formatDateTime(session.last_seen_at)}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onRevoke(session.id)}
                isLoading={busySessionId === session.id}
              >
                Révoquer
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function UserTontinesCard({ userId }: { userId: string }) {
  const { data, isLoading, error, execute } = useAsync<UserTontineEntry[]>(
    useCallback(() => userService.listUserTontines(userId), [userId]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tontines</CardTitle>
        <CardDescription>
          Liste des tontines auxquelles cet utilisateur participe ou a participé.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {error ? (
          <div className="p-6">
            <ErrorState message={getErrorMessage(error)} onRetry={execute} />
          </div>
        ) : isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Aucune tontine"
              description="L'utilisateur ne participe à aucune tontine."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tontine</TableHead>
                <TableHead>Participation</TableHead>
                <TableHead>Caution</TableHead>
                <TableHead>Tour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry) => (
                <TableRow key={entry.membership.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`${ROUTES.TONTINES}/${entry.tontine.id}`}
                      className="hover:underline"
                    >
                      {entry.tontine.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {TONTINE_TYPE_LABELS[entry.tontine.type] ??
                      entry.tontine.type}
                  </TableCell>
                  <TableCell>
                    <Badge>
                      {TONTINE_STATUS_LABELS[entry.tontine.status] ??
                        entry.tontine.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.membership.status === TontineMemberStatus.DEFAULTED
                          ? "danger"
                          : "neutral"
                      }
                    >
                      {TONTINE_MEMBER_STATUS_LABELS[entry.membership.status] ??
                        entry.membership.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(
                      entry.membership.caution_amount,
                      entry.tontine.currency,
                    )}{" "}
                    <span className="text-xs text-muted">
                      ({CAUTION_STATUS_LABELS[entry.membership.caution_status] ??
                        entry.membership.caution_status})
                    </span>
                  </TableCell>
                  <TableCell>{entry.membership.payout_order ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function UserDebtsCard({ userId }: { userId: string }) {
  const { data, isLoading, error, execute } = useAsync<UserDebtsResponse>(
    useCallback(() => userService.listUserDebts(userId), [userId]),
  );

  const open = useMemo(
    () =>
      data?.items.filter((d) =>
        ["open", "in_recovery", "partially_recovered"].includes(d.status),
      ) ?? [],
    [data],
  );
  const settled = useMemo(
    () => data?.items.filter((d) => !open.includes(d)) ?? [],
    [data, open],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dettes</CardTitle>
        <CardDescription>
          {data
            ? `${open.length} ouverte(s) · ${settled.length} clôturée(s)`
            : "Créances dues par l'utilisateur."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {error ? (
          <div className="p-6">
            <ErrorState message={getErrorMessage(error)} onRetry={execute} />
          </div>
        ) : isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Aucune dette"
              description="L'utilisateur n'a aucune dette enregistrée."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Dû</TableHead>
                <TableHead className="text-right">Recouvré</TableHead>
                <TableHead className="text-right">Restant</TableHead>
                <TableHead>Relances</TableHead>
                <TableHead>Créée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((d: UserDebtEntry) => (
                <TableRow key={d.id}>
                  <TableCell>{DEBT_TYPE_LABELS[d.type] ?? d.type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        d.status === "recovered"
                          ? "secondary"
                          : d.status === "written_off" ||
                              d.status === "in_recovery"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {DEBT_STATUS_LABELS[d.status] ?? d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(d.amount_due, d.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(d.amount_recovered, d.currency)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(d.remaining, d.currency)}
                  </TableCell>
                  <TableCell>{d.relance_count}</TableCell>
                  <TableCell className="text-xs">
                    {formatDate(d.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const toast = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeSessions, setRevokeSessions] = useState(true);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const [isRevokingAllSessions, setIsRevokingAllSessions] = useState(false);
  const {
    data: user,
    isLoading,
    error,
    execute,
  } = useAsync<User>(
    useCallback(() => userService.getUser(userId), [userId]),
  );
  const {
    data: sessions,
    isLoading: isLoadingSessions,
    execute: reloadSessions,
  } = useAsync<UserSession[]>(
    useCallback(() => userService.listUserSessions(userId), [userId]),
  );

  const setPassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Mot de passe trop court", "Minimum 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(
        "Confirmation incorrecte",
        "Les mots de passe ne correspondent pas.",
      );
      return;
    }
    setIsSettingPassword(true);
    try {
      await userService.setUserPassword(userId, {
        new_password: newPassword,
        revoke_sessions: revokeSessions,
      });
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Mot de passe utilisateur mis à jour");
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setIsSettingPassword(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setBusySessionId(sessionId);
    try {
      await userService.revokeUserSession(userId, sessionId);
      toast.success("Session révoquée");
      await reloadSessions();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusySessionId(null);
    }
  };

  const revokeAllSessions = async () => {
    setIsRevokingAllSessions(true);
    try {
      const result = await userService.revokeUserSessions(userId);
      toast.success(`${result.revoked_count} session(s) révoquée(s)`);
      await reloadSessions();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setIsRevokingAllSessions(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <ErrorState
        message={error ?? "Utilisateur introuvable."}
        onRetry={() => execute()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Détail utilisateur"
        description="Vue dossier complète et modules opérationnels à brancher."
        actions={
          <Button asChild variant="outline">
            <Link href={ROUTES.USERS}>
              <ArrowLeft />
              Retour
            </Link>
          </Button>
        }
      />

      <UserOverview user={user} />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <UserRound className="size-4" /> Profil
          </TabsTrigger>
          <TabsTrigger value="kyc">
            <ShieldCheck className="size-4" /> KYC
          </TabsTrigger>
          <TabsTrigger value="wallet">
            <Landmark className="size-4" /> Wallet
          </TabsTrigger>
          <TabsTrigger value="tontines">
            <PiggyBank className="size-4" /> Tontines
          </TabsTrigger>
          <TabsTrigger value="debts">
            <Receipt className="size-4" /> Dettes
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Smartphone className="size-4" /> Sessions
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="size-4" /> Notifs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeySquare className="size-4" />
                Mot de passe
              </CardTitle>
              <CardDescription>
                Définissez un nouveau mot de passe pour ce compte.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Nouveau mot de passe">
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Field>
              <Field label="Confirmation">
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-muted md:col-span-2">
                <input
                  type="checkbox"
                  checked={revokeSessions}
                  onChange={(e) => setRevokeSessions(e.target.checked)}
                />
                Révoquer toutes les sessions après modification
              </label>
              <div className="md:col-span-2">
                <Button
                  onClick={setPassword}
                  isLoading={isSettingPassword}
                  disabled={!newPassword || !confirmPassword}
                >
                  Mettre à jour le mot de passe
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Journal rapide</CardTitle>
              <CardDescription>Horodatages clés du dossier.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Stat
                label="Profil mis à jour"
                value={formatDateTime(user.updated_at)}
              />
              <Stat
                label="KYC mis à jour"
                value={formatDateTime(user.kyc_updated_at)}
              />
              <Stat
                label="CIP vérifiée"
                value={formatDateTime(user.cip_verified_at)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc" className="space-y-6">
          <IdentityCard user={user} />
          <KycRequestsCard userId={userId} />
        </TabsContent>

        <TabsContent value="wallet">
          <WalletCard userId={userId} />
        </TabsContent>

        <TabsContent value="tontines">
          <UserTontinesCard userId={userId} />
        </TabsContent>

        <TabsContent value="debts">
          <UserDebtsCard userId={userId} />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsCard
            sessions={sessions}
            isLoading={isLoadingSessions}
            onRevoke={revokeSession}
            onRevokeAll={revokeAllSessions}
            busySessionId={busySessionId}
            isRevokingAll={isRevokingAllSessions}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSendCard userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
