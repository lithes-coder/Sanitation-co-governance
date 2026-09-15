import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { StoreProvider } from "@/lib/store"
import { SmokyCursor } from "@/components/smoky-cursor"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Sanitation Co-Governance Intelligence Platform",
  description:
    "A role-based governance platform for municipal sanitation management, complaint tracking, and ward performance analytics.",
}

export const viewport: Viewport = {
  themeColor: "#1a3a5c",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <StoreProvider>
          {children}
          <Toaster richColors position="top-right" />
          <SmokyCursor />
        </StoreProvider>
        <Analytics />
      </body>
    </html>
  )
}
