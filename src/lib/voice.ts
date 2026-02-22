/**
 * voice.ts — GHM Dashboard Sardonic Micro-Copy Library
 *
 * Centralized source for all user-facing system communication.
 * Tone: deadpan, sardonic, break-the-4th-wall. Never mean. Never corny.
 *
 * Rules:
 * - Voice lives in: toasts, empty states, confirmations, tutorial copy, loading moments
 * - Voice does NOT touch: nav labels, column headers, form fields, data labels
 * - Use pick() for randomized variants — same action ≠ same quip every time
 *
 * Usage:
 *   import { voice, pick } from "@/lib/voice";
 *   toast.success(pick(voice.messages.sent));
 *   toast.error(voice.errors.network);
 */

/** Pick a random item from an array. */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const voice = {
  // ── Messages / Team Feed ─────────────────────────────────────────────────
  messages: {
    sent: [
      "Sent. They'll see it eventually.",
      "Message delivered. Ball's in their court.",
      "Out there now. No taking it back.",
    ],
    replySent: [
      "Reply sent. The thread continues.",
      "Replied. The conversation lives on.",
      "Sent your thoughts into the thread.",
    ],
    sendFailed: "Didn't send. Check your connection and try again.",
    pinned: [
      "Pinned. Now it floats above the noise. Use this wisely.",
      "Pinned to the top. Everything else is beneath it now.",
    ],
    unpinned: [
      "Unpinned. Back into the general population.",
      "Released into the feed. It's on its own now.",
    ],
    deleted: [
      "Gone. No record. It never happened.",
      "Deleted. The thread moves on.",
    ],
    alreadyInVault: "Already in your Vault. You're thorough.",
    savedToVault: [
      "Saved to your Vault. It'll be there when you need it.",
      "Locked in the Vault. Safe and accounted for.",
    ],
    saveFailed: "Couldn't save to Vault. Try again.",
  },

  // ── Tasks & Approvals ────────────────────────────────────────────────────
  approvals: {
    taskApproved: [
      "Approved. One less thing.",
      "Task cleared. Moving on.",
      "Approved. The work continues.",
    ],
    changesRequested: [
      "Sent back. They'll figure it out.",
      "Returned for revisions. The feedback has been delivered.",
    ],
    contentApproved: [
      "Approved. Content is live in the pipeline.",
      "Good to go. Content cleared.",
    ],
    contentSentBack: [
      "Sent back to draft. Revision time.",
      "Back to the drawing board. In a good way.",
    ],
    paymentsApproved: (count: number, extra: string) =>
      `${count} payment${count !== 1 ? "s" : ""} approved.${extra ? ` ${extra}` : ""}`,
    loadFailed: "Couldn't load the approval queue. Refresh and try again.",
    approveFailed: "Approval didn't go through. Try again.",
  },

  // ── Vault ────────────────────────────────────────────────────────────────
  vault: {
    uploaded: [
      "File uploaded. Filed and forgotten — until you need it.",
      "Uploaded. It's in there.",
    ],
    uploadFailed: "Upload failed. Try a different file or check your connection.",
    deleted: "File removed from the Vault.",
    deleteFailed: "Couldn't delete that file. Try again.",
    copied: "Link copied. Share responsibly.",
  },

  // ── Leads / Pipeline ─────────────────────────────────────────────────────
  leads: {
    claimed: [
      "Lead claimed. It's yours now.",
      "Claimed. The clock starts here.",
    ],
    statusUpdated: [
      "Pipeline updated.",
      "Stage advanced. Keep moving.",
      "Moved. Next step is on you.",
    ],
    updateFailed: "Couldn't update the pipeline. Try again.",
    auditGenerated: "Audit generated. Time to show them what they're missing.",
    demoGenerated: "Demo ready. Go close something.",
  },

  // ── Clients ──────────────────────────────────────────────────────────────
  clients: {
    saved: "Changes saved.",
    saveFailed: "Didn't save. Try again.",
    activationTriggered: "Client marked active. Commissions will start rolling in Month 2.",
  },

  // ── Generic Errors ───────────────────────────────────────────────────────
  errors: {
    network: "Can't reach the server right now. It's not you — probably.",
    unknown: "Something went wrong. Not ideal, but here we are.",
    unauthorized: "You don't have access to that.",
    notFound: "That doesn't exist anymore. Or never did.",
  },

  // ── Empty States ─────────────────────────────────────────────────────────
  empty: {
    approvalQueue: {
      title: "Nothing here.",
      body: "Task deliverables and Content Studio pieces will show up when someone submits work for review. Until then, enjoy the silence.",
    },
    teamFeed: {
      body: "No messages yet. Someone has to go first.",
    },
    taskQueue: {
      title: "Queue's clear.",
      body: "Either everything is done or nothing's been assigned. Both are technically valid states.",
    },
    clientList: {
      body: "No clients yet. That's what the pipeline is for.",
    },
    leads: {
      body: "No leads match those filters. Try loosening them or run a Discovery scan.",
    },
  },

  // ── Confirmations ────────────────────────────────────────────────────────
  confirm: {
    deleteMessage: "Delete this message? There's no undo.",
    deleteFile: "Remove this file from the Vault? It'll be gone.",
    resetOnboarding: "Reset onboarding for this user? They'll have to go through it again.",
  },
} as const;
