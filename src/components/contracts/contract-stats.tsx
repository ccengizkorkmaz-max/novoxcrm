import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, CreditCard, Home, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ContractStatsProps {
    stats: {
        totalSales: number
        totalPaid: number
        pendingAmount: number
        contractCount: number
    }
}

export function ContractStats({ stats }: ContractStatsProps) {
    const t = useTranslations('Contracts.stats')
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount)
    }

    const items = [
        {
            title: t('totalSales'),
            value: formatCurrency(stats.totalSales),
            icon: Wallet,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: t('totalPaid'),
            value: formatCurrency(stats.totalPaid),
            icon: CreditCard,
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            title: t('pendingAmount'),
            value: formatCurrency(stats.pendingAmount),
            icon: AlertCircle,
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            title: t('contractCount'),
            value: stats.contractCount.toString(),
            icon: Home,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        }
    ]

    return (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {items.map((item, idx) => (
                <Card key={idx} className="overflow-hidden border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-3 md:p-6">
                        <CardTitle className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-wider">{item.title}</CardTitle>
                        <div className={`p-1.5 md:p-2 rounded-lg ${item.bg}`}>
                            <item.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${item.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                        <div className="text-sm md:text-2xl font-bold tracking-tight">{item.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
