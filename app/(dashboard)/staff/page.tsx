"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Shield } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
import { Pagination } from "@/presentation/components/shared/pagination";
import {
  AdvancedFilters,
  type FilterField,
  type FilterValues,
} from "@/presentation/components/shared/advanced-filters";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";
import { useAsync } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { userService } from "@/presentation/services/user";
import { GRANT_LABELS, ROLE_LABELS, ROUTES } from "@/lib/constants";
import { ADMIN_ROLES, Grant, UserRole } from "@/lib/enums";
import { formatDate, formatPhone, fullName } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { UserListResponse } from "@/lib/types";

const PER_PAGE = 20;

const STAFF_FILTERS: FilterField[] = [
  {
    kind: "text",
    key: "search",
    label: "Recherche",
    placeholder: "Nom, téléphone, email…",
  },
  {
    kind: "multi",
    key: "roles",
    label: "Rôles staff",
    options: ADMIN_ROLES.map((r) => ({
      value: r,
      label: ROLE_LABELS[r] ?? r,
    })),
  },
  {
    kind: "boolean",
    key: "is_desactivate",
    label: "Comptes désactivés uniquement",
    trueLabel: "Désactivés",
    falseLabel: "Actifs",
  },
  {
    kind: "date-range",
    key: "created",
    label: "Date de création",
  },
  {
    kind: "select",
    key: "sort",
    label: "Tri",
    placeholder: "Plus récent",
    options: [
      { value: "created_desc", label: "Création (récent)" },
      { value: "created_asc", label: "Création (ancien)" },
      { value: "name_asc", label: "Nom (A→Z)" },
      { value: "last_login_desc", label: "Dernière connexion" },
    ],
  },
];

function roleVariant(role: string): "danger" | "secondary" | "neutral" {
  if (role === UserRole.SUPER_ADMIN) return "danger";
  if (role === UserRole.ADMIN) return "secondary";
  return "neutral";
}

export default function StaffPage() {
  const { hasGrant } = useAuth();
  const canRead = hasGrant(Grant.USER_READ);
  const [page, setPage] = useState(1);
  const [values, setValues] = useState<FilterValues>({});

  const fetchStaff = useCallback(() => {
    const v = values;
    const asStr = (k: string) =>
      typeof v[k] === "string" ? (v[k] as string) : undefined;
    const asArr = (k: string) =>
      Array.isArray(v[k]) ? (v[k] as string[]) : undefined;
    const asBool = (k: string) =>
      v[k] === "true" ? true : v[k] === "false" ? false : undefined;
    const roles = asArr("roles");
    return userService.listUsers({
      page,
      perPage: PER_PAGE,
      search: asStr("search"),
      roles: roles && roles.length > 0 ? roles : ADMIN_ROLES,
      isDesactivate: asBool("is_desactivate"),
      createdAtFrom: asStr("created_from"),
      createdAtTo: asStr("created_to"),
      sort: asStr("sort") ?? "created_desc",
    });
  }, [page, values]);

  const { data, isLoading, error, execute } =
    useAsync<UserListResponse>(fetchStaff);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE)),
    [data?.total],
  );

  if (!canRead) {
    return (
      <ErrorState message="Vous n'avez pas la permission de voir l'équipe." />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipe staff"
        description="Administrateurs, assistants et agents de recouvrement. Crée un nouvel agent depuis l'écran Utilisateurs."
        actions={
          <Button asChild variant="outline">
            <Link href={ROUTES.USERS}>
              <Shield className="size-4" />
              Créer / éditer un compte
            </Link>
          </Button>
        }
      />

      <AdvancedFilters
        fields={STAFF_FILTERS}
        onApply={setValues}
        onPageReset={() => setPage(1)}
        collapsible
      />

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={execute} />
      ) : isLoading && !data ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Aucun membre staff"
          description="Aucun compte staff ne correspond à ces critères."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Grants</TableHead>
                  <TableHead>Créé</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {fullName(u.first_name, u.last_name) || "—"}
                    </TableCell>
                    <TableCell>
                      {formatPhone(u.country_code, u.phone)}
                    </TableCell>
                    <TableCell className="text-xs">{u.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={roleVariant(u.role)}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.role === UserRole.SUPER_ADMIN ? (
                        <span className="text-xs text-muted italic">
                          Bypass (toutes les grants)
                        </span>
                      ) : u.grants && u.grants.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.grants.slice(0, 3).map((g) => (
                            <Badge key={g} variant="outline">
                              {GRANT_LABELS[g] ?? g}
                            </Badge>
                          ))}
                          {u.grants.length > 3 && (
                            <Badge variant="outline">
                              +{u.grants.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Aucune</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(u.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`${ROUTES.USERS}/${u.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data && data.total > PER_PAGE && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
