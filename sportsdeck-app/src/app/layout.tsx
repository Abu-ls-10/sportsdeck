import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import ThemeToggle from "@/components/ui/ThemeToggle";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        (function () {
          try {
            var saved = localStorage.getItem("sportsdeck-theme");

            // Respect saved preference
            if (saved === "light") {
              document.documentElement.classList.remove("dark");
              return;
            }

            if (saved === "dark") {
              document.documentElement.classList.add("dark");
              return;
            }

            // Default for first-time users
            document.documentElement.classList.add("dark");
          } catch (e) {}
        })();
            `,
          }}
        />
      </head>
      <body className="bg-bg-main text-text-primary" suppressHydrationWarning>

        <AuthProvider>{children}</AuthProvider>
        <ThemeToggle />
      </body>
    </html>
  );
}