'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Share2,
    MessageCircle,
    FileText,
    FileImage,
    FileCode,
    CheckCircle2,
    Copy,
    Send,
    ExternalLink,
    Loader2,
    Building2,
    Phone,
    User,
    Sparkles,
    Check,
    AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { getProjectDocumentsForSharing, shareProjectDocumentsViaWhatsApp } from '../actions'
import { encodeUuid } from '@/lib/utils'

interface ProjectDocument {
    id: string
    document_name: string
    file_name: string
    file_url: string
    file_type?: string
    file_size?: number
    description?: string
    created_at?: string
}

interface ShareProjectDocumentsModalProps {
    isOpen: boolean
    onClose: () => void
    customer: {
        id: string
        full_name: string
        phone?: string
    }
    saleId?: string | null
    initialProjectId?: string | null
    projects: Array<{ id: string, name: string }>
}

export default function ShareProjectDocumentsModal({
    isOpen,
    onClose,
    customer,
    saleId,
    initialProjectId,
    projects = []
}: ShareProjectDocumentsModalProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || (projects[0]?.id || ''))
    const [documents, setDocuments] = useState<ProjectDocument[]>([])
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
    const [loadingDocs, setLoadingDocs] = useState(false)
    const [sending, setSending] = useState(false)
    const [copied, setCopied] = useState(false)
    const [customMessage, setCustomMessage] = useState('')
    const [isMessageEdited, setIsMessageEdited] = useState(false)

    // Seçilen proje nesnesi
    const currentProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId)
    }, [projects, selectedProjectId])

    // Modal açıldığında initialProjectId'yi ayarla
    useEffect(() => {
        if (isOpen) {
            const projId = initialProjectId || (projects[0]?.id || '')
            setSelectedProjectId(projId)
            setIsMessageEdited(false)
            setCopied(false)
        }
    }, [isOpen, initialProjectId, projects])

    // Proje değiştiğinde dokümanları çek
    useEffect(() => {
        if (selectedProjectId && isOpen) {
            fetchDocuments(selectedProjectId)
        } else {
            setDocuments([])
            setSelectedDocIds([])
        }
    }, [selectedProjectId, isOpen])

    const fetchDocuments = async (projectId: string) => {
        setLoadingDocs(true)
        setSelectedDocIds([])
        try {
            const res = await getProjectDocumentsForSharing(projectId)
            if (res.error) {
                toast.error(`Dokümanlar alınamadı: ${res.error}`)
                setDocuments([])
            } else {
                const docs = res.documents || []
                setDocuments(docs)
                // Varsayılan olarak tüm dokümanları seç
                setSelectedDocIds(docs.map(d => d.id))
            }
        } catch (err) {
            console.error('Fetch docs error:', err)
            toast.error('Dokümanlar yüklenirken bir hata oluştu.')
        } finally {
            setLoadingDocs(false)
        }
    }

    // Seçilen doküman nesneleri
    const selectedDocuments = useMemo(() => {
        return documents.filter(doc => selectedDocIds.includes(doc.id))
    }, [documents, selectedDocIds])

    // Otomatik WhatsApp Mesajı Oluşturma
    useEffect(() => {
        if (isMessageEdited) return // Kullanıcı elle değiştirdiyse otomatik ezme

        const customerName = customer?.full_name || 'Değerli Müşterimiz'
        const projectName = currentProject?.name || 'Projemiz'
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://novoxcrm.com'

        if (selectedDocuments.length === 0) {
            setCustomMessage(
                `Merhaba Sayın ${customerName},\n\n` +
                `${projectName} projemiz hakkında detaylı bilgi ve dokümanları incelemek için bizimle iletişime geçebilirsiniz.\n\n` +
                `İyi günler dileriz.`
            )
            return
        }

        const docLinksText = selectedDocuments.map(doc => {
            // Kısa yönlendirme linki: /d/encodedUuid veya doğrudan dosya linki
            let shortUrl = `${origin}/d/${encodeUuid(doc.id)}`
            const icon = doc.file_name?.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'
            return `${icon} *${doc.document_name || doc.file_name}*:\n${shortUrl}`
        }).join('\n\n')

        const message = 
            `Merhaba Sayın *${customerName}*,\n\n` +
            `İlgilenmiş olduğunuz *${projectName}* projemize ait doküman ve materyalleri aşağıda bilgilerinize sunuyoruz:\n\n` +
            `${docLinksText}\n\n` +
            `Dokümanları linklere tıklayarak doğrudan inceleyebilir ve indirebilirsiniz. Detaylı sorularınız veya randevu talepleriniz için bu hat üzerinden yanıt verebilirsiniz.\n\n` +
            `İyi günler dileriz.`

        setCustomMessage(message)
    }, [customer, currentProject, selectedDocuments, isMessageEdited])

    const handleToggleDoc = (docId: string) => {
        setSelectedDocIds(prev => {
            if (prev.includes(docId)) {
                return prev.filter(id => id !== docId)
            } else {
                return [...prev, docId]
            }
        })
    }

    const handleSelectAll = () => {
        if (selectedDocIds.length === documents.length) {
            setSelectedDocIds([])
        } else {
            setSelectedDocIds(documents.map(d => d.id))
        }
    }

    // 1. WhatsApp API ile doğrudan gönderim
    const handleSendViaApi = async () => {
        if (!customer?.phone) {
            toast.error('Müşterinin geçerli bir telefon numarası bulunamadı!')
            return
        }
        if (selectedDocuments.length === 0) {
            toast.error('Lütfen paylaşmak için en az bir doküman seçin!')
            return
        }

        setSending(true)
        try {
            const res = await shareProjectDocumentsViaWhatsApp({
                customerId: customer.id,
                customerPhone: customer.phone,
                customerName: customer.full_name,
                saleId: saleId,
                projectId: selectedProjectId,
                projectName: currentProject?.name || 'Proje',
                selectedDocuments: selectedDocuments.map(d => ({
                    id: d.id,
                    document_name: d.document_name || d.file_name,
                    file_url: d.file_url
                })),
                customMessage: customMessage.trim(),
                sendMethod: 'api'
            })

            if (res.error) {
                toast.error(`Gönderim başarısız: ${res.error}`)
            } else {
                toast.success('🎉 WhatsApp bilgilendirme mesajı ve doküman linkleri başarıyla iletildi!')
                onClose()
            }
        } catch (err: any) {
            console.error('Send error:', err)
            toast.error('Gönderim sırasında bir hata oluştu.')
        } finally {
            setSending(false)
        }
    }

    // 2. WhatsApp Web / Uygulama ile Aç (wa.me linki)
    const handleOpenInWhatsApp = async () => {
        if (!customer?.phone) {
            toast.error('Müşterinin telefon numarası bulunamadı!')
            return
        }

        let cleanPhone = customer.phone.replace(/\D/g, '')
        if (cleanPhone.startsWith('0')) cleanPhone = '90' + cleanPhone.substring(1)
        else if (cleanPhone.length === 10) cleanPhone = '90' + cleanPhone

        const encoded = encodeURIComponent(customMessage.trim())
        const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`

        // Aktivite logunu arka planda kaydet
        shareProjectDocumentsViaWhatsApp({
            customerId: customer.id,
            customerPhone: customer.phone,
            customerName: customer.full_name,
            saleId: saleId,
            projectId: selectedProjectId,
            projectName: currentProject?.name || 'Proje',
            selectedDocuments: selectedDocuments.map(d => ({
                id: d.id,
                document_name: d.document_name || d.file_name,
                file_url: d.file_url
            })),
            customMessage: customMessage.trim(),
            sendMethod: 'wame'
        }).catch(e => console.error('Background log error:', e))

        // WhatsApp Web / App'i yeni sekmede aç
        window.open(waUrl, '_blank')
        toast.success('WhatsApp penceresi açıldı ve aktivite CRM\'e kaydedildi.')
        onClose()
    }

    // 3. Panoya Kopyala
    const handleCopyText = () => {
        navigator.clipboard.writeText(customMessage)
        setCopied(true)
        toast.success('Mesaj metni ve doküman linkleri panoya kopyalandı!')
        setTimeout(() => setCopied(false), 2000)
    }

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return ''
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const getFileIcon = (fileName?: string) => {
        const lower = (fileName || '').toLowerCase()
        if (lower.endsWith('.pdf')) return <FileText className="h-4 w-4 text-rose-500" />
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) {
            return <FileImage className="h-4 w-4 text-emerald-500" />
        }
        return <FileCode className="h-4 w-4 text-blue-500" />
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[680px] rounded-3xl p-6 bg-white shadow-2xl border-slate-100 max-h-[92vh] flex flex-col gap-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="gap-2 border-b border-slate-100 pb-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <MessageCircle className="h-5 w-5 fill-emerald-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    WhatsApp ile Proje Dokümanı Paylaş
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                    Müşteriye seçtiğiniz projeye ait katalog, kat planı ve sunumları tek tıkla iletin.
                                </DialogDescription>
                            </div>
                        </div>

                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold px-2.5 py-1">
                            Bilgilendirme Mesajı
                        </Badge>
                    </div>

                    {/* Müşteri Bilgi Kartı */}
                    <div className="mt-2 flex flex-wrap items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <User className="h-4 w-4 text-slate-400" />
                            <span>{customer?.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{customer?.phone || 'Telefon Yok'}</span>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body - Scrollable */}
                <div className="space-y-4 py-4 overflow-y-auto px-1 flex-1">
                    {/* Proje Seçimi */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-blue-600" />
                            Paylaşılacak Projeyi Seçin
                        </Label>
                        <Select value={selectedProjectId} onValueChange={(val) => { setSelectedProjectId(val); setIsMessageEdited(false) }}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-medium text-xs">
                                <SelectValue placeholder="Proje Seçin..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl max-h-64">
                                {projects.map((proj) => (
                                    <SelectItem key={proj.id} value={proj.id} className="text-xs font-medium">
                                        {proj.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Proje Dokümanları Listesi */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-purple-600" />
                                Proje Dokümanları ({documents.length})
                            </Label>
                            {documents.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    {selectedDocIds.length === documents.length ? 'Seçimi Temizle' : 'Tümünü Seç'}
                                </button>
                            )}
                        </div>

                        {loadingDocs ? (
                            <div className="flex items-center justify-center p-6 border border-slate-100 rounded-2xl bg-slate-50/50 text-slate-400 text-xs gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                Dokümanlar yükleniyor...
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="flex items-center gap-2 p-4 border border-amber-100 rounded-2xl bg-amber-50/50 text-amber-800 text-xs">
                                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                                <div>
                                    <span className="font-bold">Bu projeye ait doküman bulunamadı.</span>
                                    <p className="text-[11px] text-amber-700 mt-0.5">
                                        Proje detay sayfasından katalog, kat planı veya sunum yükleyebilirsiniz.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                {documents.map((doc) => {
                                    const isSelected = selectedDocIds.includes(doc.id)
                                    return (
                                        <div
                                            key={doc.id}
                                            onClick={() => handleToggleDoc(doc.id)}
                                            className={`flex items-start gap-2.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-200' 
                                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => handleToggleDoc(doc.id)}
                                                className="mt-0.5 rounded-md data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    {getFileIcon(doc.file_name)}
                                                    <span className="font-bold text-xs text-slate-900 truncate">
                                                        {doc.document_name || doc.file_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                                                    <span>{formatFileSize(doc.file_size)}</span>
                                                    {doc.description && (
                                                        <span className="truncate max-w-[120px] text-slate-400">
                                                            • {doc.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* WhatsApp Mesaj Metni Önizleme */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                WhatsApp Bilgilendirme Mesajı
                            </Label>
                            <span className="text-[10px] text-slate-400">
                                {isMessageEdited ? '✏️ Özelleştirildi' : 'Otomatik Hazırlandı'}
                            </span>
                        </div>
                        <Textarea
                            value={customMessage}
                            onChange={(e) => {
                                setCustomMessage(e.target.value)
                                setIsMessageEdited(true)
                            }}
                            rows={6}
                            className="font-sans text-xs bg-slate-50 border-slate-200 rounded-2xl p-3 leading-relaxed focus:bg-white transition-all"
                            placeholder="WhatsApp mesaj içeriği..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="gap-2 border-t border-slate-100 pt-3 shrink-0 flex-wrap sm:justify-between items-center">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyText}
                        className="rounded-xl border-slate-200 text-xs font-bold gap-1.5 h-9"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Kopyalandı' : 'Metni Kopyala'}
                    </Button>

                    <div className="flex items-center gap-2">
                        {/* WhatsApp Web / App Butonu */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleOpenInWhatsApp}
                            disabled={!customer?.phone}
                            className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 text-xs font-bold gap-1.5 h-9"
                            title="Temsilcinin kendi WhatsApp'ından doğrudan gönderir"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            WhatsApp'ta Aç
                        </Button>

                        {/* WhatsApp Cloud API ile Doğrudan Gönder Butonu */}
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSendViaApi}
                            disabled={sending || !customer?.phone || selectedDocuments.length === 0}
                            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black gap-2 h-9 px-4 shadow-md shadow-emerald-600/20"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Gönderiliyor...
                                </>
                            ) : (
                                <>
                                    <Send className="h-3.5 w-3.5" />
                                    Doğrudan Gönder
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
