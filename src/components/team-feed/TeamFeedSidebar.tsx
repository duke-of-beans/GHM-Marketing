"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare,
  Pin,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Send,
  Reply,
  Trash2,
  X,
  PanelRightOpen,
  PanelRightClose,
  Paperclip,
  HardDriveDownload,
  CheckCircle,
  CornerDownLeft,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { voice, pick } from "@/lib/voice";
import { useModifierKey } from "@/hooks/use-modifier-key";

// ─── Types (duplicated from TeamFeed to avoid cross-import issues) ────────────

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
  replies: Array<Omit<TeamMessageData, "replies"> & { reads: { readAt: string }[] }>;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  attachmentMimeType?: string | null;
  attachmentVaultId?: number | null;
};
type TeamUser = { id: number; name: string; role: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function AttachmentBlock({ msg }: { msg: Pick<TeamMessageData, "id" | "attachmentUrl" | "attachmentName" | "attachmentSize" | "attachmentVaultId"> }) {
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
    if (savedId) { toast.info(voice.messages.alreadyInVault); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/vault/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg.id, targetSpace: "private" }),
      });
      const json = await res.json();
      if (json.success) { setSavedId(json.file.id); toast.success(pick(voice.messages.savedToVault)); }
      else toast.error(voice.messages.saveFailed);
    } catch { toast.error(voice.messages.saveFailed); }
    finally { setSaving(false); }
  }
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 max-w-sm" onClick={(e) => e.stopPropagation()}>
      <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium truncate hover:underline block" title={name}>{name}</a>
        {size && <p className="text-[11px] text-muted-foreground">{size}</p>}
      </div>
      <button onClick={saveToVault} disabled={saving || !!savedId} title={savedId ? "Saved to Vault" : "Save to Vault"} className="flex-shrink-0 text-muted-foreground hover:text-primary disabled:opacity-50 transition-colors">
        {savedId ? <CheckCircle className="h-4 w-4 text-green-500" /> : saving ? <span className="text-[10px]">…</span> : <HardDriveDownload className="h-4 w-4" />}
      </button>
    </div>
  );
}

function priorityBadge(priority: string) {
  if (priority === "urgent") return <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-[10px] py-0">Urgent</Badge>;
  if (priority === "important") return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] py-0">Important</Badge>;
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

// ─── Compose ──────────────────────────────────────────────────────────────────

function ComposeBox({
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
  const [audienceValue, setAudienceValue] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [sending, setSending] = useState(false);
  const { symbol: modSymbol } = useModifierKey();

  async function send() {
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/team-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          audienceType: parentId ? "user" : audienceType,
          audienceValue: audienceType === "role" ? audienceValue : undefined,
          recipientId: audienceType === "user" ? recipientId : undefined,
          parentId,
          priority,
          isPinned,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setContent("");
      onSent();
      toast.success(parentId ? pick(voice.messages.replySent) : pick(voice.messages.sent));
    } catch {
      toast.error(voice.messages.sendFailed);
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
      {!parentId && (
        <div className="flex flex-wrap gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Select value={audienceType} onValueChange={setAudienceType}>
                    <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="role">By role</SelectItem>
                      <SelectItem value="user">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs font-medium">Who sees this?</p>
                <p className="text-muted-foreground text-xs mt-0.5">Everyone · By role (managers/sales) · Direct (one person)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                ))}
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
                  <p className="text-xs">Pinned messages float to the top of everyone&apos;s feed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground">{modSymbol}<CornerDownLeft className="h-3.5 w-3.5" /> to send</p>
        <Button size="sm" onClick={send} disabled={sending || !content.trim()} className="h-7 text-xs">
          <Send className="h-3 w-3 mr-1" />
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
}

// ─── Message Row ──────────────────────────────────────────────────────────────

function MessageRow({
  msg,
  currentUserId,
  isMaster,
  users,
  onRefresh,
}: {
  msg: TeamMessageData;
  currentUserId: number;
  isMaster: boolean;
  users: TeamUser[];
  onRefresh: () => void;
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
    toast.success(msg.isPinned ? pick(voice.messages.unpinned) : pick(voice.messages.pinned));
  }

  async function deleteMsg() {
    if (!confirm(voice.confirm.deleteMessage)) return;
    await fetch(`/api/team-messages/${msg.id}`, { method: "DELETE" });
    onRefresh();
    toast.success(pick(voice.messages.deleted));
  }

  return (
    <div
      className={`rounded-lg border p-3 transition-colors cursor-default ${
        !isRead ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      } ${msg.isPinned ? "border-amber-400/60 dark:border-amber-600/60" : ""}`}
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
            {msg.isPinned && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pin className="h-3 w-3 text-amber-500 cursor-default flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Pinned — always visible at top</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {priorityBadge(msg.priority)}
            {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
          </div>
          <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
          <AttachmentBlock msg={msg} />
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
            </span>
            <button
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); setReplying(!replying); }}
            >
              <Reply className="h-3 w-3" /> Reply
            </button>
            {hasReplies && (
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
                  </span>
                </div>
                <p className="text-xs mt-0.5 whitespace-pre-wrap break-words">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <div className="mt-3 ml-9" onClick={(e) => e.stopPropagation()}>
          <ComposeBox
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function TeamFeedSidebar({
  open,
  onClose,
  users,
  isMaster,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  users: TeamUser[];
  isMaster: boolean;
  currentUserId: number;
}) {
  const [messages, setMessages] = useState<TeamMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/team-messages");
      const data = await res.json();
      setMessages(data.messages ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const otherMessages = messages.filter((m) => !m.isPinned);

  return (
    <div
      className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
        open ? "w-80" : "w-0"
      }`}
    >
      {/* Inner panel — fixed width so content doesn't reflow during transition */}
      <div className="w-80 h-[calc(100vh-6rem)] sticky top-0 flex flex-col border rounded-xl bg-card shadow-sm ml-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Team Feed</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{voice.empty.teamFeed.body}</p>
            </div>
          ) : (
            <>
              {pinnedMessages.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1">Pinned</p>
                  {pinnedMessages.map((msg) => (
                    <MessageRow
                      key={msg.id}
                      msg={msg}
                      currentUserId={currentUserId}
                      isMaster={isMaster}
                      users={users}
                      onRefresh={load}
                    />
                  ))}
                  {otherMessages.length > 0 && (
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1 pt-1">Recent</p>
                  )}
                </>
              )}
              {otherMessages.map((msg) => (
                <MessageRow
                  key={msg.id}
                  msg={msg}
                  currentUserId={currentUserId}
                  isMaster={isMaster}
                  users={users}
                  onRefresh={load}
                />
              ))}
            </>
          )}
        </div>

        {/* Compose */}
        <div className="border-t p-3 flex-shrink-0">
          {composing ? (
            <ComposeBox
              onSent={() => { setComposing(false); load(); }}
              users={users}
              isMaster={isMaster}
            />
          ) : (
            <button
              className="w-full text-left text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg px-3 py-2 transition-colors"
              onClick={() => setComposing(true)}
            >
              Write a message to the team…
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Toggle Button (for use in page header) ───────────────────────────────────

export function TeamFeedToggle({
  open,
  onToggle,
  unreadCount,
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
            {open ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
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

