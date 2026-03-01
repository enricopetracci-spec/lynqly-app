'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Code, Copy, CheckCircle, ExternalLink } from 'lucide-react'

export function WidgetEmbed({ businessSlug }: { businessSlug: string }) {
  const [copied, setCopied] = useState(false)
  const [width, setWidth] = useState('100%')
  const [height, setHeight] = useState('600px')

  const getEmbedCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lynqly-app.vercel.app'
    return `<iframe 
  src="${baseUrl}/book/${businessSlug}"
  width="${width}" 
  height="${height}"
  frameborder="0"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
  title="Prenota Appuntamento"
></iframe>`
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getEmbedCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const previewUrl = typeof window !== 'undefined' ? `${window.location.origin}/${businessSlug}` : ''

  if (!businessSlug) {
    return (
      <div className="text-sm text-gray-500">
        Configura il tuo link personalizzato sopra per generare il widget
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Anteprima Widget</Label>
        <div className="border rounded-lg p-4 bg-gray-50">
          <div 
            className="bg-white rounded-lg shadow-md mx-auto" 
            style={{ 
              width: width === '100%' ? '100%' : `${width}`, 
              maxWidth: '600px',
              height: height 
            }}
          >
            <iframe
              const previewUrl = typeof window !== 'undefined' ? `${window.location.origin}/book/${businessSlug}` : ''
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 'none', borderRadius: '8px' }}
              title="Anteprima Widget"
            />
          </div>
        </div>
      </div>

      {/* Customization */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="width" className="text-sm">Larghezza</Label>
          <Input
            id="width"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="100% o 600px"
          />
        </div>
        <div>
          <Label htmlFor="height" className="text-sm">Altezza</Label>
          <Input
            id="height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="600px"
          />
        </div>
      </div>

      {/* Code */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Codice HTML</Label>
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
            <code>{getEmbedCode()}</code>
          </pre>
          <Button
            onClick={copyToClipboard}
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 bg-white"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                Copiato!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copia
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Code className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <div className="font-medium mb-2">Come usare il widget:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Copia il codice HTML sopra</li>
              <li>Incollalo nella pagina del tuo sito web dove vuoi mostrare il modulo di prenotazione</li>
              <li>Il widget si adatterà automaticamente al design del tuo sito</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Test Link */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Testa il widget:</span>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          {previewUrl}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}
