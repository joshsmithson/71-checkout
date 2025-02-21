import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Dart Counter",
  description: "Keep track of your dart game scores",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster theme="dark" position="top-center" />
      </body>
    </html>
  )
}

