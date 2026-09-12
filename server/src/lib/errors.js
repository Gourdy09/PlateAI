/**
 * Every failure that reaches a client goes through ApiError so responses stay
 * consistent and internal details never leak into `publicMessage`.
 */
export class ApiError extends Error {
  constructor(status, code, publicMessage, options = {}) {
    super(options.internalMessage || publicMessage);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.publicMessage = publicMessage;
    if (options.details) this.details = options.details;
    if (options.cause) this.cause = options.cause;
  }
}

export const badRequest = (publicMessage, options) =>
  new ApiError(400, 'bad_request', publicMessage, options);

export const unauthorized = (publicMessage = 'Please sign in again.', options) =>
  new ApiError(401, 'unauthorized', publicMessage, options);

export const forbidden = (publicMessage = 'You do not have access to that.', options) =>
  new ApiError(403, 'forbidden', publicMessage, options);

export const notFound = (publicMessage = 'Not found.', options) =>
  new ApiError(404, 'not_found', publicMessage, options);

export const conflict = (publicMessage, options) =>
  new ApiError(409, 'conflict', publicMessage, options);

export const unprocessable = (publicMessage, options) =>
  new ApiError(422, 'unprocessable', publicMessage, options);

export const serviceUnavailable = (publicMessage, options) =>
  new ApiError(503, 'service_unavailable', publicMessage, options);

export const gatewayTimeout = (publicMessage, options) =>
  new ApiError(504, 'timeout', publicMessage, options);

export const notImplemented = (publicMessage, options) =>
  new ApiError(501, 'not_implemented', publicMessage, options);
