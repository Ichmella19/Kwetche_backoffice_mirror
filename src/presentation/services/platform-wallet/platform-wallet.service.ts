/**
 * Service comptes wallet plateforme : les 7 comptes catégorisés
 * (réserve tontines, prêts, gains, opérationnel, cautions, bonus,
 * impayés). Crédit/débit manuel réservé au super_admin.
 *
 * Backend : `/admin/platform-wallets/*`.
 */

import { platformWalletRepository } from "@/core/data/repositories/platform-wallet";
import type { ListPlatformTxParams } from "@/core/domain/repositories/platform-wallet";
import type {
  PlatformWallet,
  PlatformWalletMovementInput,
  PlatformWalletTransaction,
  PlatformWalletTransactionsResponse,
} from "@/lib/types";

class PlatformWalletService {
  list(): Promise<PlatformWallet[]> {
    return platformWalletRepository.list();
  }

  transactions(
    purpose: string,
    params?: ListPlatformTxParams,
  ): Promise<PlatformWalletTransactionsResponse> {
    return platformWalletRepository.transactions(purpose, params);
  }

  credit(
    purpose: string,
    input: PlatformWalletMovementInput,
  ): Promise<PlatformWalletTransaction> {
    return platformWalletRepository.credit(purpose, input);
  }

  debit(
    purpose: string,
    input: PlatformWalletMovementInput,
  ): Promise<PlatformWalletTransaction> {
    return platformWalletRepository.debit(purpose, input);
  }
}

export const platformWalletService = new PlatformWalletService();
