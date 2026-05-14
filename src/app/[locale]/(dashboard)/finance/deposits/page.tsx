'use client'

import { useEffect, useState } from 'react'
import { getDeposits, confirmDeposit, cancelDeposit, confirmRefund, deleteDeposit } from '../actions'
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
import { CheckCircle2, Clock, XCircle, Search, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export default function DepositsPage() {
    const t = useTranslations('Deposits')
    const locale = useLocale()
    const [deposits, setDeposits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const checkRole = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                setIsAdmin(data?.role === 'admin' || data?.role === 'owner')
            }
        }
        checkRole()
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

    async function handleDelete(id: string) {
        if (!confirm(t('confirm.delete') || "Kaydı kalıcı olarak silmek istediğinize emin misiniz?")) return

        const result = await deleteDeposit(id)
        if (result.success) {
            toast.success(t('messages.deleted') || "Kayıt başarıyla silindi.")
            loadDeposits()
        } else {
            toast.error(result.error)
        }
    }

    const filteredDeposits = deposits.filter(d => {
        if (!search) return true
        
        // Handle both object and array response from Supabase joins
        const getVal = (obj: any) => Array.isArray(obj) ? obj[0] : obj
        const customer = getVal(d.customer)
        const sale = getVal(d.sale)
        const offer = getVal(d.offer)

        const customerName = customer?.full_name?.toLowerCase() || ''
        const saleUnit = sale?.unit?.unit_number?.toLowerCase() || ''
        const offerUnit = offer?.unit?.unit_number?.toLowerCase() || ''
        const searchLower = search.toLowerCase()

        return customerName.includes(searchLower) || 
               saleUnit.includes(searchLower) || 
               offerUnit.includes(searchLower)
    })

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
                            ) : filteredDeposits.map((d) => {
                                const getVal = (obj: any) => Array.isArray(obj) ? obj[0] : obj
                                const customer = getVal(d.customer)
                                const sale = getVal(d.sale)
                                const offer = getVal(d.offer)

                                return (
                                    <TableRow key={d.id}>
                                        <TableCell className="font-medium">{customer?.full_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {d.sale_id ? t('status.reservation') : t('status.offer')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {sale?.unit?.unit_number || offer?.unit?.unit_number}
                                            <span className="text-xs text-muted-foreground ml-1">
                                                ({sale?.unit?.block || offer?.unit?.block})
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
                                            ) : d.status === 'Cancelled' ? (
                                                <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                                    <XCircle className="h-3 w-3" /> {t('status.cancelled')}
                                                </Badge>
                                            ) : d.status === 'Refund Pending' ? (
                                                <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 flex w-fit items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {t('status.refundPending')}
                                                </Badge>
                                            ) : d.status === 'Refunded' ? (
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 flex w-fit items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> {t('status.refunded')}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 flex w-fit items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {t('status.pending')}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm">
                                                    {format(new Date(d.created_at), 'dd.MM.yyyy HH:mm')}
                                                </span>
                                                {d.status === 'Paid' && d.paid_at && (
                                                    <span className="text-[10px] text-muted-foreground italic">
                                                        {format(new Date(d.paid_at), 'dd.MM.yyyy HH:mm')} {t('info.approvedAt')}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {d.status === 'Pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleCancel(d.id)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            {t('actions.cancel')}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleConfirm(d.id)}
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            {t('actions.approve')}
                                                        </Button>
                                                    </>
                                                )}
                                                {d.status === 'Refund Pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRefundConfirm(d.id)}
                                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                                    >
                                                        {t('actions.approveRefund')}
                                                    </Button>
                                                )}
                                                {isAdmin && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(d.id)}
                                                        className="text-muted-foreground hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
