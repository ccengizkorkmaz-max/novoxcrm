'use client'

import React from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Minus } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function RoleMatrix() {
    const t = useTranslations('Settings.roles')

    const permissionGroups = [
        {
            category: 'general',
            items: [
                { key: 'viewDashboard', owner: true, manager: true, sales: true },
                { key: 'viewReports', owner: true, manager: true, sales: false },
                { key: 'viewHR', owner: true, manager: true, sales: false },
            ]
        },
        {
            category: 'crm',
            items: [
                { key: 'viewSales', owner: true, manager: true, sales: 'partial' },
                { key: 'editSales', owner: true, manager: true, sales: 'partial' },
                { key: 'assignLeads', owner: true, manager: true, sales: false },
                { key: 'claimLeads', owner: true, manager: true, sales: true },
            ]
        },
        {
            category: 'inventory',
            items: [
                { key: 'viewInventory', owner: true, manager: true, sales: true },
                { key: 'editPrices', owner: true, manager: false, sales: false },
            ]
        },
        {
            category: 'management',
            items: [
                { key: 'manageUsers', owner: true, manager: false, sales: false },
                { key: 'manageSettings', owner: true, manager: false, sales: false },
                { key: 'exportExcel', owner: true, manager: true, sales: false },
                { key: 'deleteData', owner: true, manager: false, sales: false },
            ]
        }
    ]

    const renderCheck = (val: boolean | string) => {
        if (val === true) return <Check className="w-5 h-5 text-green-500 mx-auto" />
        if (val === false) return <X className="w-5 h-5 text-red-200 mx-auto" />
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
                <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-100 border-b">
                                <th className="py-3 px-4 text-left font-bold text-slate-700 w-[40%]">{t('matrix.permission')}</th>
                                <th className="py-3 px-4 text-center font-bold text-slate-700 w-[20%]">Owner / Admin</th>
                                <th className="py-3 px-4 text-center font-bold text-slate-700 w-[20%]">Manager</th>
                                <th className="py-3 px-4 text-center font-bold text-slate-700 w-[20%]">Sales Rep</th>
                            </tr>
                        </thead>
                        <tbody>
                            {permissionGroups.map((group) => (
                                <React.Fragment key={group.category}>
                                    <tr className="bg-slate-50 border-b">
                                        <td colSpan={4} className="py-2 px-4 font-semibold text-slate-900 text-xs uppercase tracking-wider">
                                            {t(`permissions.categories.${group.category}`)}
                                        </td>
                                    </tr>
                                    {group.items.map((p) => (
                                        <tr key={p.key} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-3 px-4 text-slate-700 font-medium align-top">
                                                {t(`permissions.${p.key}`)}
                                                {/* Show general description if exists */}
                                                {(p.key === 'claimLeads' || p.key === 'viewInventory') && (
                                                    <p className="text-[10px] text-muted-foreground font-normal mt-0.5 leading-tight">
                                                        {t(`permissions.descriptions.${p.key}.allowed`)}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center border-l border-slate-50 align-top">
                                                {renderCheck(p.owner)}
                                            </td>
                                            <td className="py-3 px-4 text-center border-l border-slate-50 align-top">
                                                {renderCheck(p.manager)}
                                            </td>
                                            <td className="py-3 px-4 text-center border-l border-slate-50 align-top">
                                                {renderCheck(p.sales)}
                                                {/* Show explanation for partial permissions */}
                                                {(p.sales === 'partial' || p.key === 'assignLeads') && (
                                                    <p className="text-[9px] text-slate-500 mt-1 font-medium leading-tight px-2">
                                                        {t(`permissions.descriptions.${p.key}.${p.sales === 'partial' ? 'partial' : 'denied'}`)}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex flex-wrap gap-6 text-xs text-muted-foreground bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                            <Check className="w-3 h-3 text-green-500" />
                        </div>
                        <span><strong className="text-green-600">{t('matrix.allowed')}</strong>: Tam Erişim Hakkı</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                            <Minus className="w-3 h-3 text-yellow-500" />
                        </div>
                        <span><strong className="text-yellow-600">{t('matrix.partial')}</strong>: Sadece Kendi Verileri / Kısıtlı</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                            <X className="w-3 h-3 text-red-300" />
                        </div>
                        <span><strong className="text-red-400">{t('matrix.denied')}</strong>: Erişim Yok</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
