# @mongolian-payment/hipay

HiPay payment SDK for Node.js — create checkouts, check payments, manage corrections and statements.

[![npm version](https://img.shields.io/npm/v/@mongolian-payment/hipay.svg)](https://www.npmjs.com/package/@mongolian-payment/hipay)
[![license](https://img.shields.io/npm/l/@mongolian-payment/hipay.svg)](./LICENSE)

> Part of the **[mongolian-payment](https://github.com/mongolian-payment)** SDK suite.
> Also available for Python: **[mongolian-payment-hipay](https://pypi.org/project/mongolian-payment-hipay/)** ([source](https://github.com/mongolian-payment/hipay-py)).

## Requirements

- Node.js >= 18.0.0 (uses native `fetch`)

## Installation

```bash
npm install @mongolian-payment/hipay
```

## Quick Start

```typescript
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
```

## Configuration from Environment Variables

```typescript
import { HiPayClient, loadConfigFromEnv } from "@mongolian-payment/hipay";

const client = new HiPayClient(loadConfigFromEnv());
```

| Variable          | Description                     |
| ----------------- | ------------------------------- |
| `HIPAY_ENDPOINT`  | HiPay API base URL              |
| `HIPAY_TOKEN`     | Bearer token for authentication |
| `HIPAY_ENTITY_ID` | Entity ID assigned by HiPay     |

> Never hard-code credentials — load them from the environment or a secrets vault.

## API Reference

Every request is authenticated with the configured Bearer token. Methods throw
`HiPayError` when the API returns a non-success response (`code !== 1`).

| Method | Description |
|--------|-------------|
| `checkout(amount, options?)` | Create a checkout → `{ checkoutId, qrData, expires, ... }` |
| `getCheckout(checkoutId)` | Get checkout status → `{ status, paymentId, ... }` |
| `getPayment(paymentId)` | Get payment details |
| `paymentCorrection(paymentId)` | Submit a payment correction (refund/reversal) → `{ correction_paymentId }` |
| `statement(date)` | Get a daily statement for `"YYYY-MM-DD"` → paginated data |

```typescript
// checkout auto-fills entityId, currency (MNT), qrData (true), and signal (false)
const checkout = await client.checkout(50000, {
  ipAddress: "192.168.1.1",
  items: [
    {
      itemno: "SKU001",
      names: "Product Name",
      price: 25000,
      quantity: 2,
      brand: "Brand",
      measure: "pcs",
      vat: 2500,
      citytax: 100,
    },
  ],
});

// Submit a correction (refund) for a completed payment
const correction = await client.paymentCorrection(payment.paymentId!);
console.log(correction.correction_paymentId);

// Daily statement
const statement = await client.statement("2026-02-27");
console.log(statement.data?.list);
```

## Error Handling

All API errors throw `HiPayError`, which includes the API response code and any
validation details:

```typescript
import { HiPayError } from "@mongolian-payment/hipay";

try {
  await client.checkout(50000);
} catch (err) {
  if (err instanceof HiPayError) {
    console.error(err.message);  // Human-readable message
    console.error(err.code);     // API response code
    console.error(err.details);  // Validation details [{ field, issue }]
    console.error(err.response); // Raw response body
  }
}
```

## License

MIT
