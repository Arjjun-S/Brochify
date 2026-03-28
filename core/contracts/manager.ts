export interface BaseManager {
  readonly name: string;
  initialize(): Promise<void>;
  healthCheck(): Promise<{ ok: boolean; detail: string }>;
  shutdown(): Promise<void>;
}

export interface ManagerDependencies {
  now: () => Date;
}
