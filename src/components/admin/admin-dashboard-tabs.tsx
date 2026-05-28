"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabList, TabPanel } from "@/components/ui/tabs";
import { RoomListTable } from "@/components/admin/room-list-table";
import { GranolaMeetingsPanel } from "@/components/admin/granola-meetings-panel";
import type { Room } from "@/lib/types";

const TABS = [
  { id: "rooms", label: "Rooms" },
  { id: "meetings", label: "Granola Meetings" },
];

export function AdminDashboardTabs({ rooms }: { rooms: Room[] }) {
  const [activeTab, setActiveTab] = useState("rooms");

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <TabList tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "rooms" && (
          <Button href="/admin/rooms/new">
            <Plus className="h-4 w-4" />
            Create Room
          </Button>
        )}
      </div>

      <TabPanel tabId="rooms" activeTab={activeTab}>
        <div className="mb-2">
          <p className="text-sm text-gray-500">
            {rooms.length} room{rooms.length !== 1 ? "s" : ""} total
          </p>
        </div>

        {rooms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <p className="text-sm text-gray-500">No rooms yet</p>
            <Button
              href="/admin/rooms/new"
              variant="secondary"
              className="mt-4"
            >
              <Plus className="h-4 w-4" />
              Create your first room
            </Button>
          </div>
        ) : (
          <RoomListTable initialRooms={rooms} />
        )}
      </TabPanel>

      <TabPanel tabId="meetings" activeTab={activeTab}>
        <GranolaMeetingsPanel
          existingCompanies={rooms.map((r) => r.company_name)}
        />
      </TabPanel>
    </>
  );
}
