'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Bot, Trash2, Edit3, Save, X, Copy, FlaskConical, Trophy, XCircle } from 'lucide-react'
import { createScript, updateScript, deleteScript } from '../actions'
import { createAbTest, getAbTestForScript, completeAbTest, cancelAbTest } from '../ab-test-actions'
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
    // A/B Test state
    const [abTests, setAbTests] = useState<Record<string, any>>({})
    const [abTestLoading, setAbTestLoading] = useState<string | null>(null)
    const [showAbTestFor, setShowAbTestFor] = useState<string | null>(null)
    const [selectedVariant, setSelectedVariant] = useState<string>('')

    const startNew = () => {
        setIsNew(true); setEditing(null)
        setName(''); setDescription(''); setPrompt(''); setFirstMessage('')
    }

    const startEdit = (s: any) => {
        setEditing(s); setIsNew(false)
        setName(s.name); setDescription(s.description || '')
        setPrompt(s.prompt); setFirstMessage(s.first_message || '')
    }

    const startCopy = (s: any) => {
        setIsNew(true); setEditing(null)
        setName(`${s.name} (Kopya)`)
        setDescription(s.description || '')
        setPrompt(s.prompt)
        setFirstMessage(s.first_message || '')
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

    // A/B Test handlers
    const startAbTest = async (scriptAId: string) => {
        if (!selectedVariant) return alert('Varyant script seçin')
        setAbTestLoading(scriptAId)
        const scriptA = scripts.find(s => s.id === scriptAId)
        const res = await createAbTest({
            name: `${scriptA?.name || 'Script A'} vs Varyant`,
            scriptAId,
            scriptBId: selectedVariant
        })
        if (res.error) {
            alert(res.error)
        } else if (res.data) {
            setAbTests(prev => ({ ...prev, [scriptAId]: res.data, [selectedVariant]: res.data }))
        }
        setShowAbTestFor(null)
        setSelectedVariant('')
        setAbTestLoading(null)
    }

    const handleCompleteTest = async (testId: string, winner: 'a' | 'b') => {
        if (!confirm(`${winner === 'a' ? 'A' : 'B'} scriptini kazanan olarak ayarlamak istediğinize emin misiniz?`)) return
        await completeAbTest(testId, winner)
        setAbTests({})
    }

    const handleCancelTest = async (testId: string) => {
        if (!confirm('A/B testi iptal edilsin mi?')) return
        await cancelAbTest(testId)
        setAbTests({})
    }

    // Load AB test status for each script on mount
    useEffect(() => {
        scripts.forEach(async (s) => {
            const test = await getAbTestForScript(s.id)
            if (test) {
                setAbTests(prev => ({ ...prev, [s.id]: test }))
            }
        })
    }, [scripts])

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
                                    {!abTests[s.id] && (
                                        <Button variant="ghost" size="sm" onClick={() => { setShowAbTestFor(s.id); setSelectedVariant('') }}
                                            className="h-7 px-2 text-[10px] text-muted-foreground hover:text-violet-400 gap-1" title="A/B Test">
                                            <FlaskConical className="h-3 w-3" /> A/B
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => startCopy(s)} className="h-7 w-7 p-0 text-muted-foreground hover:text-violet-400" title="Kopyala">
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => startEdit(s)} className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-400" title="Düzenle">
                                        <Edit3 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}
                                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300" title="Sil">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* A/B Test Start Dialog */}
                            {showAbTestFor === s.id && (
                                <div className="mt-3 p-3 rounded-lg border border-violet-500/20 bg-violet-500/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold flex items-center gap-1.5">
                                            <FlaskConical className="h-3.5 w-3.5 text-violet-400" /> A/B Test Başlat
                                        </h4>
                                        <Button variant="ghost" size="sm" onClick={() => setShowAbTestFor(null)} className="h-5 w-5 p-0">
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Karşılaştırılacak varyant scripti seçin:</p>
                                    <select
                                        value={selectedVariant}
                                        onChange={e => setSelectedVariant(e.target.value)}
                                        className="w-full h-8 text-xs rounded-lg border bg-background px-2"
                                    >
                                        <option value="">Script seçin...</option>
                                        {scripts.filter(v => v.id !== s.id).map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                    <Button
                                        size="sm"
                                        disabled={!selectedVariant || abTestLoading === s.id}
                                        onClick={() => startAbTest(s.id)}
                                        className="w-full h-8 text-xs gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600"
                                    >
                                        <FlaskConical className="h-3 w-3" />
                                        {abTestLoading === s.id ? 'Başlatılıyor...' : 'Testi Başlat (%50/%50)'}
                                    </Button>
                                </div>
                            )}

                            {/* Active AB Test Panel */}
                            {abTests[s.id] && abTests[s.id].script_a_id === s.id && (
                                <div className="mt-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold flex items-center gap-1.5">
                                            <FlaskConical className="h-3.5 w-3.5 text-amber-400" /> 🔬 A/B Test Aktif
                                        </h4>
                                        <Badge variant="outline" className="text-[9px]">⏳ Devam ediyor</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['A (Kontrol)', 'B (Varyant)'].map((label, idx) => {
                                            const stats = idx === 0 ? abTests[s.id].stats_a : abTests[s.id].stats_b
                                            const p = stats as any || {}
                                            const answerRate = p.calls > 0 ? Math.round((p.answered / p.calls) * 100) : 0
                                            const appointRate = p.calls > 0 ? Math.round((p.appointments / p.calls) * 100) : 0
                                            return (
                                                <div key={idx} className="text-center p-2 rounded-lg bg-background/50 border">
                                                    <p className="text-[10px] font-bold mb-1">{label}</p>
                                                    <p className="text-lg font-black">{p.calls || 0}</p>
                                                    <p className="text-[9px] text-muted-foreground">arama</p>
                                                    <div className="flex justify-center gap-2 mt-1 text-[9px]">
                                                        <span>Cevap: %{answerRate}</span>
                                                        <span>Randevu: %{appointRate}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleCompleteTest(abTests[s.id].id, 'a')}
                                            className="flex-1 h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700">
                                            <Trophy className="h-3 w-3" /> A Kazandı
                                        </Button>
                                        <Button size="sm" onClick={() => handleCompleteTest(abTests[s.id].id, 'b')}
                                            className="flex-1 h-7 text-[10px] gap-1 bg-blue-600 hover:bg-blue-700">
                                            <Trophy className="h-3 w-3" /> B Kazandı
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleCancelTest(abTests[s.id].id)}
                                            className="h-7 text-[10px] gap-1 text-red-400">
                                            <XCircle className="h-3 w-3" /> İptal
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
