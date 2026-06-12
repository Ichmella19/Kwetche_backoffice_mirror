import { DossierReview } from "@/presentation/components/kyc/dossier-review";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function KycN2ReviewPage({ params }: PageProps) {
  const { userId } = await params;
  return <DossierReview userId={userId} level={2} />;
}
