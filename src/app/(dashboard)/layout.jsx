import Sidebar from "@/components/SideBar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex pt-[5vh] md:py-8 pb-[5vh] md:pb-8">
      <Sidebar />
      <main className="flex-1 min-h-screen px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
