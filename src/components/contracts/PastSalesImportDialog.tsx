'use client'

import React, { useState, useTransition } from 'react'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    FileSpreadsheet, 
    Download, 
    Upload, 
    CheckCircle2, 
    AlertTriangle, 
    Loader2, 
    Layers, 
    CreditCard, 
    Coins, 
    Calendar,
    ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { parsePastSalesFromExcel, executePastSalesImport } from '@/app/[locale]/(dashboard)/contracts/import-sales-actions'

export function PastSalesImportDialog() {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [parseResult, setParseResult] = useState<any>(null)
    const [isParsing, startParsing] = useTransition()
    const [isImporting, startImporting] = useTransition()
    const [importSuccess, setImportSuccess] = useState<any>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (!selected) return
        setFile(selected)
        setParseResult(null)
        setImportSuccess(null)

        const formData = new FormData()
        formData.append('file', selected)

        startParsing(async () => {
            const res = await parsePastSalesFromExcel(formData)
            if (res.error) {
                toast.error(res.error)
            } else {
                setParseResult(res)
                toast.success(`${res.validCount} geçerli satış satırı okundu.`)
            }
        })
    }

    const handleExecuteImport = () => {
        if (!parseResult?.data || parseResult.data.length === 0) return

        startImporting(async () => {
            const res = await executePastSalesImport(parseResult.data)
            if (res.error) {
                toast.error(res.error)
            } else {
                setImportSuccess(res)
                toast.success(res.message)
            }
        })
    }

    const handleReset = () => {
        setFile(null)
        setParseResult(null)
        setImportSuccess(null)
    }

    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', { 
            style: 'currency', 
            currency: currency || 'TRY', 
            maximumFractionDigits: 0 
        }).format(amount)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) handleReset()
        }}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold gap-2 rounded-xl shadow-sm"
                >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Excel&apos;den Geçmiş Satış İçe Aktar
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 space-y-6">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-xs">
                            Toplu Satış & Sözleşme Aktarımı
                        </Badge>
                    </div>
                    <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-between">
                        <span>Geçmiş Müşteri & Satış Kayıtlarını İçe Aktar</span>
                    </DialogTitle>
                    <p className="text-xs text-slate-500">
                        Daha önce CRM dışında (Excel vb.) kaydedilmiş peşin veya vadeli tamamlanan satışları, 
                        olmayan müşterileri otomatik oluşturarak ve taksit planlarını üreterek sisteme yükleyin.
                    </p>
                </DialogHeader>

                {/* Step 1: Download Template */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                            <Download className="h-4 w-4 text-indigo-600" />
                            Hazır Excel Şablonunu İndirin
                        </div>
                        <p className="text-[11px] text-indigo-800/80">
                            Örnek peşin/vadeli satış kayıtlarını ve kolon doldurma rehberini içeren resmi şablon.
                        </p>
                    </div>
                    <a 
                        href="/templates/NovoCRM_Gecmis_Satislar_Yukleme_Sablonu.xlsx" 
                        download="NovoCRM_Gecmis_Satislar_Yukleme_Sablonu.xlsx"
                        className="w-full sm:w-auto"
                    >
                        <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-2 shadow-sm text-xs">
                            <Download className="h-3.5 w-3.5" />
                            Şablonu İndir (.xlsx)
                        </Button>
                    </a>
                </div>

                {/* Step 2: Upload Zone */}
                {!importSuccess && (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                            <input 
                                type="file" 
                                accept=".xlsx, .xls" 
                                id="past-sales-upload" 
                                className="hidden" 
                                onChange={handleFileChange}
                                disabled={isParsing || isImporting}
                            />
                            <label htmlFor="past-sales-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                    {isParsing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                                </div>
                                <div className="text-sm font-bold text-slate-800">
                                    {file ? file.name : 'Doldurulmuş Excel Dosyasını Buraya Yükleyin'}
                                </div>
                                <p className="text-xs text-slate-400">
                                    .xlsx veya .xls formatı desteklenir (Tek tıkla otomatik taranır)
                                </p>
                            </label>
                        </div>

                        {/* Pre-flight Parse Summary */}
                        {parseResult && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase">Geçerli Satış</div>
                                        <div className="text-lg font-black text-slate-900">{parseResult.validCount} Adet</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                                        <div className="text-[10px] font-bold text-emerald-700 uppercase">Toplam Ciro</div>
                                        <div className="text-lg font-black text-emerald-700">
                                            {formatCurrency(parseResult.totalRevenue)}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
                                        <div className="text-[10px] font-bold text-blue-700 uppercase">Peşin Satış</div>
                                        <div className="text-lg font-black text-blue-700">{parseResult.cashSalesCount} Adet</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                                        <div className="text-[10px] font-bold text-purple-700 uppercase">Vadeli Satış</div>
                                        <div className="text-lg font-black text-purple-700">{parseResult.installmentSalesCount} Adet</div>
                                    </div>
                                </div>

                                {/* Preview Table */}
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                                    <div className="max-h-[260px] overflow-y-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                                                <tr>
                                                    <th className="p-2.5">Müşteri</th>
                                                    <th className="p-2.5">Telefon</th>
                                                    <th className="p-2.5">Proje & Ünite</th>
                                                    <th className="p-2.5">Tür</th>
                                                    <th className="p-2.5 text-right">Satış Bedeli</th>
                                                    <th className="p-2.5 text-right">Tahsil Edilen</th>
                                                    <th className="p-2.5 text-center">Taksit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {parseResult.data.slice(0, 8).map((row: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="p-2.5 font-bold text-slate-800">{row.fullName}</td>
                                                        <td className="p-2.5 text-slate-500 font-mono">{row.phone}</td>
                                                        <td className="p-2.5 text-slate-700">{row.projectName} - {row.unitNo}</td>
                                                        <td className="p-2.5">
                                                            <Badge variant="outline" className={`text-[10px] ${row.paymentType === 'Peşin' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                                                {row.paymentType}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-2.5 text-right font-black text-slate-900">
                                                            {formatCurrency(row.salePrice, row.currency)}
                                                        </td>
                                                        <td className="p-2.5 text-right font-semibold text-emerald-600">
                                                            {formatCurrency(row.collectedTotal, row.currency)}
                                                        </td>
                                                        <td className="p-2.5 text-center text-slate-600 font-bold">
                                                            {row.installmentCount > 0 ? `${row.installmentCount} Ay` : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {parseResult.data.length > 8 && (
                                        <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 border-t border-slate-100">
                                            + {parseResult.data.length - 8} kayıt daha içe aktarılacak...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Success State */}
                {importSuccess && (
                    <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in zoom-in-95">
                        <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-black text-emerald-950">İçe Aktarma Başarıyla Tamamlandı!</h3>
                        <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                            {importSuccess.message}
                        </p>
                        <div className="pt-2 flex justify-center gap-3">
                            <Button onClick={() => setOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">
                                Sözleşmelere & Nakit Akışına Dön
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="rounded-xl text-xs">
                        Kapat
                    </Button>

                    {!importSuccess && parseResult && (
                        <Button 
                            onClick={handleExecuteImport} 
                            disabled={isImporting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 shadow-md text-xs px-5"
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Kayıtlar Oluşturuluyor...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    {parseResult.validCount} Satışı ve Müşterileri İçeri Aktar
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
