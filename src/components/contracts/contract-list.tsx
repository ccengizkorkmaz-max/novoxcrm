'use client'

import { useState } from 'react'
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
import { Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'

interface ContractListProps {
    initialContracts: any[]
}

export function ContractList({ initialContracts }: ContractListProps) {
    const t = useTranslations('Contracts.table')
    const locale = useLocale()
    const [searchTerm, setSearchTerm] = useState('')
    const [contracts, setContracts] = useState(initialContracts)

    const filteredContracts = contracts.filter(c =>
        c.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customers?.some((cust: any) => cust.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('search')}
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('contractNo')}</TableHead>
                            <TableHead>{t('date')}</TableHead>
                            <TableHead>{t('customer')}</TableHead>
                            <TableHead>{t('projectUnit')}</TableHead>
                            <TableHead>{t('amount')}</TableHead>
                            <TableHead>{t('status')}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredContracts.map((contract) => (
                            <TableRow key={contract.id}>
                                <TableCell className="font-medium">{contract.contract_number}</TableCell>
                                <TableCell>{format(new Date(contract.contract_date), 'd MMM yyyy', { locale: locale === 'en' ? enUS : tr })}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        {contract.customers?.map((c: any, i: number) => (
                                            <span key={i} className="text-sm">{c.customer?.full_name}</span>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">{contract.project?.name}</span>
                                    <div className="font-medium">{contract.unit?.block} / {contract.unit?.unit_number}</div>
                                </TableCell>
                                <TableCell>
                                    {new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'tr-TR', { style: 'currency', currency: contract.currency || 'TRY' }).format(contract.total_amount)}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={contract.status} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/contracts/${contract.id}`}>{t('details')}</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const t = useTranslations('Contracts.status')
    const styles: Record<string, string> = {
        'Draft': 'bg-gray-100 text-gray-800',
        'Signed': 'bg-blue-100 text-blue-800',
        'Active': 'bg-green-100 text-green-800',
        'Completed': 'bg-purple-100 text-purple-800',
        'Cancelled': 'bg-red-100 text-red-800',
    }

    return (
        <Badge variant="secondary" className={`font-normal ${styles[status] || 'bg-gray-100'}`}>
            {t(status as any)}
        </Badge>
    )
}
