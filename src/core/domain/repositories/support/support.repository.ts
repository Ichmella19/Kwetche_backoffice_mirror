import type {
  SupportMessage,
  SupportTicket,
  SupportTicketListResponse,
  SupportTicketThread,
  UpdateSupportStatusInput,
} from "@/lib/types";

export interface AddSupportMessageInput {
  content?: string;
  files?: File[];
  /** Statut imposé après envoi (optionnel). */
  status?: string;
}

export interface ISupportRepository {
  list(params: {
    page: number;
    perPage: number;
    status?: string;
    category?: string;
    userId?: string;
  }): Promise<SupportTicketListResponse>;
  detail(id: string): Promise<SupportTicketThread>;
  addMessage(
    id: string,
    input: AddSupportMessageInput,
  ): Promise<SupportMessage>;
  updateStatus(
    id: string,
    input: UpdateSupportStatusInput,
  ): Promise<SupportTicket>;
}
