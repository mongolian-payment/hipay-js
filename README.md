# @mongolian-payment/hipay

TypeScript SDK for the HiPay payment provider in Mongolia. Zero dependencies, dual ESM/CJS builds, full type safety.

## Installation

```bash
npm install @mongolian-payment/hipay
```

Requires Node.js >= 18.0.0 (uses native `fetch`).

## Quick Start

```ts
import { HiPayClient } from "@mongolian-payment/hipay";

const client = new HiPayClient({
  endpoint: "https://merchant.hipay.mn/api",
  token: "YOUR_BEARER_TOKEN",
  entityId: "YOUR_ENTITY_ID",
});

// Create a checkout
const checkout = await client.checkout(50000);
console.log(checkout.qrData);     // QR code data for payment
console.log(checkout.checkoutId); // Track this checkout

// Check checkout status
const status = await client.getCheckout(checkout.checkoutId);
console.log(status.status); // e.g. "PAID"

// Get payment details
const payment = await client.getPayment(status.paymentId!);
console.log(payment.paymentBrand);

// Submit a payment correction (refund)
const correction = await client.paymentCorrection(payment.paymentId!);
console.log(correction.correction_paymentId);

// Get daily statement
const statement = await client.statement("2026-02-27");
console.log(statement.data?.list);
```

## Configuration

### Direct Configuration

```ts
const client = new HiPayClient({
  endpoint: "https://merchant.hipay.mn/api",
  token: "YOUR_BEARER_TOKEN",
  entityId: "YOUR_ENTITY_ID",
});
```

### Environment Variables

```ts
import { loadConfigFromEnv, HiPayClient } from "@mongolian-payment/hipay";

// Reads HIPAY_ENDPOINT, HIPAY_TOKEN, HIPAY_ENTITY_ID
const config = loadConfigFromEnv();
const client = new HiPayClient(config);
```

| Variable | Description |
|---|---|
| `HIPAY_ENDPOINT` | HiPay API base URL |
| `HIPAY_TOKEN` | Bearer token for authentication |
| `HIPAY_ENTITY_ID` | Entity ID assigned by HiPay |

## API Reference

### `client.checkout(amount, options?)`

Create a new checkout. Automatically fills `entityId`, `currency` (MNT), `qrData` (true), and `signal` (false).

| Parameter | Type | Description |
|---|---|---|
| `amount` | `number` | Payment amount in MNT |
| `options.items` | `CheckOutItem[]` | Optional line items |
| `options.ipAddress` | `string` | Optional customer IP address |

Returns `HiPayCheckoutResponse` with `checkoutId`, `qrData`, `expires`, etc.

### `client.getCheckout(checkoutId)`

Get checkout status. Returns `HiPayCheckoutGetResponse` with `status`, `paymentId`, etc.

### `client.getPayment(paymentId)`

Get payment details. Returns `HiPayPaymentGetResponse` with full payment info.

### `client.paymentCorrection(paymentId)`

Submit a payment correction (refund/reversal). Returns `HiPayPaymentCorrectionResponse` with `correction_paymentId`.

### `client.statement(date)`

Get a daily payment statement. Date format: `"YYYY-MM-DD"`. Returns `HiPayStatementResponse` with paginated data.

## Error Handling

All methods throw `HiPayError` when the API returns a non-success response (`code !== 1`) or when HTTP errors occur.

```ts
import { HiPayError } from "@mongolian-payment/hipay";

try {
  await client.checkout(50000);
} catch (err) {
  if (err instanceof HiPayError) {
    console.error(err.message);   // Human-readable error
    console.error(err.code);      // API response code
    console.error(err.details);   // Validation details [{field, issue}]
  }
}
```

## License

MIT
