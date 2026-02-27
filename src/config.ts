import type { HiPayConfig } from "./types.js";

/**
 * Loads HiPay configuration from environment variables.
 *
 * Expected environment variables:
 * - `HIPAY_ENDPOINT` - HiPay API base URL
 * - `HIPAY_TOKEN` - Bearer token for authentication
 * - `HIPAY_ENTITY_ID` - Entity ID assigned by HiPay
 *
 * @throws {Error} If any required environment variable is missing
 */
export function loadConfigFromEnv(): HiPayConfig {
  const required: Array<[keyof HiPayConfig, string]> = [
    ["endpoint", "HIPAY_ENDPOINT"],
    ["token", "HIPAY_TOKEN"],
    ["entityId", "HIPAY_ENTITY_ID"],
  ];

  const config: Record<string, string> = {};

  const missing: string[] = [];
  for (const [key, envVar] of required) {
    const value = process.env[envVar];
    if (!value) {
      missing.push(envVar);
    } else {
      config[key] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  return config as unknown as HiPayConfig;
}
