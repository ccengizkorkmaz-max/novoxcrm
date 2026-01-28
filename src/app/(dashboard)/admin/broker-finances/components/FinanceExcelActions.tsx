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

interface FinanceExcelActionsProps {
    summaryData: any[]
}

export default function FinanceExcelActions({ summaryData }: FinanceExcelActionsProps) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    // --- Export Logic ---
    const handleExport = () => {
        const data = summaryData.map(b => ({
            'Broker Adı': b.name,
            'Email': b.email,
            'Seviye': b.level,
            'Hakedilen Toplam (₺)': b.totalEarned,
            'Ödenen Toplam (₺)': b.totalPaid,
            'Bakiye (₺)': b.balance
        }))

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Finans Özeti')

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
                'Broker Email': 'broker@example.com',
                'Ödeme Tutarı': 1000,
                'Ödeme Yöntemi': 'Banka Transferi',
                'Referans No': 'TR...123',
                'Not': 'Opsiyonel açıklama'
            }
        ]
        const worksheet = XLSX.utils.json_to_sheet(templateData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ödeme Şablonu')
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
                toast.success(`${res.processedCount} ödeme başarıyla işlendi. (${res.errorCount} hata)`)
                setOpen(false)
            }
        }

        reader.readAsDataURL(file)
    }

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Dışarı Aktar (Excel)
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-blue-600 text-white hover:bg-blue-700 border-none">
                        <Upload className="h-4 w-4" />
                        Toplu Ödeme Yükle
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excel ile Ödeme Yükle</DialogTitle>
                        <DialogDescription>
                            Birden fazla brokera ait ödeme kayıtlarını Excel dosyası ile toplu olarak yükleyebilirsiniz.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                            <h4 className="text-sm font-bold text-orange-800 flex items-center gap-2 mb-1">
                                <FileSpreadsheet className="h-4 w-4" />
                                Önemli Not
                            </h4>
                            <p className="text-xs text-orange-700">
                                Yüklediğiniz ödeme tutarları, ilgili brokerın en eski hakedişinden (Eligible) başlanarak otomatik olarak eşleştirilir ve durumları "Ödendi" olarak güncellenir.
                            </p>
                        </div>

                        <Button variant="ghost" size="sm" onClick={downloadTemplate} className="w-full justify-start text-blue-600 font-bold p-0 h-auto">
                            <Download className="h-3 w-3 mr-1" /> Ödeme Şablonunu İndir
                        </Button>

                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Excel Dosyası Seçin
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
                                <Loader2 className="h-4 w-4 animate-spin" /> İşleniyor...
                            </div>
                        )}
                        <Button variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
