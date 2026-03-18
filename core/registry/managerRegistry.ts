import type { BaseManager, ManagerDependencies } from "@core/contracts/manager";
import {
  CryptoManager,
  NotificationManager,
  SecurityManager,
  UserScalingManager,
} from "@core/managers";

export interface ManagerRegistry {
  security: SecurityManager;
  crypto: CryptoManager;
  notifications: NotificationManager;
  userScaling: UserScalingManager;
  all: BaseManager[];
}

export function createManagerRegistry(
  deps: ManagerDependencies = { now: () => new Date() },
): ManagerRegistry {
  const security = new SecurityManager(deps);
  const crypto = new CryptoManager(deps);
  const notifications = new NotificationManager(deps);
  const userScaling = new UserScalingManager(deps);

  const all: BaseManager[] = [security, crypto, notifications, userScaling];

  return {
    security,
    crypto,
    notifications,
    userScaling,
    all,
  };
}

export async function initializeAllManagers(
  registry: ManagerRegistry,
): Promise<void> {
  await Promise.all(registry.all.map((manager) => manager.initialize()));
}
