'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ClipboardList, Plus, Pencil, Trash2, ChevronLeft, BarChart3, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createSurveyTemplate, updateSurveyTemplate, deleteSurveyTemplate } from '../../actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamic import — SSR disabled for SurveyJS
const SurveyCreatorWrapper = dynamic(
    () => import('./SurveyCreatorWrapper'),
    { ssr: false, loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div> }
)

interface SurveyTemplate {
    id: string
    title: string
    description: string
    questions: any
    created_at: string
}

interface SurveyManagerProps {
    initialTemplates: SurveyTemplate[]
    responseCounts: Record<string, { total: number; completed: number }>
}

export default function SurveyManager({ initialTemplates, responseCounts }: SurveyManagerProps) {
    const router = useRouter()
    const [templates, setTemplates] = useState(initialTemplates)
    const [isCreatorOpen, setIsCreatorOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<SurveyTemplate | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [creatorInstance, setCreatorInstance] = useState<any>(null)
    const [creatorKey, setCreatorKey] = useState(0) // Force re-mount

    const openCreate = () => {
        setEditingTemplate(null)
        setTitle('')
        setDescription('')
        setCreatorInstance(null)
        setCreatorKey(k => k + 1)
        setIsCreatorOpen(true)
    }

    const openEdit = (template: SurveyTemplate) => {
        setEditingTemplate(template)
        setTitle(template.title)
        setDescription(template.description || '')
        setCreatorInstance(null)
        setCreatorKey(k => k + 1)
        setIsCreatorOpen(true)
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Lütfen bir anket başlığı giriniz.')
            return
        }
        if (!creatorInstance) {
            toast.error('Anket editor henüz hazır değil.')
            return
        }

        const surveyJSON = creatorInstance.JSON
        if (!surveyJSON?.pages?.length || surveyJSON.pages.every((p: any) => !p.elements?.length)) {
            toast.error('Lütfen en az 1 soru ekleyiniz.')
            return
        }

        setIsPending(true)

        try {
            if (editingTemplate) {
                const res = await updateSurveyTemplate(editingTemplate.id, title, description, surveyJSON)
                if (res?.error) toast.error(res.error)
                else toast.success('Anket güncellendi.')
            } else {
                const res = await createSurveyTemplate(title, description, surveyJSON)
                if (res?.error) toast.error(res.error)
                else toast.success('Anket oluşturuldu.')
            }
        } catch (e) {
            toast.error('Bir hata oluştu.')
        }

        setIsPending(false)
        setIsCreatorOpen(false)
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

    const getQuestionCount = (questions: any): number => {
        if (!questions?.pages) return 0
        return questions.pages.reduce((acc: number, page: any) => {
            return acc + (page.elements?.length || 0)
        }, 0)
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
                        <p className="text-xs text-slate-500">SurveyJS tabanlı profesyonel anket builder</p>
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
                        <p className="text-xs text-slate-400 mb-4">Profesyonel anket builder ile ilk anketi oluşturun.</p>
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
                        const qCount = getQuestionCount(template.questions)
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
                                                    {qCount} soru
                                                </Badge>
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                                    {template.questions?.pages?.length || 0} sayfa
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

            {/* SurveyJS Creator Dialog - Full screen */}
            <Dialog open={isCreatorOpen} onOpenChange={setIsCreatorOpen}>
                <DialogContent className="max-w-[95vw] w-full h-[95vh] rounded-2xl flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-3 shrink-0 border-b flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <DialogTitle className="text-base">
                                {editingTemplate ? 'Anketi Düzenle' : 'Yeni Anket Oluştur'}
                            </DialogTitle>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Anket Başlığı *"
                                    className="h-8 text-sm w-60"
                                />
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Açıklama (opsiyonel)"
                                    className="h-8 text-sm w-48"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsCreatorOpen(false)} className="h-8 text-xs">
                                Vazgeç
                            </Button>
                            <Button onClick={handleSave} disabled={isPending} size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
                                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                {editingTemplate ? 'Güncelle' : 'Kaydet'}
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 overflow-hidden">
                        {isCreatorOpen && (
                            <SurveyCreatorWrapper
                                key={creatorKey}
                                surveyJSON={editingTemplate?.questions}
                                onCreatorReady={setCreatorInstance}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
