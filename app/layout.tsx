import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EPC Credentialing Portal",
  description: "Editable provider, payer, credentialing, and follow-up workspace for EPC.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
