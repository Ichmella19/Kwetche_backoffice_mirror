"use client";

import { Ban, Check, Clock, Fingerprint, X } from "lucide-react";
import { Card } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { DocumentPreview } from "./document-preview";
import { KycLevelBadge } from "./kyc-level-badge";
import { KycStatusBadge } from "./kyc-status-badge";
import { kycDocumentLabel } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils/formatters";
import type { KycDocument } from "@/lib/types";

export type KycDocumentAction = "approve" | "decline" | "block";

interface KycDocumentCardProps {
  document: KycDocument;
  canReview: boolean;
  busy?: boolean;
  onReview: (document: KycDocument, action: KycDocumentAction) => void;
}

export function KycDocumentCard({
  document,
  canReview,
  busy,
  onReview,
}: KycDocumentCardProps) {
  const label = kycDocumentLabel(document.document_type);

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="p-3">
        <DocumentPreview fileUrl={document.file_url} label={label} />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{label}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <Clock className="size-3.5" />
              {formatRelativeTime(document.submitted_at)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <KycLevelBadge level={document.target_level} />
            <KycStatusBadge status={document.validation} />
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Fingerprint className="size-3.5 shrink-0" />
          <span className="truncate font-mono">{document.user_id}</span>
        </p>

        {document.review_reason && (
          <p className="rounded-md bg-danger-soft px-2 py-1 text-xs text-danger">
            Motif : {document.review_reason}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Button
            variant="accent"
            size="sm"
            disabled={!canReview || busy}
            onClick={() => onReview(document, "approve")}
          >
            <Check />
            Approuver
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canReview || busy}
            onClick={() => onReview(document, "decline")}
            className="text-danger hover:bg-danger-soft"
          >
            <X />
            Refuser
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canReview || busy}
            onClick={() => onReview(document, "block")}
          >
            <Ban />
            Bloquer
          </Button>
        </div>
      </div>
    </Card>
  );
}
