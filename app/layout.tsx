import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const display = Baloo_2({ subsets: ["latin"], weight: ["600", "800"], variable: "--font-display" });
const body = Nunito({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Alina's Play Time",
  description: "Voice-guided learning games for Alina: balloon colors, counting, letter sounds and shapes.",
  appleWebApp: { capable: true, title: "Play Time", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#bfe6ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
