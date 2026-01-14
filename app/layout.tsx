import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Employee Portal - AceTech",
  description: "Employee portal with cash requisition and task management",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

