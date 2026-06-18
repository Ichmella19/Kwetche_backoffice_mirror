/**
 * Service Notifications : envoi de notifications / rappels multi-canal.
 */

import { notificationRepository } from "@/core/data/repositories";
import type { SendNotificationInput, SendNotificationResult } from "@/lib/types";

class NotificationService {
  send(input: SendNotificationInput): Promise<SendNotificationResult> {
    return notificationRepository.send({
      ...input,
      title: input.title.trim(),
      body: input.body.trim(),
    });
  }
}

export const notificationService = new NotificationService();
