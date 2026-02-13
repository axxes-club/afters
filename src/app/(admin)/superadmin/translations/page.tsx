"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Languages, Search, Save, Plus, RefreshCw, Loader2, Check, X, Edit2 } from "lucide-react"
import { toast } from "sonner"

interface Translation {
  id: string
  locale: string
  namespace: string
  key: string
  value: string
  updatedAt: string
}

const LOCALES = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es-ES', label: 'Español (España)', flag: '🇪🇸' },
  { value: 'es-LA', label: 'Español (Latinoamérica)', flag: '🇲🇽' },
  { value: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
]

const NAMESPACES = [
  'common',
  'nav',
  'home',
  'events',
  'tickets',
  'dashboard',
  'settings',
  'profiles',
  'auth',
  'errors',
  'time',
]

export default function TranslationsPage() {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [selectedLocale, setSelectedLocale] = useState('en')
  const [selectedNamespace, setSelectedNamespace] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTranslation, setNewTranslation] = useState({
    namespace: 'common',
    key: '',
    values: {} as Record<string, string>
  })

  useEffect(() => {
    fetchTranslations()
  }, [])

  const fetchTranslations = async () => {
    try {
      const res = await fetch('/api/admin/translations')
      const data = await res.json()
      setTranslations(data.translations || [])
    } catch (error) {
      toast.error('Failed to load translations')
    } finally {
      setLoading(false)
    }
  }

  const syncFromFiles = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/translations/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(`Synced ${data.count} translations from files`)
        fetchTranslations()
      } else {
        toast.error(data.error || 'Sync failed')
      }
    } catch (error) {
      toast.error('Failed to sync translations')
    } finally {
      setSyncing(false)
    }
  }

  const saveTranslation = async (id: string, value: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, value })
      })
      const data = await res.json()
      if (data.success) {
        setTranslations(prev => prev.map(t => t.id === id ? { ...t, value, updatedAt: new Date().toISOString() } : t))
        setEditingId(null)
        toast.success('Translation saved')
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save translation')
    } finally {
      setSaving(false)
    }
  }

  const addTranslation = async () => {
    if (!newTranslation.key.trim()) {
      toast.error('Key is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTranslation)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Translation added')
        setShowAddDialog(false)
        setNewTranslation({ namespace: 'common', key: '', values: {} })
        fetchTranslations()
      } else {
        toast.error(data.error || 'Failed to add')
      }
    } catch (error) {
      toast.error('Failed to add translation')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (translation: Translation) => {
    setEditingId(translation.id)
    setEditValue(translation.value)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  // Filter translations
  const filteredTranslations = translations.filter(t => {
    if (t.locale !== selectedLocale) return false
    if (selectedNamespace !== 'all' && t.namespace !== selectedNamespace) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return t.key.toLowerCase().includes(query) || t.value.toLowerCase().includes(query)
    }
    return true
  })

  // Group by namespace
  const groupedTranslations = filteredTranslations.reduce((acc, t) => {
    if (!acc[t.namespace]) acc[t.namespace] = []
    acc[t.namespace].push(t)
    return acc
  }, {} as Record<string, Translation[]>)

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Languages className="w-6 h-6 text-[#ff1493]" />
              <h1 className="text-2xl font-mono font-bold tracking-tight text-white">TRANSLATIONS</h1>
            </div>
            <p className="text-white/40 font-mono text-sm">Manage localized strings across the platform.</p>
          </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={syncFromFiles} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync from Files
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Translation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Translation</DialogTitle>
                <DialogDescription>Add a new translation key with values for each locale</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Namespace</Label>
                    <Select value={newTranslation.namespace} onValueChange={v => setNewTranslation(p => ({ ...p, namespace: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NAMESPACES.map(ns => (
                          <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Key</Label>
                    <Input 
                      placeholder="e.g., buttonLabel" 
                      value={newTranslation.key}
                      onChange={e => setNewTranslation(p => ({ ...p, key: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Values by Locale</Label>
                  {LOCALES.map(locale => (
                    <div key={locale.value} className="flex items-center gap-2">
                      <span className="text-lg w-8">{locale.flag}</span>
                      <Input
                        placeholder={`${locale.label} translation`}
                        value={newTranslation.values[locale.value] || ''}
                        onChange={e => setNewTranslation(p => ({
                          ...p,
                          values: { ...p.values, [locale.value]: e.target.value }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={addTranslation} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Add Translation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {LOCALES.map(locale => {
          const count = translations.filter(t => t.locale === locale.value).length
          const isSelected = selectedLocale === locale.value
          return (
            <div
              key={locale.value}
              className={`border p-3 sm:p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#ff1493]/50 bg-[#ff1493]/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }`}
              onClick={() => setSelectedLocale(locale.value)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{locale.flag}</span>
                <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase">{locale.value}</span>
              </div>
              <div className={`text-xl sm:text-2xl font-mono font-bold ${isSelected ? 'text-[#ff1493]' : 'text-white'}`}>{count}</div>
              <p className="text-[10px] font-mono text-white/40 mt-1">{locale.label}</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search keys or values..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={selectedLocale} onValueChange={setSelectedLocale}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map(locale => (
                  <SelectItem key={locale.value} value={locale.value}>
                    <span className="flex items-center gap-2">
                      <span>{locale.flag}</span>
                      {locale.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Namespaces</SelectItem>
                {NAMESPACES.map(ns => (
                  <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Translations List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff1493]" />
        </div>
      ) : Object.keys(groupedTranslations).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Languages className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No translations found</p>
            <p className="text-muted-foreground mb-4">Click "Sync from Files" to import translations</p>
            <Button onClick={syncFromFiles} disabled={syncing}>
              {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sync from Files
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTranslations).map(([namespace, items]) => (
            <Card key={namespace}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">{namespace}</Badge>
                  <span className="text-sm text-muted-foreground font-normal">
                    {items.length} strings
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map(translation => (
                    <div 
                      key={translation.id}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <code className="text-xs text-[#ff1493] bg-[#ff1493]/10 px-2 py-0.5 rounded">
                          {translation.key}
                        </code>
                        {editingId === translation.id ? (
                          <div className="mt-2">
                            <Textarea
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="min-h-[60px]"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <p className="text-sm mt-1 text-foreground">
                            {translation.value}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {editingId === translation.id ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => saveTranslation(translation.id, editValue)}
                              disabled={saving}
                            >
                              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-500" />}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={cancelEdit}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(translation)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
