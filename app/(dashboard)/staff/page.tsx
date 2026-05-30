"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Search, Shield } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
import { Pagination } from "@/presentation/components/shared/pagination";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";
import { useAsync, useDebounce } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { userService } from "@/presentation/services/user";
import { GRANT_LABELS, ROLE_LABELS, ROUTES } from "@/lib/constants";
import { ADMIN_ROLES, Grant, UserRole } from "@/lib/enums";
import { formatDate, formatPhone, fullName } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { UserListResponse } from "@/lib/types";

const PER_PAGE = 20;

const ROLE_OPTIONS = [
  { value: "all", label: "Tous les rôles staff" },
  ...ADMIN_ROLES.map((r) => ({
    value: r,
    label: ROLE_LABELS[r] ?? r,
  })),
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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 350);

  const roles = useMemo(() => {
    if (roleFilter === "all") return ADMIN_ROLES;
    return [roleFilter];
  }, [roleFilter]);

  const fetchStaff = useCallback(
    () =>
      userService.listUsers({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        roles,
      }),
    [page, debouncedSearch, roles],
  );
  const { data, isLoading, error, execute } =
    useAsync<UserListResponse>(fetchStaff);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE));

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

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Input
              placeholder="Rechercher (nom, téléphone, email)…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leadingIcon={<Search />}
            />
          </div>
          <Select
            value={roleFilter}
            options={ROLE_OPTIONS}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

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
