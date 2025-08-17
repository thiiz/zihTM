"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import TitleBar from "@/components/TitleBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TitleBar />
        <main className="h-screen overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
