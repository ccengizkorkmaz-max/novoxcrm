import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Building2, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getDeliverySchedule } from "../actions"

export default async function DeliveryReportsPage() {
    const data = await getDeliverySchedule()

    if ('error' in data) {
        return <div className="p-8 text-center text-red-500">Hata: {data.error}</div>
    }

    return (
        <div className="flex flex-col gap-6 p-1">
            <div className="flex items-center gap-4">
                <Link href="/reports">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Teslim Takvimi</h1>
                    <p className="text-sm text-muted-foreground">Ünitelerin aylık bazda planlanan teslim projeksiyonu.</p>
                </div>
            </div>

            <div className="space-y-8">
                {data.map((group) => (
                    <div key={group.month} className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold">{group.month}</h2>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {group.count} Ünite
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {group.units.map((unit: any) => (
                                <div key={unit.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 flex items-center justify-center bg-muted rounded-lg">
                                            <Building2 className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-bold">{unit.unit_number}</p>
                                            <p className="text-xs text-muted-foreground">{unit.projects?.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-muted-foreground">Planlanan Teslim</p>
                                        <p className="text-sm">{new Date(unit.delivery_date).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {data.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl">
                        <p className="text-muted-foreground">Henüz teslim tarihi tanımlanmış ünite bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
