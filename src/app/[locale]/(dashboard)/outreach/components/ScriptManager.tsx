'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Bot, Trash2, Edit3, Save, X } from 'lucide-react'
import { createScript, updateScript, deleteScript } from '../actions'
import { DEFAULT_OUTREACH_PROMPTS } from '@/lib/vapi'

export function ScriptManager({ scripts: initialScripts, tenantId, onClose }: {
    scripts: any[]; tenantId: string; onClose: () => void
}) {
    const [scripts, setScripts] = useState(initialScripts)
    const [editing, setEditing] = useState<any>(null)
    const [isNew, setIsNew] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [prompt, setPrompt] = useState('')
    const [firstMessage, setFirstMessage] = useState('')
    const [saving, setSaving] = useState(false)

    const startNew = () => {
        setIsNew(true); setEditing(null)
        setName(''); setDescription(''); setPrompt(''); setFirstMessage('')
    }

    const startEdit = (s: any) => {
        setEditing(s); setIsNew(false)
        setName(s.name); setDescription(s.description || '')
        setPrompt(s.prompt); setFirstMessage(s.first_message || '')
    }

    const handleSave = async () => {
        if (!name || !prompt) return alert('Ad ve prompt gerekli')
        setSaving(true)
        if (isNew) {
            const res = await createScript({ name, description, prompt, first_message: firstMessage })
            if (res.data) setScripts(prev => [res.data, ...prev])
        } else if (editing) {
            await updateScript(editing.id, { name, prompt, first_message: firstMessage })
            setScripts(prev => prev.map(s => s.id === editing.id ? { ...s, name, prompt, first_message: firstMessage } : s))
        }
        setEditing(null); setIsNew(false); setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Script silinsin mi?')) return
        await deleteScript(id)
        setScripts(prev => prev.filter(s => s.id !== id))
    }

    const loadTemplate = (key: string) => {
        const p = (DEFAULT_OUTREACH_PROMPTS as any)[key]
        if (p) setPrompt(p)
    }

    const showForm = isNew || editing

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 md:pr-36">
                <Button variant="ghost" size="sm" onClick={onClose}><ArrowLeft className="h-4 w-4" /></Button>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Bot className="h-5 w-5 text-violet-400" /> AI Script Yönetimi
                </h1>
                <div className="flex-1" />
                {!showForm && <Button size="sm" onClick={startNew} className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600">
                    <Plus className="h-4 w-4" /> Yeni Script
                </Button>}
            </div>

            {showForm ? (
                <Card className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">{isNew ? 'Yeni Script' : 'Script Düzenle'}</h2>
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setIsNew(false) }}><X className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Script Adı *</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Standart Soğuk Arama" className="h-9" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">İlk Mesaj (AI&apos;ın söyleyeceği ilk cümle)</Label>
                        <Input value={firstMessage} onChange={e => setFirstMessage(e.target.value)}
                            placeholder="Merhaba, ben Elif, Novo Emlak'tan arıyorum." className="h-9" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">System Prompt *</Label>
                            <div className="flex gap-1">
                                {['standard', 'secondAttempt', 'campaign', 'lostRecovery'].map(k => (
                                    <Button key={k} variant="outline" size="sm" onClick={() => loadTemplate(k)} className="h-6 text-[10px] px-2">
                                        {k === 'standard' ? 'Standart' : k === 'secondAttempt' ? '2. Deneme' : k === 'campaign' ? 'Kampanya' : 'Kayıp'}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={12}
                            placeholder="AI agent'ın davranış kurallarını yazın..." className="text-xs font-mono" />
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        <Save className="h-4 w-4" /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    {scripts.length === 0 ? (
                        <Card className="border-dashed border-2 bg-muted/30 p-8 text-center">
                            <Bot className="h-8 w-8 text-violet-400 mx-auto mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground">Henüz AI script oluşturulmamış.</p>
                        </Card>
                    ) : scripts.map(s => (
                        <Card key={s.id} className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-sm">{s.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.prompt?.substring(0, 150)}...</p>
                                    {s.first_message && (
                                        <Badge variant="outline" className="mt-2 text-[10px]">
                                            İlk mesaj: &quot;{s.first_message.substring(0, 50)}...&quot;
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex gap-1 ml-2">
                                    <Button variant="ghost" size="sm" onClick={() => startEdit(s)} className="h-7 w-7 p-0">
                                        <Edit3 className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}
                                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
