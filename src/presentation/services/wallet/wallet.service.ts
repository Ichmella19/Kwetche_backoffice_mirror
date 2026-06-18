/**
 * Service Wallet (staff) : consultation + ajustement + revue des transactions.
 */

import { walletRepository } from "@/core/data/repositories";
import type {
  AdjustWalletInput,
  WalletListResponse,
  WalletTransaction,
  WalletUserView,
} from "@/lib/types";

class WalletService {
  list(page = 1, perPage = 20, search?: string): Promise<WalletListResponse> {
    return walletRepository.list(page, perPage, search?.trim() || undefined);
  }

  getPlatformWallet(): Promise<WalletUserView> {
    return walletRepository.getPlatformWallet();
  }

  getForUser(userId: string): Promise<WalletUserView> {
    return walletRepository.getForUser(userId);
  }

  adjust(userId: string, input: AdjustWalletInput): Promise<WalletTransaction> {
    return walletRepository.adjust(userId, {
      ...input,
      reason: input.reason.trim(),
    });
  }

  confirmTransaction(txId: string): Promise<WalletTransaction> {
    return walletRepository.confirmTransaction(txId);
  }

  rejectTransaction(txId: string): Promise<WalletTransaction> {
    return walletRepository.rejectTransaction(txId);
  }
}

export const walletService = new WalletService();
