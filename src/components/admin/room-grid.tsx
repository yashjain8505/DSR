"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  ExternalLink,
  Link2,
  Search,
  Trash2,
  Building2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";
import {
  lookupKanban,
  getStageLabel,
  getStageColors,
} from "@/lib/kanban-status";
import type { KanbanEntry } from "@/lib/kanban-status";
import type { Room } from "@/lib/types";

interface RoomGridProps {
  initialRooms: Room[];
  kanbanMap: Record<string, KanbanEntry>;
}

export function RoomGrid({ initialRooms, kanbanMap }: RoomGridProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const notesRef = useRef<HTMLTextAreaElement>(null);

  async function saveNotes(roomId: string) {
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: draftNotes }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, notes: draftNotes } : r))
      );
    } catch {}
    setEditingNotesId(null);
  }

  function handleCopyLink(room: Room) {
    const url = `${window.location.origin}/room/${room.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(room.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredRooms = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rooms;
    return rooms.filter(
      (r) =>
        r.company_name.toLowerCase().includes(q) ||
        (r.contact_name && r.contact_name.toLowerCase().includes(q)) ||
        r.slug.toLowerCase().includes(q)
    );
  }, [rooms, search]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/rooms/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete room");
      }
      setRooms((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete room");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rooms by company, contact, or slug…"
          className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#4d4bf7] focus:outline-none focus:ring-2 focus:ring-[#c9d4ff]"
        />
      </div>

      {filteredRooms.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">
          No rooms match &ldquo;{search}&rdquo;
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => {
            const kanban = lookupKanban(kanbanMap, room.company_name);
            const colors = kanban ? getStageColors(kanban.stage) : null;

            return (
              <div
                key={room.id}
                className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    {room.logo_url ? (
                      <Image
                        src={room.logo_url}
                        alt={room.company_name}
                        width={44}
                        height={44}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  {kanban ? (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        colors!.bg,
                        colors!.text
                      )}
                    >
                      {getStageLabel(kanban.stage)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                      No status
                    </span>
                  )}
                </div>

                <Link
                  href={`/admin/rooms/${room.id}`}
                  className="mb-1 text-sm font-semibold text-gray-900 hover:text-[#4d4bf7]"
                >
                  {room.company_name}
                </Link>
                {room.contact_name && (
                  <p className="text-xs text-gray-500">{room.contact_name}</p>
                )}

                {kanban?.lastTouch && (
                  <p className="mt-1 text-xs text-gray-400">
                    Last follow-up: {formatDate(kanban.lastTouch)}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-gray-400">
                  Room created on: {formatDate(room.created_at)}
                </p>

                {editingNotesId === room.id ? (
                  <div className="mt-2">
                    <textarea
                      ref={notesRef}
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          saveNotes(room.id);
                        }
                        if (e.key === "Escape") setEditingNotesId(null);
                      }}
                      onBlur={() => saveNotes(room.id)}
                      rows={2}
                      className="w-full rounded-md border border-[#4d4bf7] px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#4d4bf7]"
                      placeholder="Add a note…"
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNotesId(room.id);
                      setDraftNotes(room.notes || "");
                    }}
                    className="mt-2 w-full rounded-md border border-dashed border-gray-200 px-2 py-1 text-left text-xs text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
                  >
                    {room.notes || (
                      <span className="flex items-center gap-1 text-gray-400">
                        <Pencil className="h-3 w-3" />
                        Add a note…
                      </span>
                    )}
                  </button>
                )}

                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/room/${room.slug}`}
                    target="_blank"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#4d4bf7] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#3d3bd4]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Room
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(room)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    {copiedId === room.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Link2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(room)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:border-red-200"
                    aria-label={`Delete ${room.company_name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={deleteTarget !== null}
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
            setError("");
          }
        }}
        title="Delete Room"
        description={`Are you sure you want to delete "${deleteTarget?.company_name}"? This action cannot be undone.`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteTarget(null);
                setError("");
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-gray-600">
            All room content, case studies, comparisons, and analytics data will
            be permanently deleted.
          </p>
        )}
      </Dialog>
    </>
  );
}
