export type Environment = "development" | "staging" | "production";

export interface PlaceholderResult {
  status: "placeholder";
  message: string;
}

export interface QueueMetrics {
  queued: number;
  processed: number;
  failed: number;
}
