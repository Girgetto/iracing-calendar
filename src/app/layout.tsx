import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iRacing Season Calendar",
  description:
    "Browse and track iRacing season schedules, series, and race weeks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
