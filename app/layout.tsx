import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'European Physician Workforce Crisis Monitor',
  description: 'Real-time early warning system tracking physician workforce sustainability across European healthcare systems.',
  openGraph: {
    title: 'European Physician Workforce Crisis Monitor',
    description: 'Live Eurostat data. Retirement cliff scoring. 10-year workforce projections.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=DM+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
