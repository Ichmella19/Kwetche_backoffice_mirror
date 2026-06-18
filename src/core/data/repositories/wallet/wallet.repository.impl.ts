import { httpService } from "@/core/data/http.service";
import type { IWalletRepository } from "@/core/domain/repositories";
import type {
  AdjustWalletInput,
  WalletListResponse,
  WalletTransaction,
  WalletUserView,
} from "@/lib/types";

export class WalletRepository implements IWalletRepository {
  list(
    page: number,
    perPage: number,
    search?: string,
  ): Promise<WalletListResponse> {
    return httpService.get<WalletListResponse>("/admin/wallets", {
      query: { page, per_page: perPage, search },
    });
  }

  getPlatformWallet(): Promise<WalletUserView> {
    return httpService.get<WalletUserView>("/admin/wallets/platform");
  }

  getForUser(userId: string): Promise<WalletUserView> {
    return httpService.get<WalletUserView>(`/admin/wallets/${userId}`);
  }

  adjust(userId: string, input: AdjustWalletInput): Promise<WalletTransaction> {
    return httpService.post<WalletTransaction>(
      `/admin/wallets/${userId}/adjust`,
      input,
    );
  }

  confirmTransaction(txId: string): Promise<WalletTransaction> {
    return httpService.post<WalletTransaction>(
      `/admin/wallet/transactions/${txId}/confirm`,
    );
  }

  rejectTransaction(txId: string): Promise<WalletTransaction> {
    return httpService.post<WalletTransaction>(
      `/admin/wallet/transactions/${txId}/reject`,
    );
  }
}

export const walletRepository = new WalletRepository();
