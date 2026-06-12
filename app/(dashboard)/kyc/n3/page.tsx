import { DossierList } from "@/presentation/components/kyc/dossier-list";

export default function KycN3Page() {
  return (
    <DossierList
      level={3}
      title="KYC niveau 3 — Banque & garanties"
      description="Dossiers en attente de revue : banque, mobile money, garant et garanties (foncier, véhicule…)."
    />
  );
}
