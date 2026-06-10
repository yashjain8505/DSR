import { isAdminAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata = {
  title: "Admin | Linkrunner DSR",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthenticated())) {
    return <LoginForm />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f7f7]">{children}</div>
  );
}
