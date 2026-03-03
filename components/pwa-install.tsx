'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showPrompt || !deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-2xl p-4 z-50">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/80 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-blue-600">L</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">Installa Lynqly</h3>
          <p className="text-sm text-blue-100 mb-3">
            Accesso rapido dalla home screen!
          </p>
          <Button 
            onClick={handleInstall}
            size="sm"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Installa App
          </Button>
        </div>
      </div>
    </div>
  )
}
