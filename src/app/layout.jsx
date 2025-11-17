import "./globals.css";
import { AuthProvider } from "./utils/AuthProvider";
import { Toaster } from "react-hot-toast";

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
          <Toaster />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
