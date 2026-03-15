/**
 * AI Prompt Security — SEC-002
 * Sprint COVOS-SEC-01, March 2026
 *
 * sanitizePromptInput() must wrap every user-controlled string before it is
 * interpolated into an AI prompt template.  Developer-authored system prompts
 * that contain no user data are exempt and need no changes.
 *
 * Transforms applied (in order):
 *   1. Strip null bytes
 *   2. Strip Unicode direction-override characters (U+202A–U+202E, U+2066–U+2069)
 *   3. Collapse runs of 4+ consecutive newlines to exactly 3
 *   4. Strip known injection phrases at line start (case-insensitive)
 *   5. Truncate to MAX_FIELD_LENGTH chars with "[truncated]" suffix
 */

const NULL_BYTE_RE = /\x00/g;
const DIRECTION_OVERRIDE_RE = /[\u202A-\u202E\u2066-\u2069]/g;
const NEWLINE_COLLAPSE_RE = /\n{4,}/g;

/** Patterns stripped when they appear at the start of any line. */
const INJECTION_LINE_PATTERNS: RegExp[] = [
  /^ignore previous instructions[^\n]*/gim,
  /^system:[^\n]*/gim,
  /^###[^\n]*/gm,
];

/** Maximum characters allowed per user-controlled interpolated field. */
export const MAX_PROMPT_FIELD_LENGTH = 2000;

const TRUNCATION_SUFFIX = "[truncated]";

/**
 * Sanitize a single user-controlled string before prompt interpolation.
 *
 * @param str  Raw user-supplied value (keywords, topic, URL, page content, etc.)
 * @returns    Sanitized string safe for direct inclusion in a prompt template.
 */
export function sanitizePromptInput(str: string): string {
  if (typeof str !== "string" || str.length === 0) return str ?? "";

  let s = str;

  // 1. Strip null bytes
  s = s.replace(NULL_BYTE_RE, "");

  // 2. Strip Unicode direction-override characters
  s = s.replace(DIRECTION_OVERRIDE_RE, "");

  // 3. Collapse excessive newlines
  s = s.replace(NEWLINE_COLLAPSE_RE, "\n\n\n");

  // 4. Strip injection phrases at line start
  for (const pattern of INJECTION_LINE_PATTERNS) {
    s = s.replace(pattern, "");
  }

  // 5. Enforce per-field max length
  if (s.length > MAX_PROMPT_FIELD_LENGTH) {
    s = s.slice(0, MAX_PROMPT_FIELD_LENGTH) + TRUNCATION_SUFFIX;
  }

  return s;
}
