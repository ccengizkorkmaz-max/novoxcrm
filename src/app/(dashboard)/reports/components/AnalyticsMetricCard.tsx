import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface AnalyticsMetricCardProps {
    title: string
    value: string
    description: string
    icon: LucideIcon
    trend?: {
        value: string
        positive: boolean
    }
    color?: string
}

export default function AnalyticsMetricCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    color = "text-blue-600"
}: AnalyticsMetricCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`p-2 rounded-lg bg-muted/50 ${color}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center gap-2 mt-1">
                    {trend && (
                        <span className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.positive ? '+' : ''}{trend.value}
                        </span>
                    )}
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </CardContent>
        </Card>
    )
}
