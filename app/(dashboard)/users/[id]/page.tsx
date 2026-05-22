"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  FileText,
  Landmark,
  MessageSquare,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
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
import { useAsync, useToast } from "@/presentation/hooks";
import { userService } from "@/presentation/services/user";
import { ROLE_LABELS, ROUTES } from "@/lib/constants";
import { validationLabel } from "@/lib/enums";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  fullName,
} from "@/lib/utils/formatters";
import type { User } from "@/lib/types";
import type { UserSession } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils/helpers";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function ModuleCard({
  icon: Icon,
  title,
  value,
  status = "À venir",
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  status?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted-soft text-muted">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted">{value}</p>
        </div>
        <Badge variant="outline">{status}</Badge>
      </CardContent>
    </Card>
  );
}

const WalletIcon = Landmark;

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

function ModulesGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ModuleCard icon={WalletIcon} title="Wallet" value={formatCurrency(0)} />
      <ModuleCard
        icon={Users}
        title="Tontines"
        value="Cycles, tours et cotisations"
      />
      <ModuleCard
        icon={BadgeDollarSign}
        title="Prêts"
        value="Demandes, scoring et remboursements"
      />
      <ModuleCard
        icon={Smartphone}
        title="Sessions"
        value="Vue admin des appareils"
      />
      <ModuleCard
        icon={MessageSquare}
        title="Support"
        value="Tickets et conversations"
      />
      <ModuleCard
        icon={FileText}
        title="Documents"
        value="Historique KYC étendu"
      />
    </div>
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
  } = useAsync<User>(() => userService.getUser(userId));
  const {
    data: sessions,
    isLoading: isLoadingSessions,
    execute: reloadSessions,
  } = useAsync<UserSession[]>(() => userService.listUserSessions(userId));

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
      <IdentityCard user={user} />
      <SessionsCard
        sessions={sessions}
        isLoading={isLoadingSessions}
        onRevoke={revokeSession}
        onRevokeAll={revokeAllSessions}
        busySessionId={busySessionId}
        isRevokingAll={isRevokingAllSessions}
      />

      <Card>
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
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

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Modules</h2>
          <p className="text-sm text-muted">
            Les blocs sont prêts pour les endpoints wallet, tontine, prêt,
            support et audit.
          </p>
        </div>
        <ModulesGrid />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Journal rapide</CardTitle>
          <CardDescription>
            Premiers repères avant l&apos;audit détaillé.
          </CardDescription>
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
    </div>
  );
}
