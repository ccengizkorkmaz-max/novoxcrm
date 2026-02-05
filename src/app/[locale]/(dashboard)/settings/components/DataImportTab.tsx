'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerImportDialog } from '@/components/customers/customer-import-dialog'
import { Database, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateRepresentativeAssignments } from '../actions/update-representative'

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
                        <h4 className="font-black text-slate-900 uppercase tracking-tight">Proje Üniteleri Yönetimi</h4>
                        <p className="text-sm text-slate-500 font-medium max-w-md">
                            Ünitelerinizi Excel olarak dışa aktarabilir veya şablon üzerinden toplu yükleme yapabilirsiniz.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <a href="/projects">Projelere Git</a>
                    </Button>
                </div>

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
                        <strong className="text-amber-700">Eski Temsilci Atamalarını Temizle</strong>
                        <p className="text-sm text-gray-600 mt-1">
                            Excel ile içeri aktarılan ve otomatik olarak "Burak Kotaman" üzerine atanan tüm leadlerin atamalarını kaldırır.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl font-bold h-11 px-6 shadow-sm"
                        onClick={async () => {
                            try {
                                const { cleanupImportedAssignments } = await import('@/app/[locale]/(dashboard)/crm/import-actions')
                                const result = await cleanupImportedAssignments()

                                console.log('Cleanup result:', result)

                                if (result.success) {
                                    const res = result as { success: boolean, count: number, message?: string }
                                    if (res.count === 0) {
                                        toast.info(res.message || 'Excel Import kaynaklı müşteri bulunamadı.')
                                    } else {
                                        toast.success(`${res.count} adet temsilci ataması temizlendi.`)
                                    }
                                } else {
                                    toast.error('Temizleme hatası: ' + ((result as any).error || 'Bilinmeyen hata'))
                                }
                            } catch (err: any) {
                                console.error('Button onClick error:', err)
                                toast.error('İşlem sırasında hata oluştu: ' + err.message)
                            }
                        }}
                    >
                        Atamaları Temizle
                    </Button>
                </div>

                <div className="p-6 border border-blue-100 bg-blue-50/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
                    <div className="space-y-1 text-center md:text-left">
                        <strong className="text-blue-700">Temsilci Atamalarını Güncelle</strong>
                        <p className="text-sm text-gray-600 mt-1">
                            Cengiz Korkmaz'a atanmış tüm satış kayıtlarını ve aktiviteleri Burak Kotaman'a atar.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl font-bold h-11 px-6 shadow-sm"
                        onClick={async () => {
                            try {
                                const result = await updateRepresentativeAssignments()

                                console.log('Update Rep result:', result)

                                if (result.success) {
                                    toast.success(result.message || 'Atamalar güncellendi.')
                                } else {
                                    toast.error('Güncelleme hatası: ' + (result.error || 'Bilinmeyen hata'))
                                }
                            } catch (err: any) {
                                console.error('Button onClick error:', err)
                                toast.error('İşlem sırasında hata oluştu: ' + err.message)
                            }
                        }}
                    >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Atamaları Güncelle
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
