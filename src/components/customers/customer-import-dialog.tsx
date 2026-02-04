'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Loader2, FileSpreadsheet, Download, Check, AlertTriangle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { parseCustomersFromExcel, bulkCreateCustomers } from '@/app/[locale]/(dashboard)/crm/import-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function CustomerImportDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<{ valid: any[], skipped: number, total: number } | null>(null)
    const [progress, setProgress] = useState<{ current: number, total: number } | null>(null)
    const router = useRouter()

    async function handleParse(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setParsedData(null)
        setProgress(null)

        const formData = new FormData(e.currentTarget)

        try {
            const res = await parseCustomersFromExcel(formData)

            if (res.error) {
                toast.error(res.error)
            } else {
                setParsedData({
                    valid: res.data || [],
                    skipped: res.skipped || 0,
                    total: res.total || 0
                })
            }
        } catch (error) {
            toast.error('Beklenmeyen bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    async function handleConfirmImport() {
        if (!parsedData || parsedData.valid.length === 0) return

        setLoading(true)
        const CHUNK_SIZE = 20
        const total = parsedData.valid.length
        let totalSuccess = 0
        const allErrors: string[] = []

        try {
            for (let i = 0; i < total; i += CHUNK_SIZE) {
                const chunk = parsedData.valid.slice(i, i + CHUNK_SIZE)
                setProgress({ current: i, total })

                const res = await bulkCreateCustomers(chunk)

                if (res.success) {
                    totalSuccess += res.count || 0
                    if (res.messages) allErrors.push(...res.messages)
                } else if (res.error) {
                    allErrors.push(`Grup ${Math.floor(i / CHUNK_SIZE) + 1}: ${res.error}`)
                }
            }

            setProgress({ current: total, total })

            if (allErrors.length > 0) {
                toast.warning(`${totalSuccess} müşteri eklendi, ${allErrors.length} hata oluştu.`, {
                    duration: 6000
                })
                console.log('İçe aktarma detaylı hatalar:', allErrors)
            } else {
                toast.success(`${totalSuccess} müşteri başarıyla içe aktarıldı.`)
            }

            setOpen(false)
            setParsedData(null)
            setSelectedFile(null)
            setProgress(null)
            router.refresh()
        } catch (error) {
            toast.error('İşlem sırasında beklenmeyen bir hata oluştu.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChange = (open: boolean) => {
        setOpen(open)
        if (!open) {
            setParsedData(null)
            setSelectedFile(null)
            setProgress(null)
        }
    }

    async function handleTestImport() {
        if (!parsedData || parsedData.valid.length === 0) return
        setLoading(true)
        try {
            const testBatch = parsedData.valid.slice(20, 23)
            const res = await bulkCreateCustomers(testBatch)

            if (res.success) {
                if (res.messages && res.messages.length > 0 && res.count === 0) {
                    toast.error(`Kayıt oluşturulamadı: ${res.messages[0]}`)
                } else if (res.messages && res.messages.length > 0) {
                    toast.warning(`${res.count} müşteri eklendi, ${res.messages.length} hata oluştu.`)
                } else {
                    toast.success(`Test başarılı! ${res.count} müşteri ve ilgili aktiviteler oluşturuldu.`)
                }
                setOpen(false)
                setParsedData(null)
                setSelectedFile(null)
                router.refresh()
            } else if (res.error) {
                toast.error(res.error)
            }
        } catch (error) {
            toast.error('Test sırasında hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-11 border-blue-100 text-blue-600 hover:bg-blue-50 font-bold shadow-sm rounded-xl">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Müşteri Import (x)
                </Button>
            </DialogTrigger>
            <DialogContent className={`rounded-2xl transition-all duration-300 ${parsedData ? 'sm:max-w-[800px]' : 'sm:max-w-[500px]'}`}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-900">
                        {parsedData ? 'İçe Aktarma Önizleme' : 'Müşteri İçeri Aktar'}
                    </DialogTitle>
                    <DialogDescription>
                        {parsedData ? 'Aşağıdaki verileri kontrol edip onaylayın.' : 'Excel dosyanızdaki müşterileri toplu olarak yükleyin.'}
                    </DialogDescription>
                </DialogHeader>

                {!parsedData ? (
                    <form onSubmit={handleParse}>
                        <div className="grid gap-6 py-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Download className="h-4 w-4 text-blue-500" />
                                    <span>Gereksinimler:</span>
                                </div>
                                <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4 marker:text-blue-400">
                                    <li><strong>Ad Soyad</strong> kolonu zorunludur.</li>
                                    <li><strong>Telefon</strong> kolonu zorunludur. (+905XX..., 05XX... veya 5XX... formatında olabilir)</li>
                                    <li><strong>Email</strong> ve <strong>Kaynak</strong> kolonları opsiyoneldir.</li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="file" className="text-sm font-bold text-slate-700">Excel Dosyası (.xlsx)</Label>
                                <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${selectedFile ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}>
                                    <input
                                        id="file"
                                        name="file"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        required
                                        className="hidden"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                    <Label htmlFor="file" className="cursor-pointer flex flex-col items-center gap-2 w-full h-full">
                                        {selectedFile ? (
                                            <>
                                                <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                                                <span className="text-sm font-bold text-blue-700 text-center break-all">{selectedFile.name}</span>
                                                <span className="text-xs text-blue-400">Değiştirmek için tıklayın</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 text-slate-300" />
                                                <span className="text-sm font-bold text-slate-500">Dosya Seçin</span>
                                                <span className="text-xs text-slate-400">veya sürükleyip bırakın</span>
                                            </>
                                        )}
                                    </Label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="rounded-xl font-bold text-slate-500">
                                Vazgeç
                            </Button>
                            <Button type="submit" disabled={loading || !selectedFile} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Dosyayı Tara
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                                <div className="text-2xl font-black text-green-600">{parsedData.valid.length}</div>
                                <div className="text-xs font-bold text-green-700 uppercase tracking-wide">Geçerli Kayıt</div>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center">
                                <div className="text-2xl font-black text-orange-600">{parsedData.skipped}</div>
                                <div className="text-xs font-bold text-orange-700 uppercase tracking-wide">Atlanan (Hatalı)</div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                                <div className="text-2xl font-black text-slate-600">{parsedData.total}</div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Toplam Satır</div>
                            </div>
                        </div>

                        {progress && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                    <span>İşleniyor...</span>
                                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    />
                                </div>
                                <div className="text-[10px] text-slate-400 text-right font-mono">
                                    {progress.current} / {progress.total}
                                </div>
                            </div>
                        )}

                        {parsedData.skipped > 0 && !progress && (
                            <div className="flex items-center gap-2 p-3 bg-orange-50 text-orange-700 rounded-xl text-xs font-medium border border-orange-100">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span><b>{parsedData.skipped}</b> adet satır geçersiz telefon numarası veya eksik isim nedeniyle içe aktarılmayacak.</span>
                            </div>
                        )}

                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <div className="p-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                İçe Aktarılacak Liste (İlk 100 Kayıt)
                            </div>
                            <ScrollArea className="h-[300px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                            <TableHead className="w-[40px] text-[10px] h-8">#</TableHead>
                                            <TableHead className="text-[10px] h-8">AD SOYAD</TableHead>
                                            <TableHead className="text-[10px] h-8">TELEFON (STANDARDIZE)</TableHead>
                                            <TableHead className="text-[10px] h-8">EMAIL</TableHead>
                                            <TableHead className="text-[10px] h-8">KAYNAK</TableHead>
                                            <TableHead className="text-[10px] h-8">NOTLAR</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.valid.slice(0, 100).map((c, i) => (
                                            <TableRow key={i} className="text-xs hover:bg-slate-50">
                                                <TableCell className="py-2 text-slate-400 font-mono">{i + 1}</TableCell>
                                                <TableCell className="py-2 font-bold text-slate-700">{c.full_name}</TableCell>
                                                <TableCell className="py-2 font-mono text-blue-600">{c.phone}</TableCell>
                                                <TableCell className="py-2 text-slate-500">{c.email || '-'}</TableCell>
                                                <TableCell className="py-2 text-slate-500">
                                                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase">{c.source}</span>
                                                </TableCell>
                                                <TableCell className="py-2 text-slate-500 whitespace-pre-wrap break-words max-w-[300px] text-[10px] leading-tight">{c.notes || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="ghost" onClick={() => setParsedData(null)} className="rounded-xl font-bold text-slate-500" disabled={loading}>
                                Geri Dön
                            </Button>
                            <div className="flex-1" />
                            <Button type="button" variant="outline" onClick={handleTestImport} disabled={loading} className="mr-2 rounded-xl font-bold border-blue-200 text-blue-700 hover:bg-blue-50">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Test (20. Sıradan 3 Kayıt)
                            </Button>
                            <Button type="button" onClick={handleConfirmImport} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-100">
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                {parsedData.valid.length} Müşteriyi Onayla ve Ekle
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
