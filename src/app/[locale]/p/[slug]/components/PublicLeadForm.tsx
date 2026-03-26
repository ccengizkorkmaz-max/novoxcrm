'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, CheckCircle2, User, Phone, Wallet, PenTool, Send, Loader2, Link } from 'lucide-react'
import { submitPublicLead } from '@/app/broker/actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface PublicLeadFormProps {
    brokerId: string
    tenantId: string
    brokerName: string
    projects?: { id: string, name: string }[]
}

export default function PublicLeadForm({ brokerId, tenantId, brokerName, projects = [] }: PublicLeadFormProps) {
    const t = useTranslations('PublicLeadForm')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)

        const res = await submitPublicLead(brokerId, tenantId, formData)

        if (res.error) {
            toast.error(res.error)
            setLoading(false)
        } else {
            setSuccess(true)
            toast.success(t('form.success'))
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <CardContent className="p-12 text-center">
                    <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('form.success')}</h2>
                    <p className="text-slate-500 mb-8">{t('form.successDescription')}</p>
                    <Button onClick={() => window.location.reload()} className="w-full bg-slate-900 hover:bg-slate-800 rounded-2xl h-12 font-bold">
                        {t('form.newApplication')}
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
            <div className="bg-blue-600 p-8 text-white text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 bg-white/10 p-2 rounded-xl" />
                <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
                <p className="text-blue-100 max-w-sm mx-auto">
                    {t('description')}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
                    <User className="h-4 w-4 text-blue-200" />
                    {t('brokerInfo.authorizedBroker')}: <span className="text-white font-bold">{brokerName}</span>
                </div>
            </div>

            <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-slate-700 font-bold">{t('form.nameLabel')}</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input id="full_name" name="full_name" required placeholder={t('form.namePlaceholder')} className="pl-10 h-11 bg-slate-50 border-slate-200" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-700 font-bold">{t('form.phoneLabel')}</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input id="phone" name="phone" type="tel" required placeholder={t('form.phonePlaceholder')} className="pl-10 h-11 bg-slate-50 border-slate-200" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="budget_max" className="text-slate-700 font-bold">{t('form.budgetLabel')}</Label>
                        <div className="relative">
                            <Wallet className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input id="budget_max" name="budget_max" type="number" min="0" placeholder="Örn: 250000" className="pl-10 h-11 bg-slate-50 border-slate-200" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project_id" className="text-slate-700 font-bold">{t('form.projectLabel')}</Label>
                        <Select name="project_id">
                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                                <SelectValue placeholder="İlgilendiğiniz Projeyi Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-slate-700 font-bold">{t('form.noteLabel')}</Label>
                        <div className="relative">
                            <PenTool className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Textarea id="notes" name="notes" placeholder={t('form.notePlaceholder')} className="pl-10 min-h-[100px] bg-slate-50 border-slate-200 resize-none" />
                        </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-12 text-md font-bold bg-blue-600 hover:bg-blue-700 gap-2">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        {loading ? t('form.submitting') : t('form.submit')}
                    </Button>

                    <p className="text-[10px] text-center text-slate-400 px-4">
                        {t('form.privacyPolicy')}
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}
