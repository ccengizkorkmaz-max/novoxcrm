'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Home, CheckCircle2, Clock, FileText } from "lucide-react"

interface DashboardGeneralStatsProps {
    stats: {
        total: number
        sold: number
        reserved: number
        offers: number
    }
}

export function DashboardGeneralStats({ stats }: DashboardGeneralStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Stok</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">Tüm Üniteler</p>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-600 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Satılan</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.sold}</div>
                    <p className="text-xs text-muted-foreground">Satışı Tamamlanan</p>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Opsiyonlu</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.reserved}</div>
                    <p className="text-xs text-muted-foreground">Rezerve Edilen</p>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-cyan-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Teklif Verilen</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.offers}</div>
                    <p className="text-xs text-muted-foreground">Aktif Teklifler</p>
                </CardContent>
            </Card>
        </div>
    )
}
