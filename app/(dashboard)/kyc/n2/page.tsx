import { DossierList } from "@/presentation/components/kyc/dossier-list";

export default function KycN2Page() {
  return (
    <DossierList
      level={2}
      title="KYC niveau 2 — Revenus & activité"
      description="Dossiers en attente de revue : justificatifs de revenus, attestation d'emploi, IFU/RCCM si entrepreneur."
    />
  );
}
