"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  Plus,
  RotateCcw,
  Search,
  ShieldOff,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { ErrorState } from "@/presentation/components/shared/error";
import { Pagination } from "@/presentation/components/shared/pagination";
import { ConfirmDialog } from "@/presentation/components/shared/confirm-dialog";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Field } from "@/presentation/components/ui/field";
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
import { Textarea } from "@/presentation/components/ui/textarea";
import { useAsync, useDebounce, useToast } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { userService } from "@/presentation/services/user";
import { GRANT_LABELS, ROLE_LABELS } from "@/lib/constants";
import { Grant, UserRole } from "@/lib/enums";
import { formatDate, formatPhone, fullName } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  User,
  UserListResponse,
} from "@/lib/types";

const PER_PAGE = 20;
const EDITABLE_ROLES = [UserRole.USER, UserRole.ASSISTANT, UserRole.ADMIN];
const GRANTS = Object.values(Grant);
const GRANT_CAPABLE_ROLES = [UserRole.ASSISTANT, UserRole.ADMIN];
const ROLE_DEFAULT_GRANTS: Record<string, string[]> = {
  [UserRole.USER]: [],
  [UserRole.ASSISTANT]: [Grant.USER_READ, Grant.KYC_REVIEW],
  [UserRole.ADMIN]: GRANTS,
};

type ModalMode = "create" | "edit";
type Decision = "disable" | "enable" | "delete";

interface UserFormState {
  first_name: string;
  last_name: string;
  phone: string;
  country_code: string;
  email: string;
  password: string;
  role: string;
  grants: string[];
  is_verified: boolean;
  is_desactivate: boolean;
}

const emptyForm: UserFormState = {
  first_name: "",
  last_name: "",
  phone: "",
  country_code: "+229",
  email: "",
  password: "",
  role: UserRole.USER,
  grants: [],
  is_verified: true,
  is_desactivate: false,
};

function formFromUser(user: User): UserFormState {
  return {
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    country_code: user.country_code,
    email: user.email ?? "",
    password: "",
    role: user.role,
    grants: user.grants ?? [],
    is_verified: user.is_verified,
    is_desactivate: user.is_desactivate,
  };
}

function StatusBadges({ user }: { user: User }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={user.is_verified ? "success" : "warning"}>
        {user.is_verified ? "Vérifié" : "Non vérifié"}
      </Badge>
      <Badge variant={user.is_desactivate ? "danger" : "success"}>
        {user.is_desactivate ? "Désactivé" : "Actif"}
      </Badge>
      {user.is_deleted && <Badge variant="danger">Supprimé</Badge>}
    </div>
  );
}

export default function UsersPage() {
  const toast = useToast();
  const { hasGrant, user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [target, setTarget] = useState<User | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const canWrite = hasGrant(Grant.USER_WRITE);
  const canDisable = hasGrant(Grant.USER_DISABLE);
  const canDelete = hasGrant(Grant.USER_DELETE);

  const fetchUsers = useMemo(
    () => () =>
      userService.listUsers({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch,
        includeDeleted,
      }),
    [page, debouncedSearch, includeDeleted],
  );
  const { data, isLoading, error, execute } =
    useAsync<UserListResponse>(fetchUsers);

  const openCreate = () => {
    setTarget(null);
    setForm(emptyForm);
    setModalMode("create");
  };

  const openEdit = (user: User) => {
    setTarget(user);
    setForm(formFromUser(user));
    setModalMode("edit");
  };

  const closeModal = () => {
    if (busy) return;
    setModalMode(null);
    setTarget(null);
  };

  const toggleGrant = (grant: string) => {
    if (!GRANT_CAPABLE_ROLES.includes(form.role as UserRole)) return;
    setForm((prev) => ({
      ...prev,
      grants: prev.grants.includes(grant)
        ? prev.grants.filter((item) => item !== grant)
        : [...prev.grants, grant],
    }));
  };

  const setRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      role,
      grants: ROLE_DEFAULT_GRANTS[role] ?? [],
    }));
  };

  const submitForm = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Champs requis", "Le prénom et le nom sont obligatoires.");
      return;
    }
    if (
      modalMode === "create" &&
      (!form.phone.trim() || form.password.length < 6)
    ) {
      toast.error(
        "Création impossible",
        "Téléphone et mot de passe de 6 caractères minimum requis.",
      );
      return;
    }
    const grants = GRANT_CAPABLE_ROLES.includes(form.role as UserRole)
      ? form.grants
      : [];

    setBusy(true);
    try {
      if (modalMode === "create") {
        const payload: AdminCreateUserInput = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim(),
          country_code: form.country_code.trim() || "+229",
          email: form.email.trim() || null,
          password: form.password,
          role: form.role,
          grants,
          is_verified: form.is_verified,
        };
        await userService.createUser(payload);
        toast.success("Utilisateur créé");
      } else if (target) {
        const payload: AdminUpdateUserInput = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim() || null,
          role: form.role,
          grants,
          is_verified: form.is_verified,
          is_desactivate: form.is_desactivate,
        };
        await userService.updateUser(target.id, payload);
        toast.success("Utilisateur mis à jour");
      }
      closeModal();
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openDecision = (user: User, next: Decision) => {
    setTarget(user);
    setDecision(next);
    setReason("");
  };

  const confirmDecision = async () => {
    if (!target || !decision) return;
    if (decision === "delete" && reason.trim().length < 3) {
      toast.error("Motif requis", "Indiquez un motif de suppression.");
      return;
    }

    setBusy(true);
    try {
      if (decision === "disable") {
        await userService.disableUser(target.id, reason);
        toast.success("Compte désactivé");
      } else if (decision === "enable") {
        await userService.enableUser(target.id, reason);
        toast.success("Compte réactivé");
      } else {
        await userService.deleteUser(target.id, reason);
        toast.success("Compte supprimé");
      }
      setDecision(null);
      setTarget(null);
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const totalPages = Math.max(1, data?.pages ?? 1);
  const decisionTitle =
    decision === "delete"
      ? "Supprimer ce compte ?"
      : decision === "disable"
        ? "Désactiver ce compte ?"
        : "Réactiver ce compte ?";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Consultez et administrez les comptes de la plateforme."
        actions={
          canWrite && (
            <Button onClick={openCreate}>
              <Plus />
              Créer
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher nom, téléphone, email..."
            leadingIcon={<Search />}
            className="sm:w-96"
          />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.target.checked);
                setPage(1);
              }}
            />
            Inclure supprimés
          </label>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => execute()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun utilisateur"
          description="Aucun compte ne correspond aux filtres actifs."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => {
                const isSelf = item.id === currentUser?.id;
                const isSuperAdmin = item.role === UserRole.SUPER_ADMIN;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">
                        {fullName(item.first_name, item.last_name)}
                      </p>
                      <p className="text-xs text-muted">{item.id}</p>
                    </TableCell>
                    <TableCell>
                      <p>{formatPhone(item.phone, item.country_code)}</p>
                      <p className="text-xs text-muted">{item.email ?? "—"}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ROLE_LABELS[item.role] ?? item.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadges user={item} />
                    </TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/users/${item.id}`}>
                            <Eye />
                            Détail
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canWrite || (isSuperAdmin && !isSelf)}
                          onClick={() => openEdit(item)}
                        >
                          <UserCog />
                          Modifier
                        </Button>
                        {item.is_desactivate ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!canDisable || isSuperAdmin}
                            onClick={() => openDecision(item, "enable")}
                          >
                            <RotateCcw />
                            Réactiver
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!canDisable || isSuperAdmin}
                            onClick={() => openDecision(item, "disable")}
                          >
                            <ShieldOff />
                            Désactiver
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={!canDelete || isSelf || isSuperAdmin}
                          onClick={() => openDecision(item, "delete")}
                        >
                          <Trash2 />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ConfirmDialog
        open={modalMode !== null}
        onOpenChange={(open) => (open ? null : closeModal())}
        title={
          modalMode === "create"
            ? "Créer un utilisateur"
            : "Modifier l'utilisateur"
        }
        description="Les champs disponibles respectent les règles de modération backend."
        confirmLabel={modalMode === "create" ? "Créer" : "Enregistrer"}
        isLoading={busy}
        onConfirm={submitForm}
      >
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Prénom" required>
              <Input
                value={form.first_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, first_name: e.target.value }))
                }
              />
            </Field>
            <Field label="Nom" required>
              <Input
                value={form.last_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, last_name: e.target.value }))
                }
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
            <Field label="Indicatif">
              <Input
                value={form.country_code}
                disabled={modalMode === "edit"}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, country_code: e.target.value }))
                }
              />
            </Field>
            <Field label="Téléphone" required={modalMode === "create"}>
              <Input
                value={form.phone}
                disabled={modalMode === "edit"}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </Field>
          </div>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </Field>
          {modalMode === "create" && (
            <Field label="Mot de passe" required>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </Field>
          )}
          <Field label="Rôle">
            <Select
              value={form.role}
              onChange={(e) => setRole(e.target.value)}
              options={EDITABLE_ROLES.map((role) => ({
                value: role,
                label: ROLE_LABELS[role] ?? role,
              }))}
            />
          </Field>
          {!GRANT_CAPABLE_ROLES.includes(form.role as UserRole) && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted">
              Les permissions fines sont réservées aux rôles assistant et
              administrateur. Un utilisateur mobile standard n&apos;a pas de
              grants back-office.
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_verified}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    is_verified: e.target.checked,
                  }))
                }
              />
              Compte vérifié
            </label>
            {modalMode === "edit" && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_desactivate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_desactivate: e.target.checked,
                    }))
                  }
                />
                Compte désactivé
              </label>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">Grants</p>
              {GRANT_CAPABLE_ROLES.includes(form.role as UserRole) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      grants: ROLE_DEFAULT_GRANTS[prev.role] ?? [],
                    }))
                  }
                >
                  Grants du rôle
                </Button>
              )}
            </div>
            <div className="grid max-h-56 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
              {GRANTS.map((grant) => (
                <label key={grant} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.grants.includes(grant)}
                    onChange={() => toggleGrant(grant)}
                    disabled={
                      !GRANT_CAPABLE_ROLES.includes(form.role as UserRole)
                    }
                    className="mt-1"
                  />
                  <span>{GRANT_LABELS[grant] ?? grant}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setDecision(null);
            setTarget(null);
          }
        }}
        title={decisionTitle}
        description={
          target ? fullName(target.first_name, target.last_name) : undefined
        }
        confirmLabel={decision === "delete" ? "Supprimer" : "Confirmer"}
        confirmVariant={decision === "delete" ? "danger" : "primary"}
        isLoading={busy}
        onConfirm={confirmDecision}
      >
        <Field label="Motif" required={decision === "delete"}>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif interne de modération."
            maxLength={1000}
          />
        </Field>
      </ConfirmDialog>
    </div>
  );
}
