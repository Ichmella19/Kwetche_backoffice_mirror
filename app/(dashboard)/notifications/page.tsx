"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Loader2, Search, Send, X } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/presentation/components/ui/avatar";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Field } from "@/presentation/components/ui/field";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useToast } from "@/presentation/hooks";
import { notificationService } from "@/presentation/services/notification";
import { userService } from "@/presentation/services/user";
import {
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_TYPE_LABELS,
  NotificationChannel,
  NotificationType,
} from "@/lib/enums";
import { fullName, getInitials } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { User } from "@/lib/types";

const TYPE_OPTIONS = Object.values(NotificationType).map((v) => ({
  value: v,
  label: NOTIFICATION_TYPE_LABELS[v] ?? v,
}));

const CHANNELS = Object.values(NotificationChannel).map((v) => ({
  value: v,
  label: NOTIFICATION_CHANNEL_LABELS[v] ?? v,
}));

export default function NotificationsPage() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<User[]>([]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<string>(NotificationType.SYSTEM);
  const [channels, setChannels] = useState<string[]>([
    NotificationChannel.IN_APP,
    NotificationChannel.PUSH,
  ]);
  const [sending, setSending] = useState(false);

  // Recherche debouncée d'utilisateurs.
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await userService.listUsers({ search: q, perPage: 10 });
        setResults(res.items);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  const selectedIds = useMemo(
    () => new Set(selected.map((u) => u.id)),
    [selected],
  );

  const addUser = useCallback((u: User) => {
    setSelected((prev) =>
      prev.some((x) => x.id === u.id) ? prev : [...prev, u],
    );
  }, []);

  const removeUser = useCallback((id: string) => {
    setSelected((prev) => prev.filter((u) => u.id !== id));
  }, []);

  function toggleChannel(value: string) {
    setChannels((prev) =>
      prev.includes(value)
        ? prev.filter((c) => c !== value)
        : [...prev, value],
    );
  }

  async function submit() {
    if (selected.length === 0) {
      toast.error("Sélectionnez au moins un destinataire.");
      return;
    }
    if (!title.trim() || !body.trim()) {
      toast.error("Titre et message sont obligatoires.");
      return;
    }
    if (channels.length === 0) {
      toast.error("Sélectionnez au moins un canal.");
      return;
    }
    setSending(true);
    try {
      const res = await notificationService.send({
        user_ids: selected.map((u) => u.id),
        title,
        body,
        type,
        channels,
      });
      toast.success(
        `Notification envoyée à ${res.sent} destinataire(s).`,
      );
      setTitle("");
      setBody("");
      setSelected([]);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Envoyez une notification ciblée (push / email / SMS / in-app) à un ou plusieurs membres."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* ── Destinataires ─────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Destinataires ({selected.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un membre (nom, téléphone, email)…"
                className="pl-9"
              />
              {searching ? (
                <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" />
              ) : null}
            </div>

            {results.length > 0 ? (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-1">
                {results.map((u) => {
                  const already = selectedIds.has(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      disabled={already}
                      onClick={() => addUser(u)}
                      className="flex w-full items-center gap-3 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted-soft disabled:opacity-40"
                    >
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(u.first_name, u.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1 truncate">
                        {fullName(u.first_name, u.last_name)}
                      </span>
                      <span className="text-xs text-muted">
                        {u.country_code} {u.phone}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selected.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary"
                  >
                    {fullName(u.first_name, u.last_name)}
                    <button
                      type="button"
                      onClick={() => removeUser(u.id)}
                      className="rounded-full hover:bg-primary/20"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Aucun destinataire sélectionné.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Composition ───────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4" />
              Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <Field htmlFor="notif-type" label="Catégorie">
              <Select
                id="notif-type"
                value={type}
                options={TYPE_OPTIONS}
                onChange={(e) => setType(e.target.value)}
              />
            </Field>

            <Field htmlFor="notif-title" label="Titre">
              <Input
                id="notif-title"
                value={title}
                maxLength={140}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Maintenance prévue"
              />
            </Field>

            <Field htmlFor="notif-body" label="Message">
              <Textarea
                id="notif-body"
                rows={5}
                value={body}
                maxLength={2000}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Contenu du message…"
              />
            </Field>

            <div>
              <p className="mb-2 text-sm font-medium">Canaux</p>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((c) => {
                  const active = channels.includes(c.value);
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => toggleChannel(c.value)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Badge variant="neutral">
                {selected.length} destinataire{selected.length > 1 ? "s" : ""}
              </Badge>
              <Button onClick={submit} isLoading={sending}>
                <Send className="size-4" />
                Envoyer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
