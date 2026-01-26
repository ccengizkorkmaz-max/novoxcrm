import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, CheckSquare, BarChart3, Users } from "lucide-react"
import Link from "next/link"
import { getActivityAnalytics } from "../actions"
import AnalyticsMetricCard from "../components/AnalyticsMetricCard"
import ActivityTrendChart from "../components/ActivityTrendChart"
import StatusDistributionChart from "../components/StatusDistributionChart"

export default async function ActivitiesReportsPage() {
    const data = await getActivityAnalytics()

    if ('error' in data) {
        return <div className="p-8 text-center text-red-500">Hata: {data.error}</div>
    }

    const { totalActivities, completedActivities, completionRate, pieData, dailyTrend, teamData } = data

    return (
        <div className="flex flex-col gap-6 p-1">
            <div className="flex items-center gap-4">
                <Link href="/reports">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Saha & Ekip Verimliliği</h1>
                    <p className="text-sm text-muted-foreground">Ekip aktivite sayıları ve performans takibi.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AnalyticsMetricCard
                    title="Toplam Aktivite"
                    value={totalActivities.toString()}
                    description="Son 30 gün"
                    icon={Calendar}
                    color="text-blue-600"
                />
                <AnalyticsMetricCard
                    title="Tamamlanan"
                    value={completedActivities.toString()}
                    description="Sonuçlandırılan işler"
                    icon={CheckSquare}
                    color="text-green-600"
                />
                <AnalyticsMetricCard
                    title="Tamamlama Oranı"
                    value={`%${completionRate.toFixed(1)}`}
                    description="Planlanan vs Tamamlanan"
                    icon={BarChart3}
                    color="text-purple-600"
                />
                <AnalyticsMetricCard
                    title="Aktif Personel"
                    value={teamData.length.toString()}
                    description="Saha kaydı olan ekip"
                    icon={Users}
                    color="text-amber-600"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <ActivityTrendChart data={dailyTrend} />
                <StatusDistributionChart data={pieData} />
            </div>

            <div className="rounded-xl border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Ekip Aktivite Liderlik Tablosu</h3>
                <div className="space-y-4">
                    {teamData.map((member: { name: string, count: number }, index: number) => (
                        <div key={member.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                    {index + 1}
                                </div>
                                <span className="font-medium">{member.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground">{member.count} Aktivite</span>
                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: `${(member.count / ((teamData[0] as any)?.count || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
