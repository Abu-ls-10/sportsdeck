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
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const key = "sportsdeck-theme";
                  const saved = localStorage.getItem(key);
                  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const theme = saved === "light" || saved === "dark" ? saved : (systemPrefersDark ? "dark" : "light");
                  document.documentElement.classList.remove("light", "dark");
                  document.documentElement.classList.add(theme);
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-bg-main text-text-primary">
        <AuthProvider>
          {children}
          <ThemeToggle />
        </AuthProvider>
      </body>
    </html>
  );
}