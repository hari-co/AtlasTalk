import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { SelectionProvider } from "@/context/selection-context"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })
const playfair = Playfair_Display({ 
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: '--font-playfair'
})

export const metadata: Metadata = {
  title: "AtlasTalk - Explore the World",
  description: "Immersive cultural experiences and conversations from around the globe",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased ${playfair.variable}`}>
        <SelectionProvider>
          {children}
        </SelectionProvider>
        <Analytics />
      </body>
    </html>
  )
}
