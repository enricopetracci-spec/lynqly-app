'use client'

import { useEffect } from 'react'

export function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('✅ Service Worker registrato:', registration)
        })
        .catch(error => {
          console.error('❌ Errore Service Worker:', error)
        })
    }
  }, [])

  return null
}
