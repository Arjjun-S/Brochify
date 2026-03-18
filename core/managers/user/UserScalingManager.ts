import type { BaseManager, ManagerDependencies } from "@core/contracts/manager";

export interface CapacityConfig {
  maxConcurrentUsers: number;
  softLimitPercent: number;
  hardLimitPercent: number;
}

export interface CapacitySnapshot {
  activeUsers: number;
  utilizationPercent: number;
  reachedSoftLimit: boolean;
  reachedHardLimit: boolean;
}

export class UserScalingManager implements BaseManager {
  readonly name = "UserScalingManager";
  private readonly deps: ManagerDependencies;
  private config: CapacityConfig;

  constructor(deps: ManagerDependencies) {
    this.deps = deps;
    this.config = {
      maxConcurrentUsers: 1000,
      softLimitPercent: 75,
      hardLimitPercent: 90,
    };
  }

  async initialize(): Promise<void> {
    // Placeholder: connect to redis/session tracker.
    void this.deps.now();
  }

  async healthCheck(): Promise<{ ok: boolean; detail: string }> {
    return { ok: true, detail: "User scaling manager placeholder is active." };
  }

  async shutdown(): Promise<void> {
    // Placeholder: flush scaling metrics.
  }

  getConfig(): CapacityConfig {
    return this.config;
  }

  getSnapshot(activeUsers: number): CapacitySnapshot {
    const utilizationPercent =
      this.config.maxConcurrentUsers === 0 ?
        0
      : Math.round((activeUsers / this.config.maxConcurrentUsers) * 100);

    return {
      activeUsers,
      utilizationPercent,
      reachedSoftLimit: utilizationPercent >= this.config.softLimitPercent,
      reachedHardLimit: utilizationPercent >= this.config.hardLimitPercent,
    };
  }
}
