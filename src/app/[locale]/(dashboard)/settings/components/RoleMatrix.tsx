'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Minus } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function RoleMatrix() {
    const t = useTranslations('Settings.roles')

    const permissions = [
        { key: 'viewAllSales', owner: true, manager: true, sales: false },
        { key: 'manageUsers', owner: true, manager: 'partial', sales: false },
        { key: 'manageSettings', owner: true, manager: false, sales: false },
        { key: 'deleteData', owner: true, manager: false, sales: false },
        { key: 'createSales', owner: true, manager: true, sales: true },
        { key: 'viewReports', owner: true, manager: true, sales: false },
    ]

    const renderCheck = (val: boolean | string) => {
        if (val === true) return <Check className="w-5 h-5 text-green-500 mx-auto" />
        if (val === false) return <X className="w-5 h-5 text-red-300 mx-auto" />
        if (val === 'partial') return <Minus className="w-5 h-5 text-yellow-500 mx-auto" />
        return null
    }

    return (
        <Card className="mt-6 border-dashed">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">{t('matrix.title')}</CardTitle>
                <CardDescription>{t('matrix.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b">
                                <th className="py-3 px-4 text-left font-medium text-slate-500">{t('matrix.permission')}</th>
                                <th className="py-3 px-4 text-center font-medium text-slate-700 w-24">Owner</th>
                                <th className="py-3 px-4 text-center font-medium text-slate-700 w-24">Manager</th>
                                <th className="py-3 px-4 text-center font-medium text-slate-700 w-24">Sales</th>
                            </tr>
                        </thead>
                        <tbody>
                            {permissions.map((p) => (
                                <tr key={p.key} className="border-b last:border-0 hover:bg-slate-50/50">
                                    <td className="py-2.5 px-4 text-slate-600">{t(`permissions.${p.key}`)}</td>
                                    <td className="py-2.5 px-4 text-center">{renderCheck(p.owner)}</td>
                                    <td className="py-2.5 px-4 text-center">{renderCheck(p.manager)}</td>
                                    <td className="py-2.5 px-4 text-center">{renderCheck(p.sales)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500" /> {t('matrix.allowed')}
                    </div>
                    <div className="flex items-center gap-1">
                        <X className="w-3 h-3 text-red-300" /> {t('matrix.denied')}
                    </div>
                    <div className="flex items-center gap-1">
                        <Minus className="w-3 h-3 text-yellow-500" /> {t('matrix.partial')}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
