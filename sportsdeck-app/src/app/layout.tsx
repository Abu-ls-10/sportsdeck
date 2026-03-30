import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata = {
  title: "SportsDeck",
  description: "The Ultimate Hub for Sports Fans",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg-main text-text-primary">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}