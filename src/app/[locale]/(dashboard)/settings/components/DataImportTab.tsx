'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerImportDialog } from '@/components/customers/customer-import-dialog'
import { Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function DataImportTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    Veri Yönetimi
                </CardTitle>
                <CardDescription>
                    Sisteme dış kaynaklardan veri aktarımı yapın veya mevcut verileri yönetin.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 border border-slate-100 bg-slate-50/50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:bg-white hover:shadow-sm">
                    <div className="space-y-1 text-center md:text-left">
                        <h4 className="font-black text-slate-900 uppercase tracking-tight">Müşteri Listesi İçe Aktar</h4>
                        <p className="text-sm text-slate-500 font-medium max-w-md">
                            Excel dosyanızdaki müşterileri, iletişim bilgilerini ve notlarını toplu olarak sisteme aktarın.
                        </p>
                    </div>
                    <CustomerImportDialog />
                </div>

                <div className="p-6 border border-amber-100 bg-amber-50/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
                    <div className="space-y-1 text-center md:text-left">
                        <h4 className="font-black text-amber-900 uppercase tracking-tight">Eski Temsilci Atamalarını Temizle</h4>
                        <p className="text-sm text-amber-700/70 font-medium max-w-md">
                            Excel ile içeri aktarılan ve otomatik olarak "Cengiz Korkmaz" üzerine atanan tüm leadlerin atamalarını kaldırır.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl font-bold h-11 px-6 shadow-sm"
                        onClick={async () => {
                            const { cleanupImportedAssignments } = await import('@/app/[locale]/(dashboard)/crm/import-actions')
                            const result = await cleanupImportedAssignments()
                            if (result.success) {
                                toast.success(`${result.count} adet temsilci ataması temizlendi.`)
                            } else {
                                toast.error('Temizleme hatası: ' + (result.error || 'Bilinmeyen hata'))
                            }
                        }}
                    >
                        Atamaları Temizle
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 cursor-not-allowed">
                    <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yakında</p>
                        <p className="text-xs font-bold text-slate-500 mt-1">Stok Listesi Import</p>
                    </div>
                    <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yakında</p>
                        <p className="text-xs font-bold text-slate-500 mt-1">Sözleşme Arşivi Import</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
