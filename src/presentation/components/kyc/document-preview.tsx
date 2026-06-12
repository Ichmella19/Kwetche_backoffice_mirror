"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { ExternalLink, FileText, ImageOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { resolveFileUrl } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface DocumentPreviewProps {
  fileUrl: string | null | undefined;
  label: string;
  className?: string;
}

const isPdf = (url: string) => /\.pdf(\?|$)/i.test(url);

/**
 * Vignette cliquable d'apos;un document KYC. Ouvre une visionneuse plein écran
 * (image agrandie ou PDF embarqué) avec lien d'apos;ouverture externe.
 */
export function DocumentPreview({ fileUrl, label, className }: DocumentPreviewProps) {
  const [open, setOpen] = useState(false);
  const url = resolveFileUrl(fileUrl);

  if (!url) {
    return (
      <div
        className={cn(
          "flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border bg-surface-2 text-muted",
          className,
        )}
      >
        <ImageOff className="size-6" />
      </div>
    );
  }

  const pdf = isPdf(url);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-surface-2 transition-shadow hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        {pdf ? (
          <span className="flex h-full flex-col items-center justify-center gap-2 text-muted">
            <FileText className="size-8" />
            <span className="text-xs font-medium">Document PDF</span>
          </span>
        ) : (
          <img
            src={url}
            alt={label}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        )}
        <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1 text-left text-xs font-medium text-white">
          {label}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="pr-8">{label}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto rounded-lg bg-surface-2">
            {pdf ? (
              <iframe src={url} title={label} className="h-[70vh] w-full" />
            ) : (
              <img src={url} alt={label} className="mx-auto max-h-[70vh] w-auto" />
            )}
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink className="size-4" />
            Ouvrir dans un nouvel onglet
          </a>
        </DialogContent>
      </Dialog>
    </>
  );
}
