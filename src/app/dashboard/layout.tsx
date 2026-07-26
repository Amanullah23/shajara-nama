import MemberNavbar from "@/components/dashboard/MemberNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-ivory)]">
      <MemberNavbar />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">{children}</main>
    </div>
  );
}
