import type { CaptureEventType } from "../events/types";

export type EmitFn = (
  eventType: CaptureEventType,
  metadata?: Record<string, unknown>,
) => void;

export interface Collector {
  start(): void;
  stop(): void;
  dispose(): void;
}
