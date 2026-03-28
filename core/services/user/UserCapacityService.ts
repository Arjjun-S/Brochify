import type { UserScalingManager } from "@core/managers/user/UserScalingManager";

export class UserCapacityService {
  constructor(private readonly userScalingManager: UserScalingManager) {}

  predictCapacity(activeUsers: number): {
    status: "placeholder";
    recommendation: string;
  } {
    const snapshot = this.userScalingManager.getSnapshot(activeUsers);

    if (snapshot.reachedHardLimit) {
      return {
        status: "placeholder",
        recommendation: "Scale immediately: hard limit reached.",
      };
    }

    if (snapshot.reachedSoftLimit) {
      return {
        status: "placeholder",
        recommendation: "Prepare scale-up: soft limit reached.",
      };
    }

    return {
      status: "placeholder",
      recommendation: "Capacity is healthy.",
    };
  }
}
