import type { SendNotificationInput, SendNotificationResult } from "@/lib/types";

export interface INotificationRepository {
  send(input: SendNotificationInput): Promise<SendNotificationResult>;
}
