import { httpService } from "@/core/data/http.service";
import type { INotificationRepository } from "@/core/domain/repositories";
import type { SendNotificationInput, SendNotificationResult } from "@/lib/types";

export class NotificationRepository implements INotificationRepository {
  send(input: SendNotificationInput): Promise<SendNotificationResult> {
    return httpService.post<SendNotificationResult>(
      "/admin/notifications/send",
      input,
    );
  }
}

export const notificationRepository = new NotificationRepository();
