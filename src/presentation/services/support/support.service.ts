/**
 * Service Support (staff) : inbox + conversation.
 */

import { supportRepository } from "@/core/data/repositories/support";
import type {
  AddSupportMessageInput,
  ListSupportTicketsParams,
} from "@/core/domain/repositories/support";
import type {
  SupportMessage,
  SupportTicket,
  SupportTicketListResponse,
  SupportTicketThread,
  UpdateSupportStatusInput,
} from "@/lib/types";

class SupportService {
  list(
    params: ListSupportTicketsParams = {},
  ): Promise<SupportTicketListResponse> {
    return supportRepository.list({
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
      ...params,
    });
  }

  detail(id: string): Promise<SupportTicketThread> {
    return supportRepository.detail(id);
  }

  addMessage(
    id: string,
    input: AddSupportMessageInput,
  ): Promise<SupportMessage> {
    return supportRepository.addMessage(id, input);
  }

  updateStatus(
    id: string,
    input: UpdateSupportStatusInput,
  ): Promise<SupportTicket> {
    return supportRepository.updateStatus(id, input);
  }
}

export const supportService = new SupportService();
