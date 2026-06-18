import { Badge } from "@/presentation/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { DocumentPreview } from "@/presentation/components/kyc";
import { validationLabel } from "@/lib/enums";
import type { User } from "@/lib/types";

export function IdentityCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identité KYC</CardTitle>
        <CardDescription>
          CIP, selfie et statut de validation niveau 1.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Carte CIP</p>
            <Badge variant="outline">
              {validationLabel(user.cip_validation)}
            </Badge>
          </div>
          <DocumentPreview fileUrl={user.cip_photo} label="Carte CIP" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Selfie</p>
            <Badge variant="outline">
              {validationLabel(user.selfie_validation)}
            </Badge>
          </div>
          <DocumentPreview fileUrl={user.selfie_photo} label="Selfie" />
        </div>
      </CardContent>
    </Card>
  );
}
