#!/usr/bin/env sh

set -eu

required_paths="
core/contracts/manager.ts
core/registry/managerRegistry.ts
core/managers/security/SecurityManager.ts
core/managers/crypto/CryptoManager.ts
core/managers/notification/NotificationManager.ts
core/managers/user/UserScalingManager.ts
core/services/security/SecurityAuditService.ts
core/services/crypto/CryptoRotationService.ts
core/services/notification/ToastQueueService.ts
core/services/user/UserCapacityService.ts
"

missing=0
for path in $required_paths; do
  if [ ! -f "$path" ]; then
    echo "[temp] Missing: $path"
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  echo "[temp] Structure verification failed"
  exit 1
fi

echo "[temp] Structure verification passed"
