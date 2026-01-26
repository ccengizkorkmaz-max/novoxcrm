import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Building2, ExternalLink } from "lucide-react"

export default async function PortalDocuments() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get customer profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('customer_id')
        .eq('id', user?.id)
        .single()

    // Get contracts for documents
    const { data: contracts } = await supabase
        .from('contracts')
        .select(`
            *,
            sales!inner(
                units!inner(
                    unit_number,
                    projects!inner(name)
                )
            )
        `)
        .eq('sales.customer_id', profile?.customer_id)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Belgelerim</h1>
                <p className="text-slate-500">Sözleşme, fatura ve mülkünüze ait diğer evraklara buradan erişebilirsiniz.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {contracts?.map((contract) => (
                    <Card key={contract.id} className="border-none shadow-sm overflow-hidden group">
                        <div className="h-2 bg-blue-600" />
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Satış Sözleşmesi
                            </CardTitle>
                            <CardDescription>
                                {contract.sales.units.projects.name} | No: {contract.sales.units.unit_number}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg flex flex-col gap-1">
                                    <div className="flex justify-between">
                                        <span>Dosya Adı:</span>
                                        <span className="font-medium text-slate-700">Sozlesme_{contract.contract_number}.pdf</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Boyut:</span>
                                        <span className="font-medium text-slate-700">2.4 MB</span>
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full gap-2 text-slate-700 border-slate-200 hover:bg-slate-50 transition-colors">
                                    <Download className="h-4 w-4" />
                                    İndir
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Card className="border-none shadow-sm overflow-hidden group border-dashed border-2 bg-slate-50/50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-slate-400">
                            <Building2 className="h-5 w-5" />
                            Tapu Fotokopisi
                        </CardTitle>
                        <CardDescription>
                            İşlem tamamlandığında buraya eklenecektir.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="opacity-40 pointer-events-none">
                        <Button variant="outline" disabled className="w-full gap-2">
                            <Download className="h-4 w-4" />
                            İndir
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900 text-white border-none p-8 rounded-3xl overflow-hidden relative">
                <div className="relative z-10 space-y-4 max-w-md">
                    <h3 className="text-xl font-bold">Resmi Belgeler ve Faturalar</h3>
                    <p className="text-slate-400 text-sm">
                        E-Fatura süreçleriniz tamamlandığında dijital kopyalara anlık olarak buradan ulaşabileceksiniz.
                    </p>
                    <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Gelir İdaresi Başkanlığı (GİB)
                    </Button>
                </div>
                <FileText className="absolute -right-12 -bottom-12 h-64 w-64 text-white/5 rotate-12" />
            </Card>
        </div>
    )
}
