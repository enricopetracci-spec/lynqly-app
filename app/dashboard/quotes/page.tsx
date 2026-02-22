'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Plus, Search, Eye, Send, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react'
import { formatDate, formatPrice } from '@/lib/utils'

type Quote = {
  id: string
  quote_number: string
  status: string
  issue_date: string
  expiry_date: string
  total: number
  customer: {
    name: string
    email: string
    phone: string
  }
  quote_items: {
    description: string
    quantity: number
    unit_price: number
    total: number
  }[]
}

type QuoteItem = {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

  const [formData, setFormData] = useState({
    customer_id: '',
    expiry_days: 30,
    notes: '',
    items: [] as QuoteItem[]
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [quotes, filter, searchQuery])

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!business) return

    setBusinessId(business.id)

    // Load quotes
    const { data: quotesData } = await supabase
      .from('quotes')
      .select(`
        *,
        customer:customers(name, email, phone),
        quote_items(description, quantity, unit_price, total)
      `)
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })

    if (quotesData) {
      setQuotes(quotesData as Quote[])
    }

    // Load customers
    const { data: customersData } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .eq('business_id', business.id)
      .order('name')

    if (customersData) {
      setCustomers(customersData)
    }

    // Load services
    const { data: servicesData } = await supabase
      .from('services')
      .select('id, name, price')
      .eq('business_id', business.id)
      .eq('is_active', true)

    if (servicesData) {
      setServices(servicesData)
    }

    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...quotes]

    if (filter !== 'all') {
      filtered = filtered.filter(q => q.status === filter)
    }

    if (searchQuery) {
      filtered = filtered.filter(q =>
        q.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.quote_number.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredQuotes(filtered)
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    })
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Calcola totale riga
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const addServiceAsItem = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return

    setFormData({
      ...formData,
      items: [...formData.items, {
        description: service.name,
        quantity: 1,
        unit_price: service.price,
        total: service.price
      }]
    })
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!businessId || formData.items.length === 0) {
      alert('Aggiungi almeno un servizio/prodotto al preventivo')
      return
    }

    try {
      // Generate quote number
      const { data: quoteNumberData } = await supabase
        .rpc('generate_quote_number', { business_uuid: businessId })

      if (!quoteNumberData) {
        alert('Errore nella generazione del numero preventivo')
        return
      }

      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + formData.expiry_days)

      const total = calculateTotal()

      // Create quote
      const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          business_id: businessId,
          customer_id: formData.customer_id,
          quote_number: quoteNumberData,
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0],
          expiry_date: expiryDate.toISOString().split('T')[0],
          notes: formData.notes,
          subtotal: total,
          tax_rate: 0,
          tax_amount: 0,
          total: total
        })
        .select()
        .single()

      if (quoteError || !newQuote) {
        console.error('Quote error:', quoteError)
        alert('Errore nella creazione del preventivo')
        return
      }

      // Add items
      const items = formData.items.map((item, index) => ({
        quote_id: newQuote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        sort_order: index
      }))

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(items)

      if (itemsError) {
        console.error('Items error:', itemsError)
        alert('Errore nell\'aggiunta dei servizi')
        return
      }

      // Reset form
      setFormData({
        customer_id: '',
        expiry_days: 30,
        notes: '',
        items: []
      })
      setShowCreateForm(false)
      loadData()

    } catch (error) {
      console.error('Error:', error)
      alert('Errore imprevisto')
    }
  }

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    const updateData: any = { status: newStatus }

    if (newStatus === 'sent') updateData.sent_at = new Date().toISOString()
    if (newStatus === 'accepted') updateData.accepted_at = new Date().toISOString()
    if (newStatus === 'rejected') updateData.rejected_at = new Date().toISOString()

    const { error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', quoteId)

    if (!error) {
      loadData()
    }
  }

  const deleteQuote = async (quoteId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo preventivo?')) return

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId)

    if (!error) {
      loadData()
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Bozza' },
      sent: { color: 'bg-blue-100 text-blue-800', icon: Send, label: 'Inviato' },
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accettato' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rifiutato' },
      expired: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Scaduto' }
    }

    const badge = badges[status as keyof typeof badges] || badges.draft
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  const getStats = () => {
    const draft = quotes.filter(q => q.status === 'draft').length
    const sent = quotes.filter(q => q.status === 'sent').length
    const accepted = quotes.filter(q => q.status === 'accepted').length
    const totalAccepted = quotes
      .filter(q => q.status === 'accepted')
      .reduce((sum, q) => sum + q.total, 0)

    return { draft, sent, accepted, totalAccepted }
  }

  const stats = getStats()

  if (loading) {
    return <div>Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Preventivi</h1>
          <p className="text-gray-600 mt-1">Gestisci i preventivi e le proposte commerciali</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Preventivo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Bozze</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inviati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Accettati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fatturato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalAccepted)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Tutti
          </Button>
          <Button
            variant={filter === 'draft' ? 'default' : 'outline'}
            onClick={() => setFilter('draft')}
            size="sm"
          >
            Bozze
          </Button>
          <Button
            variant={filter === 'sent' ? 'default' : 'outline'}
            onClick={() => setFilter('sent')}
            size="sm"
          >
            Inviati
          </Button>
          <Button
            variant={filter === 'accepted' ? 'default' : 'outline'}
            onClick={() => setFilter('accepted')}
            size="sm"
          >
            Accettati
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilter('rejected')}
            size="sm"
            >
            Rifiutati
          </Button>
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cerca per numero o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="max-w-4xl w-full my-8">
            <CardHeader>
              <CardTitle>Nuovo Preventivo</CardTitle>
              <CardDescription>Crea un preventivo personalizzato per il cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer">Cliente *</Label>
                    <select
                      id="customer"
                      value={formData.customer_id}
                      onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Seleziona cliente</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="expiry">Validità (giorni)</Label>
                    <Input
                      id="expiry"
                      type="number"
                      value={formData.expiry_days}
                      onChange={(e) => setFormData({...formData, expiry_days: parseInt(e.target.value)})}
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Servizi/Prodotti *</Label>
                    <Button type="button" size="sm" onClick={addItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      Aggiungi Riga
                    </Button>
                  </div>

                  {services.length > 0 && (
                    <div className="mb-3 p-3 bg-blue-50 rounded">
                      <p className="text-sm text-blue-800 mb-2">Aggiungi dai tuoi servizi:</p>
                      <div className="flex flex-wrap gap-2">
                        {services.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => addServiceAsItem(s.id)}
                            className="text-xs px-2 py-1 bg-white border border-blue-200 rounded hover:bg-blue-100"
                          >
                            {s.name} - {formatPrice(s.price)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded">
                        <div className="col-span-12 sm:col-span-5">
                          <Input
                            placeholder="Descrizione"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <Input
                            type="number"
                            placeholder="Qtà"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                            min="0.01"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <Input
                            type="number"
                            placeholder="Prezzo"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2 flex items-center">
                          <span className="text-sm font-medium">{formatPrice(item.total)}</span>
                        </div>
                        <div className="col-span-1 sm:col-span-1 flex items-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {formData.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Totale</div>
                        <div className="text-2xl font-bold">{formatPrice(calculateTotal())}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Note</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Note aggiuntive per il cliente..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Annulla
                  </Button>
                  <Button type="submit">
                    Crea Preventivo
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quotes List */}
      {filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun preventivo</h3>
            <p className="text-gray-500 mb-4">
              {filter === 'all' 
                ? 'Crea il tuo primo preventivo per iniziare'
                : `Nessun preventivo con stato "${filter}"`
              }
            </p>
            {filter === 'all' && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crea Primo Preventivo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuotes.map((quote) => (
            <Card key={quote.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{quote.quote_number}</h3>
                        <p className="text-sm text-gray-500">{quote.customer.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Data emissione:</span>
                        <div className="font-medium">{formatDate(quote.issue_date)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Scadenza:</span>
                        <div className="font-medium">{formatDate(quote.expiry_date)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Importo:</span>
                        <div className="font-medium text-green-600">{formatPrice(quote.total)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Stato:</span>
                        <div>{getStatusBadge(quote.status)}</div>
                      </div>
                    </div>

                    {quote.quote_items.length > 0 && (
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Servizi:</div>
                        <div className="space-y-1">
                          {quote.quote_items.map((item, index) => (
                            <div key={index} className="text-sm text-gray-600 flex justify-between">
                              <span>{item.description} x {item.quantity}</span>
                              <span className="font-medium">{formatPrice(item.total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-2">
                    {quote.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => updateQuoteStatus(quote.id, 'sent')}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Invia
                      </Button>
                    )}

                    {quote.status === 'sent' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateQuoteStatus(quote.id, 'accepted')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accettato
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuoteStatus(quote.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rifiutato
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteQuote(quote.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
