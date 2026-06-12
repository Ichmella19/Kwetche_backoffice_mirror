import type {
  PlatformWallet,
  PlatformWalletMovementInput,
  PlatformWalletTransaction,
  PlatformWalletTransactionsResponse,
} from "@/lib/types";

export interface ListPlatformTxParams {
  page?: number;
  perPage?: number;
  movement?: "credit" | "debit";
}

export interface IPlatformWalletRepository {
  list(): Promise<PlatformWallet[]>;
  transactions(
    purpose: string,
    params?: ListPlatformTxParams,
  ): Promise<PlatformWalletTransactionsResponse>;
  credit(
    purpose: string,
    input: PlatformWalletMovementInput,
  ): Promise<PlatformWalletTransaction>;
  debit(
    purpose: string,
    input: PlatformWalletMovementInput,
  ): Promise<PlatformWalletTransaction>;
}
