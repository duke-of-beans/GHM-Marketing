/**
 * typing-store.ts — Shared in-memory typing indicator store
 *
 * NOTE: In Vercel serverless, individual function instances may not share
 * memory. Typing indicators are intentionally best-effort / ephemeral — this
 * is acceptable behaviour for a "X is typing…" UX. No data is persisted.
 */

const typingStore = new Map<number, { name: string; expiresAt: number }>();

/** Register a user as currently typing. Expires after 4 seconds. */
export function setTyping(userId: number, name: string): void {
  typingStore.set(userId, { name, expiresAt: Date.now() + 4_000 });
}

/**
 * Return all users currently typing, optionally excluding one userId.
 * Also purges expired entries as a side-effect.
 */
export function getActiveTypers(
  excludeUserId?: number
): { userId: number; name: string }[] {
  const now = Date.now();
  const result: { userId: number; name: string }[] = [];

  for (const [id, data] of typingStore.entries()) {
    if (data.expiresAt < now) {
      typingStore.delete(id);
      continue;
    }
    if (id !== excludeUserId) {
      result.push({ userId: id, name: data.name });
    }
  }

  return result;
}
