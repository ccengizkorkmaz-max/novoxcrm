import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    TrendingUp,
    Users,
    Home,
    Package,
    Banknote,
    BarChart3,
    Calendar,
    Settings,
    DollarSign,
    TrendingDown,
    Activity,
    Building2,
    CalendarCheck,
    ArrowRight
} from "lucide-react"
import Link from "next/link"

const reportCards = [
    {
        title: "Satış Performansı",
        description: "Ciro, adet ve pipeline analizi ile satış hedeflerinizi takip edin.",
        href: "/reports/sales",
        icon: Activity,
        color: "text-blue-600",
        bgColor: "bg-blue-100"
    },
    {
        title: "Stok & Proje Analizi",
        description: "Proje bazlı doluluk, kalan üniteler ve tip bazlı stok dağılımı.",
        href: "/reports/inventory",
        icon: Building2,
        color: "text-green-600",
        bgColor: "bg-green-100"
    },
    {
        title: "Finansal Analiz & KDV",
        description: "Nakit akışı ve vergi yükümlülükleri dökümü.",
        href: "/reports/finance",
        icon: DollarSign,
        color: "text-orange-600", // Added color
        bgColor: "bg-orange-100" // Added bgColor
    },
    {
        title: "İptal & Devir Analizi",
        description: "Satış kaybı ve cayma oranları incelemesi.",
        href: "/reports/loss",
        icon: TrendingDown,
        color: "text-red-600", // Added color
        bgColor: "bg-red-100" // Added bgColor
    },
    {
        title: "Teslim Takvimi",
        description: "Ünitelerin aylık teslim projeksiyonu.",
        href: "/reports/delivery",
        icon: Calendar,
        color: "text-indigo-600", // Added color
        bgColor: "bg-indigo-100" // Added bgColor
    },
    {
        title: "Saha & Ekip Verimliliği",
        description: "Ekip bazlı aktivite sayıları, randevu verimliliği ve performans takibi.",
        href: "/reports/activities",
        icon: CalendarCheck,
        color: "text-purple-600",
        bgColor: "bg-purple-100"
    }
]

export default function ReportsPage() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Raporlar & Analiz</h1>
                <p className="text-muted-foreground mt-2">İşletmenizin performansını detaylı raporlar ile analiz edin.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {reportCards.map((report) => (
                    <Link key={report.href} href={report.href}>
                        <Card className="hover:bg-accent/50 transition-colors group cursor-pointer border-2 hover:border-primary/20">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                <div className={`p-3 rounded-2xl ${report.bgColor} ${report.color}`}>
                                    <report.icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-xl">{report.title}</CardTitle>
                                    <CardDescription className="mt-1">{report.description}</CardDescription>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="rounded-xl border bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground italic">
                    Not: Raporlar şu an taslak aşamasındadır. Yakında veri tabanınızdaki canlı verilerle grafiksel olarak güncellenecektir.
                </p>
            </div>
        </div>
    )
}
