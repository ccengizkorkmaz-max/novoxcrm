import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2, LayoutGrid, CheckCircle, Package } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { getInventoryAnalytics } from "../actions"
import AnalyticsMetricCard from "../components/AnalyticsMetricCard"
import ProjectOccupancyChart from "../components/ProjectOccupancyChart"
import UnitTypeChart from "../components/UnitTypeChart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

export default async function InventoryReportsPage() {
    const data = await getInventoryAnalytics()

    if ('error' in data) {
        return <div className="p-8 text-center text-red-500">Hata: {data.error}</div>
    }

    const { projectStats, typeData, totalUnits, totalSold, totalCurrentValue, availableUnits } = data

    return (
        <div className="flex flex-col gap-6 p-1">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Stok & Proje Analizi</h1>
                        <p className="text-sm text-muted-foreground">Projeler bazında doluluk ve ünite bazlı stok durumu.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AnalyticsMetricCard
                    title="Toplam Ünite"
                    value={totalUnits.toString()}
                    description="Tüm projeler"
                    icon={LayoutGrid}
                    color="text-blue-600"
                />
                <AnalyticsMetricCard
                    title="Satılan Ünite"
                    value={totalSold.toString()}
                    description={`${((totalSold / totalUnits) * 100).toFixed(1)}% Satıldı`}
                    icon={CheckCircle}
                    color="text-green-600"
                />
                <AnalyticsMetricCard
                    title="Mevcut Stok"
                    value={availableUnits.toString()}
                    description="Satışa hazır üniteler"
                    icon={Package}
                    color="text-amber-600"
                />
                <AnalyticsMetricCard
                    title="Portföy Değeri"
                    value={`${(totalCurrentValue).toFixed(1)} M ₺`}
                    description="Toplam piyasa değeri"
                    icon={Building2}
                    color="text-purple-600"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <ProjectOccupancyChart data={projectStats} />
                <UnitTypeChart data={typeData} />
            </div>

            <div className="rounded-xl border bg-card">
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-1">Proje Detayları</h3>
                    <p className="text-sm text-muted-foreground mb-4">Proje bazlı detaylı stok ve doluluk listesi.</p>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Proje Adı</TableHead>
                                <TableHead>Toplam</TableHead>
                                <TableHead>Satılan</TableHead>
                                <TableHead>Rezerve</TableHead>
                                <TableHead>Boş</TableHead>
                                <TableHead className="w-[200px]">Doluluk Oranı</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projectStats.map((p) => (
                                <TableRow key={p.name}>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell>{p.total}</TableCell>
                                    <TableCell>{p.sold}</TableCell>
                                    <TableCell>{p.reserved}</TableCell>
                                    <TableCell>{p.available}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={p.occupancyRate} className="h-2" />
                                            <span className="text-xs font-medium w-10 text-right">
                                                %{p.occupancyRate.toFixed(0)}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
