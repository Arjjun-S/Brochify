import type { NotificationManager } from "@core/managers/notification/NotificationManager";

export class ToastQueueService {
  constructor(private readonly notificationManager: NotificationManager) {}

  queueWelcomeToast(userName: string): { id: string; message: string } {
    const toast = this.notificationManager.enqueueToast(
      `Welcome back, ${userName}!`,
      "success",
    );

    return { id: toast.id, message: toast.message };
  }
}
