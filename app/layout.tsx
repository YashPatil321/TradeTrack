import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TradesMonk - Professional Service Providers",
  description: "Connect with trusted handymen, plumbers, electricians, and painters in your area",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          {/* Vercel Analytics */}
          <Analytics />
          {/* Optional performance metrics */}
          <SpeedInsights />
        </SessionProvider>
      </body>
    </html>
  );
}
