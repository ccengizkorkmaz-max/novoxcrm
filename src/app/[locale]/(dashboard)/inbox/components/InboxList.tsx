'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
    Mail,
    Info,
    Calendar,
    Clock,
    User,
    ChevronRight,
    MessageSquareText,
    Search,
    Filter,
    ArrowUpRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'

interface InboxListProps {
    initialEmails: any[]
}

export function InboxList({ initialEmails }: InboxListProps) {
    const t = useTranslations('Sidebar.Inbox')
    const locale = useLocale()
    const [viewingEmail, setViewingEmail] = useState<any | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const filteredEmails = initialEmails.filter(email => {
        const searchLower = searchQuery.toLowerCase()
        return (
            email.customers?.full_name?.toLowerCase().includes(searchLower) ||
            email.description?.toLowerCase().includes(searchLower) ||
            email.id.toLowerCase().includes(searchLower)
        )
    })

    const dateLocale = locale === 'tr' ? tr : enUS

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Ara..."
                        className="pl-9 bg-background shadow-sm border-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Card className="overflow-hidden border-slate-200 shadow-sm">
                <CardContent className="p-0">
                    {filteredEmails.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50">
                            <Mail className="h-10 w-10 mb-3 opacity-20" />
                            <p>{t('empty')}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredEmails.map((email) => (
                                <div
                                    key={email.id}
                                    className="group cursor-pointer hover:bg-slate-50 transition-all duration-150 flex items-center gap-3 py-1 px-4"
                                    onClick={() => setViewingEmail(email)}
                                >
                                    <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />

                                    <div className="w-40 shrink-0">
                                        <h4 className="text-[13px] font-semibold text-slate-900 truncate">
                                            {email.customers?.full_name}
                                        </h4>
                                    </div>

                                    <div className="w-48 shrink-0 hidden sm:block">
                                        <span className="text-[11px] text-blue-600 bg-blue-50/50 px-1.5 py-0 rounded border border-blue-100/50">
                                            {email.customers?.email || 'No email'}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] text-muted-foreground line-clamp-1">
                                            {email.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 ml-2">
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
                                            {format(new Date(email.created_at), 'dd MMM, HH:mm', { locale: dateLocale })}
                                        </span>
                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!viewingEmail} onOpenChange={(open) => !open && setViewingEmail(null)}>
                <DialogContent className="max-w-2xl w-[95vw] rounded-2xl overflow-hidden p-0">
                    <DialogHeader className="p-6 bg-slate-50 border-b">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <Mail className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <DialogTitle className="text-xl font-bold">{t('messageDetails')}</DialogTitle>
                                    <Badge variant="outline" className="bg-white">{email_label_safe(viewingEmail)}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {viewingEmail?.customers?.full_name} &bull; {viewingEmail?.customers?.email}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-6 max-h-[70vh] overflow-auto">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-6 text-sm text-muted-foreground border-b pb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {viewingEmail && format(new Date(viewingEmail.created_at), 'PPP', { locale: dateLocale })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {viewingEmail && format(new Date(viewingEmail.created_at), 'HH:mm', { locale: dateLocale })}
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                    <User className="h-4 w-4" />
                                    {viewingEmail?.customers?.phone || 'No phone'}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
                                <div className="whitespace-pre-wrap font-sans text-base text-slate-700 leading-relaxed">
                                    {viewingEmail?.description || 'No content provided.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setViewingEmail(null)}>
                            Kapat
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" asChild>
                            <a href={`/crm?q=${viewingEmail?.customers?.full_name}`}>
                                Pipeline'da Gör
                                <ArrowUpRight className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function email_label_safe(email: any) {
    if (!email) return ''
    return 'Incoming Lead'
}
