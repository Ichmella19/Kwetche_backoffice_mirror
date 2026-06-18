import type {
  AdjustWalletInput,
  WalletListResponse,
  WalletTransaction,
  WalletUserView,
} from "@/lib/types";

export interface IWalletRepository {
  list(
    page: number,
    perPage: number,
    search?: string,
  ): Promise<WalletListResponse>;
  /** Wallet « maison » de la plateforme + son historique. */
  getPlatformWallet(): Promise<WalletUserView>;
  getForUser(userId: string): Promise<WalletUserView>;
  adjust(userId: string, input: AdjustWalletInput): Promise<WalletTransaction>;
  confirmTransaction(txId: string): Promise<WalletTransaction>;
  rejectTransaction(txId: string): Promise<WalletTransaction>;
}
