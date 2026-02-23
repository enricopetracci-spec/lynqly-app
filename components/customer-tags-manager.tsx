'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, RotateCcw } from 'lucide-react'

type Tag = {
  id: string
  name: string
  emoji: string
  color: string
  is_system: boolean
}

const EMOJI_OPTIONS = ['⭐', '🆕', '🔄', '⚠️', '❗', '❌', '💎', '🎯', '🔥', '💰', '👑', '✨', '🏆', '📌', '🎉']

const COLOR_OPTIONS = [
  { name: 'Blu', value: 'blue' },
  { name: 'Verde', value: 'green' },
  { name: 'Giallo', value: 'yellow' },
  { name: 'Rosso', value: 'red' },
  { name: 'Arancione', value: 'orange' },
  { name: 'Viola', value: 'purple' },
  { name: 'Grigio', value: 'gray' },
]

const getColorClass = (color: string) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  return colors[color] || colors.blue
}

export function CustomerTagsManager({ businessId }: { businessId: string | null }) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    emoji: '🏷️',
    color: 'blue'
  })

  useEffect(() => {
    if (businessId) {
      loadTags()
    }
  }, [businessId])

  const loadTags = async () => {
    if (!businessId) return

    const { data } = await supabase
      .from('customer_tags')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order')

    if (data) {
      setTags(data)
    }
    setLoading(false)
  }

  const addTag = async () => {
    if (!businessId || !formData.name.trim()) return

    const { error } = await supabase
      .from('customer_tags')
      .insert({
        business_id: businessId,
        name: formData.name.trim(),
        emoji: formData.emoji,
        color: formData.color,
        is_system: false,
        sort_order: tags.length + 1
      })

    if (!error) {
      setFormData({ name: '', emoji: '🏷️', color: 'blue' })
      setShowAddForm(false)
      loadTags()
    }
  }

  const deleteTag = async (tagId: string) => {
    if (!confirm('Eliminare questo tag? Verrà rimosso da tutti i clienti.')) return

    const { error } = await supabase
      .from('customer_tags')
      .delete()
      .eq('id', tagId)

    if (!error) {
      loadTags()
    }
  }

  const resetToDefaults = async () => {
    if (!businessId) return
    if (!confirm('Ripristinare i tag predefiniti? I tag personalizzati non verranno eliminati.')) return

    const { error } = await supabase.rpc('create_default_customer_tags', { 
      business_uuid: businessId 
    })

    if (!error) {
      loadTags()
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Caricamento...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <div
            key={tag.id}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getColorClass(tag.color)}`}
          >
            <span className="text-lg">{tag.emoji}</span>
            <span className="font-medium">{tag.name}</span>
            {!tag.is_system && (
              <button
                onClick={() => deleteTag(tag.id)}
                className="ml-1 hover:opacity-70"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showAddForm ? (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          <div>
            <Label>Nome Tag</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Es: Cliente Premium"
              maxLength={50}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, emoji })}
                    className={`w-10 h-10 text-xl flex items-center justify-center rounded border-2 ${
                      formData.emoji === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Colore</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`px-3 py-1 text-xs rounded-full ${getColorClass(color.value)} ${
                      formData.color === color.value ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={addTag} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Aggiungi
            </Button>
            <Button onClick={() => setShowAddForm(false)} variant="outline" size="sm">
              Annulla
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button onClick={() => setShowAddForm(true)} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Aggiungi Tag
          </Button>
          <Button onClick={resetToDefaults} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            Ripristina Predefiniti
          </Button>
        </div>
      )}
    </div>
  )
}
