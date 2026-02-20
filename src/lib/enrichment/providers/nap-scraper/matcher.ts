/**
 * NAP Matcher — Fuzzy comparison of Name, Address, Phone
 *
 * Handles the messy reality of how directories format the same info differently:
 *   "St" vs "Street" vs "St."
 *   "(310) 555-0123" vs "310-555-0123" vs "3105550123"
 *   "Acme Plumbing" vs "Acme Plumbing Co." vs "ACME PLUMBING CO"
 *   "Suite 100" vs "Ste 100" vs "Ste. 100" vs "#100"
 */

export type MatchStatus = "match" | "mismatch" | "missing" | "partial";

export interface NAPComparison {
  status: MatchStatus;
  confidence: number;       // 0–100
  nameMatch: boolean;
  addressMatch: boolean;
  phoneMatch: boolean;
  details: string[];        // ["Phone: found (555) 123-4567, expected 555-123-4567"]
}

// ============================================================================
// Normalization helpers
// ============================================================================

function normalizePhone(phone: string | null): string {
  if (!phone) return "";
  return phone.replace(/\D/g, ""); // strip everything non-digit
}

const STREET_ABBR: Record<string, string> = {
  street: "st",
  avenue: "ave",
  boulevard: "blvd",
  drive: "dr",
  road: "rd",
  lane: "ln",
  court: "ct",
  circle: "cir",
  place: "pl",
  terrace: "ter",
  way: "way",
};

const SUITE_ABBR = /\b(suite|ste\.?|unit|apt\.?|#)\s*/gi;

function normalizeAddress(addr: string | null): string {
  if (!addr) return "";
  return addr
    .toLowerCase()
    .replace(SUITE_ABBR, "ste ")
    .replace(/\b(north|south|east|west)\b/g, (m) => m[0]) // N, S, E, W
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => STREET_ABBR[word] ?? word)
    .join(" ")
    .trim();
}

function normalizeName(name: string | null): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[.,\-&]/g, " ")
    .replace(/\b(llc|inc|co|corp|company|ltd)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Levenshtein-based similarity 0–1
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return 1 - dp[m][n] / Math.max(m, n);
}

// ============================================================================
// Main comparison function
// ============================================================================

export function compareNAP(
  canonical: { name: string; address: string; phone: string },
  found: { name: string | null; address: string | null; phone: string | null }
): NAPComparison {
  const details: string[] = [];

  // If nothing found at all → missing
  if (!found.name && !found.address && !found.phone) {
    return {
      status: "missing",
      confidence: 0,
      nameMatch: false,
      addressMatch: false,
      phoneMatch: false,
      details: ["Business not found in directory"],
    };
  }

  // Phone — digits must match exactly after normalization
  const canonPhone = normalizePhone(canonical.phone);
  const foundPhone = normalizePhone(found.phone);
  const phoneMatch = canonPhone.length > 0 && canonPhone === foundPhone;
  if (!phoneMatch && found.phone) {
    details.push(`Phone: found "${found.phone}", expected "${canonical.phone}"`);
  }

  // Name — fuzzy match with similarity threshold
  const canonName = normalizeName(canonical.name);
  const foundName = normalizeName(found.name);
  const nameSim = similarity(canonName, foundName);
  const nameMatch = nameSim >= 0.8;
  if (!nameMatch && found.name) {
    details.push(`Name: found "${found.name}", expected "${canonical.name}"`);
  }

  // Address — fuzzy match (more lenient; formatting varies wildly)
  const canonAddr = normalizeAddress(canonical.address);
  const foundAddr = normalizeAddress(found.address);
  const addrSim = similarity(canonAddr, foundAddr);
  const addressMatch = addrSim >= 0.75;
  if (!addressMatch && found.address) {
    details.push(`Address: found "${found.address}", expected "${canonical.address}"`);
  }

  // Confidence score = weighted average of match qualities
  const confidence = Math.round(
    (nameSim * 0.3 + addrSim * 0.4 + (phoneMatch ? 1 : foundPhone ? 0 : 0.5) * 0.3) * 100
  );

  // Status determination
  let status: MatchStatus;
  if (nameMatch && addressMatch && phoneMatch) {
    status = "match";
  } else if (!nameMatch && !addressMatch && !phoneMatch) {
    status = "mismatch";
  } else {
    // At least one field matches
    status = confidence >= 60 ? "partial" : "mismatch";
  }

  return { status, confidence, nameMatch, addressMatch, phoneMatch, details };
}
