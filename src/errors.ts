import type { Details } from "./types.js";

/**
 * Custom error class for HiPay API errors.
 *
 * Thrown when the API returns a response with `code !== 1` or when
 * an HTTP-level error occurs. Includes the response code and any
 * validation details returned by the API.
 */
export class HiPayError extends Error {
  constructor(
    message: string,
    public code?: number,
    public details?: Details[],
    public response?: unknown,
  ) {
    super(message);
    this.name = "HiPayError";
  }
}
