import type { CryptoManager } from "@core/managers/crypto/CryptoManager";

export class CryptoRotationService {
  constructor(private readonly cryptoManager: CryptoManager) {}

  async scheduleRotation(): Promise<{
    status: "placeholder";
    nextAction: string;
  }> {
    const config = this.cryptoManager.getConfig();
    return {
      status: "placeholder",
      nextAction: `Rotate keys every ${config.keyRotationDays} days.`,
    };
  }
}
