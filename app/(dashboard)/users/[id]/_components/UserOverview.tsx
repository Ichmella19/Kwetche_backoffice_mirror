import { Badge } from "@/presentation/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { ROLE_LABELS } from "@/lib/constants";
import {
  formatDate,
  formatDateTime,
  formatPhone,
  fullName,
} from "@/lib/utils/formatters";
import type { User } from "@/lib/types";
import { Stat } from "./Stat";

export function UserOverview({ user }: { user: User }) {
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
