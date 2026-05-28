import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/admin/sidebar";
import { RoomGrid } from "@/components/admin/room-grid";
import { fetchKanbanMap } from "@/lib/kanban-status";
import type { Room } from "@/lib/types";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ data: rooms }, kanbanMap] = await Promise.all([
    supabase.from("rooms").select("*").order("created_at", { ascending: false }),
    fetchKanbanMap(),
  ]);

  const allRooms = (rooms ?? []) as Room[];

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
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

          {allRooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
              <p className="text-sm text-gray-500">No rooms yet</p>
              <Button href="/admin/rooms/new" variant="secondary" className="mt-4">
                <Plus className="h-4 w-4" />
                Create your first room
              </Button>
            </div>
          ) : (
            <RoomGrid initialRooms={allRooms} kanbanMap={kanbanMap} />
          )}
        </div>
      </main>
    </>
  );
}
