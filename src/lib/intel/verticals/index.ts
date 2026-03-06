export { localServiceProfile } from "./local-service";
// export { ecommerceProfile } from "./ecommerce";       // Phase 2
// export { saasProfile } from "./saas";                 // Phase 2
// export { hospitalityProfile } from "./hospitality";   // Phase 3

import { localServiceProfile } from "./local-service";
import type { VerticalProfile } from "../types";

/**
 * Registry of all vertical profiles.
 * Keyed by verticalId for O(1) lookup.
 */
export const verticalRegistry: Record<string, VerticalProfile> = {
  [localServiceProfile.verticalId]: localServiceProfile,
};

/**
 * Get a vertical profile by ID, or throw if not found.
 */
export function getVerticalProfile(verticalId: string): VerticalProfile {
  const profile = verticalRegistry[verticalId];
  if (!profile) {
    throw new Error(
      `Unknown vertical "${verticalId}". Available: ${Object.keys(verticalRegistry).join(", ")}`
    );
  }
  return profile;
}

/**
 * List all registered vertical IDs.
 */
export function listVerticalIds(): string[] {
  return Object.keys(verticalRegistry);
}
