// src/app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: [
    { path: "../../public/fonts/geist/Geist-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/geist/Geist-Bold.woff2",    weight: "700", style: "normal" },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    { path: "../../public/fonts/geist-mono/GeistMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/geist-mono/GeistMono-Bold.woff2",    weight: "700", style: "normal" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Phoenix Admin Panel",
  description: "پنل مدیریت پشتیبانی ققنوس",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}