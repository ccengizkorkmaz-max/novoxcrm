import { Button } from "@/components/ui/button"
import { CreditCard, PieChart, TrendingUp, DollarSign, Wallet, AlertCircle, Clock } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { getFinancialAnalytics } from "../actions"
import AnalyticsMetricCard from "../components/AnalyticsMetricCard"
import CashFlowChart from "../components/CashFlowChart"
import CollectionPieChart from "../components/CollectionPieChart"

export default async function FinanceReportsPage() {
    const data = await getFinancialAnalytics()

    if ('error' in data) {
        return <div className="p-8 text-center text-red-500">Hata: {data.error}</div>
    }

    const { totalCollected, totalPending, totalOverdue, monthlyCashflow, statusData, vatMetrics } = data

    return (
        <div className="flex flex-col gap-6 p-1">
            <div className="flex items-center gap-4">
                <BackButton variant="ghost" size="icon" />
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Finansal Analiz & KDV</h1>
                    <p className="text-sm text-muted-foreground">Tahsilat performansınız ve resmi vergi projeksiyonlarınız.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AnalyticsMetricCard
                    title="Toplam Tahsilat"
                    value={`${(totalCollected / 1000000).toFixed(2)} M ₺`}
                    description="Bugüne kadar ödenenler"
                    icon={Wallet}
                    color="text-green-600"
                />
                <AnalyticsMetricCard
                    title="Tahsil Edilen KDV"
                    value={`${(vatMetrics.totalVat / 1000000).toFixed(2)} M ₺`}
                    description="Ödenen taksitlerin KDV'si"
                    icon={TrendingUp}
                    color="text-blue-600"
                />
                <AnalyticsMetricCard
                    title="Vadesi Geçmiş"
                    value={`${(totalOverdue / 1000000).toFixed(2)} M ₺`}
                    description="Gecikmiş ödemeler"
                    icon={AlertCircle}
                    color="text-red-600"
                />
                <AnalyticsMetricCard
                    title="Bekleyen KDV"
                    value={`${(vatMetrics.pendingVat / 1000000).toFixed(2)} M ₺`}
                    description="Gelecek taksitlerin KDV'si"
                    icon={Clock}
                    color="text-purple-600"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <CashFlowChart data={monthlyCashflow} />
                <CollectionPieChart data={statusData} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-muted/30 p-6">
                    <h3 className="font-semibold mb-2">💡 Finansal Not</h3>
                    <p className="text-sm text-muted-foreground italic">
                        KDV hesaplamaları varsayılan %20 oranına (iç KDV) göre hesaplanmıştır. Taksitli satışlarda her ödeme tarihine göre KDV yükümlülüğünüz oluşmaktadır. Vadesi geçen ödemelerin takibi nakit akışınız için kritiktir.
                    </p>
                </div>
                <div className="rounded-xl border bg-primary/5 p-6 border-primary/20">
                    <h3 className="font-semibold mb-2 text-primary">📈 Tahsilat Oranı</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold">%${((totalCollected / (totalCollected + totalPending)) * 100).toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground pb-1">Genel Performans</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
