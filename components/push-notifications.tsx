'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, CheckCircle, AlertCircle } from 'lucide-react'

export function PushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Il tuo browser non supporta le notifiche')
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        new Notification('Notifiche Abilitate! 🎉', {
          body: 'Riceverai notifiche per nuove prenotazioni e aggiornamenti'
        })
      }
    } catch (error) {
      console.error('Notification error:', error)
      alert('Errore nell\'abilitazione delle notifiche')
    }
  }

  const sendTestNotification = () => {
    if (permission !== 'granted') {
      alert('Abilita prima le notifiche!')
      return
    }

    new Notification('Notifica di Test 🔔', {
      body: 'Questa è una notifica di prova da Lynqly',
      tag: 'test-notification',
      requireInteraction: false
    })
  }

  if (!supported) {
    return (
      <div className="text-sm text-gray-500">
        Il tuo browser non supporta le notifiche push
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg border-2 ${
        permission === 'granted' 
          ? 'bg-green-50 border-green-200' 
          : permission === 'denied'
          ? 'bg-red-50 border-red-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          {permission === 'granted' ? (
            <>
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Notifiche Abilitate</div>
                <div className="text-sm text-green-700">Riceverai notifiche per eventi importanti</div>
              </div>
            </>
          ) : permission === 'denied' ? (
            <>
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <div className="font-medium text-red-900">Notifiche Bloccate</div>
                <div className="text-sm text-red-700">Sblocca le notifiche nelle impostazioni del browser</div>
              </div>
            </>
          ) : (
            <>
              <Bell className="w-6 h-6 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Notifiche Non Abilitate</div>
                <div className="text-sm text-gray-700">Abilita per ricevere aggiornamenti in tempo reale</div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {permission !== 'granted' && (
          <Button onClick={requestPermission}>
            <Bell className="w-4 h-4 mr-2" />
            Abilita Notifiche
          </Button>
        )}

        {permission === 'granted' && (
          <Button onClick={sendTestNotification} variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Invia Notifica Test
          </Button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-900">
          <div className="font-medium mb-2">📬 Riceverai notifiche per:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Nuove prenotazioni dai clienti</li>
            <li>Preventivi accettati o rifiutati</li>
            <li>Reminder appuntamenti in arrivo</li>
          </ul>
        </div>
      </div>

      {permission === 'denied' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm text-orange-900">
            <div className="font-medium mb-2">Come sbloccare le notifiche:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Clicca sull'icona del lucchetto nella barra degli indirizzi</li>
              <li>Trova "Notifiche" nelle impostazioni</li>
              <li>Cambia da "Bloccate" a "Consentite"</li>
              <li>Ricarica la pagina</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

export function sendNotification(title: string, body: string, tag?: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      tag: tag || 'lynqly-notification',
      requireInteraction: false
    })
  }
}
