import { httpService } from "@/core/data/http.service";
import type {
  IWalletTransactionsRepository,
  ListWalletTransactionsParams,
} from "@/core/domain/repositories/wallet-transactions";
import type { WalletTransactionsResponse } from "@/lib/types";

const csv = (v?: string[]) => (v && v.length > 0 ? v.join(",") : undefined);

export class WalletTransactionsRepository
  implements IWalletTransactionsRepository
{
  list({
    page = 1,
    perPage = 50,
    userId,
    movements,
    categories,
    statuses,
    reference,
    amountMin,
    amountMax,
    createdFrom,
    createdTo,
    sort,
  }: ListWalletTransactionsParams): Promise<WalletTransactionsResponse> {
    return httpService.get<WalletTransactionsResponse>(
      "/admin/wallet/transactions",
      {
        query: {
          page,
          per_page: perPage,
          user_id: userId,
          movements: csv(movements),
          categories: csv(categories),
          statuses: csv(statuses),
          reference,
          amount_min: amountMin,
          amount_max: amountMax,
          created_from: createdFrom,
          created_to: createdTo,
          sort,
        },
      },
    );
  }
}

export const walletTransactionsRepository = new WalletTransactionsRepository();
