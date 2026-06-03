import { httpService } from "@/core/data/http.service";
import type {
  AddSupportMessageInput,
  ISupportRepository,
} from "@/core/domain/repositories/support";
import type {
  SupportMessage,
  SupportTicket,
  SupportTicketListResponse,
  SupportTicketThread,
  UpdateSupportStatusInput,
} from "@/lib/types";

export class SupportRepository implements ISupportRepository {
  list({
    page,
    perPage,
    status,
    category,
    userId,
  }: {
    page: number;
    perPage: number;
    status?: string;
    category?: string;
    userId?: string;
  }): Promise<SupportTicketListResponse> {
    return httpService.get<SupportTicketListResponse>(
      "/admin/support/tickets",
      {
        query: {
          page,
          per_page: perPage,
          status,
          category,
          user_id: userId,
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
