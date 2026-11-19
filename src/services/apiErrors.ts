import axios from 'axios';
import type { ApiResponse } from '../types';

/**
 * Translation layer between the backend's HTTP envelope and the frontend's
 * existing `ApiResponse<T>`.
 *
 * WHY THIS FILE EXISTS, rather than changing `ApiResponse<T>`:
 * the backend's envelope is a discriminated union (`ApiSuccess | ApiFailure`
 * in `src/contracts/api.contract.ts`) where `data` is OPTIONAL, while the
 * frontend's `ApiResponse<T>` requires `data` and carries a flat `error`
 * string. Ten services and ~185 components already consume the frontend
 * shape. Changing that type would touch every one of them, so the shapes are
 * reconciled HERE instead - one small file, no blast radius.
 *
 * Nothing in this file knows about any particular endpoint.
 */

/** The failure body produced centrally by the backend's error middleware. */
export interface BackendFailureBody {
  success: false;
  message: string;
  /** Machine-readable code, e.g. "VALIDATION_ERROR", "CONFLICT". */
  error?: string;
  /** Field-level problems. Present only on 422 responses. */
  details?: { field: string; message: string }[];
  /** Correlation id, echoed so a user can quote it in a bug report. */
  requestId?: string;
}

/** The success body. `data` is absent for endpoints that return no payload. */
export interface BackendSuccessBody<T> {
  success: true;
  message?: string;
  data?: T;
}

/**
 * Builds the single human-readable string the existing UI renders.
 *
 * The forms show one error banner, so a 422 carrying several field issues is
 * joined into one sentence rather than dropped. Field NAMES are deliberately
 * omitted: the backend's messages are already written for a human
 * ("Password must be at least 8 characters"), and prefixing them with a
 * camelCase path would read worse, not better.
 */
const describeFailure = (body: BackendFailureBody): string => {
  if (body.details !== undefined && body.details.length > 0) {
    return body.details.map((issue) => issue.message).join(' ');
  }

  return body.message;
};

/** True when the value looks like the backend's failure envelope. */
const isBackendFailureBody = (value: unknown): value is BackendFailureBody => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // Narrow through an index signature rather than asserting the target shape:
  // the point of this guard is that we do NOT yet know the body is ours, so
  // claiming it has `message` before checking would defeat it.
  const body = value as Record<string, unknown>;

  return body['success'] === false && typeof body['message'] === 'string';
};

/**
 * Maps ANY thrown request failure onto the frontend's `ApiResponse<T>`.
 *
 * Deliberately exhaustive about the non-HTTP cases: a student whose request
 * never reached the server must not be shown a blank banner, and "the server
 * is unreachable" is a different user action from "your password is too
 * short".
 *
 * Never rethrows - every caller gets a value it can render.
 */
export const toApiFailure = <T>(err: unknown, fallback: string): ApiResponse<T> => {
  const failure = (message: string): ApiResponse<T> => ({
    success: false,
    data: null as unknown as T,
    error: message,
  });

  if (!axios.isAxiosError(err)) {
    return failure(fallback);
  }

  // The server answered with a status code.
  if (err.response !== undefined) {
    const body: unknown = err.response.data;

    if (isBackendFailureBody(body)) {
      return failure(describeFailure(body));
    }

    // A proxy, load balancer or dev-server 404 - not our envelope at all.
    return failure(
      `The server returned an unexpected ${String(err.response.status)} response. ${fallback}`,
    );
  }

  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    return failure('The server took too long to respond. Please try again.');
  }

  // No response and no timeout: the request never completed. Almost always
  // the backend not running, or a CORS rejection.
  return failure(
    'Cannot reach the server. Please confirm the backend is running and try again.',
  );
};

/**
 * Reads the machine-readable `error` code off a failure body.
 *
 * Returns `undefined` for anything that is not our envelope - a proxy error
 * page, an HTML 502, a network failure - so a caller never branches on a
 * code that did not come from the API.
 */
export const readErrorCode = (body: unknown): string | undefined =>
  isBackendFailureBody(body) ? body.error : undefined;

/**
 * Reads the verification ticket that accompanies exactly one refusal:
 * `ACCOUNT_PENDING_VERIFICATION` from `POST /auth/login`.
 */
export const readVerificationTicketFrom = (body: unknown): string | undefined => {
  if (!isBackendFailureBody(body)) {
    return undefined;
  }

  const ticket = (body as unknown as Record<string, unknown>)['verificationTicket'];

  return typeof ticket === 'string' && ticket.length > 0 ? ticket : undefined;
};

/**
 * Unwraps a 2xx body into `ApiResponse<T>`.
 *
 * A 2xx whose body is `success: false`, or which is missing `data` when the
 * caller needs it, is treated as a failure rather than silently handing the
 * UI `undefined`.
 */
export const toApiSuccess = <T>(
  body: BackendSuccessBody<T> | BackendFailureBody,
  fallback: string,
): ApiResponse<T> => {
  if (body.success === true && body.data !== undefined) {
    return {
      success: true,
      data: body.data,
      ...(body.message === undefined ? {} : { message: body.message }),
    };
  }

  return {
    success: false,
    data: null as unknown as T,
    error: isBackendFailureBody(body) ? describeFailure(body) : fallback,
  };
};
