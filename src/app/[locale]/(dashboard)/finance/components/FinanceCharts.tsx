'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface FinanceChartsProps {
    projectData: { name: string, value: number }[]
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function FinanceCharts({ projectData }: FinanceChartsProps) {
    if (!projectData || projectData.length === 0) {
        return (
            <Card className="col-span-full lg:col-span-2">
                <CardHeader>
                    <CardTitle>Proje Bazlı Tahsilat</CardTitle>
                    <CardDescription>Henüz tahsilat verisi bulunmuyor.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg m-6">
                    <p className="text-muted-foreground italic">Veri bekleniyor...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-full lg:col-span-2 shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="text-lg font-bold">Proje Bazlı Tahsilat Grafiği</CardTitle>
                <CardDescription>Bu ay gerçekleştirilen tahsilatların projelere göre dağılımı.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `₺${value.toLocaleString()}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [`₺${Number(value).toLocaleString()}`, 'Tahsilat']}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {projectData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
