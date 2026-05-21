"use client";

import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  PiggyBank,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { StatCard } from "@/presentation/components/shared/stat-card";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { useAuth } from "@/presentation/contexts/auth-context";
import { useAsync } from "@/presentation/hooks";
import { dashboardService } from "@/presentation/services/dashboard";
import { ROUTES } from "@/lib/constants";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useAsync(() => dashboardService.getStats());

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bonjour ${user?.first_name ?? ""} 👋`}
        description="Vue d'ensemble de l'activité de la plateforme Kwetche."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Dossiers KYC en attente"
          value={data?.pendingKyc}
          icon={ShieldCheck}
          tone="warning"
          isLoading={isLoading}
          hint="À traiter dès que possible"
        />
        <StatCard label="Utilisateurs" value="—" icon={Users} tone="secondary" hint="Bientôt disponible" />
        <StatCard label="Volume wallet" value="—" icon={Banknote} tone="primary" hint="Bientôt disponible" />
        <StatCard label="Tontines actives" value="—" icon={PiggyBank} tone="accent" hint="Bientôt disponible" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                Vérification d&apos;identité
              </h3>
              <p className="text-sm text-muted">
                Examinez les pièces CIP et justificatifs soumis par les utilisateurs.
              </p>
            </div>
            <Button asChild>
              <Link href={ROUTES.KYC}>
                Ouvrir la file KYC
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <h3 className="text-sm font-semibold text-foreground">Modules à venir</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">Wallet</Badge>
              <Badge variant="neutral">Tontines</Badge>
              <Badge variant="neutral">Prêts</Badge>
              <Badge variant="neutral">Litiges</Badge>
            </div>
            <p className="text-sm text-muted">
              Ces modules seront branchés dès que les endpoints correspondants
              seront disponibles côté API.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
