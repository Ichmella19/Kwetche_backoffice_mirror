"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  ArrowLeft,
  Bell,
  KeySquare,
  Landmark,
  LineChart,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { ErrorState } from "@/presentation/components/shared/error";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/presentation/components/ui/tabs";
import { useAsync, useToast } from "@/presentation/hooks";
import { userService } from "@/presentation/services/user";
import { ROLE_LABELS, ROUTES } from "@/lib/constants";
import {
  formatDateTime,
  formatPhone,
  fullName,
} from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { User, UserSession } from "@/lib/types";

import {
  IdentityCard,
  KycRequestsCard,
  NotificationSendCard,
  SessionsCard,
  Stat,
  UserAnalyticsCard,
  UserDebtsCard,
  UserOverview,
  UserTontinesCard,
  WalletCard,
} from "./_components";

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
        <TabsList className="w-full justify-start">
          <TabsTrigger value="profile">
            <UserRound className="size-4" /> Profil
          </TabsTrigger>
          <TabsTrigger value="kyc">
            <ShieldCheck className="size-4" /> KYC
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <LineChart className="size-4" /> Analytics
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
          <Tabs defaultValue="identity">
            <TabsList>
              <TabsTrigger value="identity">Identité</TabsTrigger>
              <TabsTrigger value="security">Sécurité</TabsTrigger>
              <TabsTrigger value="activity">Journal</TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Coordonnées principales du compte utilisateur.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Stat
                    label="Nom complet"
                    value={fullName(user.first_name, user.last_name)}
                  />
                  <Stat
                    label="Téléphone"
                    value={formatPhone(user.phone, user.country_code)}
                  />
                  <Stat label="Email" value={user.email ?? "Non renseigné"} />
                  <Stat label="Rôle" value={ROLE_LABELS[user.role] ?? user.role} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>État du compte</CardTitle>
                  <CardDescription>
                    Statuts administratifs et conformité.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Stat
                    label="Compte"
                    value={user.is_desactivate ? "Désactivé" : "Actif"}
                  />
                  <Stat
                    label="Vérification"
                    value={user.is_verified ? "Vérifié" : "Non vérifié"}
                  />
                  <Stat label="Niveau KYC" value={`Niveau ${user.kyc_level}`} />
                  <Stat label="NPI" value={user.npi_number ?? "Non renseigné"} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
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
            </TabsContent>

            <TabsContent value="activity">
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
          </Tabs>
        </TabsContent>

        <TabsContent value="kyc" className="space-y-6">
          <Tabs defaultValue="identity">
            <TabsList>
              <TabsTrigger value="identity">Identité niveau 1</TabsTrigger>
              <TabsTrigger value="requests">Demandes complémentaires</TabsTrigger>
            </TabsList>
            <TabsContent value="identity">
              <IdentityCard user={user} />
            </TabsContent>
            <TabsContent value="requests">
              <KycRequestsCard userId={userId} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="analytics">
          <UserAnalyticsCard userId={userId} />
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
