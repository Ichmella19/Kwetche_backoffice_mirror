"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { Button } from "@/presentation/components/ui/button";
import { Field } from "@/presentation/components/ui/field";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useToast } from "@/presentation/hooks";
import { tontineService } from "@/presentation/services/tontine";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { TontineNotifyAudience } from "@/lib/types";

const AUDIENCES: { value: TontineNotifyAudience; label: string }[] = [
  { value: "all", label: "Tous les membres" },
  { value: "active", label: "Membres actifs" },
  { value: "pending", label: "Inscrits (en attente du démarrage)" },
  { value: "defaulted", label: "Membres défaillants" },
];

const CHANNELS: { value: string; label: string }[] = [
  { value: "in_app", label: "In-app" },
  { value: "push", label: "Push" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
];

interface NotifyMembersDialogProps {
  tontineId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotifyMembersDialog({
  tontineId,
  open,
  onOpenChange,
}: NotifyMembersDialogProps) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<TontineNotifyAudience>("all");
  const [channels, setChannels] = useState<string[]>(["in_app", "push"]);
  const [busy, setBusy] = useState(false);

  function reset() {
    setTitle("");
    setBody("");
    setAudience("all");
    setChannels(["in_app", "push"]);
  }

  function toggleChannel(value: string) {
    setChannels((prev) =>
      prev.includes(value)
        ? prev.filter((c) => c !== value)
        : [...prev, value],
    );
  }

  async function submit() {
    if (!title.trim() || !body.trim()) {
      toast.error("Titre et message sont obligatoires.");
      return;
    }
    if (channels.length === 0) {
      toast.error("Sélectionnez au moins un canal.");
      return;
    }
    setBusy(true);
    try {
      const result = await tontineService.notifyMembers(tontineId, {
        title,
        body,
        audience,
        channels,
      });
      toast.success(
        `Notification envoyée à ${result.recipients} membre(s).`,
      );
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Notifier les membres</DialogTitle>
          <DialogDescription>
            Message ciblé envoyé aux membres de la tontine via les canaux
            sélectionnés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field htmlFor="notify-audience" label="Destinataires">
            <Select
              id="notify-audience"
              value={audience}
              options={AUDIENCES}
              onChange={(e) =>
                setAudience(e.target.value as TontineNotifyAudience)
              }
            />
          </Field>

          <Field htmlFor="notify-title" label="Titre">
            <Input
              id="notify-title"
              value={title}
              maxLength={140}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Rappel de cotisation"
            />
          </Field>

          <Field htmlFor="notify-body" label="Message">
            <Textarea
              id="notify-body"
              rows={4}
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
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Annuler
          </Button>
          <Button onClick={submit} isLoading={busy}>
            <Send className="size-4" />
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
