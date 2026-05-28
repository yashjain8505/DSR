import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/admin/sidebar";
import { GranolaMeetingsPanel } from "@/components/admin/granola-meetings-panel";
import { formatDate } from "@/lib/utils";
import type { Room } from "@/lib/types";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .order("created_at", { ascending: false });

  const allRooms = (rooms ?? []) as Room[];

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
              <p className="mt-1 text-sm text-gray-500">
                {allRooms.length} room{allRooms.length !== 1 ? "s" : ""} total
              </p>
            </div>
            <Button href="/admin/rooms/new">
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          </div>

          {/* Room list */}
          {allRooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
              <p className="text-sm text-gray-500">No rooms yet</p>
              <Button href="/admin/rooms/new" variant="secondary" className="mt-4">
                <Plus className="h-4 w-4" />
                Create your first room
              </Button>
            </div>
          ) : (
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
                  {allRooms.map((room) => {
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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Granola meetings — generate rooms from demo calls */}
          <GranolaMeetingsPanel
            existingCompanies={allRooms.map((r) => r.company_name)}
          />
        </div>
      </main>
    </>
  );
}
