import { Eye, Users, Building2, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardsProps {
  totalPageViews: number;
  totalUniqueVisitors: number;
  activeRooms: number;
  emailConversionRate: number;
}

const kpis = [
  {
    key: "views",
    label: "Total Page Views",
    icon: Eye,
    iconBg: "bg-[#e6ecff]",
    iconColor: "text-[#4d4bf7]",
  },
  {
    key: "visitors",
    label: "Unique Visitors",
    icon: Users,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    key: "active",
    label: "Active Rooms",
    icon: Building2,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    key: "conversion",
    label: "Email Conversion",
    icon: Mail,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
] as const;

export function KpiCards({
  totalPageViews,
  totalUniqueVisitors,
  activeRooms,
  emailConversionRate,
}: KpiCardsProps) {
  const values: Record<string, string> = {
    views: String(totalPageViews),
    visitors: String(totalUniqueVisitors),
    active: String(activeRooms),
    conversion: `${emailConversionRate}%`,
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.key}>
          <CardContent className="flex items-center gap-4 py-5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.iconBg}`}
            >
              <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {values[kpi.key]}
              </p>
              <p className="text-sm text-gray-500">{kpi.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
