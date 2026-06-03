"use client";

import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Field } from "@/presentation/components/ui/field";
import { Input } from "@/presentation/components/ui/input";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useToast } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { notificationService } from "@/presentation/services/notification";
import {
  Grant,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_TYPE_LABELS,
  NotificationChannel,
  NotificationType,
} from "@/lib/enums";
import { getErrorMessage } from "@/lib/utils/helpers";

export function NotificationSendCard({ userId }: { userId: string }) {
  const toast = useToast();
  const { hasGrant } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<string>(NotificationType.SYSTEM);
  const [channels, setChannels] = useState<string[]>([
    NotificationChannel.IN_APP,
    NotificationChannel.PUSH,
  ]);
  const [busy, setBusy] = useState(false);

  if (!hasGrant(Grant.NOTIFICATION_SEND)) return null;

  const toggleChannel = (c: string) =>
    setChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Champs requis", "Indiquez un titre et un message.");
      return;
    }
    if (channels.length === 0) {
      toast.error("Canal requis", "Choisissez au moins un canal.");
      return;
    }
    setBusy(true);
    try {
      const res = await notificationService.send({
        user_ids: [userId],
        title,
        body,
        type,
        channels,
      });
      toast.success(`Notification envoyée (${res.sent})`);
      setTitle("");
      setBody("");
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envoyer une notification</CardTitle>
        <CardDescription>
          Notification ou rappel multi-canal à cet utilisateur.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Titre">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Message">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
          />
        </Field>
        <Field label="Type">
          <div className="flex flex-wrap gap-2">
            {Object.values(NotificationType).map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={type === t ? "accent" : "outline"}
                onClick={() => setType(t)}
              >
                {NOTIFICATION_TYPE_LABELS[t]}
              </Button>
            ))}
          </div>
        </Field>
        <Field label="Canaux">
          <div className="flex flex-wrap gap-2">
            {Object.values(NotificationChannel).map((c) => (
              <Button
                key={c}
                type="button"
                size="sm"
                variant={channels.includes(c) ? "accent" : "outline"}
                onClick={() => toggleChannel(c)}
              >
                {NOTIFICATION_CHANNEL_LABELS[c]}
              </Button>
            ))}
          </div>
        </Field>
        <Button
          onClick={send}
          isLoading={busy}
          disabled={!title.trim() || !body.trim()}
        >
          Envoyer
        </Button>
      </CardContent>
    </Card>
  );
}
