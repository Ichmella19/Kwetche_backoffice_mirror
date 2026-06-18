/**
 * Service "Transactions wallet" (transverse) : historique global paginé,
 * filtrable et triable de la table `wallet_transactions`.
 */

import { walletTransactionsRepository } from "@/core/data/repositories/wallet-transactions";
import type { ListWalletTransactionsParams } from "@/core/domain/repositories/wallet-transactions";
import type { WalletTransactionsResponse } from "@/lib/types";

class WalletTransactionsService {
  list(
    params: ListWalletTransactionsParams = {},
  ): Promise<WalletTransactionsResponse> {
    return walletTransactionsRepository.list({
      page: params.page ?? 1,
      perPage: params.perPage ?? 50,
      ...params,
    });
  }
}

export const walletTransactionsService = new WalletTransactionsService();
