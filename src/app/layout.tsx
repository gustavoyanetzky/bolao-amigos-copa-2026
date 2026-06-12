import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bolao-amigos-copa-2026.vercel.app"),
  title: {
    default: "Bolão Amigos FC",
    template: "%s · Bolão Amigos FC",
  },
  description: "Bolão da Copa do Mundo FIFA 2026 — Clube dos Amigos",
  applicationName: "Bolão Amigos FC",
  openGraph: {
    title: "Bolão Amigos FC",
    description: "Bolão da Copa do Mundo FIFA 2026 — Clube dos Amigos",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B1F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} dark h-full antialiased`}>
      <head>
        {/* Material Symbols Outlined — icones do design-system */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-full flex flex-col bg-brand-navy-deep text-text-primary mx-auto w-full max-w-md">
        {children}
      </body>
    </html>
  );
}
