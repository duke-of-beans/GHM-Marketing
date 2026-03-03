/**
 * Tenant Voice Settings — Sprint 36 (FEAT-016b)
 *
 * Shared helper to fetch GlobalSettings voice fields and build the
 * TenantVoice object for AI prompt injection. Used by every API route
 * that calls callAI().
 *
 * The system-prompt-builder reads ctx.tenantVoice and injects BRAND VOICE
 * GUIDELINES into the system prompt automatically.
 */

import { prisma } from "@/lib/prisma";
import type { TenantVoice } from "./router/types";

/**
 * Fetch tenant-level voice settings from GlobalSettings.
 * Returns undefined if no voice fields are configured (safe fallback).
 */
export async function getTenantVoiceSettings(): Promise<TenantVoice | undefined> {
  try {
    const gs = await prisma.globalSettings.findFirst({
      select: {
        voiceTone: true,
        voiceKeywords: true,
        voiceAntiKeywords: true,
        voiceSampleCopy: true,
        voiceIndustry: true,
        voiceAudience: true,
      },
    });

    if (!gs) return undefined;

    // Only return if at least one voice field is set
    const hasVoice = gs.voiceTone || gs.voiceKeywords || gs.voiceAntiKeywords || gs.voiceSampleCopy;
    if (!hasVoice) return undefined;

    return {
      tone: gs.voiceTone,
      keywords: gs.voiceKeywords,
      antiKeywords: gs.voiceAntiKeywords,
      sampleCopy: gs.voiceSampleCopy,
      industry: gs.voiceIndustry,
      audience: gs.voiceAudience,
    };
  } catch (err) {
    console.warn("[getTenantVoiceSettings] Failed to fetch voice settings:", err);
    return undefined;
  }
}
