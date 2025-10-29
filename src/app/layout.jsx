import "./globals.css";
import { AuthProvider } from "./utils/AuthProvider";
import Sidebar from "@/components/SideBar";

export const metadata = {
  title: "CashTrack",
  description:
    "Simple and collaborative web to keep track of expenses and savings",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <AuthProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-h-screen pt-[5vh] md:pt-0 p-6 sm:p-8">
              <div className="max-w-6xl mx-auto">{children}</div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
