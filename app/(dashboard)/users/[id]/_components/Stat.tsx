/**
 * Petite case clé/valeur réutilisée dans les grilles des cards du détail
 * utilisateur. Compact, sans skeleton — pour les vraies stat cards riches
 * (icône, loading), utiliser `StatCard` (`@/presentation/components/shared`).
 */
export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}
