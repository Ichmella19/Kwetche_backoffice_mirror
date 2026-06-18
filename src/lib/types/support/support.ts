export interface SupportTicketUserMini {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country_code: string | null;
  email: string | null;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender: string | null;
  message_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  /** Mini-payload utilisateur joint par le backend pour l'inbox BO. */
  user?: SupportTicketUserMini | null;
}

export interface SupportAttachment {
  id: string;
  message_id: string;
  file_path: string;
  file_name: string | null;
  file_kind: string | null;
  file_size: number;
  created_at: string | null;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: "user" | "agent" | "system";
  content: string;
  is_read: boolean;
  attachments: SupportAttachment[];
  created_at: string | null;
  updated_at: string | null;
}

export interface SupportTicketThread {
  ticket: SupportTicket;
  messages: SupportMessage[];
}

export interface SupportTicketListResponse {
  items: SupportTicket[];
  total: number;
  page: number;
  per_page: number;
}

export interface UpdateSupportStatusInput {
  status: string;
}
