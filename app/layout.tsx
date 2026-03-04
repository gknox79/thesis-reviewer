import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Thesis Draft Reviewer',
  description:
    'Formative feedback on your thesis chapter — a drafting aid from Prof. Knox\'s research group.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  )
}
