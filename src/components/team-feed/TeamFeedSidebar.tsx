"use client";

/**
 * TeamFeedSidebar — Sprint Cowork overhaul
 *
 * New in this version vs Sprint 21-B:
 * - Resizable panel: drag handle on left edge, min 280px / max 520px
 *   Persists to localStorage key `covos:teamfeed-width`
 * - Two-pane interior: 64px people strip (left) + message thread (right)
 * - Presence dots on people strip: green = active in last 5min, grey = offline
 *   Polls GET /api/team/presence every 30s
 * - Typing indicator: "X is typing…" fires from ComposeBox onChange (debounced)
 *   POST /api/team-messages/typing → SSE "typing" event → rendered at bottom
 *   Auto-clears on client after 4s
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare, Pin, ChevronDown, ChevronUp, MoreHorizontal, Send, Reply,
  Trash2, X, PanelRightOpen, PanelRightClose, CornerDownLeft,
  Search, ChevronRight, Pencil, Check, Users, AlertCircle, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { voice, pick } from "@/lib/voice";
import { useModifierKey } from "@/hooks/use-modifier-key";
import { EmojiPickerButton, GifPickerButton, ReactionRow, InlineMedia } from "./TeamFeedMultimedia";
import { AttachmentBlock } from "./TeamFeedAttachment";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 280;
const MAX_WIDTH = 520;
const PRESENCE_ACTIVE_MS = 5 * 60 * 1000; // 5 minutes

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageAuthor = { id: number; name: string; role: string };
export type TeamMessageReader = { userId: number; readAt: string; user: { id: number; name: string } };
export type TeamMessageData = {
  id: number;
  content: string;
  author: MessageAuthor;
  recipient: MessageAuthor | null;
  audienceType: string;
  audienceValue: string | null;
  isPinned: boolean;
  priority: string;
  createdAt: string;
  editedAt?: string | null;
  mentions?: { userId: number; name: string }[] | null;
  reads: TeamMessageReader[];
  reactions: { userId: number; emoji: string }[];
  replies: Array<Omit<TeamMessageData, "replies"> & {
    reads: TeamMessageReader[];
    reactions: { userId: number; emoji: string }[];
  }>;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  attachmentMimeType?: string | null;
  attachmentVaultId?: number | null;
};
export type TeamUser = { id: number; name: string; role: string };

type PresenceUser = {
  userId: number;
  name: string;
  role: string;
  lastSeen: string | null;
};

type TypingUser = { userId: number; name: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function priorityBadge(priority: string) {
  if (priority === "urgent")
    return <StatusBadge variant="danger">Urgent</StatusBadge>;
  if (priority === "important")
    return <StatusBadge variant="warning">Important</StatusBadge>;
  return null;
}

function audienceLabel(msg: TeamMessageData) {
  if (msg.audienceType === "user" && msg.recipient) return `→ ${msg.recipient.name}`;
  if (msg.audienceType === "role" && msg.audienceValue) {
    const labels: Record<string, string> = { admin: "Admins", master: "Managers", sales: "Sales Reps" };
    return `→ All ${labels[msg.audienceValue] ?? msg.audienceValue}`;
  }
  return "→ Everyone";
}

function isActive(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < PRESENCE_ACTIVE_MS;
}

function savedWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  const stored = localStorage.getItem("covos:teamfeed-width");
  if (!stored) return DEFAULT_WIDTH;
  const n = parseInt(stored, 10);
  return isNaN(n) ? DEFAULT_WIDTH : Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, n));
}

// ─── @Mention Autocomplete ────────────────────────────────────────────────────

function MentionAutocomplete({
  query, users, onSelect,
}: {
  query: string;
  users: TeamUser[];
  onSelect: (user: TeamUser) => void;
}) {
  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);
  if (!filtered.length) return null;
  return (
    <div className="absolute bottom-full mb-1 left-0 w-48 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
      {filtered.map((u) => (
        <button
          key={u.id}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
          onMouseDown={(e) => { e.preventDefault(); onSelect(u); }}
        >
          <Avatar className="h-5 w-5 flex-shrink-0">
            <AvatarFallback className="text-[8px]">{initials(u.name)}</AvatarFallback>
          </Avatar>
          {u.name}
        </button>
      ))}
    </div>
  );
}

// ─── Compose Box ──────────────────────────────────────────────────────────────

function ComposeBox({
  onSent, users, isMaster, parentId,
  placeholder = "Message the team…", compact = false,
}: {
  onSent: () => void;
  users: TeamUser[];
  isMaster: boolean;
  parentId?: number;
  placeholder?: string;
  compact?: boolean;
}) {
  const [content, setContent] = useState("");
  const [audienceType, setAudienceType] = useState("all");
  const [audienceValue, setAudienceValue] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [sending, setSending] = useState(false);
  const [gifAttachment, setGifAttachment] = useState<{ url: string; title: string } | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentions, setMentions] = useState<{ userId: number; name: string }[]>([]);
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { symbol: modSymbol } = useModifierKey();

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    const cursor = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);

    // Fire typing indicator (debounced 500ms, main compose only)
    if (!parentId && val.trim()) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        fetch("/api/team-messages/typing", { method: "POST" }).catch(() => {});
      }, 500);
    }
  }

  function insertMention(user: TeamUser) {
    const cursor = textareaRef.current?.selectionStart ?? content.length;
    const before = content.slice(0, cursor);
    const after = content.slice(cursor);
    const replaced = before.replace(/@\w*$/, `@${user.name} `);
    setContent(replaced + after);
    setMentionQuery(null);
    if (!mentions.find((m) => m.userId === user.id)) {
      setMentions((prev) => [...prev, { userId: user.id, name: user.name }]);
    }
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function audienceChipLabel() {
    if (parentId) return null;
    if (audienceType === "all") return "Everyone";
    if (audienceType === "role") {
      if (audienceValue === "manager") return "Managers";
      if (audienceValue === "sales") return "Sales";
      return "By role";
    }
    if (audienceType === "user") {
      const u = users.find((u) => String(u.id) === recipientId);
      return u ? u.name : "Direct";
    }
    return "Everyone";
  }

  function cyclePriority() {
    setPriority((p) => p === "normal" ? "important" : p === "important" ? "urgent" : "normal");
  }

  const priorityIcon = priority === "urgent"
    ? <Zap className="h-3.5 w-3.5 text-status-danger" />
    : priority === "important"
    ? <AlertCircle className="h-3.5 w-3.5 text-status-warning" />
    : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/40" />;

  async function send() {
    if (!content.trim() && !gifAttachment) return;
    setSending(true);
    try {
      const res = await fetch("/api/team-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim() || (gifAttachment ? gifAttachment.title : ""),
          audienceType: parentId ? "user" : audienceType,
          audienceValue: audienceType === "role" ? audienceValue : undefined,
          recipientId: audienceType === "user" ? recipientId : undefined,
          parentId,
          priority,
          isPinned,
          mentions: mentions.length > 0 ? mentions : undefined,
          ...(gifAttachment && {
            attachmentUrl: gifAttachment.url,
            attachmentName: gifAttachment.title || "GIF",
            attachmentMimeType: "image/gif",
          }),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setContent(""); setGifAttachment(null); setMentions([]);
      onSent();
      toast.success(parentId ? pick(voice.messages.replySent) : pick(voice.messages.sent));
    } catch {
      toast.error(voice.messages.sendFailed);
    } finally {
      setSending(false);
    }
  }

  const chipLabel = audienceChipLabel();

  return (
    <div className={`space-y-1.5 relative ${compact ? "" : ""}`}>
      {mentionQuery !== null && (
        <MentionAutocomplete query={mentionQuery} users={users} onSelect={insertMention} />
      )}
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        className="resize-none text-sm"
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
      />
      {gifAttachment && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gifAttachment.url} alt={gifAttachment.title} className="rounded-lg max-h-32 border" />
          <button onClick={() => setGifAttachment(null)}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border flex items-center justify-center hover:bg-muted">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {!parentId && showAudiencePicker && (
        <div className="rounded-lg border bg-popover p-2 shadow-md space-y-1.5 text-xs">
          <p className="font-medium text-muted-foreground px-1">Who sees this?</p>
          <div className="flex flex-wrap gap-1">
            {[
              { value: "all", label: "Everyone" },
              { value: "role_manager", label: "Managers" },
              { value: "role_sales", label: "Sales" },
            ].map((opt) => {
              const active =
                opt.value === "all" ? audienceType === "all"
                : opt.value === "role_manager" ? audienceType === "role" && audienceValue === "manager"
                : audienceType === "role" && audienceValue === "sales";
              return (
                <button key={opt.value}
                  onClick={() => {
                    if (opt.value === "all") { setAudienceType("all"); setAudienceValue(""); }
                    else if (opt.value === "role_manager") { setAudienceType("role"); setAudienceValue("manager"); }
                    else { setAudienceType("role"); setAudienceValue("sales"); }
                    setShowAudiencePicker(false);
                  }}
                  className={`px-2 py-1 rounded border text-xs transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="font-medium text-muted-foreground px-1 pt-0.5">Direct message</p>
          <div className="flex flex-wrap gap-1">
            {users.map((u) => (
              <button key={u.id}
                onClick={() => { setAudienceType("user"); setRecipientId(String(u.id)); setShowAudiencePicker(false); }}
                className={`px-2 py-1 rounded border text-xs transition-colors ${
                  audienceType === "user" && recipientId === String(u.id)
                    ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-1 min-w-0">
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
          {!parentId && chipLabel && (
            <button
              onClick={() => setShowAudiencePicker(!showAudiencePicker)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors flex-shrink-0 ${
                audienceType !== "all"
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-muted/60 border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Users className="h-3 w-3" />
              {chipLabel}
            </button>
          )}
          {!parentId && (
            <button onClick={cyclePriority} title={`Priority: ${priority}`}
              className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0">
              {priorityIcon}
            </button>
          )}
          {isMaster && !parentId && (
            <button onClick={() => setIsPinned(!isPinned)} title={isPinned ? "Pinned" : "Pin message"}
              className={`p-1 rounded transition-colors flex-shrink-0 ${isPinned ? "text-status-warning" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
              <Pin className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="flex items-center gap-0.5 ml-0.5 flex-shrink-0">
            <EmojiPickerButton onPick={(emoji) => setContent((c) => c + emoji)} />
            {!gifAttachment && <GifPickerButton onPick={setGifAttachment} />}
          </div>
        </div>
        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground flex-shrink-0">
          {modSymbol}<CornerDownLeft className="h-3 w-3" />
        </span>
        <Button size="sm" onClick={send}
          disabled={sending || (!content.trim() && !gifAttachment)} className="h-7 text-xs px-3 ml-1 flex-shrink-0">
          {sending ? "…" : <><Send className="h-4 w-4 mr-1" />Send</>}
        </Button>
      </div>
    </div>
  );
}

// ─── Message Row ──────────────────────────────────────────────────────────────

function MessageRow({
  msg, currentUserId, isMaster, users, onRefresh,
}: {
  msg: TeamMessageData;
  currentUserId: number;
  isMaster: boolean;
  users: TeamUser[];
  onRefresh: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editContent, setEditContent] = useState(msg.content);
  const [saving, setSaving] = useState(false);

  const isRead = msg.reads.some((r) => r.userId === currentUserId);
  const hasReplies = msg.replies.length > 0;
  const readers = msg.reads.filter((r) => r.userId !== msg.author.id);
  const canEdit = msg.author.id === currentUserId;

  async function markRead() {
    if (isRead) return;
    await fetch(`/api/team-messages/${msg.id}/read`, { method: "POST" });
    onRefresh();
  }

  async function togglePin() {
    await fetch(`/api/team-messages/${msg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !msg.isPinned }),
    });
    onRefresh();
    toast.success(msg.isPinned ? pick(voice.messages.unpinned) : pick(voice.messages.pinned));
  }

  function deleteMsg() {
    setShowDeleteConfirm(true);
  }

  async function confirmDeleteMsg() {
    await fetch(`/api/team-messages/${msg.id}`, { method: "DELETE" });
    onRefresh();
    toast.success(pick(voice.messages.deleted));
  }

  async function saveEdit() {
    if (!editContent.trim() || editContent === msg.content) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/team-messages/${msg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error();
      onRefresh();
      setEditing(false);
      toast.success("Message updated");
    } catch {
      toast.error("Failed to save edit");
    } finally {
      setSaving(false);
    }
  }

  function renderContent(text: string, mentions?: { userId: number; name: string }[] | null) {
    if (!mentions?.length) return <span className="whitespace-pre-wrap break-words">{text}</span>;
    const parts: React.ReactNode[] = [];
    let last = 0;
    for (const m of mentions) {
      const tag = `@${m.name}`;
      const idx = text.indexOf(tag, last);
      if (idx === -1) continue;
      parts.push(text.slice(last, idx));
      parts.push(<span key={m.userId} className="text-primary font-medium">{tag}</span>);
      last = idx + tag.length;
    }
    parts.push(text.slice(last));
    return <span className="whitespace-pre-wrap break-words">{parts}</span>;
  }

  return (
    <div
      className={`rounded-lg border p-3 transition-colors cursor-default ${
        !isRead ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
      onClick={markRead}
    >
      <div className="flex items-start gap-2.5">
        <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
          <AvatarFallback className="text-[10px]">{initials(msg.author.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold">{msg.author.name}</span>
            <span className="text-xs text-muted-foreground truncate">{audienceLabel(msg)}</span>
            {priorityBadge(msg.priority)}
            {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
          </div>
          {editing ? (
            <div className="mt-1 space-y-1.5" onClick={(e) => e.stopPropagation()}>
              <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                rows={3} className="resize-none text-sm" autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit(); }} />
              <div className="flex gap-1.5">
                <Button size="sm" className="h-6 text-xs" onClick={saveEdit} disabled={saving}>
                  <Check className="h-4 w-4 mr-1" />{saving ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs"
                  onClick={() => { setEditing(false); setEditContent(msg.content); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 leading-relaxed">
              {renderContent(msg.content, msg.mentions)}
            </p>
          )}
          <InlineMedia url={msg.attachmentUrl ?? ""} name={msg.attachmentName} mimeType={msg.attachmentMimeType} />
          <AttachmentBlock msg={msg} />
          <ReactionRow messageId={msg.id} reactions={msg.reactions ?? []} currentUserId={currentUserId} onUpdate={onRefresh} />
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[11px] text-muted-foreground cursor-default">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    {msg.editedAt && <span className="ml-1 opacity-60">(edited)</span>}
                  </span>
                </TooltipTrigger>
                {readers.length > 0 && (
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs font-medium mb-0.5">Seen by</p>
                    <p className="text-xs text-muted-foreground">{readers.map((r) => r.user.name).join(", ")}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); setReplying(!replying); }}>
              <Reply className="h-4 w-4" /> Reply
            </button>
            {hasReplies && (
              <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {msg.replies.length} {msg.replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
            {readers.length > 0 && (
              <span className="text-[11px] text-muted-foreground">Seen by {readers.length}</span>
            )}
          </div>
        </div>
        {(isMaster || msg.author.id === currentUserId) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => { setEditing(true); setEditContent(msg.content); }}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {isMaster && (
                <DropdownMenuItem onClick={togglePin}>
                  <Pin className="h-4 w-4 mr-2" />
                  {msg.isPinned ? "Unpin" : "Pin to top"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={deleteMsg} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {expanded && hasReplies && (
        <div className="mt-3 ml-9 space-y-2 border-l-2 border-muted pl-3">
          {msg.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2">
              <Avatar className="h-5 w-5 flex-shrink-0 mt-0.5">
                <AvatarFallback className="text-[8px]">{initials(reply.author.name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">{reply.author.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    {reply.editedAt && <span className="ml-1 opacity-60">(edited)</span>}
                  </span>
                </div>
                <p className="text-xs mt-0.5 whitespace-pre-wrap break-words">{reply.content}</p>
                <ReactionRow messageId={reply.id} reactions={reply.reactions ?? []}
                  currentUserId={currentUserId} onUpdate={onRefresh} />
              </div>
            </div>
          ))}
        </div>
      )}
      {replying && (
        <div className="mt-3 ml-9" onClick={(e) => e.stopPropagation()}>
          <ComposeBox onSent={() => { setReplying(false); onRefresh(); }}
            users={users} isMaster={isMaster} parentId={msg.id}
            placeholder="Write a reply…" compact />
        </div>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This message will be removed for everyone in the feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMsg} className="bg-destructive text-destructive-foreground">
              Delete message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Pinned Banner Strip ──────────────────────────────────────────────────────

function PinnedBanner({
  messages, currentUserId, isMaster, users, onRefresh,
}: {
  messages: TeamMessageData[];
  currentUserId: number;
  isMaster: boolean;
  users: TeamUser[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (!messages.length) return null;
  return (
    <div className="border-b bg-status-warning-bg/60 flex-shrink-0">
      <button
        className="w-full flex items-center gap-2 px-4 py-2 text-xs hover:bg-status-warning-bg/50 dark:hover:bg-status-warning-bg/20 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <Pin className="h-4 w-4 text-status-warning flex-shrink-0" />
        <span className="font-medium text-status-warning flex-1 text-left">
          {messages.length} pinned {messages.length === 1 ? "message" : "messages"}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-status-warning" /> : <ChevronRight className="h-4 w-4 text-status-warning" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {messages.map((msg) => (
            <MessageRow key={msg.id} msg={msg} currentUserId={currentUserId}
              isMaster={isMaster} users={users} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── People Strip ─────────────────────────────────────────────────────────────

function PeopleStrip({ presenceUsers }: { presenceUsers: PresenceUser[] }) {
  return (
    <div className="w-16 flex-shrink-0 flex flex-col items-center py-3 gap-2.5 border-r bg-muted/10 overflow-y-auto">
      {presenceUsers.map((u) => (
        <TooltipProvider key={u.userId}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative cursor-default">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[9px] bg-secondary">{initials(u.name)}</AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${
                    isActive(u.lastSeen) ? "bg-green-500" : "bg-slate-400"
                  }`}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              <p className="font-medium">{u.name}</p>
              <p className="text-muted-foreground">{isActive(u.lastSeen) ? "Active now" : "Offline"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {presenceUsers.length === 0 && (
        <div className="flex items-center justify-center py-2 opacity-30">
          <Users className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function TeamFeedSidebar({
  open, onClose, users, isMaster, currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  users: TeamUser[];
  isMaster: boolean;
  currentUserId: number;
}) {
  const [messages, setMessages] = useState<TeamMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isMobile, setIsMobile] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_WIDTH);
  const currentWidthRef = useRef(DEFAULT_WIDTH);

  // Init panel width from localStorage on mount
  useEffect(() => {
    const w = savedWidth();
    setPanelWidth(w);
    currentWidthRef.current = w;
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Content fade-in animation (delayed 200ms after open)
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setContentVisible(true), 200);
      return () => clearTimeout(t);
    } else {
      setContentVisible(false);
    }
  }, [open]);

  // ── Drag resize ──────────────────────────────────────────────────────────
  function handleDragStart(e: React.MouseEvent) {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = currentWidthRef.current;

    function onMouseMove(ev: MouseEvent) {
      if (!isDragging.current) return;
      // Left edge drag: moving left (smaller clientX) → panel grows
      const delta = dragStartX.current - ev.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
      currentWidthRef.current = newWidth;
      setPanelWidth(newWidth);
    }

    function onMouseUp() {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      localStorage.setItem("covos:teamfeed-width", String(currentWidthRef.current));
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  // ── Messages ─────────────────────────────────────────────────────────────
  const load = useCallback(async (q = "") => {
    try {
      const url = q ? `/api/team-messages?q=${encodeURIComponent(q)}` : "/api/team-messages";
      const res = await fetch(url);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!open) return;
    isFirstLoad.current = true;
    setLoading(true);
    load(search).then(() => {
      if (isFirstLoad.current) {
        requestAnimationFrame(() => scrollToBottom());
        isFirstLoad.current = false;
      }
    });
  }, [open, load, search, scrollToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isFirstLoad.current) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) requestAnimationFrame(() => scrollToBottom());
  }, [messages, scrollToBottom]);

  // ── SSE ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const sse = new EventSource("/api/team-messages/stream");

    sse.addEventListener("message", () => load(search));

    sse.addEventListener("typing", (e) => {
      try {
        const typers = JSON.parse(e.data) as TypingUser[];
        const filtered = typers.filter((u) => u.userId !== currentUserId);
        setTypingUsers(filtered);
        if (typingClearRef.current) clearTimeout(typingClearRef.current);
        if (filtered.length > 0) {
          typingClearRef.current = setTimeout(() => setTypingUsers([]), 4_000);
        }
      } catch { /* ignore malformed */ }
    });

    sse.addEventListener("reconnect", () => sse.close());

    return () => sse.close();
  }, [open, load, search, currentUserId]);

  // ── Presence polling ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    async function fetchPresence() {
      try {
        const res = await fetch("/api/team/presence");
        if (!res.ok) return;
        const data = await res.json();
        setPresenceUsers(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
    }
    fetchPresence();
    const interval = setInterval(fetchPresence, 30_000);
    return () => clearInterval(interval);
  }, [open]);

  // ── Debounced search ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchActive) return;
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  }, [search, searchActive, load]);

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const feedMessages = [...messages.filter((m) => !m.isPinned)].reverse();

  // Interior content (reused in both desktop and mobile layouts)
  const panelInterior = (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b flex-shrink-0">
        {searchActive ? (
          <div className="flex-1 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <Input autoFocus placeholder="Search messages…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0" />
            <button onClick={() => { setSearchActive(false); setSearch(""); load(""); }}
              className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold text-sm flex-1">Team Feed</span>
            <button onClick={() => setSearchActive(true)}
              className="text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-4 w-4" />
            </button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Pinned banner */}
      <PinnedBanner messages={pinnedMessages} currentUserId={currentUserId}
        isMaster={isMaster} users={users} onRefresh={() => load(search)} />

      {/* Messages scroll */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : feedMessages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={search ? "No messages found" : voice.empty.teamFeed.body}
            variant="inline"
            iconSize="h-8 w-8"
          />
        ) : (
          feedMessages.map((msg) => (
            <MessageRow key={msg.id} msg={msg} currentUserId={currentUserId}
              isMaster={isMaster} users={users} onRefresh={() => load(search)} />
          ))
        )}
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-3 py-1.5 border-t flex-shrink-0">
          <p className="text-xs text-muted-foreground italic">
            {typingUsers.map((u) => u.name).join(", ")}{" "}
            {typingUsers.length === 1 ? "is" : "are"} typing…
          </p>
        </div>
      )}

      {/* Compose */}
      <div className="border-t p-3 flex-shrink-0">
        <ComposeBox
          onSent={() => {
            load(search).then(() => requestAnimationFrame(() => scrollToBottom()));
          }}
          users={users}
          isMaster={isMaster}
        />
      </div>
    </div>
  );

  // Mobile bottom sheet layout
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={onClose}
          />
        )}
        {/* Bottom sheet */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-2xl md:hidden transition-transform duration-300 ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
          style={{ height: "70vh" }}
        >
          {/* Drag handle visual */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          {/* Two-pane interior */}
          <div className="flex flex-1 min-h-0 h-[calc(100%-20px)]">
            <PeopleStrip presenceUsers={presenceUsers} />
            {panelInterior}
          </div>
        </div>
      </>
    );
  }

  // Desktop side panel layout
  return (
    <div
      style={{ width: open ? `${panelWidth}px` : 0 }}
      className="flex-shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden"
    >
      <div
        style={{ width: `${panelWidth}px` }}
        className={`h-[calc(100vh-6rem)] sticky top-0 flex flex-col border rounded-lg bg-card shadow-sm ml-4 relative transition-opacity duration-200 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Drag handle — left edge */}
        <div
          onMouseDown={handleDragStart}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 rounded-l-lg hover:bg-primary/20 transition-colors"
          title="Drag to resize"
        />

        {/* Two-pane interior */}
        <div className="flex flex-1 min-h-0">
          {/* People strip — 64px fixed */}
          <PeopleStrip presenceUsers={presenceUsers} />
          {panelInterior}
        </div>
      </div>
    </div>
  );
}

// ─── Toggle Button ────────────────────────────────────────────────────────────

export function TeamFeedToggle({
  open, onToggle, unreadCount,
}: {
  open: boolean;
  onToggle: () => void;
  unreadCount: number;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={open ? "secondary" : "outline"}
            size="sm"
            className="relative h-8 gap-1.5"
            onClick={onToggle}
          >
            {open ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            <span className="text-xs hidden sm:inline">Team Feed</span>
            {!open && unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-0.5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {open ? "Close Team Feed" : "Open Team Feed"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
