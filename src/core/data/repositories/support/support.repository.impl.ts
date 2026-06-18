import { httpService } from "@/core/data/http.service";
import type {
  AddSupportMessageInput,
  ISupportRepository,
  ListSupportTicketsParams,
} from "@/core/domain/repositories/support";
import type {
  SupportMessage,
  SupportTicket,
  SupportTicketListResponse,
  SupportTicketThread,
  UpdateSupportStatusInput,
} from "@/lib/types";

const csv = (v?: string[]) => (v && v.length > 0 ? v.join(",") : undefined);

export class SupportRepository implements ISupportRepository {
  list({
    page = 1,
    perPage = 20,
    status,
    category,
    userId,
    statuses,
    categories,
    search,
    createdFrom,
    createdTo,
    sort,
  }: ListSupportTicketsParams): Promise<SupportTicketListResponse> {
    return httpService.get<SupportTicketListResponse>(
      "/admin/support/tickets",
      {
        query: {
          page,
          per_page: perPage,
          status,
          category,
          user_id: userId,
          statuses: csv(statuses),
          categories: csv(categories),
          search,
          created_from: createdFrom,
          created_to: createdTo,
          sort,
        },
      },
    );
  }

  detail(id: string): Promise<SupportTicketThread> {
    return httpService.get<SupportTicketThread>(
      `/admin/support/tickets/${id}`,
    );
  }

  async addMessage(
    id: string,
    input: AddSupportMessageInput,
  ): Promise<SupportMessage> {
    const formData = new FormData();
    if (input.content) formData.append("content", input.content);
    if (input.status) formData.append("status", input.status);
    for (const file of input.files ?? []) {
      formData.append("attachments", file, file.name);
    }
    const raw = await httpService.post<{ message: SupportMessage }>(
      `/admin/support/tickets/${id}/messages`,
      formData,
    );
    return raw.message;
  }

  updateStatus(
    id: string,
    input: UpdateSupportStatusInput,
  ): Promise<SupportTicket> {
    return httpService.post<SupportTicket>(
      `/admin/support/tickets/${id}/status`,
      input,
    );
  }
}

export const supportRepository = new SupportRepository();
