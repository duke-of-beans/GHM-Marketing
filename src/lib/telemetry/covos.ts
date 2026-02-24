/**
 * COVOS Owner Telemetry — FEAT-020
 *
 * Anonymous cross-tenant event pipeline. Sends aggregated platform signals
 * to the COVOS central analytics endpoint for fleet-wide visibility.
 *
 * Privacy contract:
 *   - Tenant identity is hashed (SHA-256 of slug). Never the real slug or name.
 *   - No user IDs, client names, lead data, or business-specific content.
 *   - Only event type + feature + tenant hash + timestamp + count.
 *   - Disabled if COVOS_TELEMETRY_ENDPOINT is not set.
 */

import crypto from "crypto";

const ENDPOINT = process.env.COVOS_TELEMETRY_ENDPOINT ?? null;
const TENANT_SLUG = process.env.COVOS_TENANT_SLUG ?? "ghm";

// Stable one-way hash of tenant identity — never reversible
export function hashTenant(slug: string): string {
  return crypto.createHash("sha256").update(`covos:tenant:${slug}`).digest("hex").slice(0, 16);
}

export interface TelemetryEvent {
  eventType: string;
  feature?: string | null;
  count: number;
  day: string; // YYYY-MM-DD
}

/**
 * Send a batch of anonymized telemetry events to the COVOS endpoint.
 * Non-blocking — silently swallows all errors.
 */
export async function sendTelemetry(events: TelemetryEvent[]): Promise<void> {
  if (!ENDPOINT || events.length === 0) return;

  const tenantHash = hashTenant(TENANT_SLUG);

  try {
    const payload = {
      tenantHash,
      sentAt: new Date().toISOString(),
      events,
    };

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-COVOS-Version": "1",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      console.warn(`[covos-telemetry] Endpoint returned ${res.status}`);
    }
  } catch {
    // Network errors, timeouts — all silently swallowed
  }
}
