import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
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
    <html lang="en" className="dark">
      <body className="bg-bg-main text-text-primary">

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem("sportsdeck-theme");
                  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  var theme = saved || (prefersDark ? "dark" : "light");

                  if (theme === "dark") {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

        <AuthProvider>{children}</AuthProvider>

        <div className="fixed bottom-6 right-6 z-50">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}