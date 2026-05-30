import type { NotificationChannel, NotificationType } from "@/lib/enums";

export interface SendNotificationInput {
  user_ids: string[];
  title: string;
  body: string;
  type?: NotificationType | string;
  channels?: (NotificationChannel | string)[];
  data?: Record<string, unknown>;
}

export interface SendNotificationResult {
  sent: number;
  channels: string[];
}
