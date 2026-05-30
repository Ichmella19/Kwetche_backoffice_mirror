"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RotateCcw, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Field } from "@/presentation/components/ui/field";
import { Badge } from "@/presentation/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/presentation/components/ui/avatar";
import { useAuth } from "@/presentation/contexts/auth-context";
import { useAsync, useToast } from "@/presentation/hooks";
import { userService } from "@/presentation/services/user";
import { sessionService } from "@/presentation/services/sessions";
import { authService } from "@/presentation/services/auth";
import { GRANT_LABELS, ROLE_LABELS } from "@/lib/constants";
import {
  fullName,
  formatDate,
  formatDateTime,
  formatPhone,
  getInitials,
  resolveFileUrl,
} from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";

const schema = z.object({
  first_name: z.string().min(1, "Prénom requis"),
  last_name: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide").or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, refresh, isSuperAdmin } = useAuth();
  const toast = useToast();
  const [sessionBusy, setSessionBusy] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const {
    data: sessions,
    isLoading: sessionsLoading,
    execute: refreshSessions,
  } = useAsync(useCallback(() => sessionService.listMine(), []));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      email: user?.email ?? "",
    },
  });

  if (!user) return null;

  const onSubmit = async (values: FormValues) => {
    try {
      await userService.updateProfile({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email || null,
      });
      await refresh();
      toast.success("Profil mis à jour");
    } catch (err) {
      toast.error("Mise à jour impossible", getErrorMessage(err));
    }
  };

  const photo = resolveFileUrl(user.profile_photo);

  const revokeSession = async (sessionId: string) => {
    setSessionBusy(sessionId);
    try {
      await sessionService.revoke(sessionId);
      await refreshSessions();
      toast.success("Session révoquée");
    } catch (err) {
      toast.error("Révocation impossible", getErrorMessage(err));
    } finally {
      setSessionBusy(null);
    }
  };

  const revokeOthers = async () => {
    setSessionBusy("others");
    try {
      const result = await sessionService.revokeOthers();
      await refreshSessions();
      toast.success(`${result.revoked_count} session(s) révoquée(s)`);
    } catch (err) {
      toast.error("Révocation impossible", getErrorMessage(err));
    } finally {
      setSessionBusy(null);
    }
  };

  const changePassword = async () => {
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

    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await refreshSessions();
      toast.success("Mot de passe mis à jour");
    } catch (err) {
      toast.error("Modification impossible", getErrorMessage(err));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon profil"
        description="Vos informations et vos permissions."
      />

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar className="size-16">
            {photo && <AvatarImage src={photo} alt="" />}
            <AvatarFallback className="text-lg">
              {getInitials(user.first_name, user.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-xl font-semibold text-foreground">
              {fullName(user.first_name, user.last_name)}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant="secondary">
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
              {isSuperAdmin && (
                <Badge variant="primary" className="gap-1">
                  <ShieldCheck className="size-3" /> Super-admin
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>
              Modifiez votre nom et votre email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Prénom"
                  htmlFor="first_name"
                  error={errors.first_name?.message}
                  required
                >
                  <Input
                    id="first_name"
                    invalid={!!errors.first_name}
                    {...register("first_name")}
                  />
                </Field>
                <Field
                  label="Nom"
                  htmlFor="last_name"
                  error={errors.last_name?.message}
                  required
                >
                  <Input
                    id="last_name"
                    invalid={!!errors.last_name}
                    {...register("last_name")}
                  />
                </Field>
              </div>
              <Field
                label="Email"
                htmlFor="email"
                error={errors.email?.message}
              >
                <Input
                  id="email"
                  type="email"
                  invalid={!!errors.email}
                  {...register("email")}
                />
              </Field>
              <Field label="Téléphone">
                <Input
                  value={formatPhone(user.phone, user.country_code)}
                  disabled
                />
              </Field>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={!isDirty}
              >
                Enregistrer
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions &amp; compte</CardTitle>
            <CardDescription>Grants attribués à votre compte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted">Membre depuis</p>
                <p className="font-medium text-foreground">
                  {formatDate(user.created_at)}
                </p>
              </div>
              <div>
                <p className="text-muted">Dernière connexion</p>
                <p className="font-medium text-foreground">
                  {formatDate(user.last_login_at)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted">Grants</p>
              {isSuperAdmin ? (
                <Badge variant="primary">Tous les droits (super-admin)</Badge>
              ) : user.grants.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.grants.map((grant) => (
                    <Badge key={grant} variant="secondary">
                      {GRANT_LABELS[grant] ?? grant}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Aucun grant attribué.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
          <CardDescription>
            Mettez à jour votre mot de passe. Les autres sessions seront
            révoquées.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Mot de passe actuel">
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
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
          <div className="md:col-span-3">
            <Button
              type="button"
              onClick={changePassword}
              isLoading={isChangingPassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              Changer le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Sessions actives</CardTitle>
              <CardDescription>
                Appareils connectés à votre compte.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={revokeOthers}
              isLoading={sessionBusy === "others"}
            >
              <RotateCcw />
              Révoquer les autres
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <p className="text-sm text-muted">Chargement des sessions…</p>
          ) : !sessions || sessions.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Smartphone className="size-4" />
              Aucune session active.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Appareil</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Dernière activité</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Smartphone className="size-4 text-muted" />
                        <div>
                          <p className="font-medium">
                            {session.device_name ??
                              session.os ??
                              "Appareil inconnu"}
                          </p>
                          <p className="text-xs text-muted">
                            {session.app_version ?? "version inconnue"}
                          </p>
                        </div>
                        {session.is_current && (
                          <Badge variant="success">Session actuelle</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{session.device_ip ?? "—"}</TableCell>
                    <TableCell>
                      {formatDateTime(session.last_seen_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={session.is_current}
                          isLoading={sessionBusy === session.id}
                          onClick={() => revokeSession(session.id)}
                        >
                          <Trash2 />
                          Révoquer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
