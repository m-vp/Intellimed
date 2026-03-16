import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntelliMed — Predictive Medical Intelligence System",
  description: "AI-powered medical diagnostics for brain tumor detection, Alzheimer's classification, and intelligent report analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
