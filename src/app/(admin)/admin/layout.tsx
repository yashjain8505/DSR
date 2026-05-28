import { cookies } from "next/headers";
import { LoginForm } from "@/components/admin/login-form";

export const metadata = {
  title: "Admin | Linkrunner DSR",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const auth = cookieStore.get("admin_auth");

  if (!auth || auth.value !== "true") {
    return <LoginForm />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f7f7]">{children}</div>
  );
}
