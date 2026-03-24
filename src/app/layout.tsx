import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getProjects } from "@/lib/actions";
import { getImages } from "@/lib/image-actions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mermaid Server",
  description: "Create, preview, and download Mermaid diagrams",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [projects, images] = await Promise.all([
    getProjects(),
    getImages()
  ]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex bg-gray-900 text-gray-100 overflow-hidden">
        <Sidebar initialProjects={projects} initialImages={images} />
        <main className="flex-1 h-full overflow-hidden bg-white text-gray-900 relative">
          {children}
        </main>
      </body>
    </html>
  );
}
