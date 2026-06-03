"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Paperclip, Send, X } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { ErrorState } from "@/presentation/components/shared/error";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Select } from "@/presentation/components/ui/select";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useAsync, useRealtime, useToast } from "@/presentation/hooks";
import { supportService } from "@/presentation/services/support";
import { ROUTES } from "@/lib/constants";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS,
  SupportTicketStatus,
} from "@/lib/enums";
import { formatDateTime } from "@/lib/utils/formatters";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { SupportMessage, SupportTicketThread } from "@/lib/types";

const STATUS_OPTIONS = Object.values(SupportTicketStatus).map((v) => ({
  value: v,
  label: SUPPORT_STATUS_LABELS[v] ?? v,
}));

const MAX_ATTACHMENTS = 5;

function variantOf(status: string): "secondary" | "danger" | "neutral" {
  if (status === SupportTicketStatus.RESOLVED) return "secondary";
  if (status === SupportTicketStatus.OPEN) return "danger";
  return "neutral";
}

export default function SupportTicketDetailPage() {
  const router = useRouter();
  const params = useParams<{ ticketId: string }>();
  const id = params.ticketId;
  const toast = useToast();
  const [composer, setComposer] = useState("");
  const [statusOnSend, setStatusOnSend] = useState<string>(
    SupportTicketStatus.IN_PROGRESS,
  );
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const fetchThread = useCallback(
    () => supportService.detail(id),
    [id],
  );
  const { data, isLoading, error, execute } =
    useAsync<SupportTicketThread>(fetchThread);

  useRealtime(["support.ticket.updated"], (event) => {
    const payload = event.data as { id?: string } | null;
    if (!payload || payload.id === id) void execute();
  });

  const ticket = data?.ticket ?? null;
  const messages: SupportMessage[] = data?.messages ?? [];

  const pickFiles = () => fileInput.current?.click();

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    const remaining = MAX_ATTACHMENTS - files.length;
    if (remaining <= 0) {
      toast.error("Trop de pièces jointes", "Maximum 5 fichiers par message.");
      return;
    }
    const added = Array.from(list).slice(0, remaining);
    setFiles((f) => [...f, ...added]);
    e.target.value = "";
  };

  const removeFile = (index: number) =>
    setFiles((f) => f.filter((_, i) => i !== index));

  const submit = async () => {
    if (composer.trim().length === 0 && files.length === 0) {
      toast.error("Message vide", "Tapez un message ou ajoutez un fichier.");
      return;
    }
    setBusy(true);
    try {
      await supportService.addMessage(id, {
        content: composer.trim() || undefined,
        files,
        status: statusOnSend,
      });
      toast.success("Message envoyé.");
      setComposer("");
      setFiles([]);
      void execute();
    } catch (err) {
      toast.error("Échec envoi", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (next: string) => {
    if (!ticket || next === ticket.status) return;
    setBusy(true);
    try {
      await supportService.updateStatus(id, { status: next });
      toast.success("Statut mis à jour.");
      void execute();
    } catch (err) {
      toast.error("Échec mise à jour", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ticket support" />
        <ErrorState
          title="Impossible de charger le ticket"
          message={getErrorMessage(error)}
          onRetry={execute}
        />
      </div>
    );
  }

  if (isLoading || !ticket) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ticket support" />
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const canStillRespond = ticket.status !== SupportTicketStatus.CLOSED;

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.subject}
        description={`Catégorie : ${SUPPORT_CATEGORY_LABELS[ticket.category] ?? ticket.category}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={variantOf(ticket.status)}>
              {SUPPORT_STATUS_LABELS[ticket.status] ?? ticket.status}
            </Badge>
            <Select
              value={ticket.status}
              options={STATUS_OPTIONS}
              onChange={(e) => changeStatus(e.target.value)}
              disabled={busy}
              aria-label="Statut"
            />
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="text-sm text-muted-foreground">
            {ticket.user ? (
              <Link
                href={`${ROUTES.USERS}/${ticket.user_id}`}
                className="font-medium hover:underline"
              >
                {ticket.user.first_name} {ticket.user.last_name}
              </Link>
            ) : (
              <span className="font-mono text-xs">{ticket.user_id}</span>
            )}
            {ticket.user?.phone ? (
              <span>
                {" "}
                · {ticket.user.country_code ?? ""}
                {ticket.user.phone}
              </span>
            ) : null}
            {ticket.user?.email ? <span> · {ticket.user.email}</span> : null}
            <span> · Créé le {formatDateTime(ticket.created_at)}</span>
            <span> · {ticket.message_count ?? messages.length} message(s)</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          {messages.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Aucun message pour le moment.
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}
        </CardContent>
      </Card>

      {canStillRespond ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="text-sm font-medium">Répondre à l&apos;utilisateur</div>
            <Textarea
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              rows={5}
              placeholder="Tapez votre message…"
              maxLength={4000}
            />

            {files.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between rounded-md bg-muted px-2 py-1"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Retirer la pièce jointe"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={onFilesChange}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pickFiles}
                  disabled={busy}
                >
                  <Paperclip className="mr-1.5 h-4 w-4" />
                  Joindre ({files.length}/{MAX_ATTACHMENTS})
                </Button>
                <Select
                  value={statusOnSend}
                  options={STATUS_OPTIONS}
                  onChange={(e) => setStatusOnSend(e.target.value)}
                  disabled={busy}
                  aria-label="Statut après envoi"
                />
              </div>
              <Button isLoading={busy} onClick={submit}>
                <Send className="mr-1.5 h-4 w-4" />
                Envoyer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => router.push(ROUTES.SUPPORT)}>
          Retour à la liste
        </Button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: SupportMessage }) {
  const isAgent = message.sender_type === "agent";
  const isSystem = message.sender_type === "system";
  const align = isAgent ? "items-end" : "items-start";
  const bubble = isAgent
    ? "bg-emerald-50 dark:bg-emerald-950"
    : isSystem
      ? "bg-muted"
      : "bg-card border";
  return (
    <div className={`flex flex-col ${align} gap-1`}>
      <div className="text-xs text-muted-foreground">
        {isAgent ? "Agent" : isSystem ? "Système" : "Utilisateur"} ·{" "}
        {formatDateTime(message.created_at)}
      </div>
      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${bubble}`}>
        {message.content ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : null}
        {message.attachments.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att) =>
              att.file_kind === "image" ? (
                <a
                  key={att.id}
                  href={att.file_path}
                  target="_blank"
                  rel="noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={att.file_path}
                    alt={att.file_name ?? "image"}
                    className="h-24 w-24 rounded-md object-cover"
                  />
                </a>
              ) : (
                <a
                  key={att.id}
                  href={att.file_path}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs hover:bg-muted"
                >
                  <Paperclip className="h-3 w-3" />
                  <span className="max-w-[200px] truncate">
                    {att.file_name ?? "pièce jointe"}
                  </span>
                </a>
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
