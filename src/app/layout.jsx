import "./globals.css";
import { AuthProvider } from "./utils/AuthProvider";

export const metadata = {
  title: "CashTrack",
  description:
    "Simple and collaborative web to keep track of expenses and savings",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
