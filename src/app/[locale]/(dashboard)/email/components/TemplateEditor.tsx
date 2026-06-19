'use client'

import { useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, ArrowLeft, Eye, Send, FileText, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { updateTemplate, sendTest } from '../actions'
import { useRouter } from '@/i18n/routing'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

// Unlayer editörü client-side only olarak yükle
const EmailEditor = dynamic(() => import('react-email-editor').then(mod => mod.default), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-[600px] bg-muted/30 rounded-lg">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400 mb-3" />
                <p className="text-sm text-muted-foreground">Email editör yükleniyor...</p>
            </div>
        </div>
    ),
})

interface TemplateEditorProps {
    template: {
        id: string
        name: string
        subject: string
        design_json: any
        html: string
    }
}

export function TemplateEditor({ template }: TemplateEditorProps) {
    const emailEditorRef = useRef<any>(null)
    const [name, setName] = useState(template.name)
    const [subject, setSubject] = useState(template.subject || '')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewHtml, setPreviewHtml] = useState('')
    const [testOpen, setTestOpen] = useState(false)
    const [testEmail, setTestEmail] = useState('')
    const [sending, setSending] = useState(false)
    const router = useRouter()

    const onEditorReady = useCallback((editor: any) => {
        emailEditorRef.current = editor

        // Mevcut tasarımı yükle
        if (template.design_json && Object.keys(template.design_json).length > 0) {
            editor.loadDesign(template.design_json)
        }

        // Merge tags (dinamik değişkenler)
        editor.setMergeTags({
            full_name: { name: 'Müşteri Adı', value: '{{full_name}}' },
            first_name: { name: 'İlk İsim', value: '{{first_name}}' },
            email: { name: 'Email', value: '{{email}}' },
            phone: { name: 'Telefon', value: '{{phone}}' },
            company_name: { name: 'Şirket Adı', value: '{{company_name}}' },
        })
    }, [template.design_json])

    const handleSave = async () => {
        if (!emailEditorRef.current) return

        setSaving(true)
        emailEditorRef.current.exportHtml(async (data: any) => {
            const { design, html } = data
            
            const res = await updateTemplate(template.id, {
                name,
                subject,
                design_json: design,
                html,
            })

            setSaving(false)
            if (res.error) {
                toast.error(res.error)
            } else {
                setSaved(true)
                toast.success('Şablon kaydedildi')
                setTimeout(() => setSaved(false), 2000)
            }
        })
    }

    const handlePreview = () => {
        if (!emailEditorRef.current) return
        emailEditorRef.current.exportHtml((data: any) => {
            setPreviewHtml(data.html)
            setPreviewOpen(true)
        })
    }

    const handleSendTest = async () => {
        if (!testEmail.trim()) return toast.error('Email adresi girin')
        if (!emailEditorRef.current) return

        setSending(true)
        emailEditorRef.current.exportHtml(async (data: any) => {
            const res = await sendTest(testEmail.trim(), subject || name, data.html)
            setSending(false)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(`Test email ${testEmail}'e gönderildi`)
                setTestOpen(false)
            }
        })
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* Toolbar */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/email')} className="gap-1 text-xs">
                        <ArrowLeft className="h-3.5 w-3.5" /> Geri
                    </Button>

                    <div className="h-5 w-px bg-border" />

                    <div className="flex items-center gap-2 flex-1">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="h-8 text-sm font-semibold border-none bg-transparent shadow-none focus-visible:ring-0 max-w-[250px]"
                            placeholder="Şablon adı..."
                        />
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Input
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="h-8 text-xs max-w-[300px]"
                            placeholder="Email konusu..."
                        />
                    </div>

                    <div className="h-5 w-px bg-border" />

                    <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" onClick={handlePreview} className="h-8 gap-1 text-xs">
                            <Eye className="h-3.5 w-3.5" /> Önizle
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setTestOpen(true)} className="h-8 gap-1 text-xs">
                            <Send className="h-3.5 w-3.5" /> Test Gönder
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700">
                            {saving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : saved ? (
                                <Check className="h-3.5 w-3.5" />
                            ) : (
                                <Save className="h-3.5 w-3.5" />
                            )}
                            {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Merge Tags Info */}
            <div className="px-4 py-1.5 bg-muted/30 border-b flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="font-medium">Kullanılabilir değişkenler:</span>
                {['{{full_name}}', '{{first_name}}', '{{email}}', '{{phone}}', '{{company_name}}'].map(tag => (
                    <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 font-mono cursor-pointer hover:bg-muted" onClick={() => { navigator.clipboard.writeText(tag); toast.success(`${tag} kopyalandı`) }}>
                        {tag}
                    </Badge>
                ))}
            </div>

            {/* Editor */}
            <div className="flex-1">
                <EmailEditor
                    ref={emailEditorRef}
                    onReady={onEditorReady}
                    minHeight="100%"
                    options={{
                        locale: 'tr-TR',
                        appearance: {
                            theme: 'modern_dark',
                        },
                        features: {
                            stockImages: {
                                enabled: true,
                                safeSearch: true,
                                defaultSearchTerm: 'business',
                            },
                        },
                        tools: {
                            button: { enabled: true },
                            divider: { enabled: true },
                            heading: { enabled: true },
                            html: { enabled: true },
                            image: { enabled: true },
                            menu: { enabled: true },
                            social: { enabled: true },
                            text: { enabled: true },
                            timer: { enabled: true },
                            video: { enabled: true },
                        },
                    }}
                />
            </div>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-3xl h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Email Önizleme</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-white rounded-lg">
                        <iframe srcDoc={previewHtml} className="w-full h-full min-h-[500px] border-0" title="Email Preview" />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Test Email Dialog */}
            <Dialog open={testOpen} onOpenChange={setTestOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-blue-500" /> Test Email Gönder
                        </DialogTitle>
                    </DialogHeader>
                    <div>
                        <label className="text-xs font-medium mb-1 block">Alıcı Email</label>
                        <Input placeholder="test@ornek.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
                        <p className="text-[10px] text-muted-foreground mt-1">Test emaili "[TEST]" prefiksi ile gönderilir</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTestOpen(false)}>İptal</Button>
                        <Button onClick={handleSendTest} disabled={sending} className="bg-blue-600 hover:bg-blue-700">
                            {sending ? 'Gönderiliyor...' : 'Gönder'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
