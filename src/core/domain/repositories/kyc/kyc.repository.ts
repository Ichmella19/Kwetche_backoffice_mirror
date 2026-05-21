import type { KycDocument } from "@/lib/types";

export interface IKycRepository {
  listPending(level?: number): Promise<KycDocument[]>;
  approve(documentId: string): Promise<KycDocument>;
  reject(documentId: string, reason: string): Promise<KycDocument>;
}
