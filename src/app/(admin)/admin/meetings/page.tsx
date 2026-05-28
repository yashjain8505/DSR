import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/admin/sidebar";
import { GranolaMeetingsPanel } from "@/components/admin/granola-meetings-panel";
import type { Room } from "@/lib/types";

export default async function MeetingsPage() {
  const supabase = await createClient();

  const { data: rooms } = await supabase
    .from("rooms")
    .select("company_name")
    .order("created_at", { ascending: false });

  const existingCompanies = (rooms ?? []).map(
    (r: Pick<Room, "company_name">) => r.company_name
  );

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Meetings</h1>
          <GranolaMeetingsPanel existingCompanies={existingCompanies} />
        </div>
      </main>
    </>
  );
}
