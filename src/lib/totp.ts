/**
 * src/lib/totp.ts
 *
 * TOTP helpers using otplib.
 * Wraps secret generation, QR URI building, code verification, and backup codes.
 *
 * Secrets are stored encrypted in the database (totpSecret field).
 * The encryption key is loaded from TOTP_ENCRYPTION_KEY env var (32-byte hex).
 * Falls back to a build-time warning if key is missing.
 *
 * Only admin + master role users get 2FA enforced. Sales users are exempt.
 */

import { generateSecret as otplibGenerateSecret, generateSync, verifySync, generateURI } from "otplib";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const APP_NAME = "GHM Dashboard";

// ── TOTP instance ─────────────────────────────────────────────────────────────
// otplib v12 uses a functional API — no class instance needed.

// ── Encryption helpers ────────────────────────────────────────────────────────

function getEncryptionKey(): Buffer {
  const hex = process.env.TOTP_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    // In development without the key, use a deterministic dev key
    // NEVER use this pattern in production — the env var must be set
    if (process.env.NODE_ENV !== "production") {
      return Buffer.from("a".repeat(64), "hex");
    }
    throw new Error("TOTP_ENCRYPTION_KEY env var is missing or invalid (must be 64-char hex)");
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a TOTP secret before storing in DB.
 * Format: iv:authTag:ciphertext (all hex, joined by colons)
 */
export function encryptSecret(secret: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12); // 96-bit IV for AES-GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

/**
 * Decrypt a TOTP secret retrieved from DB.
 */
export function decryptSecret(encrypted: string): string {
  const key = getEncryptionKey();
  const parts = encrypted.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted secret format");
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final("utf8");
}

// ── TOTP operations ───────────────────────────────────────────────────────────

/**
 * Generate a new TOTP secret for a user.
 */
export function generateSecret(): string {
  return otplibGenerateSecret();
}

/**
 * Build the otpauth:// URI for QR code generation.
 * Pass to a QR library on the frontend (e.g. qrcode.react).
 */
export function buildOtpAuthUri(email: string, secret: string): string {
  return generateURI({ strategy: "totp", label: email, secret, issuer: APP_NAME });
}

/**
 * Verify a TOTP code against the stored (decrypted) secret.
 */
export function verifyCode(code: string, secret: string): boolean {
  const result = verifySync({ strategy: "totp", token: code, secret });
  return result.valid;
}

// ── Backup codes ──────────────────────────────────────────────────────────────

import { createHash } from "crypto";

/**
 * Generate 8 single-use backup codes (each 8 alphanumeric chars).
 * Returns { plaintext: string[], hashed: string[] }
 * Store hashed in DB, return plaintext to user exactly once.
 */
export function generateBackupCodes(): { plaintext: string[]; hashed: string[] } {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    // 5 bytes = 10 hex chars, more readable as uppercase
    codes.push(randomBytes(5).toString("hex").toUpperCase());
  }
  const hashed = codes.map((c) =>
    createHash("sha256").update(c).digest("hex")
  );
  return { plaintext: codes, hashed };
}

/**
 * Verify a backup code against a stored list of hashed codes.
 * Returns the remaining codes (with the used one removed) if valid, or null if invalid.
 */
export function verifyBackupCode(
  inputCode: string,
  hashedCodes: string[]
): string[] | null {
  const inputHash = createHash("sha256")
    .update(inputCode.toUpperCase().replace(/\s/g, ""))
    .digest("hex");
  const idx = hashedCodes.indexOf(inputHash);
  if (idx === -1) return null;
  // Remove the used code
  const remaining = [...hashedCodes];
  remaining.splice(idx, 1);
  return remaining;
}
