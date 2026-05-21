"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Field } from "@/presentation/components/ui/field";
import { useAuth } from "@/presentation/contexts/auth-context";
import { useToast } from "@/presentation/contexts/toast-context";
import { ApiError } from "@/core/data/http.service";
import { ROUTES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils/helpers";

const schema = z.object({
  email: z.string().min(1, "Email requis").email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await login({ email: values.email.trim(), password: values.password });
      toast.success("Connexion réussie", "Bienvenue sur le back-office Kwetche.");
      router.replace(ROUTES.DASHBOARD);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : getErrorMessage(err);
      toast.error("Connexion impossible", message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Connexion
        </h1>
        <p className="text-sm text-muted">
          Accès réservé aux administrateurs de la plateforme.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Adresse email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@kwetche.com"
            leadingIcon={<Mail />}
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Field
          label="Mot de passe"
          htmlFor="password"
          error={errors.password?.message}
          required
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              leadingIcon={<Lock />}
              invalid={!!errors.password}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
              aria-label={showPassword ? "Masquer" : "Afficher"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link
            href={ROUTES.FORGOT_PASSWORD}
            className="text-sm font-medium text-primary hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          Se connecter
        </Button>
      </form>
    </div>
  );
}
