"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, KeyRound, Lock } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Field } from "@/presentation/components/ui/field";
import { useToast } from "@/presentation/contexts/toast-context";
import { authService } from "@/presentation/services/auth";
import { ROUTES, VALIDATION } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils/helpers";

const schema = z
  .object({
    email: z.string().min(1, "Email requis").email("Email invalide"),
    code: z.string().min(4, "Code à 4 chiffres minimum"),
    password: z
      .string()
      .min(VALIDATION.PASSWORD_MIN_LENGTH, `Au moins ${VALIDATION.PASSWORD_MIN_LENGTH} caractères`),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

function ResetForm() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: searchParams.get("email") ?? "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await authService.resetPassword({
        email: values.email.trim(),
        code: values.code.trim(),
        new_password: values.password,
      });
      toast.success("Mot de passe réinitialisé", "Connectez-vous avec votre nouveau mot de passe.");
      router.replace(ROUTES.LOGIN);
    } catch (err) {
      toast.error("Réinitialisation impossible", getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Field label="Adresse email" htmlFor="email" error={errors.email?.message} required>
        <Input id="email" type="email" invalid={!!errors.email} {...register("email")} />
      </Field>

      <Field label="Code reçu par email" htmlFor="code" error={errors.code?.message} required>
        <Input
          id="code"
          inputMode="numeric"
          placeholder="123456"
          leadingIcon={<KeyRound />}
          invalid={!!errors.code}
          {...register("code")}
        />
      </Field>

      <Field
        label="Nouveau mot de passe"
        htmlFor="password"
        error={errors.password?.message}
        required
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          leadingIcon={<Lock />}
          invalid={!!errors.password}
          {...register("password")}
        />
      </Field>

      <Field label="Confirmer" htmlFor="confirm" error={errors.confirm?.message} required>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          leadingIcon={<Lock />}
          invalid={!!errors.confirm}
          {...register("confirm")}
        />
      </Field>

      <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
        Réinitialiser
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Réinitialiser le mot de passe
        </h1>
        <p className="text-sm text-muted">
          Entrez le code reçu par email et choisissez un nouveau mot de passe.
        </p>
      </div>

      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>

      <Link
        href={ROUTES.LOGIN}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour à la connexion
      </Link>
    </div>
  );
}
