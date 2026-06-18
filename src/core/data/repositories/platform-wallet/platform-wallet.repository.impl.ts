import { httpService } from "@/core/data/http.service";
import type {
  IPlatformWalletRepository,
  ListPlatformTxParams,
} from "@/core/domain/repositories/platform-wallet";
import type {
  PlatformWallet,
  PlatformWalletMovementInput,
  PlatformWalletTransaction,
  PlatformWalletTransactionsResponse,
} from "@/lib/types";

export class PlatformWalletRepository implements IPlatformWalletRepository {
  list(): Promise<PlatformWallet[]> {
    return httpService.get<PlatformWallet[]>("/admin/platform-wallets");
  }

  transactions(
    purpose: string,
    params: ListPlatformTxParams = {},
  ): Promise<PlatformWalletTransactionsResponse> {
    return httpService.get<PlatformWalletTransactionsResponse>(
      `/admin/platform-wallets/${purpose}/transactions`,
      {
        query: {
          page: params.page,
          per_page: params.perPage,
          movement: params.movement,
        },
      },
    );
  }

  credit(
    purpose: string,
    input: PlatformWalletMovementInput,
  ): Promise<PlatformWalletTransaction> {
    return httpService.post<PlatformWalletTransaction>(
      `/admin/platform-wallets/${purpose}/credit`,
      input,
    );
  }

  debit(
    purpose: string,
    input: PlatformWalletMovementInput,
  ): Promise<PlatformWalletTransaction> {
    return httpService.post<PlatformWalletTransaction>(
      `/admin/platform-wallets/${purpose}/debit`,
      input,
    );
  }
}

export const platformWalletRepository = new PlatformWalletRepository();
