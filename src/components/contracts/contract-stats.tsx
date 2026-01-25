import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, CreditCard, Home, AlertCircle } from 'lucide-react'

interface ContractStatsProps {
    stats: {
        totalSales: number
        totalPaid: number
        pendingAmount: number
        contractCount: number
    }
}

export function ContractStats({ stats }: ContractStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount)
    }

    const items = [
        {
            title: 'Toplam Satış Bedeli',
            value: formatCurrency(stats.totalSales),
            icon: Wallet,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: 'Tahsil Edilen',
            value: formatCurrency(stats.totalPaid),
            icon: CreditCard,
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            title: 'Bekleyen Ödemeler',
            value: formatCurrency(stats.pendingAmount),
            icon: AlertCircle,
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            title: 'Sözleşme Sayısı',
            value: stats.contractCount.toString(),
            icon: Home,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-4">
            {items.map((item, idx) => (
                <Card key={idx}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                        <div className={`p-2 rounded-md ${item.bg}`}>
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{item.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
