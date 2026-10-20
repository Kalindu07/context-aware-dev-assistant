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
