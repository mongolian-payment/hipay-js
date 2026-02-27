import { describe, it, expect, vi, beforeEach } from "vitest";
import { HiPayClient } from "../src/client.js";
import { HiPayError } from "../src/errors.js";
import { loadConfigFromEnv } from "../src/config.js";
import type { HiPayConfig } from "../src/types.js";

const TEST_CONFIG: HiPayConfig = {
  endpoint: "https://merchant.hipay.mn/api",
  token: "test-bearer-token",
  entityId: "test-entity-id",
};

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

describe("HiPayClient", () => {
  let client: HiPayClient;

  beforeEach(() => {
    client = new HiPayClient(TEST_CONFIG);
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // checkout
  // ==========================================================================

  describe("checkout", () => {
    it("should create a checkout with minimal parameters", async () => {
      const responseBody = {
        code: 1,
        description: "Success",
        requestId: "req-123",
        checkoutId: "checkout-456",
        expires: "2026-03-01T00:00:00Z",
        qrData: "hipay://pay?checkout=checkout-456",
      };

      const fetchMock = mockFetch(responseBody);
      vi.stubGlobal("fetch", fetchMock);

      const result = await client.checkout(50000);

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("https://merchant.hipay.mn/api/checkout");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer test-bearer-token");

      const body = JSON.parse(options.body);
      expect(body.entityId).toBe("test-entity-id");
      expect(body.amount).toBe(50000);
      expect(body.currency).toBe("MNT");
      expect(body.qrData).toBe(true);
      expect(body.signal).toBe(false);
      expect(body.ipaddress).toBeUndefined();
      expect(body.items).toBeUndefined();

      expect(result.checkoutId).toBe("checkout-456");
      expect(result.qrData).toBe("hipay://pay?checkout=checkout-456");
    });

    it("should create a checkout with items and IP address", async () => {
      const responseBody = {
        code: 1,
        description: "Success",
        requestId: "req-789",
        checkoutId: "checkout-abc",
        expires: "2026-03-01T00:00:00Z",
        qrData: "hipay://pay?checkout=checkout-abc",
      };

      const fetchMock = mockFetch(responseBody);
      vi.stubGlobal("fetch", fetchMock);

      const result = await client.checkout(15000, {
        ipAddress: "192.168.1.1",
        items: [
          {
            itemno: "ITEM-001",
            names: "Test Item",
            price: 15000,
            quantity: 1,
            brand: "TestBrand",
            measure: "pc",
            vat: 1500,
            citytax: 0,
          },
        ],
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.ipaddress).toBe("192.168.1.1");
      expect(body.items).toHaveLength(1);
      expect(body.items[0].itemno).toBe("ITEM-001");

      expect(result.checkoutId).toBe("checkout-abc");
    });

    it("should throw HiPayError when checkout fails with code !== 1", async () => {
      const responseBody = {
        code: 0,
        description: "Invalid entity",
        requestId: "",
        checkoutId: "",
        expires: "",
        qrData: "",
        details: [{ field: "entityId", issue: "Entity not found" }],
      };

      vi.stubGlobal("fetch", mockFetch(responseBody));

      await expect(client.checkout(50000)).rejects.toThrow(HiPayError);
      await expect(client.checkout(50000)).rejects.toThrow("Invalid entity");
    });
  });

  // ==========================================================================
  // getCheckout
  // ==========================================================================

  describe("getCheckout", () => {
    it("should get checkout status by ID", async () => {
      const responseBody = {
        code: 1,
        description: "Success",
        amount: 50000,
        currency: "MNT",
        status: "PAID",
        status_date: "2026-02-27T12:00:00Z",
        paymentId: "pay-123",
      };

      const fetchMock = mockFetch(responseBody);
      vi.stubGlobal("fetch", fetchMock);

      const result = await client.getCheckout("checkout-456");

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://merchant.hipay.mn/api/checkout/get/checkout-456?entityId=test-entity-id",
      );

      expect(result.status).toBe("PAID");
      expect(result.paymentId).toBe("pay-123");
      expect(result.amount).toBe(50000);
    });

    it("should throw HiPayError on non-success code", async () => {
      const responseBody = {
        code: 0,
        description: "Checkout not found",
      };

      vi.stubGlobal("fetch", mockFetch(responseBody));

      await expect(client.getCheckout("bad-id")).rejects.toThrow(HiPayError);
    });
  });

  // ==========================================================================
  // getPayment
  // ==========================================================================

  describe("getPayment", () => {
    it("should get payment details by ID", async () => {
      const responseBody = {
        code: 1,
        description: "Success",
        id: "rec-001",
        amount: "50000",
        currency: "MNT",
        entityId: "test-entity-id",
        paymentId: "pay-123",
        paymentType: "QR",
        paymentBrand: "KhanBank",
        paymentDate: "2026-02-27",
      };

      const fetchMock = mockFetch(responseBody);
      vi.stubGlobal("fetch", fetchMock);

      const result = await client.getPayment("pay-123");

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://merchant.hipay.mn/api/payment/get/pay-123?entityId=test-entity-id",
      );

      expect(result.paymentId).toBe("pay-123");
      expect(result.amount).toBe("50000");
      expect(result.paymentBrand).toBe("KhanBank");
    });
  });

  // ==========================================================================
  // paymentCorrection
  // ==========================================================================

  describe("paymentCorrection", () => {
    it("should submit a payment correction", async () => {
      const responseBody = {
        code: 1,
        description: "Success",
        paymentId: "pay-123",
        correction_paymentId: "corr-456",
      };

      const fetchMock = mockFetch(responseBody);
      vi.stubGlobal("fetch", fetchMock);

      const result = await client.paymentCorrection("pay-123");

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("https://merchant.hipay.mn/api/pos/correction");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body.entityId).toBe("test-entity-id");
      expect(body.paymentId).toBe("pay-123");

      expect(result.correction_paymentId).toBe("corr-456");
    });
  });

  // ==========================================================================
  // statement
  // ==========================================================================

  describe("statement", () => {
    it("should get a statement for a given date", async () => {
      const responseBody = {
        code: 1,
        description: "Success",
        data: {
          list: [
            {
              paymentDate: "2026-02-27",
              checkoutId: "checkout-001",
              paymentId: "pay-001",
              amount: 50000,
              currency: "MNT",
              feeAmount: 500,
              feePrc: 1.0,
              paymentDesc: "Test payment",
              returnAmount: 0,
            },
          ],
          entityId: "test-entity-id",
          date: "2026-02-27",
          page: 1,
          perPage: 20,
          totalCount: 1,
          totalPage: 1,
        },
      };

      const fetchMock = mockFetch(responseBody);
      vi.stubGlobal("fetch", fetchMock);

      const result = await client.statement("2026-02-27");

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("https://merchant.hipay.mn/api/pos/statement");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body.entityId).toBe("test-entity-id");
      expect(body.date).toBe("2026-02-27");

      expect(result.data?.list).toHaveLength(1);
      expect(result.data?.list[0].amount).toBe(50000);
      expect(result.data?.totalCount).toBe(1);
    });
  });

  // ==========================================================================
  // HTTP error handling
  // ==========================================================================

  describe("HTTP error handling", () => {
    it("should throw HiPayError on HTTP 401", async () => {
      const responseBody = {
        code: 0,
        description: "Unauthorized",
      };

      vi.stubGlobal("fetch", mockFetch(responseBody, 401));

      await expect(client.checkout(50000)).rejects.toThrow(HiPayError);
      await expect(client.checkout(50000)).rejects.toThrow("HiPay API error");
    });

    it("should throw HiPayError on HTTP 500", async () => {
      const responseBody = {
        code: 0,
        description: "Internal Server Error",
      };

      vi.stubGlobal("fetch", mockFetch(responseBody, 500));

      await expect(client.checkout(50000)).rejects.toThrow(HiPayError);
    });

    it("should handle non-JSON error responses", async () => {
      const fetchFn = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        headers: new Headers({ "content-type": "text/html" }),
        json: () => Promise.reject(new Error("not JSON")),
        text: () => Promise.resolve("<html>Bad Gateway</html>"),
      });

      vi.stubGlobal("fetch", fetchFn);

      await expect(client.checkout(50000)).rejects.toThrow(HiPayError);
    });
  });
});

// ==========================================================================
// loadConfigFromEnv
// ==========================================================================

describe("loadConfigFromEnv", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("should load config from environment variables", () => {
    vi.stubEnv("HIPAY_ENDPOINT", "https://merchant.hipay.mn/api");
    vi.stubEnv("HIPAY_TOKEN", "my-token");
    vi.stubEnv("HIPAY_ENTITY_ID", "my-entity");

    const config = loadConfigFromEnv();
    expect(config.endpoint).toBe("https://merchant.hipay.mn/api");
    expect(config.token).toBe("my-token");
    expect(config.entityId).toBe("my-entity");
  });

  it("should throw when environment variables are missing", () => {
    vi.stubEnv("HIPAY_ENDPOINT", "");
    vi.stubEnv("HIPAY_TOKEN", "");
    vi.stubEnv("HIPAY_ENTITY_ID", "");

    expect(() => loadConfigFromEnv()).toThrow(
      "Missing required environment variables",
    );
  });

  it("should list all missing variables in the error message", () => {
    delete process.env.HIPAY_ENDPOINT;
    delete process.env.HIPAY_TOKEN;
    delete process.env.HIPAY_ENTITY_ID;

    try {
      loadConfigFromEnv();
      expect.unreachable("Should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain("HIPAY_ENDPOINT");
      expect(msg).toContain("HIPAY_TOKEN");
      expect(msg).toContain("HIPAY_ENTITY_ID");
    }
  });
});
