import type { WalletTransactionsResponse } from "@/lib/types";

export interface ListWalletTransactionsParams {
  page?: number;
  perPage?: number;
  userId?: string;
  movements?: string[];
  categories?: string[];
  statuses?: string[];
  reference?: string;
  amountMin?: number;
  amountMax?: number;
  createdFrom?: string;
  createdTo?: string;
  sort?: string;
}

export interface IWalletTransactionsRepository {
  list(
    params: ListWalletTransactionsParams,
  ): Promise<WalletTransactionsResponse>;
}
