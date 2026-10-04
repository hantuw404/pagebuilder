import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pageCLoner — Structure-Preserving Content Replacer",
  description: "AI-powered SEO content analyzer and HTML structure-preserving cloner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
