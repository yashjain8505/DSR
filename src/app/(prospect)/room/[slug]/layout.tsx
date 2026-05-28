/**
 * Layout for the prospect-facing room route.
 * No additional chrome needed; the root layout provides HTML/body structure
 * and the page component renders the RoomHeader.
 */
export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
