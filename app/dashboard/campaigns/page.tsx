'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MessageSquare, Send, Users, Eye } from 'lucide-react'

const TEMPLATES = {
  reactivation: {
    name: 'Riprenotazione',
    message: 'Ciao {nome}! 👋\nÈ passato un po\' di tempo dall\'ultima visita. Che ne dici di prenotare un nuovo appuntamento?\n{link}\nTi aspettiamo! 🌟'
  },
  promotion: {
    name: 'Promozione',
    message: 'Ciao {nome}! 🎉\nAbbiamo una promozione speciale per te! Prenota ora e approfitta dell\'offerta.\n{link}\nNon perdere questa occasione! ✨'
  },
  reminder: {
    name: 'Reminder',
    message: 'Ciao {nome}! 👋\nVuoi prenotare il tuo prossimo appuntamento?\n{link}\nSiamo qui per te! 💙'
  },
  new_service: {
    name: 'Nuovo Servizio',
    message: 'Ciao {nome}! ✨\nAbbiamo un nuovo servizio che potrebbe interessarti! Scoprilo e prenota ora.\n{link}\nNon vediamo l\'ora di vederti! 🎊'
  }
}

export default function CampaignsPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('reactivation')
  const [message, setMessage] = useState(TEMPLATES.reactivation.message)
  const [segment, setSegment] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [inactiveDays, setInactiveDays] = useState(30)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setMessage(TEMPLATES[selectedTemplate].message)
  }, [selectedTemplate])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: biz } = await supabase
      .from('businesses')
      .select('id, slug')
      .eq('user_id', session.user.id)
      .single()

    if (!biz) return
    setSlug(biz.slug || '')

    const { data: custs } = await supabase
      .from('customers')
      .select('id, name, phone, created_at')
      .eq('business_id', biz.id)

    if (custs) {
      const custsWithTags = await Promise.all(
        custs.map(async (c) => {
          const { data: tagData } = await supabase
            .from('customer_tag_assignments')
            .select('tag_id')
            .eq('customer_id', c.id)
          
          return {
            ...c,
            tagIds: tagData ? tagData.map((t: any) => t.tag_id) : []
          }
        })
      )
      
      setCustomers(custsWithTags)
    }

    const { data: tagsData } = await supabase
      .from('customer_tags')
      .select('id, name, emoji')
      .eq('business_id', biz.id)
      .order('sort_order')

    if (tagsData) {
      setTags(tagsData)
    }

    setLoading(false)
  }

  function getFilteredCustomers() {
    let filtered = [...customers]

    if (segment === 'new') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      filtered = filtered.filter(c => new Date(c.created_at) > monthAgo)
    }

    if (segment === 'inactive') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - inactiveDays)
      filtered = filtered.filter(c => new Date(c.created_at) < cutoff)
    }

    if (segment === 'tags' && selectedTags.length > 0) {
      filtered = filtered.filter(c =>
        c.tagIds && c.tagIds.some((tid: string) => selectedTags.includes(tid))
      )
    }

    return filtered
  }

  const filteredCustomers = getFilteredCustomers()

  function getPreview() {
    const name = filteredCustomers[0]?.name || 'Mario'
    const link = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}` : 'link'
    return message.replace(/{nome}/g, name).replace(/{link}/g, link)
  }

  function send() {
    if (!filteredCustomers.length) {
      alert('Nessun destinatario!')
      return
    }

    const link = slug ? `${window.location.origin}/${slug}` : ''
    
    filteredCustomers.forEach((c, i) => {
      const txt = message.replace(/{nome}/g, c.name).replace(/{link}/g, link)
      const url = `https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(txt)}`
      setTimeout(() => window.open(url, '_blank'), i * 500)
    })
  }

  function toggleTag(id: string) {
    setSelectedTags(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  if (loading) return <div className="p-8">Caricamento...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campagne WhatsApp</h1>
        <p className="text-gray-600">Invia messaggi personalizzati ai tuoi clienti</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Template Messaggio
              </CardTitle>
              <CardDescription>Scegli un template o personalizza</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTemplate(key as keyof typeof TEMPLATES)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
                      selectedTemplate === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              <div>
                <Label>Messaggio</Label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full p-3 border rounded-lg font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usa <code className="bg-gray-100 px-1 rounded">{'{nome}'}</code> e{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{link}'}</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Segmentation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Segmento Target
              </CardTitle>
              <CardDescription>Chi riceverà questo messaggio?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="seg" value="all" checked={segment === 'all'} onChange={(e) => setSegment(e.target.value)} className="w-4 h-4" />
                  <span className="font-medium">Tutti i clienti</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="seg" value="new" checked={segment === 'new'} onChange={(e) => setSegment(e.target.value)} className="w-4 h-4" />
                  <span className="font-medium">Nuovi clienti (ultimo mese)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="seg" value="inactive" checked={segment === 'inactive'} onChange={(e) => setSegment(e.target.value)} className="w-4 h-4" />
                  <span className="font-medium">Clienti inattivi</span>
                </label>

                {segment === 'inactive' && (
                  <div className="ml-6 mt-2">
                    <Label className="text-sm">Giorni di inattività</Label>
                    <input
                      type="number"
                      value={inactiveDays}
                      onChange={(e) => setInactiveDays(parseInt(e.target.value))}
                      min="1"
                      className="w-24 px-2 py-1 border rounded"
                    />
                  </div>
                )}

                {tags.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="seg" value="tags" checked={segment === 'tags'} onChange={(e) => setSegment(e.target.value)} className="w-4 h-4" />
                    <span className="font-medium">Per tag</span>
                  </label>
                )}

                {segment === 'tags' && tags.length > 0 && (
                  <div className="ml-6 mt-2 flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm border transition ${
                          selectedTags.includes(tag.id)
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        {tag.emoji} {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Destinatari:</span>
                  <span className="text-2xl font-bold text-blue-600">{filteredCustomers.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button onClick={send} disabled={!filteredCustomers.length} size="lg" className="w-full">
            <Send className="w-4 h-4 mr-2" />
            Invia Campagna ({filteredCustomers.length} destinatari)
          </Button>

          <p className="text-sm text-gray-500 text-center">
            I messaggi verranno aperti in WhatsApp Web.
          </p>
        </div>

        {/* Preview */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Anteprima
              </CardTitle>
              <CardDescription>Come apparirà su WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {filteredCustomers[0]?.name || 'Mario Rossi'}
                      </div>
                      <div className="text-xs text-gray-500">online</div>
                    </div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {getPreview()}
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-right">
                    {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {filteredCustomers.length > 1 && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Messaggio personalizzato per ogni cliente
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
