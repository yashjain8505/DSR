import { redirect } from "next/navigation";

/**
 * Root page — redirects to the admin dashboard.
 * Prospect-facing rooms are accessed via /room/[slug].
 */
export default function Home() {
  redirect("/admin");
}
