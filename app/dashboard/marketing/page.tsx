'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MessageSquare, Send, Users, Eye, Tag as TagIcon } from 'lucide-react'

type Customer = {
  id: string
  name: string
  phone: string
  created_at: string
  customer_tag_assignments: {
    tag: {
      id: string
      name: string
    }
  }[]
}

type Tag = {
  id: string
  name: string
  emoji: string
}

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
    name: 'Reminder Generico',
    message: 'Ciao {nome}! 👋\nVuoi prenotare il tuo prossimo appuntamento?\n{link}\nSiamo qui per te! 💙'
  },
  new_service: {
    name: 'Nuovo Servizio',
    message: 'Ciao {nome}! ✨\nAbbiamo un nuovo servizio che potrebbe interessarti! Scoprilo e prenota ora.\n{link}\nNon vediamo l\'ora di vederti! 🎊'
  }
}

export default function MarketingPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [businessSlug, setBusinessSlug] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('reactivation')
  const [customMessage, setCustomMessage] = useState(TEMPLATES.reactivation.message)
  const [segment, setSegment] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [inactiveDays, setInactiveDays] = useState(30)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setCustomMessage(TEMPLATES[selectedTemplate].message)
  }, [selectedTemplate])

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id, slug')
      .eq('user_id', session.user.id)
      .single()

    if (!business) return

    setBusinessSlug(business.slug || '')

    // Load customers with tags
    const { data: customersData } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        phone,
        created_at,
        customer_tag_assignments(
          tag:customer_tags(id, name)
        )
      `)
      .eq('business_id', business.id)

    if (customersData) {
      setCustomers(customersData as Customer[])
    }

    // Load tags
    const { data: tagsData } = await supabase
      .from('customer_tags')
      .select('id, name, emoji')
      .eq('business_id', business.id)
      .order('sort_order')

    if (tagsData) {
      setTags(tagsData)
    }

    setLoading(false)
  }

  const getFilteredCustomers = () => {
    let filtered = [...customers]

    if (segment === 'new') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      filtered = filtered.filter(c => new Date(c.created_at) > monthAgo)
    }

    if (segment === 'inactive') {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - inactiveDays)
      filtered = filtered.filter(c => new Date(c.created_at) < cutoffDate)
    }

    if (segment === 'tags' && selectedTags.length > 0) {
      filtered = filtered.filter(c =>
        c.customer_tag_assignments.some(a => selectedTags.includes(a.tag.id))
      )
    }

    return filtered
  }

  const filteredCustomers = getFilteredCustomers()

  const getPreviewMessage = () => {
    const exampleName = filteredCustomers.length > 0 ? filteredCustomers[0].name : 'Mario'
    const bookingLink = businessSlug ? `${window.location.origin}/${businessSlug}` : 'https://tuodominio.it/prenota'
    
    return customMessage
      .replace(/{nome}/g, exampleName)
      .replace(/{link}/g, bookingLink)
  }

  const handleSendCampaign = () => {
    if (filteredCustomers.length === 0) {
      alert('Nessun destinatario selezionato!')
      return
    }

    const bookingLink = businessSlug ? `${window.location.origin}/${businessSlug}` : ''
    
    filteredCustomers.forEach((customer, index) => {
      const personalizedMessage = customMessage
        .replace(/{nome}/g, customer.name)
        .replace(/{link}/g, bookingLink)
      
      const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(personalizedMessage)}`
      
      // Delay to avoid browser blocking multiple popups
      setTimeout(() => {
        window.open(whatsappUrl, '_blank')
      }, index * 500) // 500ms delay between each
    })
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  if (loading) {
    return <div>Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marketing</h1>
        <p className="text-gray-600 mt-1">Crea campagne WhatsApp per i tuoi clienti</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Campaign Setup */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Template Messaggio
              </CardTitle>
              <CardDescription>Scegli un template o personalizza il messaggio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTemplate(key as keyof typeof TEMPLATES)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedTemplate === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {template.name}
                  </button>
                ))}
              </div>

              <div>
                <Label>Messaggio</Label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  placeholder="Scrivi il tuo messaggio..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usa <code className="bg-gray-100 px-1 rounded">{'{nome}'}</code> per il nome del cliente e{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{link}'}</code> per il link di prenotazione
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
                  <input
                    type="radio"
                    name="segment"
                    value="all"
                    checked={segment === 'all'}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Tutti i clienti</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="segment"
                    value="new"
                    checked={segment === 'new'}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Nuovi clienti (ultimo mese)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="segment"
                    value="inactive"
                    checked={segment === 'inactive'}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-4 h-4"
                  />
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
                    <input
                      type="radio"
                      name="segment"
                      value="tags"
                      checked={segment === 'tags'}
                      onChange={(e) => setSegment(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">Per tag</span>
                  </label>
                )}

                {segment === 'tags' && tags.length > 0 && (
                  <div className="ml-6 mt-2 flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm border transition-all ${
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Destinatari:</span>
                  <span className="text-2xl font-bold text-blue-600">{filteredCustomers.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button
            onClick={handleSendCampaign}
            disabled={filteredCustomers.length === 0}
            size="lg"
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Invia Campagna ({filteredCustomers.length} destinatari)
          </Button>

          <p className="text-sm text-gray-500 text-center">
            I messaggi verranno aperti in WhatsApp Web. Assicurati di avere WhatsApp attivo.
          </p>
        </div>

        {/* Right Column - Preview */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Anteprima Messaggio
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
                        {filteredCustomers.length > 0 ? filteredCustomers[0].name : 'Mario Rossi'}
                      </div>
                      <div className="text-xs text-gray-500">online</div>
                    </div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {getPreviewMessage()}
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
