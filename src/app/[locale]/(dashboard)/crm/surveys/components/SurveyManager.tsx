'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ClipboardList, Plus, Pencil, Trash2, GripVertical, ChevronLeft, BarChart3, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { createSurveyTemplate, updateSurveyTemplate, deleteSurveyTemplate } from '../../actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Question {
    id: string
    type: 'select' | 'text' | 'number'
    label: string
    options?: string[]
}

interface SurveyTemplate {
    id: string
    title: string
    description: string
    questions: Question[]
    created_at: string
}

interface SurveyManagerProps {
    initialTemplates: SurveyTemplate[]
    responseCounts: Record<string, { total: number; completed: number }>
}

const DEFAULT_QUESTIONS: Question[] = [
    { id: 'q1', type: 'select', label: 'Mesleğiniz', options: ['Doktor', 'Avukat', 'Mühendis', 'İşadamı', 'Memur', 'Serbest Meslek', 'Emekli', 'Diğer'] },
    { id: 'q2', type: 'select', label: 'Medeni Durumunuz', options: ['Evli', 'Bekar', 'Boşanmış'] },
    { id: 'q3', type: 'number', label: 'Çocuk Sayınız' },
    { id: 'q4', type: 'select', label: 'Aracınız', options: ['SUV/Jeep', 'Sedan Lüks', 'Sedan Ekonomik', 'Ticari', 'Yok'] },
    { id: 'q5', type: 'select', label: 'Satın Alma Amacınız', options: ['Oturum', 'Yatırım', 'Tatil', 'Çocuk İçin'] },
    { id: 'q6', type: 'select', label: 'Ödeme Tercihiniz', options: ['Nakit', 'Banka Kredisi', 'Taksitli', 'Takas'] },
    { id: 'q7', type: 'text', label: 'Mezun Olduğunuz Üniversite' },
]

export default function SurveyManager({ initialTemplates, responseCounts }: SurveyManagerProps) {
    const router = useRouter()
    const [templates, setTemplates] = useState(initialTemplates)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<SurveyTemplate | null>(null)
    const [isPending, setIsPending] = useState(false)

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS)

    const openCreate = () => {
        setEditingTemplate(null)
        setTitle('')
        setDescription('')
        setQuestions(DEFAULT_QUESTIONS)
        setIsDialogOpen(true)
    }

    const openEdit = (template: SurveyTemplate) => {
        setEditingTemplate(template)
        setTitle(template.title)
        setDescription(template.description || '')
        setQuestions(template.questions || [])
        setIsDialogOpen(true)
    }

    const addQuestion = () => {
        const newId = `q${Date.now()}`
        setQuestions([...questions, { id: newId, type: 'text', label: '', options: [] }])
    }

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id))
    }

    const updateQuestion = (id: string, field: string, value: any) => {
        setQuestions(questions.map(q => {
            if (q.id !== id) return q
            const updated = { ...q, [field]: value }
            if (field === 'type' && value === 'select' && !updated.options?.length) {
                updated.options = ['Seçenek 1', 'Seçenek 2']
            }
            return updated
        }))
    }

    const updateOption = (qId: string, optIdx: number, value: string) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q
            const opts = [...(q.options || [])]
            opts[optIdx] = value
            return { ...q, options: opts }
        }))
    }

    const addOption = (qId: string) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q
            return { ...q, options: [...(q.options || []), ''] }
        }))
    }

    const removeOption = (qId: string, optIdx: number) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q
            const opts = [...(q.options || [])]
            opts.splice(optIdx, 1)
            return { ...q, options: opts }
        }))
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Lütfen bir başlık giriniz.')
            return
        }
        if (questions.length === 0) {
            toast.error('En az 1 soru eklemelisiniz.')
            return
        }
        // Validate questions have labels
        const emptyLabel = questions.find(q => !q.label.trim())
        if (emptyLabel) {
            toast.error('Tüm sorular için başlık giriniz.')
            return
        }

        setIsPending(true)

        if (editingTemplate) {
            const res = await updateSurveyTemplate(editingTemplate.id, title, description, questions)
            if (res?.error) toast.error(res.error)
            else toast.success('Anket güncellendi.')
        } else {
            const res = await createSurveyTemplate(title, description, questions)
            if (res?.error) toast.error(res.error)
            else toast.success('Anket oluşturuldu.')
        }

        setIsPending(false)
        setIsDialogOpen(false)
        router.refresh()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu anketi silmek istediğinize emin misiniz?')) return
        const res = await deleteSurveyTemplate(id)
        if (res?.error) toast.error(res.error)
        else {
            toast.success('Anket silindi.')
            setTemplates(templates.filter(t => t.id !== id))
        }
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/tr/crm">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-blue-600" />
                            Anket Yönetimi
                        </h1>
                        <p className="text-xs text-slate-500">Müşterilerinize gönderilecek anket şablonlarını yönetin</p>
                    </div>
                </div>
                <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 h-9 text-xs font-bold gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Yeni Anket
                </Button>
            </div>

            {/* Template List */}
            {templates.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <ClipboardList className="h-10 w-10 text-slate-300 mb-3" />
                        <h3 className="font-bold text-slate-600 mb-1">Henüz anket oluşturulmamış</h3>
                        <p className="text-xs text-slate-400 mb-4">Müşterilerinize gönderilecek ilk anketi oluşturun.</p>
                        <Button onClick={openCreate} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs font-bold gap-1.5">
                            <Plus className="h-3.5 w-3.5" />
                            İlk Anketi Oluştur
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {templates.map(template => {
                        const counts = responseCounts[template.id] || { total: 0, completed: 0 }
                        return (
                            <Card key={template.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <ClipboardList className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-sm text-slate-900 truncate">{template.title}</h3>
                                            {template.description && (
                                                <p className="text-[11px] text-slate-400 truncate">{template.description}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                                    {template.questions?.length || 0} soru
                                                </Badge>
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-blue-600 border-blue-200">
                                                    <BarChart3 className="h-2.5 w-2.5 mr-1" />
                                                    {counts.completed}/{counts.total} yanıt
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => openEdit(template)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(template.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTemplate ? 'Anketi Düzenle' : 'Yeni Anket Oluştur'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2 flex-1 overflow-y-auto">
                        <div className="grid gap-3">
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold">Anket Başlığı</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: Müşteri Tanıma Anketi"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold">Açıklama (Opsiyonel)</Label>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Kısa açıklama..."
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        {/* Questions Builder */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sorular</Label>
                                <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={addQuestion}>
                                    <Plus className="h-3 w-3" /> Soru Ekle
                                </Button>
                            </div>

                            {questions.map((q, qIdx) => (
                                <Card key={q.id} className="border-slate-200">
                                    <CardContent className="p-3 space-y-2">
                                        <div className="flex items-start gap-2">
                                            <GripVertical className="h-4 w-4 text-slate-300 mt-2.5 flex-shrink-0 cursor-grab" />
                                            <div className="flex-1 grid gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-400 w-5 flex-shrink-0">{qIdx + 1}.</span>
                                                    <Input
                                                        value={q.label}
                                                        onChange={(e) => updateQuestion(q.id, 'label', e.target.value)}
                                                        placeholder="Soru metni..."
                                                        className="h-8 text-xs flex-1"
                                                    />
                                                    <Select
                                                        value={q.type}
                                                        onValueChange={(val) => updateQuestion(q.id, 'type', val)}
                                                    >
                                                        <SelectTrigger className="h-8 text-[10px] w-28 flex-shrink-0">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="select">Seçmeli</SelectItem>
                                                            <SelectItem value="text">Metin</SelectItem>
                                                            <SelectItem value="number">Sayı</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 flex-shrink-0" onClick={() => removeQuestion(q.id)}>
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>

                                                {q.type === 'select' && (
                                                    <div className="pl-5 space-y-1.5">
                                                        {(q.options || []).map((opt, optIdx) => (
                                                            <div key={optIdx} className="flex items-center gap-1.5">
                                                                <span className="text-[9px] text-slate-300 w-3">•</span>
                                                                <Input
                                                                    value={opt}
                                                                    onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                                                    placeholder="Seçenek..."
                                                                    className="h-7 text-[11px] flex-1"
                                                                />
                                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500" onClick={() => removeOption(q.id, optIdx)}>
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] text-blue-500 hover:text-blue-600 pl-4" onClick={() => addOption(q.id)}>
                                                            + Seçenek Ekle
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Vazgeç</Button>
                        <Button onClick={handleSave} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
                            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {editingTemplate ? 'Güncelle' : 'Oluştur'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
