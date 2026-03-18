import type { BaseManager, ManagerDependencies } from "@core/contracts/manager";
import type { QueueMetrics } from "@core/types/common";

export type ToastLevel = "info" | "success" | "warning" | "error";

export interface ToastPayload {
  id: string;
  message: string;
  level: ToastLevel;
  createdAt: string;
}

export class NotificationManager implements BaseManager {
  readonly name = "NotificationManager";
  private readonly deps: ManagerDependencies;
  private queue: ToastPayload[] = [];
  private processed = 0;
  private failed = 0;

  constructor(deps: ManagerDependencies) {
    this.deps = deps;
  }

  async initialize(): Promise<void> {
    // Placeholder: attach channels (websocket, email, in-app).
    void this.deps.now();
  }

  async healthCheck(): Promise<{ ok: boolean; detail: string }> {
    return { ok: true, detail: "Notification manager placeholder is active." };
  }

  async shutdown(): Promise<void> {
    // Placeholder: drain queued messages.
  }

  enqueueToast(message: string, level: ToastLevel = "info"): ToastPayload {
    const payload: ToastPayload = {
      id: Math.random().toString(36).slice(2),
      message,
      level,
      createdAt: this.deps.now().toISOString(),
    };
    this.queue.push(payload);
    return payload;
  }

  getMetrics(): QueueMetrics {
    return {
      queued: this.queue.length,
      processed: this.processed,
      failed: this.failed,
    };
  }
}
