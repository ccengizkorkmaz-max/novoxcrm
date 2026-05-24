'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Upload,
    Loader2,
    Check,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    FileSpreadsheet,
    Grid
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { importUnitsMapped } from '@/app/[locale]/(dashboard)/projects/[id]/import-actions'

interface ExcelImportProps {
    projectId: string
    onImport?: (formData: FormData) => Promise<any> // Left for backwards compatibility
}

const CRM_FIELDS = [
    { key: 'unit_number', label: 'Ünite Numarası', required: true, aliases: ['ünite no', 'unite no', 'no', 'unit number', 'unit_no', 'ünite_no', 'kapı no', 'daire no', 'kapı numarası', 'daire no.'] },
    { key: 'type', label: 'Oda Tipi (Örn: 2+1)', required: true, aliases: ['oda tipi', 'tip', 'type', 'oda', 'oda_tipi', 'oda sayısı', 'oda sayisi', 'oda ve salon'] },
    { key: 'unit_category', label: 'Kategori (Örn: Konut, Ofis)', required: false, aliases: ['kategori', 'tür', 'tur', 'ünite türü', 'kategori adı', 'unit_category', 'category'] },
    { key: 'block', label: 'Blok', required: false, aliases: ['blok', 'block', 'blok adı', 'blok_adi'] },
    { key: 'floor', label: 'Kat', required: false, aliases: ['kat', 'floor', 'kat no', 'bulunduğu kat', 'kat_no'] },
    { key: 'price', label: 'Fiyat', required: false, aliases: ['fiyat', 'price', 'tutar', 'satış fiyatı', 'satis fiyati', 'birim fiyatı'] },
    { key: 'currency', label: 'Para Birimi', required: false, aliases: ['para birimi', 'currency', 'döviz', 'doviz', 'birim'] },
    { key: 'area_gross', label: 'Brüt Alan (m²)', required: false, aliases: ['brüt m²', 'brüt alan', 'brut alan', 'brüt', 'brut', 'area_gross', 'gross_area', 'brüt alan (m²)', 'brüt m2'] },
    { key: 'area_net', label: 'Net Alan (m²)', required: false, aliases: ['net m²', 'net alan', 'net', 'area_net', 'net_area', 'net alan (m²)', 'net m2'] },
    { key: 'status', label: 'Durum (Örn: Satılık)', required: false, aliases: ['durum', 'status', 'satış durumu', 'satis durumu'] },
    { key: 'direction', label: 'Cephe', required: false, aliases: ['cephe', 'direction', 'yön', 'yon', 'bakı', 'cephe yönü'] }
]

export function ExcelImport({ projectId }: ExcelImportProps) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(1) // 1: Select File, 2: Mapping, 3: Preview
    const [loading, setLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [excelHeaders, setExcelHeaders] = useState<string[] | null>(null)
    const [excelRows, setExcelRows] = useState<any[] | null>(null)
    const [mapping, setMapping] = useState<Record<string, string>>({})
    const fileInputRef = useRef<HTMLInputElement>(null)

    const resetWizard = () => {
        setStep(1)
        setSelectedFile(null)
        setExcelHeaders(null)
        setExcelRows(null)
        setMapping({})
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null
        setSelectedFile(file)
        if (!file) return

        setLoading(true)
        try {
            const bytes = await file.arrayBuffer()
            const workbook = XLSX.read(bytes, { type: 'buffer' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const rows = XLSX.utils.sheet_to_json(worksheet) as any[]

            if (rows.length === 0) {
                toast.error('Seçilen dosya boş veya geçersiz formatta.')
                setLoading(false)
                return
            }

            // Extract headers from first row
            const headers = Object.keys(rows[0])
            setExcelHeaders(headers)
            setExcelRows(rows)

            // Auto mapping based on aliases
            const initialMapping: Record<string, string> = {}
            CRM_FIELDS.forEach(field => {
                const matchedHeader = headers.find(h => {
                    const normalizedHeader = h.trim().toLowerCase()
                    return field.aliases.includes(normalizedHeader)
                })
                initialMapping[field.key] = matchedHeader || ''
            })
            setMapping(initialMapping)
            setStep(2)
        } catch (err) {
            console.error('Excel parse error:', err)
            toast.error('Dosya okunurken bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const handleFieldMappingChange = (fieldKey: string, excelHeader: string) => {
        setMapping(prev => ({
            ...prev,
            [fieldKey]: excelHeader
        }))
    }

    const validateMapping = () => {
        const unmappedRequired = CRM_FIELDS.filter(f => f.required && !mapping[f.key])
        if (unmappedRequired.length > 0) {
            toast.error(`Zorunlu alanları eşleştirmeniz gerekmektedir: ${unmappedRequired.map(f => f.label).join(', ')}`)
            return false
        }
        setStep(3)
        return true
    }

    // Map rows using the selected mapping rules
    const getMappedUnits = (): any[] => {
        if (!excelRows) return []
        return excelRows.map(row => {
            const unit: Record<string, any> = {}
            CRM_FIELDS.forEach(field => {
                const excelHeader = mapping[field.key]
                if (excelHeader) {
                    unit[field.key] = row[excelHeader]
                } else {
                    unit[field.key] = null
                }
            })
            return unit
        })
    }

    const handleImportSubmit = async () => {
        setLoading(true)
        const mappedUnits = getMappedUnits()

        try {
            const result = await importUnitsMapped(projectId, mappedUnits)
            if (result?.success) {
                toast.success(`${result.count || 0} adet ünite başarıyla içe aktarıldı!`)
                setOpen(false)
                resetWizard()
                // Force reload to update list
                window.location.reload()
            } else {
                toast.error(result?.error || 'İçe aktarım başarısız oldu.')
            }
        } catch (err) {
            console.error('Import error:', err)
            toast.error('İçe aktarırken sunucu tarafında bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) resetWizard()
        }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Excel İçe Aktarma Sihirbazı
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[750px] max-h-[85vh] flex flex-col p-6">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <FileSpreadsheet className="h-6 w-6 text-green-600" />
                        Excel Ünite Yükleme Sihirbazı
                    </DialogTitle>
                    <DialogDescription>
                        Excel dosyalarınızdaki farklı sütun başlıklarını sistemdeki ünite alanlarıyla eşleştirerek kolayca yükleyin.
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Indicators */}
                <div className="flex items-center justify-between py-4 border-y my-3 text-sm shrink-0">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 font-bold' : 'text-muted-foreground'}`}>
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step > 1 ? 'bg-green-500 text-white' : 'border border-blue-600'}`}>
                            {step > 1 ? <Check className="h-4 w-4" /> : '1'}
                        </span>
                        Dosya Seçimi
                    </div>
                    <div className="h-[1px] bg-slate-200 flex-1 mx-4" />
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 font-bold' : 'text-muted-foreground'}`}>
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step > 2 ? 'bg-green-500 text-white' : step === 2 ? 'border border-blue-600' : 'border border-slate-300'}`}>
                            {step > 2 ? <Check className="h-4 w-4" /> : '2'}
                        </span>
                        Sütun Eşleştirme
                    </div>
                    <div className="h-[1px] bg-slate-200 flex-1 mx-4" />
                    <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600 font-bold' : 'text-muted-foreground'}`}>
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'border border-blue-600' : 'border border-slate-300'}`}>
                            3
                        </span>
                        Önizleme ve Yükleme
                    </div>
                </div>

                {/* Step Content Area */}
                <div className="flex-1 overflow-y-auto py-2 pr-1 min-h-[250px]">
                    {/* STEP 1: SELECT FILE */}
                    {step === 1 && (
                        <div className="space-y-4 py-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 min-h-[300px]">
                            {loading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                                    <p className="text-sm font-medium text-slate-600">Dosya yükleniyor ve okunuyor...</p>
                                </div>
                            ) : (
                                <>
                                    <FileSpreadsheet className="h-12 w-12 text-slate-400 mb-2" />
                                    <div className="text-center">
                                        <p className="font-bold text-slate-700">Ünite verilerini içeren Excel dosyasını seçin</p>
                                        <p className="text-xs text-muted-foreground mt-1">Desteklenen formatlar: .xlsx, .xls, .csv</p>
                                    </div>
                                    <Input
                                        id="excel-file"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-2"
                                    >
                                        Dosya Seç
                                    </Button>
                                </>
                            )}
                        </div>
                    )}

                    {/* STEP 2: COLUMN MAPPING */}
                    {step === 2 && excelHeaders && (
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                                <div>
                                    <p className="font-semibold">Otomatik Sütun Eşleştirme Tamamlandı</p>
                                    <p className="mt-0.5">Sütun başlıkları benzerlik durumuna göre otomatik eşleştirilmiştir. Lütfen doğruluğunu kontrol edin.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {CRM_FIELDS.map(field => (
                                    <div key={field.key} className="space-y-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor={`field-${field.key}`} className="font-bold text-slate-700 flex items-center gap-1">
                                                {field.label}
                                                {field.required && <span className="text-red-500">*</span>}
                                            </Label>
                                            {mapping[field.key] ? (
                                                <span className="text-[10px] text-green-600 font-bold bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <Check className="h-3 w-3" /> Eşleşti
                                                </span>
                                            ) : field.required ? (
                                                <span className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                                                    Zorunlu
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded-full">
                                                    İsteğe bağlı
                                                </span>
                                            )}
                                        </div>
                                        <select
                                            id={`field-${field.key}`}
                                            value={mapping[field.key]}
                                            onChange={(e) => handleFieldMappingChange(field.key, e.target.value)}
                                            className="flex h-10 w-full mt-2 rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <option value="">-- Eşleştirilmedi --</option>
                                            {excelHeaders.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PREVIEW & IMPORT */}
                    {step === 3 && excelRows && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex justify-between items-center">
                                <div className="flex gap-2">
                                    <Grid className="h-4 w-4 shrink-0 text-blue-600" />
                                    <div>
                                        <p className="font-semibold">Hazır: İçe Aktarılacak Toplam Ünite Sayısı: {excelRows.length}</p>
                                        <p className="mt-0.5">Aşağıda ilk 5 satırın eşleştirilmiş halini görebilirsiniz.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-x-auto max-h-[350px]">
                                <Table className="text-xs">
                                    <TableHeader>
                                        <TableRow>
                                            {CRM_FIELDS.filter(f => mapping[f.key]).map(f => (
                                                <TableHead key={f.key}>{f.label}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {getMappedUnits().slice(0, 5).map((unit, idx) => (
                                            <TableRow key={idx}>
                                                {CRM_FIELDS.filter(f => mapping[f.key]).map(f => (
                                                    <TableCell key={f.key} className="font-medium text-slate-700">
                                                        {unit[f.key] !== null && unit[f.key] !== undefined ? String(unit[f.key]) : '-'}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dialog Footer Actions */}
                <DialogFooter className="shrink-0 border-t pt-4 mt-2 flex justify-between items-center">
                    {step > 1 ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep(prev => prev - 1)}
                            disabled={loading}
                            className="mr-auto"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Geri
                        </Button>
                    ) : (
                        <div className="mr-auto" />
                    )}

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            İptal
                        </Button>

                        {step === 2 && (
                            <Button
                                type="button"
                                onClick={validateMapping}
                                disabled={loading}
                            >
                                Devam Et <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}

                        {step === 3 && (
                            <Button
                                type="button"
                                onClick={handleImportSubmit}
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                İçe Aktarımı Başlat
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
