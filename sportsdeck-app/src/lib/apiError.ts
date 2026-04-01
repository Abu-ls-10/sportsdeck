type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const maybePayload = payload as ApiErrorPayload;
  return maybePayload.error ?? maybePayload.message ?? fallback;
}

export function isBannedActionError(status: number, payload: unknown): boolean {
  if (status !== 403) return false;
  const message = getApiErrorMessage(payload, "").toLowerCase();
  return message.includes("banned") || message.includes("ban");
}
