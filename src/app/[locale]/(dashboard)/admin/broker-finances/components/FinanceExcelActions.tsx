'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Download, Upload, Loader2, FileSpreadsheet } from "lucide-react"
import * as XLSX from 'xlsx'
import { processBulkPaymentImport } from '@/app/broker/finance-actions'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useTranslations } from 'next-intl'

interface FinanceExcelActionsProps {
    summaryData: any[]
}

export default function FinanceExcelActions({ summaryData }: FinanceExcelActionsProps) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const t = useTranslations('BrokerFinances')

    // --- Export Logic ---
    const handleExport = () => {
        const data = summaryData.map(b => {
            const row: any = {}
            row[t('excel.headers.brokerName')] = b.name
            row[t('excel.headers.email')] = b.email
            row[t('excel.headers.level')] = b.level || 'Standart'
            row[t('excel.headers.totalEarned')] = b.totalEarned
            row[t('excel.headers.totalPaid')] = b.totalPaid
            row[t('excel.headers.balance')] = b.balance
            return row
        })

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, t('excel.sheetNames.financeSummary'))

        // Auto-size columns
        const maxWidths = data.reduce((acc: any, row: any) => {
            Object.keys(row).forEach((key, i) => {
                const val = (row[key] || '').toString().length
                acc[i] = Math.max(acc[i] || 10, val + 2)
            })
            return acc
        }, [])
        worksheet['!cols'] = maxWidths.map((w: number) => ({ wch: w }))

        XLSX.writeFile(workbook, `Broker_Finans_Ozeti_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    // --- Template Download ---
    const downloadTemplate = () => {
        const templateData = [
            {
                [t('excel.headers.email')]: 'broker@example.com',
                [t('excel.headers.paymentAmount')]: 1000,
                [t('excel.headers.paymentMethod')]: 'Banka Transferi',
                [t('excel.headers.referenceNo')]: 'TR...123',
                [t('excel.headers.note')]: 'Opsiyonel açıklama'
            }
        ]
        const worksheet = XLSX.utils.json_to_sheet(templateData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, t('excel.sheetNames.paymentTemplate'))
        XLSX.writeFile(workbook, 'Broker_Odeme_Yukleme_Sablonu.xlsx')
    }

    // --- Import Logic ---
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        const reader = new FileReader()

        reader.onload = async (event) => {
            const base64 = (event.target?.result as string).split(',')[1]
            const res = await processBulkPaymentImport(base64)

            setLoading(false)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(t('excel.importSuccess', { processedCount: res.processedCount ?? 0, errorCount: res.errorCount ?? 0 }))
                setOpen(false)
            }
        }

        reader.readAsDataURL(file)
    }

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                {t('excel.export')}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-blue-600 text-white hover:bg-blue-700 border-none">
                        <Upload className="h-4 w-4" />
                        {t('excel.bulkImport')}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('excel.dialogTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('excel.dialogDesc')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                            <h4 className="text-sm font-bold text-orange-800 flex items-center gap-2 mb-1">
                                <FileSpreadsheet className="h-4 w-4" />
                                {t('excel.note')}
                            </h4>
                            <p className="text-xs text-orange-700">
                                {t('excel.noteDesc')}
                            </p>
                        </div>

                        <Button variant="ghost" size="sm" onClick={downloadTemplate} className="w-full justify-start text-blue-600 font-bold p-0 h-auto">
                            <Download className="h-3 w-3 mr-1" /> {t('excel.downloadTemplate')}
                        </Button>

                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t('excel.selectFile')}
                            </label>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleImport}
                                disabled={loading}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        {loading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> {t('excel.processing')}
                            </div>
                        )}
                        <Button variant="ghost" onClick={() => setOpen(false)}>{t('recordPayment.cancel')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
