"use client";

import { Check, Clock, Fingerprint, X } from "lucide-react";
import { Card } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { DocumentPreview } from "./document-preview";
import { KycLevelBadge } from "./kyc-level-badge";
import { KYC_DOCUMENT_LABELS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils/formatters";
import type { KycDocument } from "@/lib/types";

interface KycDocumentCardProps {
  document: KycDocument;
  canApprove: boolean;
  canReject: boolean;
  busy?: boolean;
  onApprove: (document: KycDocument) => void;
  onReject: (document: KycDocument) => void;
}

export function KycDocumentCard({
  document,
  canApprove,
  canReject,
  busy,
  onApprove,
  onReject,
}: KycDocumentCardProps) {
  const label = KYC_DOCUMENT_LABELS[document.document_type] ?? document.document_type;

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
          <KycLevelBadge level={document.target_level} />
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Fingerprint className="size-3.5 shrink-0" />
          <span className="truncate font-mono">{document.user_id}</span>
        </p>

        <div className="mt-auto flex gap-2 pt-1">
          <Button
            variant="accent"
            size="sm"
            fullWidth
            disabled={!canApprove || busy}
            onClick={() => onApprove(document)}
          >
            <Check />
            Approuver
          </Button>
          <Button
            variant="outline"
            size="sm"
            fullWidth
            disabled={!canReject || busy}
            onClick={() => onReject(document)}
            className="text-danger hover:bg-danger-soft"
          >
            <X />
            Rejeter
          </Button>
        </div>
      </div>
    </Card>
  );
}
