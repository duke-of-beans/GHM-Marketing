"use client";

/**
 * TeamFeedSidebar — Sprint 21-B full overhaul
 *
 * What changed vs Sprint 19:
 * - SSE replaces 30s polling (instant updates)
 * - Auto-scroll to bottom on open / new messages
 * - Pinned messages extracted to collapsible banner strip (not inline)
 * - Compose always visible — audience/priority collapsed until expanded
 * - @mention support with inline autocomplete
 * - Edit message (author only, in-place)
 * - "Seen by X" read receipts on hover
 * - Search bar in panel header
 * - Dead code removed (ReactionRow && true guard)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare, Pin, ChevronDown, ChevronUp, MoreHorizontal, Send, Reply,
  Trash2, X, PanelRightOpen, PanelRightClose, CornerDownLeft,
  Search, ChevronRight, Pencil, Check,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { voice, pick } from "@/lib/voice";
import { useModifierKey } from "@/hooks/use-modifier-key";
import { EmojiPickerButton, GifPickerButton, ReactionRow, InlineMedia } from "./TeamFeedMultimedia";
import { AttachmentBlock } from "./TeamFeedAttachment";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function priorityBadge(priority: string) {
  if (priority === "urgent")
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-[10px] py-0">Urgent</Badge>;
  if (priority === "important")
    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] py-0">Important</Badge>;
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

// ─── @Mention Autocomplete ────────────────────────────────────────────────────

function MentionAutocomplete({
  query,
  users,
  onSelect,
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
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [gifAttachment, setGifAttachment] = useState<{ url: string; title: string } | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentions, setMentions] = useState<{ userId: number; name: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { symbol: modSymbol } = useModifierKey();

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    // Detect @mention trigger
    const cursor = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
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
      setContent(""); setGifAttachment(null); setMentions([]); setOptionsOpen(false);
      onSent();
      toast.success(parentId ? pick(voice.messages.replySent) : pick(voice.messages.sent));
    } catch {
      toast.error(voice.messages.sendFailed);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`space-y-2 relative ${compact ? "" : "border rounded-lg p-3 bg-muted/30"}`}>
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
      {/* Audience / priority options — collapsed by default */}
      {!parentId && optionsOpen && (
        <div className="flex flex-wrap gap-1.5">
          <Select value={audienceType} onValueChange={setAudienceType}>
            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="role">By role</SelectItem>
              <SelectItem value="user">Direct</SelectItem>
            </SelectContent>
          </Select>
          {audienceType === "role" && (
            <Select value={audienceValue} onValueChange={setAudienceValue}>
              <SelectTrigger className="h-7 w-24 text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Managers</SelectItem>
                <SelectItem value="sales">Sales Reps</SelectItem>
              </SelectContent>
            </Select>
          )}
          {audienceType === "user" && (
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder="Person" /></SelectTrigger>
              <SelectContent>
                {users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="important">Important</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          {isMaster && (
            <Button variant={isPinned ? "default" : "outline"} size="sm" className="h-7 text-xs px-2"
              onClick={() => setIsPinned(!isPinned)}>
              <Pin className="h-3 w-3 mr-1" />{isPinned ? "Pinned" : "Pin"}
            </Button>
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <EmojiPickerButton onPick={(emoji) => setContent((c) => c + emoji)} />
          {!gifAttachment && <GifPickerButton onPick={setGifAttachment} />}
          {!parentId && (
            <button onClick={() => setOptionsOpen(!optionsOpen)}
              className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 transition-colors">
              {optionsOpen ? "▲ less" : "⋯ options"}
            </button>
          )}
          <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-1">
            {modSymbol}<CornerDownLeft className="h-3.5 w-3.5" />
          </p>
        </div>
        <Button size="sm" onClick={send}
          disabled={sending || (!content.trim() && !gifAttachment)} className="h-7 text-xs">
          <Send className="h-3 w-3 mr-1" />{sending ? "Sending…" : "Send"}
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

  async function deleteMsg() {
    if (!confirm(voice.confirm.deleteMessage)) return;
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

  // Render @mentions as highlighted spans
  function renderContent(text: string, mentions?: { userId: number; name: string }[] | null) {
    if (!mentions?.length) return <span className="whitespace-pre-wrap break-words">{text}</span>;
    const parts: React.ReactNode[] = [];
    let last = 0;
    for (const m of mentions) {
      const tag = `@${m.name}`;
      const idx = text.indexOf(tag, last);
      if (idx === -1) continue;
      parts.push(text.slice(last, idx));
      parts.push(
        <span key={m.userId} className="text-primary font-medium">{tag}</span>
      );
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

          {/* Content / Edit */}
          {editing ? (
            <div className="mt-1 space-y-1.5" onClick={(e) => e.stopPropagation()}>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="resize-none text-sm"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit(); }}
              />
              <div className="flex gap-1.5">
                <Button size="sm" className="h-6 text-xs" onClick={saveEdit} disabled={saving}>
                  <Check className="h-3 w-3 mr-1" />{saving ? "Saving…" : "Save"}
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
          <ReactionRow
            messageId={msg.id}
            reactions={msg.reactions ?? []}
            currentUserId={currentUserId}
            onUpdate={onRefresh}
          />

          {/* Footer */}
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
                    <p className="text-xs text-muted-foreground">
                      {readers.map((r) => r.user.name).join(", ")}
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); setReplying(!replying); }}>
              <Reply className="h-3 w-3" /> Reply
            </button>
            {hasReplies && (
              <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {msg.replies.length} {msg.replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
            {readers.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                Seen by {readers.length}
              </span>
            )}
          </div>
        </div>

        {/* Actions menu */}
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

      {/* Thread replies */}
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
                <ReactionRow
                  messageId={reply.id}
                  reactions={reply.reactions ?? []}
                  currentUserId={currentUserId}
                  onUpdate={onRefresh}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <div className="mt-3 ml-9" onClick={(e) => e.stopPropagation()}>
          <ComposeBox
            onSent={() => { setReplying(false); onRefresh(); }}
            users={users} isMaster={isMaster} parentId={msg.id}
            placeholder="Write a reply…" compact
          />
        </div>
      )}
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
    <div className="border-b bg-amber-50/60 dark:bg-amber-950/20 flex-shrink-0">
      <button
        className="w-full flex items-center gap-2 px-4 py-2 text-xs hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <Pin className="h-3 w-3 text-amber-500 flex-shrink-0" />
        <span className="font-medium text-amber-700 dark:text-amber-400 flex-1 text-left">
          {messages.length} pinned {messages.length === 1 ? "message" : "messages"}
        </span>
        {open ? <ChevronUp className="h-3 w-3 text-amber-500" /> : <ChevronRight className="h-3 w-3 text-amber-500" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {messages.map((msg) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              currentUserId={currentUserId}
              isMaster={isMaster}
              users={users}
              onRefresh={onRefresh}
            />
          ))}
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

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

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  // Load on open + scroll to bottom on first load
  useEffect(() => {
    if (!open) return;
    isFirstLoad.current = true;
    setLoading(true);
    load(search).then(() => {
      if (isFirstLoad.current) {
        // Defer scroll until DOM has painted
        requestAnimationFrame(() => scrollToBottom());
        isFirstLoad.current = false;
      }
    });
  }, [open, load, search, scrollToBottom]);

  // Scroll to bottom when new messages arrive (only if already near bottom)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isFirstLoad.current) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) requestAnimationFrame(() => scrollToBottom());
  }, [messages, scrollToBottom]);

  // SSE — replace polling
  useEffect(() => {
    if (!open) return;
    const sse = new EventSource("/api/team-messages/stream");
    sse.addEventListener("message", () => load(search));
    sse.addEventListener("reconnect", () => {
      sse.close();
      // Browser EventSource auto-reconnects after close isn't called,
      // but we explicitly re-mount via the effect cleanup/re-run
    });
    return () => sse.close();
  }, [open, load, search]);

  // Debounced search
  useEffect(() => {
    if (!searchActive) return;
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  }, [search, searchActive, load]);

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const feedMessages = [...messages.filter((m) => !m.isPinned)].reverse(); // chronological asc

  return (
    <div className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${open ? "w-80" : "w-0"}`}>
      <div className="w-80 h-[calc(100vh-6rem)] sticky top-0 flex flex-col border rounded-xl bg-card shadow-sm ml-4">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0">
          {searchActive ? (
            <div className="flex-1 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <Input
                autoFocus
                placeholder="Search messages…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0"
              />
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
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Pinned banner — sits above scroll area, doesn't displace feed */}
        <PinnedBanner
          messages={pinnedMessages}
          currentUserId={currentUserId}
          isMaster={isMaster}
          users={users}
          onRefresh={() => load(search)}
        />

        {/* Messages — newest at bottom (chronological asc) */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : feedMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{search ? "No messages found." : voice.empty.teamFeed.body}</p>
            </div>
          ) : (
            feedMessages.map((msg) => (
              <MessageRow
                key={msg.id}
                msg={msg}
                currentUserId={currentUserId}
                isMaster={isMaster}
                users={users}
                onRefresh={() => load(search)}
              />
            ))
          )}
        </div>

        {/* Compose — always visible */}
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
