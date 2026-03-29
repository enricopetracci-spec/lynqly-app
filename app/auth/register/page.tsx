'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Registrazione Disabilitata
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Le nuove istanze Lynqly vengono create esclusivamente dall'amministratore.
          </p>
          <p className="text-gray-600">
            Se hai ricevuto le credenziali di accesso, usa il pulsante qui sotto.
          </p>
          <div className="pt-4">
            <Link 
              href="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Vai al Login
            </Link>
          </div>
          <p className="text-sm text-gray-500 pt-4">
            Per richiedere un account, contatta il supporto.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
