import Link from "next/link";
import Image from "next/image";
import { Building2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getRelativeTime } from "@/lib/utils";
import { Sparkline } from "./sparkline";
import { FunnelBar } from "./funnel-bar";
import type { RoomAnalyticsCard } from "@/lib/types";

interface RoomFunnelCardProps {
  room: RoomAnalyticsCard;
}

export function RoomFunnelCard({ room }: RoomFunnelCardProps) {
  const hasActivity = room.page_views > 0;

  const funnelStages = [
    { label: "Page Views", count: room.page_views, color: "#4d4bf7" },
    { label: "Tab Clicks", count: room.tab_clicks, color: "#7c7af9" },
    {
      label: "Emails Submitted",
      count: room.email_submits,
      color: "#f59e0b",
    },
    { label: "Video Plays", count: room.video_plays, color: "#10b981" },
  ];

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <Link
            href={`/admin/rooms/${room.id}`}
            className="flex min-w-0 items-center gap-2.5 hover:opacity-80"
          >
            {room.logo_url ? (
              <Image
                src={room.logo_url}
                alt={room.company_name}
                width={28}
                height={28}
                className="rounded-md object-contain"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
              </div>
            )}
            <span className="truncate text-sm font-semibold text-gray-900">
              {room.company_name}
            </span>
          </Link>

          {room.last_activity && (
            <span className="flex shrink-0 items-center gap-1 text-[10px] text-gray-400">
              <Clock className="h-3 w-3" />
              {getRelativeTime(room.last_activity)}
            </span>
          )}
        </div>

        {/* Sparkline */}
        <div className="border-b border-gray-50 px-4 py-2">
          <Sparkline
            data={room.sparkline}
            height={32}
            color={hasActivity ? "#4d4bf7" : "#d1d5db"}
          />
        </div>

        {/* Funnel */}
        <div className="px-4 py-3">
          {hasActivity ? (
            <FunnelBar stages={funnelStages} />
          ) : (
            <p className="py-2 text-center text-xs text-gray-400">
              No activity yet
            </p>
          )}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-around border-t border-gray-100 py-2 text-center">
          <div>
            <p className="text-xs font-bold text-gray-900">
              {room.unique_visitors}
            </p>
            <p className="text-[10px] text-gray-400">Visitors</p>
          </div>
          <div className="h-6 w-px bg-gray-100" />
          <div>
            <p className="text-xs font-bold text-gray-900">
              {room.page_views}
            </p>
            <p className="text-[10px] text-gray-400">Views</p>
          </div>
          <div className="h-6 w-px bg-gray-100" />
          <div>
            <p className="text-xs font-bold text-gray-900">
              {room.email_submits}
            </p>
            <p className="text-[10px] text-gray-400">Emails</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
