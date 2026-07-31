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
    ArrowRight,
    Megaphone,
    Flame,
    Zap,
    AlertTriangle,
    Phone,
    MessageSquare,
    Filter,
    Bot,
    ArrowUpDown,
    Target,
    Clock,
    Brain
} from "lucide-react"
import Link from "next/link"
import { getTranslations } from 'next-intl/server'

const reportCards = [
    {
        id: "performance-analytics",
        href: "/reports/performance-analytics",
        icon: Activity,
        color: "text-violet-600",
        bgColor: "bg-violet-100"
    },
    {
        id: "sales",
        href: "/reports/sales",
        icon: Activity,
        color: "text-blue-600",
        bgColor: "bg-blue-100"
    },
    {
        id: "inventory",
        href: "/reports/inventory",
        icon: Building2,
        color: "text-green-600",
        bgColor: "bg-green-100"
    },
    {
        id: "finance",
        href: "/reports/finance",
        icon: DollarSign,
        color: "text-orange-600",
        bgColor: "bg-orange-100"
    },
    {
        id: "loss",
        href: "/reports/loss",
        icon: TrendingDown,
        color: "text-red-600",
        bgColor: "bg-red-100"
    },
    {
        id: "delivery",
        href: "/reports/delivery",
        icon: Calendar,
        color: "text-indigo-600",
        bgColor: "bg-indigo-100"
    },
    {
        id: "activities",
        href: "/reports/activities",
        icon: CalendarCheck,
        color: "text-purple-600",
        bgColor: "bg-purple-100"
    },
    {
        id: "activity-tracking",
        href: "/reports/activity-tracking",
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-100"
    },
    {
        id: "ad-source-analytics",
        href: "/reports/ad-source-analytics",
        icon: Target,
        color: "text-cyan-600",
        bgColor: "bg-cyan-100"
    },
    {
        id: "marketing",
        href: "/reports/marketing",
        icon: Megaphone,
        color: "text-pink-600",
        bgColor: "bg-pink-100"
    },
    {
        id: "hot-leads",
        href: "/reports/hot-leads",
        icon: Flame,
        color: "text-red-500",
        bgColor: "bg-red-50"
    },
    {
        id: "ai-call-performance",
        href: "/reports/ai-call-performance",
        icon: Phone,
        color: "text-blue-600",
        bgColor: "bg-blue-50"
    },
    {
        id: "whatsapp-analytics",
        href: "/reports/whatsapp-analytics",
        icon: MessageSquare,
        color: "text-green-600",
        bgColor: "bg-green-50"
    },
    {
        id: "project-performance",
        href: "/reports/project-performance",
        icon: Building2,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50"
    },
    {
        id: "broker-performance",
        href: "/reports/broker-performance",
        icon: Users,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50"
    },
    {
        id: "lead-funnel",
        href: "/reports/lead-funnel",
        icon: Filter,
        color: "text-purple-600",
        bgColor: "bg-purple-50"
    },
    {
        id: "maya-tracking",
        href: "/reports/maya-tracking",
        icon: Bot,
        color: "text-violet-600",
        bgColor: "bg-violet-50"
    },
    {
        id: "period-comparison",
        href: "/reports/period-comparison",
        icon: ArrowUpDown,
        color: "text-cyan-600",
        bgColor: "bg-cyan-50"
    },
    {
        id: "outreach-ceo",
        href: "/reports/outreach-ceo",
        icon: BarChart3,
        color: "text-indigo-600",
        bgColor: "bg-indigo-100"
    },
    {
        id: "outreach-cost",
        href: "/reports/outreach-cost",
        icon: DollarSign,
        color: "text-purple-600",
        bgColor: "bg-purple-100"
    },
    {
        id: "meta-automation",
        href: "/reports/meta-automation",
        icon: Zap,
        color: "text-amber-600",
        bgColor: "bg-amber-100"
    },
    {
        id: "call-timing",
        href: "/reports/call-timing",
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-50"
    },
    {
        id: "conversation-intelligence",
        href: "/reports/conversation-intelligence",
        icon: Brain,
        color: "text-violet-600",
        bgColor: "bg-violet-50"
    },
    {
        id: "revenue-attribution",
        href: "/reports/revenue-attribution",
        icon: Banknote,
        color: "text-amber-600",
        bgColor: "bg-amber-50"
    },
    {
        id: "self-learning",
        href: "/reports/self-learning",
        icon: Brain,
        color: "text-purple-600",
        bgColor: "bg-purple-50"
    },
    {
        id: "crm-statistics",
        href: "/reports/crm-statistics",
        icon: Users,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50"
    }
]


export default async function ReportsPage() {
    const t = await getTranslations('Reports')

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                <p className="text-muted-foreground mt-2">{t('description')}</p>
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
                                    <CardTitle className="text-xl">{t(`cards.${report.id}.title`)}</CardTitle>
                                    <CardDescription className="mt-1">{t(`cards.${report.id}.description`)}</CardDescription>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="rounded-xl border bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground italic">
                    {t('note')}
                </p>
            </div>
        </div>
    )
}
