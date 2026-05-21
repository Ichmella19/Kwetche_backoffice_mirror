"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Field } from "@/presentation/components/ui/field";
import { useToast } from "@/presentation/contexts/toast-context";
import { authService } from "@/presentation/services/auth";
import { ROUTES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils/helpers";

const schema = z.object({
  email: z.string().min(1, "Email requis").email("Email invalide"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormValues) => {
    try {
      await authService.forgotPassword({ email: email.trim() });
      toast.success("Code envoyé", "Vérifiez votre boîte mail.");
      router.push(`${ROUTES.RESET_PASSWORD}?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      toast.error("Échec de l'envoi", getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Mot de passe oublié
        </h1>
        <p className="text-sm text-muted">
          Saisissez votre email pour recevoir un code de réinitialisation.
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

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          Envoyer le code
        </Button>
      </form>

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
