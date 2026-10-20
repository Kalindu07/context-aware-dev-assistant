/**
 * Event transmission is allowed only when capture is actively transmitting
 * and a backend session has been successfully established.
 */
export function shouldSendEvents(state: {
  transmitting: boolean;
  sessionId: string | undefined;
}): boolean {
  return Boolean(state.transmitting && state.sessionId);
}

/**
 * Re-check immediately before awaiting a network write so disable/dispose
 * can invalidate in-flight emits that already passed the initial gate.
 */
export function shouldCompleteSend(state: {
  transmitting: boolean;
  sessionId: string | undefined;
  startedGeneration: number;
  currentGeneration: number;
}): boolean {
  return (
    shouldSendEvents(state) &&
    state.startedGeneration === state.currentGeneration
  );
}
