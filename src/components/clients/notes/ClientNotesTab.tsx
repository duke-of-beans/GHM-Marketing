"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

export type ClientNote = {
  id: number;
  content: string;
  type: string;
  isPinned: boolean;
  tags: string[] | null;
  createdAt: string;
  author: { id: number; name: string };
  task: { id: number; title: string } | null;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Add Note Form ────────────────────────────────────────────────────────────

function AddNoteForm({
  onSubmit,
}: {
  onSubmit: (content: string, type: string, isPinned?: boolean) => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("update");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await onSubmit(content, type, isPinned);
      setContent("");
      setIsPinned(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Add a note, contact log, or pin a standing instruction as a Client Standard..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <div className="flex items-center gap-3">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="call">Call Log</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="issue">Issue</SelectItem>
            <SelectItem value="standard">Client Standard</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="rounded"
          />
          Pin as Client Standard
        </label>
        <Button type="submit" size="sm" disabled={!content.trim() || loading} className="ml-auto">
          {loading ? "Saving..." : "Add Note"}
        </Button>
      </div>
    </form>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────

type Props = {
  clientId: number;
  initialNotes: ClientNote[];
};

export function ClientNotesTab({ clientId, initialNotes }: Props) {
  const [notes, setNotes] = useState<ClientNote[]>(initialNotes);

  async function addNote(content: string, type: string, isPinned = false) {
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, isPinned }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const { data } = await res.json();
      setNotes((prev) => [data, ...prev]);
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    }
  }

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const regularNotes = notes.filter((n) => !n.isPinned);

  return (
    <div className="space-y-4">
      <AddNoteForm onSubmit={addNote} />

      {pinnedNotes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-0.5">📌 Client Standards</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Pinned instructions that always apply to this account
          </p>
          <div className="space-y-2">
            {pinnedNotes.map((note) => (
              <Card key={note.id} className="border-amber-200 bg-amber-50/50">
                <CardContent className="py-3">
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.author.name} · {formatDate(note.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium mb-2">Notes</h3>
        {regularNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No notes yet. Add contact logs, task updates, or pin a Client Standard above to keep
            standing instructions visible at all times.
          </p>
        ) : (
          <div className="space-y-2">
            {regularNotes.map((note) => (
              <Card key={note.id}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {note.author.name} · {formatDate(note.createdAt)}
                        {note.task && <> · Re: {note.task.title}</>}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {note.type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
