'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CashFlowChartProps {
    data: any[]
}

export default function CashFlowChart({ data }: CashFlowChartProps) {
    return (
        <Card className="col-span-4 h-full">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Nakit Akış Projeksiyonu (6 Ay)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}M`}
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                formatter={(value: any, name: any) => [
                                    `${Number(value).toFixed(2)}M ₺`,
                                    name === 'total' ? 'Toplam Beklenen' : 'Tahsil Edilen'
                                ]}
                            />
                            <Legend verticalAlign="top" align="right" height={36} />
                            <Bar
                                dataKey="total"
                                name="total"
                                fill="#e2e8f0"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                            <Bar
                                dataKey="collected"
                                name="collected"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                                style={{ transform: 'translateX(-40px)' }}
                            // Note: Recharts handles overlap visually if stacked, but here we want side by side effectively
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
