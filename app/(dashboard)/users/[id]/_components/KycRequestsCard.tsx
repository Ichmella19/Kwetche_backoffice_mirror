"use client";

import { useEffect, useMemo, useState } from "react";
import type { BadgeProps } from "@/presentation/components/ui/badge";
import { Badge } from "@/presentation/components/ui/badge";
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
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useAsync, useToast } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { kycService } from "@/presentation/services/kyc";
import { Grant, KycRequestStatus, kycRequestStatusLabel } from "@/lib/enums";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { KycDocumentRequest } from "@/lib/types";

function requestStatusVariant(status: string): BadgeProps["variant"] {
  if (status === KycRequestStatus.FULFILLED) return "success";
  if (status === KycRequestStatus.CANCELLED) return "neutral";
  return "warning";
}

export function KycRequestsCard({ userId }: { userId: string }) {
  const toast = useToast();
  const { hasGrant } = useAuth();
  const canManage = hasGrant(Grant.KYC_REVIEW);

  const fetchRequests = useMemo(
    () => () => kycService.listRequests(userId),
    [userId],
  );
  const { data, isLoading, execute } = useAsync<KycDocumentRequest[]>(
    fetchRequests,
    false,
  );

  const [level, setLevel] = useState(2);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    execute().catch(() => undefined);
  }, [execute]);

  const create = async () => {
    if (label.trim().length < 2) {
      toast.error("Libellé requis", "Décrivez le document à fournir.");
      return;
    }
    setBusy(true);
    try {
      await kycService.createRequest({
        user_id: userId,
        target_level: level,
        label,
        note,
      });
      toast.success("Demande envoyée à l'utilisateur");
      setLabel("");
      setNote("");
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    setCancelingId(id);
    try {
      await kycService.cancelRequest(id);
      toast.success("Demande annulée");
      await execute();
    } catch (err) {
      toast.error("Action impossible", getErrorMessage(err));
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents complémentaires</CardTitle>
        <CardDescription>
          Réclamez des pièces supplémentaires (niveau 2/3) à l&apos;utilisateur.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {canManage && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Niveau">
              <div className="flex gap-2">
                {[2, 3].map((l) => (
                  <Button
                    key={l}
                    type="button"
                    size="sm"
                    variant={level === l ? "accent" : "outline"}
                    onClick={() => setLevel(l)}
                  >
                    Niveau {l}
                  </Button>
                ))}
              </div>
            </Field>
            <Field label="Document demandé">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex : Facture SBEE récente"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Note (optionnel)">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Précisions pour l'utilisateur"
                  maxLength={1000}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Button onClick={create} isLoading={busy} disabled={!label.trim()}>
                Réclamer le document
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted">
            Aucune demande pour cet utilisateur.
          </p>
        ) : (
          <div className="space-y-2">
            {data.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {req.label}{" "}
                    <span className="text-xs text-muted">
                      · niv. {req.target_level}
                    </span>
                  </p>
                  {req.note && (
                    <p className="text-xs text-muted">{req.note}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={requestStatusVariant(req.status)}>
                    {kycRequestStatusLabel(req.status)}
                  </Badge>
                  {canManage && req.status === KycRequestStatus.PENDING && (
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={cancelingId === req.id}
                      onClick={() => cancel(req.id)}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
