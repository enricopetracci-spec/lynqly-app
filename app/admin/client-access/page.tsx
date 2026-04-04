'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ClientCredentialsPage() {
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)
  
  const email = searchParams.get('email') || ''
  const password = searchParams.get('password') || ''
  const businessName = searchParams.get('name') || ''

  const copyAll = () => {
    const text = `Email: ${email}\nPassword: ${password}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyEmail = () => {
    navigator.clipboard.writeText(email)
  }

  const copyPassword = () => {
    navigator.clipboard.writeText(password)
  }

  const openLogin = () => {
    window.open('https://lynqly-app.vercel.app/auth/login', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="bg-blue-600 text-white">
          <Link href="/admin" className="text-blue-100 hover:text-white mb-4 inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Torna ad Admin
          </Link>
          <CardTitle className="text-2xl">🔑 Credenziali Cliente</CardTitle>
          <p className="text-blue-100 text-sm mt-2">
            Accesso dashboard: <strong>{businessName}</strong>
          </p>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* ALERT ISTRUZIONI */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
            <h3 className="font-bold text-amber-900 mb-2">⚠️ Istruzioni importanti:</h3>
            <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
              <li>Usa una <strong>finestra INCOGNITO</strong> per evitare conflitti</li>
              <li>Copia le credenziali qui sotto</li>
              <li>Click "Apri Login Cliente"</li>
              <li>Incolla le credenziali manualmente</li>
            </ol>
          </div>

          {/* CREDENZIALI */}
          <div className="space-y-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-4 text-lg">Credenziali di accesso</h3>
              
              {/* Email */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Email:</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={email}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white border rounded-lg font-mono text-lg"
                  />
                  <Button onClick={copyEmail} variant="outline" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Password:</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={password || '[Non disponibile - usa reset password]'}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white border rounded-lg font-mono text-lg"
                  />
                  {password && (
                    <Button onClick={copyPassword} variant="outline" size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* AZIONI */}
            <div className="flex gap-3">
              <Button 
                onClick={copyAll}
                className="flex-1 bg-purple-600 hover:bg-purple-700 h-14 text-lg"
                disabled={!password}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Copiato!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copia Tutto
                  </>
                )}
              </Button>
              
              <Button 
                onClick={openLogin}
                className="flex-1 bg-blue-600 hover:bg-blue-700 h-14 text-lg"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Apri Login Cliente
              </Button>
            </div>
          </div>

          {/* STEPS */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3">📋 Procedura consigliata:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                <span>Apri finestra <strong>Incognito</strong> (Ctrl+Shift+N o Cmd+Shift+N)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                <span>Click <strong>"Copia Tutto"</strong> in questa pagina</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                <span>Click <strong>"Apri Login Cliente"</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                <span>Incolla email e password nei campi login</span>
              </div>
            </div>
          </div>

          {!password && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ Password non disponibile</strong><br />
                Le credenziali non sono state salvate. Usa "Reset Password" dalla pagina Gestisci.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
