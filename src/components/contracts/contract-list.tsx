'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Search, Loader2, Calendar, Building2, Hash, User, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'

interface ContractListProps {
    initialContracts: any[]
}

export function ContractList({ initialContracts: contracts }: ContractListProps) {
    const t = useTranslations('Contracts.table')
    const locale = useLocale()
    const searchParams = useSearchParams()
    const searchTerm = searchParams.get('q') || ''

    return (
        <div className="space-y-4">

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="relative w-full overflow-auto max-h-[calc(100vh-350px)]">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10">{t('contractNo')}</TableHead>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10">{t('date')}</TableHead>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10">{t('customer')}</TableHead>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10">{t('projectUnit')}</TableHead>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10">{t('amount')}</TableHead>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10">{t('status')}</TableHead>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10 text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contracts.length > 0 ? (
                                contracts.map((contract: any) => (
                                    <TableRow key={contract.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-bold text-slate-900">{contract.contract_number}</TableCell>
                                        <TableCell className="text-slate-600">
                                            {format(new Date(contract.contract_date), 'd MMM yyyy', { locale: locale === 'en' ? enUS : tr })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                {contract.customers?.map((c: any, i: number) => (
                                                    <span key={i} className="text-sm font-medium text-slate-800">{c.customer?.full_name}</span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">{contract.project?.name}</span>
                                            <div className="font-bold text-slate-800">{contract.unit?.block} / {contract.unit?.unit_number}</div>
                                        </TableCell>
                                        <TableCell className="font-bold text-blue-600">
                                            {new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'tr-TR', { style: 'currency', currency: contract.currency || 'TRY' }).format(contract.total_amount)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={contract.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold">
                                                <Link href={`/contracts/${contract.id}`}>{t('details')}</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                                        {searchTerm ? t('noResults') : t('empty')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="flex flex-col gap-4 md:hidden">
                {contracts.length > 0 ? (
                    contracts.map((contract: any) => (
                        <div key={contract.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-4 relative overflow-hidden active:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Hash className="h-3.5 w-3.5" />
                                        <span className="font-bold text-[15px]">{contract.contract_number}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span className="text-xs font-medium">
                                            {format(new Date(contract.contract_date), 'd MMM yyyy', { locale: locale === 'en' ? enUS : tr })}
                                        </span>
                                    </div>
                                </div>
                                <StatusBadge status={contract.status} />
                            </div>

                            <div className="grid grid-cols-1 gap-3 border-y border-slate-50 py-3">
                                <div className="flex items-start gap-2">
                                    <User className="h-4 w-4 text-slate-400 mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t('customer')}</span>
                                        <div className="flex flex-col">
                                            {contract.customers?.map((c: any, i: number) => (
                                                <span key={i} className="text-sm font-bold text-slate-800">{c.customer?.full_name}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Building2 className="h-4 w-4 text-slate-400 mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t('projectUnit')}</span>
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">{contract.project?.name}</span>
                                            <span className="font-bold text-slate-800 ml-1">{contract.unit?.block} / {contract.unit?.unit_number}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t('amount')}</span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'tr-TR', { style: 'currency', currency: contract.currency || 'TRY' }).format(contract.total_amount)}
                                    </span>
                                </div>
                                <Button size="sm" asChild className="rounded-lg font-bold bg-slate-900 text-white shadow-sm">
                                    <Link href={`/contracts/${contract.id}`}>
                                        {t('details')}
                                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground">
                        {searchTerm ? t('noResults') : t('empty')}
                    </div>
                )}
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const t = useTranslations('Contracts.status')
    const styles: Record<string, string> = {
        'Draft': 'bg-slate-100 text-slate-700 border-slate-200',
        'Signed': 'bg-blue-50 text-blue-700 border-blue-100',
        'Active': 'bg-emerald-50 text-emerald-700 border-emerald-100',
        'Completed': 'bg-purple-50 text-purple-700 border-purple-100',
        'Cancelled': 'bg-red-50 text-red-700 border-red-100',
    }

    return (
        <Badge variant="outline" className={cn("font-bold text-[10px] px-2.5 py-0.5 uppercase tracking-wider shadow-none transition-colors", styles[status] || 'bg-gray-100')}>
            {t(status as any)}
        </Badge>
    )
}
