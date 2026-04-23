import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axia Art — Where artists become collectors",
  description: "Exchange your work with artists you admire. No galleries. No money. No speculation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}