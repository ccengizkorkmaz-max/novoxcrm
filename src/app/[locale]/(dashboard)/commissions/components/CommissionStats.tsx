import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Banknote, Clock, Calendar, TrendingUp } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface CommissionStatsProps {
    stats: {
        totalEarned: number
        pending: number
        thisMonth: number
        count: number
    }
}

export default async function CommissionStats({ stats }: CommissionStatsProps) {
    // We can use translations later, for now hardcoded Turkish or English based on app
    // const t = await getTranslations('Commissions')

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount)
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Toplam Kazanılan
                    </CardTitle>
                    <Banknote className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalEarned)}</div>
                    <p className="text-xs text-muted-foreground">
                        Onaylanan ve ödenen primler
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Bekleyen Tutar
                    </CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.pending)}</div>
                    <p className="text-xs text-muted-foreground">
                        Henüz onaylanmamış
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Bu Ay
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.thisMonth)}</div>
                    <p className="text-xs text-muted-foreground">
                        Bu ay hakedilen
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        İşlem Sayısı
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.count}</div>
                    <p className="text-xs text-muted-foreground">
                        Toplam prim kaydı
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
