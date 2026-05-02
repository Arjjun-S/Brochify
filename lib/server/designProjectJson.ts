type JsonRecord = Record<string, unknown>;

const IDENTITY_MATRIX: [number, number, number, number, number, number] = [1, 0, 0, 1, 0, 0];

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toSafeMatrix(value: unknown): [number, number, number, number, number, number] {
  if (!Array.isArray(value)) {
    return [...IDENTITY_MATRIX];
  }

  return [
    toFiniteNumber(value[0], 1),
    toFiniteNumber(value[1], 0),
    toFiniteNumber(value[2], 0),
    toFiniteNumber(value[3], 1),
    toFiniteNumber(value[4], 0),
    toFiniteNumber(value[5], 0),
  ];
}

function sanitizeObjectNode(node: unknown): void {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return;
  }

  const record = node as JsonRecord;

  if ("transformMatrix" in record) {
    record.transformMatrix = toSafeMatrix(record.transformMatrix);
  }

  if (typeof record.scaleX !== "number" || !Number.isFinite(record.scaleX)) {
    record.scaleX = 1;
  }

  if (typeof record.scaleY !== "number" || !Number.isFinite(record.scaleY)) {
    record.scaleY = 1;
  }

  if (typeof record.left !== "number" || !Number.isFinite(record.left)) {
    record.left = 0;
  }

  if (typeof record.top !== "number" || !Number.isFinite(record.top)) {
    record.top = 0;
  }

  const nestedObjects = record.objects;
  if (Array.isArray(nestedObjects)) {
    nestedObjects.forEach((child) => sanitizeObjectNode(child));
  }

  if (record.clipPath) {
    sanitizeObjectNode(record.clipPath);
  }
}

export function sanitizeDesignProjectJson(rawJson: string): string {
  if (typeof rawJson !== "string" || !rawJson.trim()) {
    return rawJson;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return rawJson;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return rawJson;
  }

  const state = parsed as JsonRecord;

  if (!Array.isArray(state.objects)) {
    state.objects = [];
  }

  state.viewportTransform = toSafeMatrix(state.viewportTransform);

  const objects = state.objects;
  if (Array.isArray(objects)) {
    objects.forEach((object) => sanitizeObjectNode(object));
  }

  if (state.backgroundImage) {
    sanitizeObjectNode(state.backgroundImage);
  }

  if (state.overlayImage) {
    sanitizeObjectNode(state.overlayImage);
  }

  return JSON.stringify(state);
}
