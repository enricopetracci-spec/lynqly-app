'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Send, MessageSquare } from 'lucide-react'

const TEMPLATES = {
  welcome: 'Ciao {nome}! 👋 Benvenuto! Prenota il tuo primo appuntamento qui: {link}',
  promo: 'Ciao {nome}! 🎉 Offerta speciale per te! Prenota ora: {link}',
  reminder: 'Ciao {nome}! 💙 È ora di prenotare il tuo prossimo appuntamento: {link}'
}

export default function CampaignsPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [message, setMessage] = useState(TEMPLATES.welcome)
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: biz } = await supabase
      .from('businesses')
      .select('id, slug')
      .eq('user_id', session.user.id)
      .single()

    if (biz) {
      setSlug(biz.slug || '')
      
      const { data: custs } = await supabase
        .from('customers')
        .select('id, name, phone')
        .eq('business_id', biz.id)

      setCustomers(custs || [])
    }

    setLoading(false)
  }

  function send() {
    if (!customers.length) {
      alert('Nessun cliente!')
      return
    }

    const link = slug ? `${window.location.origin}/${slug}` : ''
    
    customers.forEach((c, i) => {
      const txt = message.replace(/{nome}/g, c.name).replace(/{link}/g, link)
      const url = `https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(txt)}`
      setTimeout(() => window.open(url, '_blank'), i * 500)
    })
  }

  if (loading) return <div className="p-8">Caricamento...</div>

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campagne WhatsApp</h1>
        <p className="text-gray-600">Invia messaggi ai tuoi clienti</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Messaggio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setMessage(TEMPLATES.welcome)}>Benvenuto</Button>
              <Button variant="outline" size="sm" onClick={() => setMessage(TEMPLATES.promo)}>Promo</Button>
              <Button variant="outline" size="sm" onClick={() => setMessage(TEMPLATES.reminder)}>Reminder</Button>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full p-3 border rounded-lg font-mono text-sm"
              placeholder="Scrivi il messaggio..."
            />

            <p className="text-xs text-gray-500">
              Usa <code className="bg-gray-100 px-1 rounded">{'{nome}'}</code> e <code className="bg-gray-100 px-1 rounded">{'{link}'}</code>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anteprima</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-sm font-semibold mb-2">
                  {customers[0]?.name || 'Cliente'}
                </div>
                <div className="bg-green-100 rounded-lg p-3 text-sm whitespace-pre-wrap">
                  {message
                    .replace(/{nome}/g, customers[0]?.name || 'Mario')
                    .replace(/{link}/g, slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}` : 'link')}
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Destinatari:</span>
                <span className="text-2xl font-bold text-blue-600">{customers.length}</span>
              </div>
              
              <Button onClick={send} disabled={!customers.length} className="w-full" size="lg">
                <Send className="w-4 h-4 mr-2" />
                Invia a {customers.length} clienti
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
