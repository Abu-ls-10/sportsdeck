import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "SportsDeck",
  description: "Personalized sports dashboard",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg-main text-text-primary">
        {children}
      </body>
    </html>
  );
}