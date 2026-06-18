/**
 * Inbox — file d'attente unifiée « À traiter ».
 * Miroir de `app/commons/enums/inbox/inbox_kind.py`.
 */

import { ROUTES } from "@/lib/constants";

export enum InboxItemKind {
  KYC_IDENTITY = "kyc_identity",
  KYC_N2 = "kyc_n2",
  KYC_N3 = "kyc_n3",
  WALLET_TX = "wallet_tx",
  SUPPORT = "support",
  RECOUVREMENT = "recouvrement",
}

export const INBOX_KIND_LABELS: Record<string, string> = {
  [InboxItemKind.KYC_IDENTITY]: "KYC Identité",
  [InboxItemKind.KYC_N2]: "KYC Niveau 2",
  [InboxItemKind.KYC_N3]: "KYC Niveau 3",
  [InboxItemKind.WALLET_TX]: "Transaction wallet",
  [InboxItemKind.SUPPORT]: "Support",
  [InboxItemKind.RECOUVREMENT]: "Recouvrement",
};

/**
 * Pour une entrée d'inbox, calcule la route BO de destination
 * (l'écran qui permet à l'agent de traiter l'élément).
 */
export function routeForInboxItem(item: {
  kind: string;
  user_id: string;
  ref_id?: string | null;
}): string {
  switch (item.kind) {
    case InboxItemKind.KYC_IDENTITY:
      return `${ROUTES.KYC}?user_id=${item.user_id}`;
    case InboxItemKind.KYC_N2:
      return `${ROUTES.KYC_N2}/${item.user_id}`;
    case InboxItemKind.KYC_N3:
      return `${ROUTES.KYC_N3}/${item.user_id}`;
    case InboxItemKind.WALLET_TX:
      return `${ROUTES.WALLET_TRANSACTIONS}?status=pending&user_id=${item.user_id}`;
    case InboxItemKind.SUPPORT:
      return item.ref_id
        ? `${ROUTES.SUPPORT}/${item.ref_id}`
        : ROUTES.SUPPORT;
    case InboxItemKind.RECOUVREMENT:
      return `${ROUTES.RECOUVREMENT}?user_id=${item.user_id}`;
    default:
      return ROUTES.INBOX;
  }
}
