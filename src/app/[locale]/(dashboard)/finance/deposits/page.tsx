'use client'

import { useEffect, useState } from 'react'
import { getDeposits, confirmDeposit, cancelDeposit, confirmRefund } from '../actions'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CheckCircle2, Clock, XCircle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useTranslations, useLocale } from 'next-intl'

export default function DepositsPage() {
    const t = useTranslations('Deposits')
    const locale = useLocale()
    const [deposits, setDeposits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        loadDeposits()
    }, [])

    async function loadDeposits() {
        setLoading(true)
        const data = await getDeposits()
        setDeposits(data)
        setLoading(false)
    }

    async function handleConfirm(id: string) {
        if (!confirm(t('confirm.approvePayment'))) return

        const result = await confirmDeposit(id)
        if (result.success) {
            toast.success(t('messages.approved'))
            loadDeposits()
        } else {
            toast.error(result.error)
        }
    }

    async function handleRefundConfirm(id: string) {
        if (!confirm(t('confirm.approveRefund'))) return

        const result = await confirmRefund(id)
        if (result.success) {
            toast.success(t('messages.refunded'))
            loadDeposits()
        } else {
            toast.error(result.error)
        }
    }

    async function handleCancel(id: string) {
        if (!confirm(t('confirm.cancel'))) return

        const result = await cancelDeposit(id)
        if (result.success) {
            toast.success(t('messages.cancelled'))
            loadDeposits()
        } else {
            toast.error(result.error)
        }
    }

    const filteredDeposits = deposits.filter(d =>
        d.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        d.sale?.unit?.unit_number?.toLowerCase().includes(search.toLowerCase()) ||
        d.offer?.unit?.unit_number?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
            </div>

            <div className="flex items-center space-x-2 bg-white p-4 rounded-lg border shadow-sm">
                <Search className="text-muted-foreground h-4 w-4" />
                <Input
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0 max-w-sm"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('cardTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('table.customer')}</TableHead>
                                <TableHead>{t('table.source')}</TableHead>
                                <TableHead>{t('table.unit')}</TableHead>
                                <TableHead>{t('table.amount')}</TableHead>
                                <TableHead>{t('table.status')}</TableHead>
                                <TableHead>{t('table.date')}</TableHead>
                                <TableHead className="text-right">{t('table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">{t('table.loading')}</TableCell>
                                </TableRow>
                            ) : filteredDeposits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{t('table.empty')}</TableCell>
                                </TableRow>
                            ) : filteredDeposits.map((d) => (
                                <TableRow key={d.id}>
                                    <TableCell className="font-medium">{d.customer?.full_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {d.sale_id ? t('status.reservation') : t('status.offer')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {d.sale?.unit?.unit_number || d.offer?.unit?.unit_number}
                                        <span className="text-xs text-muted-foreground ml-1">
                                            ({d.sale?.unit?.block || d.offer?.unit?.block})
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-bold">
                                            {d.amount.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} {d.currency}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {d.status === 'Paid' ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex w-fit items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> {t('status.paid')}
                                            </Badge>
                                        ) : d.status === 'Pending' ? (
                                            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 flex w-fit items-center gap-1">
                                                <Clock className="h-3 w-3" /> {t('status.pending')}
                                            </Badge>
                                        ) : d.status === 'Refund Pending' ? (
                                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 flex w-fit items-center gap-1">
                                                <Clock className="h-3 w-3" /> {t('status.refundPending')}
                                            </Badge>
                                        ) : d.status === 'Refunded' ? (
                                            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 flex w-fit items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> {t('status.refunded')}
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                                <XCircle className="h-3 w-3" /> {t('status.cancelled')}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(d.created_at), 'dd.MM.yyyy HH:mm')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {d.status === 'Pending' && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleCancel(d.id)}
                                                >
                                                    {t('actions.cancel')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleConfirm(d.id)}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    {t('actions.approve')}
                                                </Button>
                                            </div>
                                        )}
                                        {d.status === 'Refund Pending' && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleRefundConfirm(d.id)}
                                                    className="bg-orange-600 hover:bg-orange-700"
                                                >
                                                    {t('actions.approveRefund')}
                                                </Button>
                                            </div>
                                        )}
                                        {d.status === 'Paid' && (
                                            <span className="text-xs text-muted-foreground italic">
                                                {format(new Date(d.paid_at), 'dd.MM.yyyy HH:mm')} {t('info.approvedAt')}
                                            </span>
                                        )}
                                        {d.status === 'Refunded' && (
                                            <span className="text-xs text-muted-foreground italic">
                                                {t('info.refundedAt')}
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
