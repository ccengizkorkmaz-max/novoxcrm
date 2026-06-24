'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, Target, ArrowLeft, Save, Loader2, Phone, Mail, Building2, User } from 'lucide-react'
import { createLead } from '../lead-actions'
import { useRouter } from '@/i18n/routing'
import { toast } from 'sonner'

interface NewLeadFormClientProps {
    teamMembers: { id: string; full_name: string | null; role: string | null }[]
    projects: { id: string; name: string | null }[]
}

export default function NewLeadFormClient({ teamMembers, projects }: NewLeadFormClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        project_id: '',
        source: 'manual',
        assigned_to: '',
        notes: '',
        company_name: '',
        company_phone: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.full_name.trim()) {
            toast.error('Ad Soyad alanı zorunludur.')
            return
        }

        startTransition(async () => {
            const res = await createLead({
                full_name: form.full_name.trim(),
                phone: form.phone.trim() || null,
                email: form.email.trim() || null,
                status: 'new',
                source: form.source.trim() || 'manual',
                project_id: form.project_id || null,
                assigned_to: form.assigned_to || null,
                notes: form.notes.trim() || null,
                company_name: form.company_name.trim() || null,
                company_phone: form.company_phone.trim() || null
            })

            if (res.success) {
                toast.success('Müşteri adayı başarıyla eklendi.')
                router.push('/leads')
            } else {
                toast.error(res.error || 'Aday eklenirken bir hata oluştu.')
            }
        })
    }

    const inputClass = "h-11 bg-white border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-300"
    const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-wide"

    return (
        <div className="max-w-[1200px] mx-auto">
            {/* ═══════ STICKY HEADER ═══════ */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-6">
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/leads')}
                            className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                                <Target className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">
                                    Yeni Müşteri Adayı Ekle
                                </h1>
                                <p className="text-xs text-slate-400 font-medium">
                                    Manuel olarak yeni bir müşteri adayı kaydı oluşturun.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════ FORM ═══════ */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Kişisel Bilgiler */}
                        <Card className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <User className="h-4 w-4" />
                                </div>
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Kişisel & İletişim Bilgileri</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label className={labelClass}>Ad Soyad *</Label>
                                    <Input
                                        value={form.full_name}
                                        onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                                        required
                                        className={inputClass}
                                        placeholder="Ad Soyad yazın..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Telefon</Label>
                                    <Input
                                        value={form.phone}
                                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                        className={inputClass}
                                        placeholder="05XX XXX XX XX"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>E-posta</Label>
                                    <Input
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        type="email"
                                        className={inputClass}
                                        placeholder="ornek@email.com"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Firma Bilgileri */}
                        <Card className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Firma Bilgileri</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Firma Adı</Label>
                                    <Input
                                        value={form.company_name}
                                        onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                                        className={inputClass}
                                        placeholder="Firma adını yazın..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Firma Telefonu</Label>
                                    <Input
                                        value={form.company_phone}
                                        onChange={e => setForm(f => ({ ...f, company_phone: e.target.value }))}
                                        className={inputClass}
                                        placeholder="Firma telefonunu yazın..."
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Notlar & Kaynak */}
                        <Card className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                    <Plus className="h-4 w-4" />
                                </div>
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Ek Bilgiler</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Kaynak</Label>
                                    <Input
                                        value={form.source}
                                        onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                                        className={inputClass}
                                        placeholder="manual, meta_ads, web_form vb."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Notlar</Label>
                                    <Textarea
                                        value={form.notes}
                                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                        className="bg-white border-slate-200 rounded-xl resize-none min-h-[100px] text-sm placeholder:text-slate-300"
                                        placeholder="Aday hakkında ek notlar..."
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column (1/3 width) */}
                    <div className="space-y-6">
                        {/* Atama & İlişkilendirme */}
                        <Card className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <User className="h-4 w-4" />
                                </div>
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Atama & Proje</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Atanan Temsilci</Label>
                                    <Select
                                        value={form.assigned_to || 'none'}
                                        onValueChange={v => setForm(f => ({ ...f, assigned_to: v === 'none' ? '' : v }))}
                                    >
                                        <SelectTrigger className={inputClass}>
                                            <SelectValue placeholder="Temsilci seçin" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="none">Atanmadı</SelectItem>
                                            {teamMembers.map(m => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.full_name}
                                                    {m.role && <span className="text-[10px] text-slate-400 ml-2">({m.role})</span>}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className={labelClass}>İlişkili Proje</Label>
                                    <Select
                                        value={form.project_id || 'none'}
                                        onValueChange={v => setForm(f => ({ ...f, project_id: v === 'none' ? '' : v }))}
                                    >
                                        <SelectTrigger className={inputClass}>
                                            <SelectValue placeholder="Proje seçin" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="none">Proje Yok</SelectItem>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ═══════ STICKY FOOTER ═══════ */}
                <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 py-4 mt-6">
                    <div className="flex items-center justify-between max-w-[1200px] mx-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-slate-400 hover:text-slate-600 text-sm rounded-xl"
                            onClick={() => router.push('/leads')}
                            disabled={isPending}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Vazgeç
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200/60 text-sm px-12"
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                                    <span>Ekleniyor...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    <span>Ekle</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
