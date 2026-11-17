import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { zh } from "@/i18n/zh";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: zh.app.fullName, template: `%s · ${zh.app.name}` },
  description: zh.app.description,
  applicationName: zh.app.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: zh.app.name, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf5" },
    { media: "(prefers-color-scheme: dark)", color: "#16110e" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
