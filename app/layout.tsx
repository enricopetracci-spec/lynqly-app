export const metadata: Metadata = {
  title: 'Lynqly - Gestione Attività di Quartiere',
  description: 'Sistema di prenotazioni e gestione per attività locali',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
  themeColor: '#2563eb',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lynqly',
  },
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" style={{overflowX: 'hidden', maxWidth: '100vw', width: '100%'}}>
      <body className={inter.className} style={{overflowX: 'hidden', maxWidth: '100vw', width: '100%', margin: 0, padding: 0}}>
        <div style={{overflowX: 'hidden', maxWidth: '100vw', width: '100%', position: 'relative'}}>
          {children}
        </div>
      </body>
    </html>
  )
}
