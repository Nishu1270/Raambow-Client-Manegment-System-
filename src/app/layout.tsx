import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RaamBow Client Management | RaamBow TechSolutions",
  description: "Modern internal client and follow-up management for RaamBow TechSolutions.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-800 font-sans antialiased">{children}</body>
    </html>
  );
}
