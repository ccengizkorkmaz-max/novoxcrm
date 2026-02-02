import { Button } from "@/components/ui/button"
import { UserMinus, Frown, TrendingDown, XCircle, RefreshCcw, AlertTriangle } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { getLossAnalytics } from "../actions"
import AnalyticsMetricCard from "../components/AnalyticsMetricCard"
import LossDistributionChart from "../components/LossDistributionChart"

export default async function LossReportsPage() {
    const data = await getLossAnalytics()

    if ('error' in data) {
        return <div className="p-8 text-center text-red-500">Hata: {data.error}</div>
    }

    const { total, lossRate, distribution, lost, cancelled, transferred } = data

    return (
        <div className="flex flex-col gap-6 p-1">
            <div className="flex items-center gap-4">
                <BackButton variant="ghost" size="icon" />
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">İptal & Devir Analizi</h1>
                    <p className="text-sm text-muted-foreground">Kaybedilen fırsatların ve iptal edilen satışların oranları.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AnalyticsMetricCard
                    title="Toplam Kayıt"
                    value={total.toString()}
                    description="Değerlendirilen tüm adaylar"
                    icon={TrendingDown}
                />
                <AnalyticsMetricCard
                    title="Kayıp Oranı"
                    value={`%${lossRate.toFixed(1)}`}
                    description="Kaçan fırsat yüzdesi"
                    icon={XCircle}
                    color="text-red-600"
                />
                <AnalyticsMetricCard
                    title="İptal Edilen"
                    value={cancelled.toString()}
                    description="Satış sonrası vazgeçen"
                    icon={RefreshCcw}
                    color="text-orange-600"
                />
                <AnalyticsMetricCard
                    title="Devredilen"
                    value={transferred.toString()}
                    description="Hakkını başkasına devreden"
                    icon={RefreshCcw}
                    color="text-blue-600"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <LossDistributionChart data={distribution} />

                <div className="col-span-4 rounded-xl border bg-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Kayıp Analizi Notu</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            • <strong>Kaybedildi (Lost):</strong> Aday aşamasında fiyat veya teknik sebeplerle vazgeçen müşterileri temsil eder.
                        </p>
                        <p>
                            • <strong>İptal Edildi:</strong> Kapora veya sözleşme sonrası cayma hakkını kullanan müşterilerdir; stok yönetimi için kritiktir.
                        </p>
                        <p>
                            • <strong>Devredildi:</strong> Müşterinin kendi hakkını başka bir profile devrettiği (temlik) durumlardır; finansal olarak ciro kaybı değildir ancak müşteri değişimini gösterir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
