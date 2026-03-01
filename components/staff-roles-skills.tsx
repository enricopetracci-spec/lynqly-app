'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Briefcase, Award } from 'lucide-react'

export function StaffRolesManager({ businessId }: { businessId: string | null }) {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    if (businessId) loadRoles()
  }, [businessId])

  const loadRoles = async () => {
    if (!businessId) return
    const { data } = await supabase
      .from('staff_roles')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order')
    
    if (data) setRoles(data)
    setLoading(false)
  }

  const addRole = async () => {
    if (!businessId || !formData.name.trim()) return
    
    await supabase.from('staff_roles').insert({
      business_id: businessId,
      name: formData.name.trim(),
      description: formData.description.trim(),
      is_system: false,
      sort_order: roles.length + 1
    })
    
    setFormData({ name: '', description: '' })
    setShowForm(false)
    loadRoles()
  }

  const deleteRole = async (id: string) => {
    if (!confirm('Eliminare questo ruolo?')) return
    await supabase.from('staff_roles').delete().eq('id', id)
    loadRoles()
  }

  const createDefaults = async () => {
    if (!businessId) return
    
    const defaults = [
      { name: 'Parrucchiere Senior', description: 'Parrucchiere esperto' },
      { name: 'Estetista', description: 'Specialista estetica' },
      { name: 'Barbiere', description: 'Specialista barba' },
      { name: 'Apprendista', description: 'In formazione' },
      { name: 'Receptionist', description: 'Accoglienza' }
    ]

    for (let i = 0; i < defaults.length; i++) {
      await supabase.from('staff_roles').insert({
        business_id: businessId,
        name: defaults[i].name,
        description: defaults[i].description,
        is_system: true,
        sort_order: i + 1
      }).select().single()
    }
    
    loadRoles()
  }

  if (loading) return <div className="text-sm text-gray-500">Caricamento...</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {roles.map(role => (
          <div key={role.id} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
            <Briefcase className="w-4 h-4" />
            <div>
              <div className="font-medium">{role.name}</div>
              {role.description && <div className="text-xs">{role.description}</div>}
            </div>
            {!role.is_system && (
              <button onClick={() => deleteRole(role.id)} className="ml-1 hover:opacity-70">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          <div>
            <Label>Nome Ruolo *</Label>
            <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Es: Manager" />
          </div>
          <div>
            <Label>Descrizione</Label>
            <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Breve descrizione" />
          </div>
          <div className="flex gap-2">
            <Button onClick={addRole} size="sm"><Plus className="w-4 h-4 mr-1" />Aggiungi</Button>
            <Button onClick={() => setShowForm(false)} variant="outline" size="sm">Annulla</Button>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Aggiungi Ruolo</Button>
          {roles.length === 0 && <Button onClick={createDefaults} variant="outline" size="sm">Crea Ruoli Predefiniti</Button>}
        </div>
      )}
    </div>
  )
}

export function StaffSkillsManager({ businessId }: { businessId: string | null }) {
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', category: '' })

  useEffect(() => {
    if (businessId) loadSkills()
  }, [businessId])

  const loadSkills = async () => {
    if (!businessId) return
    const { data } = await supabase
      .from('staff_skills')
      .select('*')
      .eq('business_id', businessId)
      .order('category, sort_order')
    
    if (data) setSkills(data)
    setLoading(false)
  }

  const addSkill = async () => {
    if (!businessId || !formData.name.trim()) return
    
    await supabase.from('staff_skills').insert({
      business_id: businessId,
      name: formData.name.trim(),
      category: formData.category.trim() || null,
      is_system: false,
      sort_order: skills.length + 1
    })
    
    setFormData({ name: '', category: '' })
    setShowForm(false)
    loadSkills()
  }

  const deleteSkill = async (id: string) => {
    if (!confirm('Eliminare questa competenza?')) return
    await supabase.from('staff_skills').delete().eq('id', id)
    loadSkills()
  }

  const createDefaults = async () => {
    if (!businessId) return
    
    const defaults = [
      { name: 'Taglio', category: 'Capelli' },
      { name: 'Colore', category: 'Capelli' },
      { name: 'Piega', category: 'Capelli' },
      { name: 'Trattamenti', category: 'Capelli' },
      { name: 'Extension', category: 'Capelli' },
      { name: 'Barba', category: 'Barba' },
      { name: 'Manicure', category: 'Unghie' },
      { name: 'Pedicure', category: 'Unghie' },
      { name: 'Massaggi', category: 'Estetica' },
      { name: 'Trucco', category: 'Estetica' }
    ]

    for (let i = 0; i < defaults.length; i++) {
      await supabase.from('staff_skills').insert({
        business_id: businessId,
        name: defaults[i].name,
        category: defaults[i].category,
        is_system: true,
        sort_order: i + 1
      }).select().single()
    }
    
    loadSkills()
  }

  if (loading) return <div className="text-sm text-gray-500">Caricamento...</div>

  const categories = [...new Set(skills.map(s => s.category).filter(Boolean))]

  return (
    <div className="space-y-4">
      {categories.map(cat => (
        <div key={cat}>
          <div className="text-sm font-medium text-gray-700 mb-2">{cat}</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.filter(s => s.category === cat).map(skill => (
              <div key={skill.id} className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-800 rounded-full border border-green-200 text-sm">
                <Award className="w-3 h-3" />
                <span>{skill.name}</span>
                {!skill.is_system && (
                  <button onClick={() => deleteSkill(skill.id)} className="ml-1 hover:opacity-70">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {skills.filter(s => !s.category).length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Altre</div>
          <div className="flex flex-wrap gap-2">
            {skills.filter(s => !s.category).map(skill => (
              <div key={skill.id} className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full border border-gray-300 text-sm">
                <Award className="w-3 h-3" />
                <span>{skill.name}</span>
                {!skill.is_system && (
                  <button onClick={() => deleteSkill(skill.id)} className="ml-1 hover:opacity-70">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          <div>
            <Label>Nome Competenza *</Label>
            <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Es: Riflessatura" />
          </div>
          <div>
            <Label>Categoria</Label>
            <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="Es: Capelli" />
          </div>
          <div className="flex gap-2">
            <Button onClick={addSkill} size="sm"><Plus className="w-4 h-4 mr-1" />Aggiungi</Button>
            <Button onClick={() => setShowForm(false)} variant="outline" size="sm">Annulla</Button>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Aggiungi Competenza</Button>
          {skills.length === 0 && <Button onClick={createDefaults} variant="outline" size="sm">Crea Competenze Predefinite</Button>}
        </div>
      )}
    </div>
  )
}
