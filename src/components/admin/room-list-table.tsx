"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import type { Room } from "@/lib/types";

export function RoomListTable({ initialRooms }: { initialRooms: Room[] }) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

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
      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rooms by company, contact, or slug…"
          className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#4d4bf7] focus:outline-none focus:ring-2 focus:ring-[#c9d4ff]"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tabs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRooms.map((room) => {
              const visibleCount = [
                room.tab_case_studies_visible,
                room.tab_comparison_visible,
                room.tab_getting_started_visible,
              ].filter(Boolean).length;

              return (
                <tr
                  key={room.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/rooms/${room.id}`}
                      className="font-medium text-gray-900 hover:text-[#4d4bf7]"
                    >
                      {room.company_name}
                    </Link>
                    {room.contact_name && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {room.contact_name}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                      /{room.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={room.is_active ? "success" : "default"}
                    >
                      {room.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    3 + {visibleCount} unlocked
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(room.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/rooms/${room.id}`}
                        className="text-sm font-medium text-[#4d4bf7] hover:text-[#3d3bd4]"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/room/${room.slug}`}
                        target="_blank"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(room)}
                        className="text-gray-400 hover:text-red-600 transition-colors duration-150"
                        aria-label={`Delete ${room.company_name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
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
