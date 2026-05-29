"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  Settings,
  FileText,
  Layers,
  DollarSign,
  BookOpen,
  GitCompare,
  Rocket,
  BarChart3,
  ChevronLeft,
  Package,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  roomId?: string;
  roomName?: string;
};

const mainLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/meetings", label: "Meetings", icon: Calendar },
  { href: "/admin/rooms/new", label: "Create Room", icon: Plus },
  { href: "/admin/assets", label: "Assets", icon: Package },
];

const roomLinks = [
  { segment: "", label: "Room Settings", icon: Settings },
  { segment: "/meeting-brief", label: "Meeting Brief", icon: FileText },
  { segment: "/overview", label: "Product & Why Linkrunner", icon: Layers },
  { segment: "/pricing", label: "Pricing", icon: DollarSign },
  { segment: "/case-studies", label: "Case Studies", icon: BookOpen },
  { segment: "/comparisons", label: "Comparisons", icon: GitCompare },
  { segment: "/getting-started", label: "Getting Started", icon: Rocket },
  { segment: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar({ roomId, roomName }: SidebarProps) {
  const currentPath = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="border-b border-gray-200 px-5 py-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4d4bf7]">
            <span className="text-sm font-bold text-white">L</span>
          </div>
          <span className="text-base font-semibold text-gray-900">
            Linkrunner
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Main links */}
        <div className="mb-2">
          <span className="px-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            Main
          </span>
        </div>
        <ul className="mb-6 flex flex-col gap-0.5">
          {mainLinks.map((link) => {
            const active =
              link.href === "/admin"
                ? currentPath === "/admin"
                : currentPath === link.href ||
                  currentPath.startsWith(link.href + "/");
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#e6ecff] text-[#4d4bf7]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Room sub-navigation */}
        {roomId && (
          <>
            <div className="mb-2">
              <Link
                href="/admin"
                className="flex items-center gap-1 px-3 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                Back to rooms
              </Link>
            </div>
            {roomName && (
              <div className="mb-3 px-3">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {roomName}
                </p>
              </div>
            )}
            <ul className="flex flex-col gap-0.5">
              {roomLinks.map((link) => {
                const href = `/admin/rooms/${roomId}${link.segment}`;
                const active =
                  link.segment === ""
                    ? currentPath === `/admin/rooms/${roomId}`
                    : currentPath.startsWith(href);
                return (
                  <li key={link.segment}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-[#e6ecff] text-[#4d4bf7]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>
    </aside>
  );
}
