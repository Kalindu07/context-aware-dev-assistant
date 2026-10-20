/** ISO-8601 UTC timestamp accepted by the shared schema `date-time` format. */
export function nowIso(): string {
  return new Date().toISOString();
}
