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
    <html lang="en" suppressHydrationWarning>
      <head>
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
      </head>
      <body className="bg-bg-main text-text-primary" suppressHydrationWarning>

        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}