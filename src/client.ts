import type {
  HiPayConfig,
  CheckoutOptions,
  HiPayCheckoutRequest,
  HiPayCheckoutResponse,
  HiPayCheckoutGetResponse,
  HiPayPaymentGetResponse,
  HiPayPaymentCorrectionRequest,
  HiPayPaymentCorrectionResponse,
  HiPayStatementRequest,
  HiPayStatementResponse,
} from "./types.js";
import { HiPayError } from "./errors.js";

/**
 * HiPay payment API client.
 *
 * Handles checkout creation, payment queries, corrections, and statements.
 * Uses Bearer token authentication on every request.
 *
 * @example
 * ```ts
 * import { HiPayClient } from "@mongolian-payment/hipay";
 *
 * const client = new HiPayClient({
 *   endpoint: "https://merchant.hipay.mn/api",
 *   token: "MY_BEARER_TOKEN",
 *   entityId: "MY_ENTITY_ID",
 * });
 *
 * const checkout = await client.checkout(50000);
 * console.log(checkout.qrData);
 * ```
 */
export class HiPayClient {
  private readonly config: HiPayConfig;

  constructor(config: HiPayConfig) {
    this.config = config;
  }

  // ==========================================================================
  // HTTP helper
  // ==========================================================================

  /**
   * Make an authenticated request to the HiPay API.
   * Automatically attaches the Bearer token and Content-Type headers.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.token}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = { method, headers };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const url = `${this.config.endpoint}${path}`;
    const res = await fetch(url, options);

    let responseBody: unknown;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      responseBody = await res.json();
    } else {
      responseBody = await res.text();
    }

    if (!res.ok) {
      const msg = typeof responseBody === "object" && responseBody !== null
        ? (responseBody as Record<string, unknown>).description ?? `HTTP ${res.status}`
        : `HTTP ${res.status}`;
      throw new HiPayError(
        `HiPay API error: ${method} ${path} (${res.status}) - ${msg}`,
        res.status,
        undefined,
        responseBody,
      );
    }

    return responseBody as T;
  }

  /**
   * Validate that an API response indicates success (code === 1).
   * Throws a HiPayError with details if the response code is not 1.
   */
  private assertSuccess(response: { code: number; description: string; details?: { field: string; issue: string }[] }): void {
    if (response.code !== 1) {
      throw new HiPayError(
        `HiPay error: ${response.description}`,
        response.code,
        response.details,
        response,
      );
    }
  }

  // ==========================================================================
  // Checkout Operations
  // ==========================================================================

  /**
   * Create a new checkout.
   *
   * Automatically fills in entityId, currency (MNT), qrData (true),
   * and signal (false).
   *
   * @param amount - The payment amount in MNT
   * @param options - Optional items and IP address
   * @returns The checkout response with QR data and checkout ID
   * @throws {HiPayError} If the API returns a non-success code
   */
  async checkout(
    amount: number,
    options?: CheckoutOptions,
  ): Promise<HiPayCheckoutResponse> {
    const body: HiPayCheckoutRequest = {
      entityId: this.config.entityId,
      amount,
      currency: "MNT",
      qrData: true,
      signal: false,
      ...(options?.ipAddress ? { ipaddress: options.ipAddress } : {}),
      ...(options?.items ? { items: options.items } : {}),
    };

    const response = await this.request<HiPayCheckoutResponse>(
      "POST",
      "/checkout",
      body,
    );

    this.assertSuccess(response);
    return response;
  }

  /**
   * Get the status of a checkout.
   *
   * @param checkoutId - The checkout ID to query
   * @returns The checkout status response
   * @throws {HiPayError} If the API returns a non-success code
   */
  async getCheckout(checkoutId: string): Promise<HiPayCheckoutGetResponse> {
    const entityId = encodeURIComponent(this.config.entityId);
    const id = encodeURIComponent(checkoutId);

    const response = await this.request<HiPayCheckoutGetResponse>(
      "GET",
      `/checkout/get/${id}?entityId=${entityId}`,
    );

    this.assertSuccess(response);
    return response;
  }

  // ==========================================================================
  // Payment Operations
  // ==========================================================================

  /**
   * Get payment details by payment ID.
   *
   * @param paymentId - The payment ID to query
   * @returns The payment details
   * @throws {HiPayError} If the API returns a non-success code
   */
  async getPayment(paymentId: string): Promise<HiPayPaymentGetResponse> {
    const entityId = encodeURIComponent(this.config.entityId);
    const id = encodeURIComponent(paymentId);

    const response = await this.request<HiPayPaymentGetResponse>(
      "GET",
      `/payment/get/${id}?entityId=${entityId}`,
    );

    this.assertSuccess(response);
    return response;
  }

  /**
   * Submit a payment correction (refund/reversal).
   *
   * @param paymentId - The payment ID to correct
   * @returns The correction response with the new correction payment ID
   * @throws {HiPayError} If the API returns a non-success code
   */
  async paymentCorrection(
    paymentId: string,
  ): Promise<HiPayPaymentCorrectionResponse> {
    const body: HiPayPaymentCorrectionRequest = {
      entityId: this.config.entityId,
      paymentId,
    };

    const response = await this.request<HiPayPaymentCorrectionResponse>(
      "POST",
      "/pos/correction",
      body,
    );

    this.assertSuccess(response);
    return response;
  }

  // ==========================================================================
  // Statement Operations
  // ==========================================================================

  /**
   * Get a payment statement for a given date.
   *
   * @param date - The statement date in "YYYY-MM-DD" format
   * @returns The statement response with paginated payment data
   * @throws {HiPayError} If the API returns a non-success code
   */
  async statement(date: string): Promise<HiPayStatementResponse> {
    const body: HiPayStatementRequest = {
      entityId: this.config.entityId,
      date,
    };

    const response = await this.request<HiPayStatementResponse>(
      "POST",
      "/pos/statement",
      body,
    );

    this.assertSuccess(response);
    return response;
  }
}
