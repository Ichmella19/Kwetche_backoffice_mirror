import { cn } from "@/lib/utils/cn";

interface BrandProps {
  /** Masque le texte (logo seul). */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Identité Kwetche : monogramme « K » en dégradé or sur fond indigo + wordmark.
 * Pas d'apos;asset externe requis.
 */
export function Brand({ iconOnly, className }: BrandProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-lg bg-secondary text-lg font-black leading-none text-primary shadow-sm">
        K
      </span>
      {!iconOnly && (
        <span className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight text-foreground">Kwetche</span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Back-office
          </span>
        </span>
      )}
    </span>
  );
}
