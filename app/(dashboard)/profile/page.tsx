"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/presentation/components/ui/avatar";
import { useAuth } from "@/presentation/contexts/auth-context";
import { useToast } from "@/presentation/hooks";
import { userService } from "@/presentation/services/user";
import { GRANT_LABELS, ROLE_LABELS } from "@/lib/constants";
import {
  fullName,
  formatDate,
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

  return (
    <div className="space-y-6">
      <PageHeader title="Mon profil" description="Vos informations et vos permissions." />

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
              <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
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
            <CardDescription>Modifiez votre nom et votre email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prénom" htmlFor="first_name" error={errors.first_name?.message} required>
                  <Input id="first_name" invalid={!!errors.first_name} {...register("first_name")} />
                </Field>
                <Field label="Nom" htmlFor="last_name" error={errors.last_name?.message} required>
                  <Input id="last_name" invalid={!!errors.last_name} {...register("last_name")} />
                </Field>
              </div>
              <Field label="Email" htmlFor="email" error={errors.email?.message}>
                <Input id="email" type="email" invalid={!!errors.email} {...register("email")} />
              </Field>
              <Field label="Téléphone">
                <Input value={formatPhone(user.phone, user.country_code)} disabled />
              </Field>
              <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
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
                <p className="font-medium text-foreground">{formatDate(user.created_at)}</p>
              </div>
              <div>
                <p className="text-muted">Dernière connexion</p>
                <p className="font-medium text-foreground">{formatDate(user.last_login_at)}</p>
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
    </div>
  );
}
