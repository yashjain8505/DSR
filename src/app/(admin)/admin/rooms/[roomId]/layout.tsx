import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/admin/sidebar";

export default async function RoomEditorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  const supabase = await createClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("company_name")
    .eq("id", roomId)
    .single();

  return (
    <>
      <Sidebar
        roomId={roomId}
        roomName={room?.company_name ?? "Room"}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-8">{children}</div>
      </main>
    </>
  );
}
