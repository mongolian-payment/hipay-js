// ============================================================================
// Configuration
// ============================================================================

/** Configuration for the HiPayClient */
export interface HiPayConfig {
  /** HiPay API base endpoint (e.g. https://merchant.hipay.mn/api) */
  endpoint: string;
  /** Bearer token for API authentication */
  token: string;
  /** Entity ID assigned by HiPay */
  entityId: string;
}

// ============================================================================
// Checkout Types
// ============================================================================

/** A single item within a checkout request */
export interface CheckOutItem {
  /** Item number / SKU */
  itemno: string;
  /** Item name */
  names: string;
  /** Unit price */
  price: number;
  /** Quantity */
  quantity: number;
  /** Brand name */
  brand: string;
  /** Unit of measure */
  measure: string;
  /** VAT amount */
  vat: number;
  /** City tax amount */
  citytax: number;
}

/** Options for creating a checkout */
export interface CheckoutOptions {
  /** Line items for the checkout */
  items?: CheckOutItem[];
  /** IP address of the customer */
  ipAddress?: string;
}

/** @internal Wire format for the checkout creation request */
export interface HiPayCheckoutRequest {
  entityId: string;
  amount: number;
  currency: string;
  qrData: boolean;
  signal: boolean;
  ipaddress?: string;
  items?: CheckOutItem[];
}

/** PubNub signal configuration returned with a checkout */
export interface Signal {
  /** PubNub subscribe key */
  subscribeKey: string;
  /** PubNub channel name */
  channel: string;
  /** UUID for the PubNub connection */
  uuid: string;
}

/** Validation error detail */
export interface Details {
  /** The field that caused the error */
  field: string;
  /** Description of the issue */
  issue: string;
}

/** Response from creating a checkout */
export interface HiPayCheckoutResponse {
  /** Response code (1 = success) */
  code: number;
  /** Human-readable description */
  description: string;
  /** Unique request ID */
  requestId: string;
  /** Checkout ID for tracking */
  checkoutId: string;
  /** Expiration timestamp */
  expires: string;
  /** PubNub signal configuration (when signal=true) */
  signal?: Signal;
  /** QR code data string */
  qrData: string;
  /** Validation error details */
  details?: Details[];
}

// ============================================================================
// Checkout Status Types
// ============================================================================

/** Response from getting checkout status */
export interface HiPayCheckoutGetResponse {
  /** Response code (1 = success) */
  code: number;
  /** Human-readable description */
  description: string;
  /** Checkout amount */
  amount?: number;
  /** Currency code */
  currency?: string;
  /** Discount amount applied */
  discount_amount?: number;
  /** Checkout status */
  status?: string;
  /** Date of the status change */
  status_date?: string;
  /** Associated payment ID */
  paymentId?: string;
  /** Validation error details */
  details?: Details[];
}

// ============================================================================
// Payment Types
// ============================================================================

/** Response from getting payment details */
export interface HiPayPaymentGetResponse {
  /** Response code (1 = success) */
  code: number;
  /** Human-readable description */
  description: string;
  /** Payment record ID */
  id?: string;
  /** Payment amount (string from API) */
  amount?: string;
  /** Currency code */
  currency?: string;
  /** Entity ID */
  entityId?: string;
  /** Associated checkout ID */
  checkoutId?: string;
  /** Payment ID */
  paymentId?: string;
  /** Type of payment */
  paymentType?: string;
  /** Payment brand (e.g. wallet name) */
  paymentBrand?: string;
  /** Date of the payment */
  paymentDate?: string;
  /** Payment description */
  paymentDesc?: string;
  /** Result description from provider */
  result_desc?: string;
  /** Result code from provider */
  result_code?: string;
  /** Validation error details */
  details?: Details[];
}

// ============================================================================
// Payment Correction Types
// ============================================================================

/** @internal Wire format for the payment correction request */
export interface HiPayPaymentCorrectionRequest {
  entityId: string;
  paymentId: string;
}

/** Response from a payment correction */
export interface HiPayPaymentCorrectionResponse {
  /** Response code (1 = success) */
  code: number;
  /** Human-readable description */
  description: string;
  /** Original payment ID */
  paymentId?: string;
  /** New correction payment ID */
  correction_paymentId?: string;
  /** Validation error details */
  details?: Details[];
}

// ============================================================================
// Statement Types
// ============================================================================

/** @internal Wire format for the statement request */
export interface HiPayStatementRequest {
  entityId: string;
  date: string;
}

/** A single row in a statement */
export interface StatementListItem {
  /** Date of the payment */
  paymentDate: string;
  /** Associated checkout ID */
  checkoutId: string;
  /** Payment ID */
  paymentId: string;
  /** Payment amount */
  amount: number;
  /** Currency code */
  currency: string;
  /** Fee amount charged */
  feeAmount: number;
  /** Fee percentage */
  feePrc: number;
  /** Payment description */
  paymentDesc: string;
  /** Amount returned (refunded) */
  returnAmount: number;
}

/** Statement data with pagination */
export interface StatementData {
  /** List of statement items */
  list: StatementListItem[];
  /** Entity ID */
  entityId: string;
  /** Statement date */
  date: string;
  /** Current page number */
  page: number;
  /** Items per page */
  perPage: number;
  /** Total number of items */
  totalCount: number;
  /** Total number of pages */
  totalPage: number;
}

/** Response from getting a statement */
export interface HiPayStatementResponse {
  /** Response code (1 = success) */
  code: number;
  /** Human-readable description */
  description: string;
  /** Validation error details */
  details?: Details[];
  /** Statement data with pagination */
  data?: StatementData;
}
