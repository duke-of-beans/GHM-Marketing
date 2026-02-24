"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Pin,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Send,
  Bell,
  Reply,
  Trash2,
  Zap,
  Paperclip,
  HardDriveDownload,
  CheckCircle,
  CornerDownLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useModifierKey } from "@/hooks/use-modifier-key";
import { EmojiPickerButton, GifPickerButton, ReactionRow, InlineMedia } from "./TeamFeedMultimedia";
// ─── Types ───────────────────────────────────────────────────────────────────

type MessageAuthor = { id: number; name: string; role: string };

type TeamMessageData = {
  id: number;
  content: string;
  author: MessageAuthor;
  recipient: MessageAuthor | null;
  audienceType: string;
  audienceValue: string | null;
  isPinned: boolean;
  priority: string;
  createdAt: string;
  reads: { readAt: string }[];
  reactions: { userId: number; emoji: string }[];
  replies: Array<Omit<TeamMessageData, "replies"> & { reads: { readAt: string }[]; reactions: { userId: number; emoji: string }[] }>;
  // Attachment fields
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  attachmentMimeType?: string | null;
  attachmentVaultId?: number | null;
};

type TeamUser = { id: number; name: string; role: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function priorityBadge(priority: string) {
  if (priority === "urgent") return <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-[10px] py-0">Urgent</Badge>;
  if (priority === "important") return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] py-0">Important</Badge>;
  return null;
}

const AUDIENCE_ROLE_LABELS: Record<string, string> = {
  admin: "Admins",
  master: "Managers",
  sales: "Sales Reps",
};

function audienceLabel(msg: TeamMessageData) {
  if (msg.audienceType === "user" && msg.recipient) return `→ ${msg.recipient.name}`;
  if (msg.audienceType === "role" && msg.audienceValue)
    return `→ All ${AUDIENCE_ROLE_LABELS[msg.audienceValue] ?? msg.audienceValue}`;
  return "→ Everyone";
}

// ─── Compose Box ─────────────────────────────────────────────────────────────

function ComposeMessage({
  onSent,
  users,
  isMaster,
  parentId,
  placeholder = "Write a message...",
  compact = false,
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
  const [audienceValue, setAudienceValue] = useState<string>("");
  const [recipientId, setRecipientId] = useState<string>("");
  const [priority, setPriority] = useState("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [sending, setSending] = useState(false);
  const [gifAttachment, setGifAttachment] = useState<{ url: string; title: string } | null>(null);
  const { symbol: modSymbol } = useModifierKey();

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
          ...(gifAttachment && {
            attachmentUrl: gifAttachment.url,
            attachmentName: gifAttachment.title || "GIF",
            attachmentMimeType: "image/gif",
          }),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setContent("");
      setGifAttachment(null);
      onSent();
      toast.success(parentId ? "Reply sent" : "Message sent");
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`space-y-2 ${compact ? "" : "border rounded-lg p-3 bg-muted/30"}`}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        className="resize-none text-sm"
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
      />
      {gifAttachment && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gifAttachment.url} alt={gifAttachment.title} className="rounded-lg max-h-32 border" />
          <button
            onClick={() => setGifAttachment(null)}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border flex items-center justify-center hover:bg-muted"
          >
            <span className="text-xs">✕</span>
          </button>
        </div>
      )}
      {!parentId && (
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Select value={audienceType} onValueChange={setAudienceType}>
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="role">By role</SelectItem>
                      <SelectItem value="user">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-medium text-xs">Who sees this message?</p>
                <p className="text-muted-foreground text-xs mt-0.5">Everyone = all team • By role = managers or sales • Direct = one person</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {audienceType === "role" && (
            <Select value={audienceValue} onValueChange={setAudienceValue}>
              <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Managers</SelectItem>
                <SelectItem value="sales">Sales Reps</SelectItem>
              </SelectContent>
            </Select>
          )}
          {audienceType === "user" && (
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Select person" /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="important">Important</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          {isMaster && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isPinned ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => setIsPinned(!isPinned)}
                  >
                    <Pin className="h-3 w-3 mr-1" />
                    {isPinned ? "Pinned" : "Pin"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Pinned messages float to the top of everyone&apos;s feed and are always visible.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <EmojiPickerButton onPick={(emoji) => setContent((c) => c + emoji)} />
          {!gifAttachment && <GifPickerButton onPick={setGifAttachment} />}
          <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-1">{modSymbol}<CornerDownLeft className="h-3.5 w-3.5" /> to send</p>
        </div>
        <Button size="sm" onClick={send} disabled={sending || (!content.trim() && !gifAttachment)} className="h-7 text-xs">
          <Send className="h-3 w-3 mr-1" />
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
}

// ─── Attachment Block ─────────────────────────────────────────────────────────

function AttachmentBlock({ msg }: { msg: Pick<TeamMessageData, "id" | "attachmentUrl" | "attachmentName" | "attachmentSize" | "attachmentMimeType" | "attachmentVaultId"> }) {
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(msg.attachmentVaultId ?? null);

  if (!msg.attachmentUrl) return null;

  const name = msg.attachmentName ?? "attachment";
  const size = msg.attachmentSize
    ? msg.attachmentSize < 1024 * 1024
      ? `${(msg.attachmentSize / 1024).toFixed(1)} KB`
      : `${(msg.attachmentSize / (1024 * 1024)).toFixed(1)} MB`
    : null;

  async function saveToVault(e: React.MouseEvent) {
    e.stopPropagation();
    if (savedId) {
      toast.info("Already saved to Vault");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/vault/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg.id, targetSpace: "private" }),
      });
      const json = await res.json();
      if (json.success) {
        setSavedId(json.file.id);
        toast.success("Saved to your Vault (My Files)");
      } else {
        toast.error(json.error ?? "Save failed");
      }
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="mt-2 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 max-w-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <a
          href={msg.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium truncate hover:underline block"
          title={name}
        >
          {name}
        </a>
        {size && <p className="text-[11px] text-muted-foreground">{size}</p>}
      </div>
      <button
        onClick={saveToVault}
        disabled={saving || !!savedId}
        title={savedId ? "Saved to Vault" : "Save to Vault"}
        className="flex-shrink-0 text-muted-foreground hover:text-primary disabled:opacity-50 transition-colors"
      >
        {savedId ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : saving ? (
          <span className="text-[10px]">…</span>
        ) : (
          <HardDriveDownload className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

// ─── Single Message Row ───────────────────────────────────────────────────────

function MessageRow({
  msg,
  currentUserId,
  isMaster,
  users,
  onRefresh,
  showReplies = true,
}: {
  msg: TeamMessageData;
  currentUserId: number;
  isMaster: boolean;
  users: TeamUser[];
  onRefresh: () => void;
  showReplies?: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isRead = msg.reads.length > 0;
  const hasReplies = msg.replies.length > 0;

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
    toast.success(msg.isPinned ? "Unpinned" : "Pinned to top");
  }

  async function deleteMsg() {
    if (!confirm("Delete this message?")) return;
    await fetch(`/api/team-messages/${msg.id}`, { method: "DELETE" });
    onRefresh();
    toast.success("Message deleted");
  }

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        !isRead ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      } ${msg.isPinned ? "border-amber-400/60 dark:border-amber-600/60" : ""}`}
      onClick={markRead}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
          <AvatarFallback className="text-[10px]">{initials(msg.author.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold">{msg.author.name}</span>
            <span className="text-xs text-muted-foreground">{audienceLabel(msg)}</span>
            {msg.isPinned && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pin className="h-3 w-3 text-amber-500 cursor-default" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Pinned — always visible at the top of the feed</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {priorityBadge(msg.priority)}
            {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
          </div>
          <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          <InlineMedia url={msg.attachmentUrl ?? ""} name={msg.attachmentName} mimeType={msg.attachmentMimeType} />
          <AttachmentBlock msg={msg} />
          <ReactionRow
            messageId={msg.id}
            reactions={msg.reactions ?? []}
            currentUserId={currentUserId}
            onUpdate={onRefresh}
          />
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
            </span>
            {showReplies && (
              <button
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => { e.stopPropagation(); setReplying(!replying); }}
              >
                <Reply className="h-3 w-3" /> Reply
              </button>
            )}
            {hasReplies && showReplies && (
              <button
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {msg.replies.length} {msg.replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
        </div>
        {(isMaster || msg.author.id === currentUserId) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isMaster && (
                <DropdownMenuItem onClick={togglePin}>
                  <Pin className="h-4 w-4 mr-2" />
                  {msg.isPinned ? "Unpin" : "Pin to top"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={deleteMsg} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Replies */}
      {showReplies && expanded && hasReplies && (
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
                  </span>
                </div>
                <p className="text-xs mt-0.5 whitespace-pre-wrap">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply compose */}
      {showReplies && replying && (
        <div className="mt-3 ml-9" onClick={(e) => e.stopPropagation()}>
          <ComposeMessage
            onSent={() => { setReplying(false); onRefresh(); }}
            users={users}
            isMaster={isMaster}
            parentId={msg.id}
            placeholder="Write a reply..."
            compact
          />
        </div>
      )}
    </div>
  );
}

// ─── Full Feed Panel (Sheet) ──────────────────────────────────────────────────

export function TeamFeedPanel({
  users,
  isMaster,
  currentUserId,
  trigger,
}: {
  users: TeamUser[];
  isMaster: boolean;
  currentUserId: number;
  trigger: React.ReactNode;
}) {
  const [messages, setMessages] = useState<TeamMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team-messages");
      const data = await res.json();
      setMessages(data.messages ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Team Feed
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs mt-1">Be the first to post something.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageRow
                key={msg.id}
                msg={msg}
                currentUserId={currentUserId}
                isMaster={isMaster}
                users={users}
                onRefresh={load}
              />
            ))
          )}
        </div>

        <div className="border-t p-4">
          {composing ? (
            <ComposeMessage
              onSent={() => { setComposing(false); load(); }}
              users={users}
              isMaster={isMaster}
            />
          ) : (
            <Button className="w-full" onClick={() => { setComposing(true); load(); }}>
              <Send className="h-4 w-4 mr-2" />
              New Message
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Dashboard Widget ─────────────────────────────────────────────────────────

export function TeamFeedWidget({
  users,
  isMaster,
  currentUserId,
}: {
  users: TeamUser[];
  isMaster: boolean;
  currentUserId: number;
}) {
  const [messages, setMessages] = useState<TeamMessageData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/team-messages?feed=true");
      const data = await res.json();
      setMessages(data.messages ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll every 30s for new messages
  useEffect(() => {
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const recentMessages = messages.filter((m) => !m.isPinned).slice(0, 4);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5" />
            Team Feed
            {unreadCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-5 flex items-center justify-center rounded-full cursor-default">
                      {unreadCount}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-xs">{unreadCount} unread {unreadCount === 1 ? "message" : "messages"} — click to open and mark as read</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardTitle>
          <TeamFeedPanel
            users={users}
            isMaster={isMaster}
            currentUserId={currentUserId}
            trigger={
              <Button variant="ghost" size="sm" className="text-xs h-7">
                View all
              </Button>
            }
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 min-h-0">
        {loading ? (
          <div className="space-y-2">
            {[1,2].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <>
            {/* Pinned messages first */}
            {pinnedMessages.map((msg) => (
              <MessageRow
                key={msg.id}
                msg={msg}
                currentUserId={currentUserId}
                isMaster={isMaster}
                users={users}
                onRefresh={load}
                showReplies={false}
              />
            ))}
            {/* Recent messages */}
            {recentMessages.map((msg) => (
              <MessageRow
                key={msg.id}
                msg={msg}
                currentUserId={currentUserId}
                isMaster={isMaster}
                users={users}
                onRefresh={load}
                showReplies={false}
              />
            ))}
          </>
        )}
      </CardContent>

      {/* Quick compose at bottom of widget */}
      <div className="border-t p-3">
        <TeamFeedPanel
          users={users}
          isMaster={isMaster}
          currentUserId={currentUserId}
          trigger={
            <button className="w-full text-left text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg px-3 py-2 transition-colors">
              Write a message to the team…
            </button>
          }
        />
      </div>
    </Card>
  );
}

