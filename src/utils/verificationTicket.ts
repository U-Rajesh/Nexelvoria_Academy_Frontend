/**
 * Where the email-verification ticket lives between pages.
 *
 * ===========================================================================
 * WHY sessionStorage, AND WHY NOT A URL.
 *
 * The verification screen needs to know which account a code belongs to. It
 * used to be told through the query string - `/verify-otp?studentId=user-2` -
 * which put a real internal identifier into browser history, into the
 * `Referer` header of every outbound request from that page, and into any
 * analytics or server log that records URLs.
 *
 * The ticket replaces that id, and it is kept out of the URL for the same
 * reason. `sessionStorage` rather than `localStorage` because the ticket is
 * short-lived by design (15 minutes) and scoped to one browser tab: closing
 * the tab should discard it, and a second tab should not inherit a
 * half-finished verification.
 *
 * Losing it is recoverable and needs no special handling: signing in again
 * with the correct password returns a fresh ticket.
 *
 * NOT A SESSION. The ticket authenticates nothing - it is purpose-scoped and
 * signed with a key that cannot produce an access token. Storing it is
 * therefore not equivalent to storing a login.
 * ===========================================================================
 */

const TICKET_KEY = 'nexelvoria_verification_ticket';

/**
 * Stores the ticket, tolerating a storage failure.
 *
 * `sessionStorage` throws in a private window with site data blocked, and in
 * some embedded webviews. A failure here must not break the page: the user
 * simply sees the "session expired" path and signs in again.
 */
export const storeVerificationTicket = (ticket: string): void => {
  try {
    sessionStorage.setItem(TICKET_KEY, ticket);
  } catch {
    // Non-fatal by design - see above.
  }
};

/** The stored ticket, or null when there is none or storage is unavailable. */
export const readVerificationTicket = (): string | null => {
  try {
    const ticket = sessionStorage.getItem(TICKET_KEY);

    return ticket !== null && ticket !== '' ? ticket : null;
  } catch {
    return null;
  }
};

/**
 * Discards the ticket.
 *
 * Called once verification succeeds, so a spent ticket does not linger for
 * the rest of the tab's life.
 */
export const clearVerificationTicket = (): void => {
  try {
    sessionStorage.removeItem(TICKET_KEY);
  } catch {
    // Nothing to do; it expires on its own in 15 minutes.
  }
};
