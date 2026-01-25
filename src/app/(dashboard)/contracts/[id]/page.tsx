import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    FileText,
    CreditCard,
    History,
    FileCheck,
    User,
    Home,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ArrowRightLeft
} from 'lucide-react'
import Link from 'next/link'
import { BackButton } from '@/components/back-button'

import { ContractStatusActions, IndividualPaymentAction, ContractLegalActions } from '@/components/contracts/contract-detail-actions'
import { formatCurrency } from '@/lib/utils'
import { ContractDocumentUpload } from '@/components/contracts/contract-document-upload'
import { uploadContractDocument } from './documents-actions'
import { Download } from 'lucide-react'
import { DeleteDocumentButton } from '@/components/contracts/delete-document-button'

interface ContractPageProps {
    params: Promise<{ id: string }>
}

export default async function ContractDetailPage({ params }: ContractPageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: contract } = await supabase
        .from('contracts')
        .select(`
            *,
            customers: contract_customers(
                customer: customers(full_name, phone, email),
                role,
                share_percentage
            ),
            unit: units(*, projects(name)),
            payments: payment_plans(*),
            documents: contract_documents(*),
            activities: contract_activities(
                *,
                performer: performed_by(full_name)
            )
        `)
        .eq('id', id)
        .single()

    if (!contract) notFound()

    return (
        <div className="flex flex-col gap-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-4">
                    <BackButton href="/contracts" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">{contract.contract_number}</h1>
                            <StatusBadge status={contract.status} />
                        </div>
                        <p className="text-muted-foreground">
                            {contract.unit?.projects?.name} - {contract.unit?.block} / {contract.unit?.unit_number}
                        </p>
                    </div>
                </div>

                {/* Signed Stamp Overlay - Top Right */}
                {contract.status === 'Signed' && (
                    <div className="absolute -top-4 right-0 rotate-12 pointer-events-none z-10">
                        <div className="border-4 border-green-600 rounded-lg px-8 py-4 bg-green-50/90 backdrop-blur-sm shadow-lg">
                            <p className="text-3xl font-bold text-green-600 tracking-wider">İMZALANDI</p>
                        </div>
                    </div>
                )}
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <FileText className="h-4 w-4" /> Yazdır
                    </Button>
                    <ContractStatusActions contractId={contract.id} status={contract.status} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content (Tabs) */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="summary" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="summary" className="gap-2">
                                <FileText className="h-4 w-4" /> Genel Bakış
                            </TabsTrigger>
                            <TabsTrigger value="payments" className="gap-2">
                                <CreditCard className="h-4 w-4" /> Ödeme Planı
                            </TabsTrigger>
                            <TabsTrigger value="history" className="gap-2">
                                <History className="h-4 w-4" /> İşlem Geçmişi
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="summary" className="space-y-6">
                            {/* Financial Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Finansal Özet</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="space-y-1">
                                            <span className="text-sm text-muted-foreground block">Satış Bedeli</span>
                                            <span className="text-xl font-bold">
                                                {formatCurrency(contract.amount, contract.currency)}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-sm text-muted-foreground block">Net Tutar</span>
                                            <span className="text-xl font-bold">
                                                {formatCurrency(contract.final_amount, contract.currency)}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-primary">
                                            <span className="text-sm text-muted-foreground block">Toplam (KDV Dahil)</span>
                                            <span className="text-xl font-bold">
                                                {formatCurrency(contract.total_amount, contract.currency)}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-green-600">
                                            <span className="text-sm text-muted-foreground block">Tahsil Edilen</span>
                                            <span className="text-xl font-bold">
                                                {formatCurrency(calculatePaid(contract.payments), contract.currency)}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="mt-6 space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span>Ödeme İlerlemesi</span>
                                            <span>%{Math.round((calculatePaid(contract.payments) / contract.total_amount) * 100)}</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 transition-all"
                                                style={{ width: `${(calculatePaid(contract.payments) / contract.total_amount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <User className="h-4 w-4" /> Müşteri Bilgileri
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {contract.customers?.map((c: any, i: number) => (
                                            <div key={i} className="flex flex-col border-b pb-2 last:border-0 last:pb-0">
                                                <span className="font-semibold">{c.customer?.full_name}</span>
                                                <span className="text-sm text-muted-foreground">{c.customer?.phone}</span>
                                                <Badge variant="secondary" className="w-fit mt-1 text-[10px]">
                                                    {c.role === 'Primary' ? 'Ana Alıcı' : 'Ortak'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Home className="h-4 w-4" /> Ünite Bilgileri
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Proje:</span>
                                            <span className="font-medium">{contract.unit?.projects?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Blok/No:</span>
                                            <span className="font-medium">{contract.unit?.block} / {contract.unit?.unit_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tip:</span>
                                            <span className="font-medium">{contract.unit?.type}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="payments">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Ödeme Takvimi</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Tür</th>
                                                    <th className="text-left p-3 font-medium">Vade</th>
                                                    <th className="text-right p-3 font-medium">Tutar</th>
                                                    <th className="text-center p-3 font-medium">Durum</th>
                                                    <th className="text-right p-3 font-medium">İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y text-sm">
                                                {contract.payments?.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).map((p: any) => (
                                                    <tr key={p.id} className="hover:bg-slate-50/50">
                                                        <td className="p-3">{translatePaymentType(p.payment_type)}</td>
                                                        <td className="p-3">{format(new Date(p.due_date), 'd MMM yyyy', { locale: tr })}</td>
                                                        <td className="p-3 text-right font-medium">
                                                            {formatCurrency(p.amount, p.currency)}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <PaymentStatusBadge status={p.status} />
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <IndividualPaymentAction
                                                                paymentId={p.id}
                                                                contractId={contract.id}
                                                                status={p.status}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">İşlem Geçmişi</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {contract.activities && contract.activities.length > 0 ? (
                                        <div className="space-y-4">
                                            {contract.activities
                                                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                                .map((activity: any) => (
                                                    <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                                                        <div className="flex-shrink-0 mt-1">
                                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm">{activity.description}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {activity.performer?.full_name || 'Sistem'} • {format(new Date(activity.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                                                                    </p>
                                                                </div>
                                                                {activity.activity_type === 'payment_confirmed' && (
                                                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                                                        Ödeme
                                                                    </Badge>
                                                                )}
                                                                {activity.activity_type === 'document_uploaded' && (
                                                                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                                                                        Belge
                                                                    </Badge>
                                                                )}
                                                                {activity.activity_type === 'document_deleted' && (
                                                                    <Badge variant="outline" className="text-red-600 border-red-600">
                                                                        Silme
                                                                    </Badge>
                                                                )}
                                                                {activity.activity_type === 'status_changed' && (
                                                                    <Badge variant="outline" className="text-purple-600 border-purple-600">
                                                                        Durum
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8">Henüz bir işlem kaydı bulunmamaktadır.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Actions / Legal */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Hukuki / İdari İşlemler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ContractLegalActions contractId={contract.id} status={contract.status} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Belge Arşivi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <ContractDocumentUpload contractId={contract.id} onUpload={uploadContractDocument} />

                            {contract.documents && contract.documents.length > 0 ? (
                                <div className="space-y-2">
                                    {contract.documents.map((doc: any) => (
                                        <div key={doc.id} className="p-3 border rounded flex items-center justify-between text-sm hover:bg-slate-50">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{doc.document_name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    asChild
                                                >
                                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                <DeleteDocumentButton
                                                    documentId={doc.id}
                                                    contractId={contract.id}
                                                    documentName={doc.document_name}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Henüz döküman yüklenmemiş</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        'Draft': 'bg-gray-100 text-gray-800',
        'Signed': 'bg-blue-100 text-blue-800',
        'Active': 'bg-green-100 text-green-800',
        'Completed': 'bg-purple-100 text-purple-800',
        'Cancelled': 'bg-red-100 text-red-800',
    }
    const labels: Record<string, string> = {
        'Draft': 'Taslak',
        'Signed': 'İmzalandı',
        'Active': 'Aktif',
        'Completed': 'Tamamlandı',
        'Cancelled': 'İptal Edildi',
    }
    return (
        <Badge className={`${styles[status] || 'bg-gray-100'} px-3`}>{labels[status] || status}</Badge>
    )
}

function PaymentStatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        'Pending': 'bg-gray-100 text-gray-600',
        'Paid': 'bg-green-100 text-green-700 font-semibold',
        'Overdue': 'bg-red-100 text-red-700',
        'Partial': 'bg-orange-100 text-orange-700',
    }
    const labels: Record<string, string> = {
        'Pending': 'Bekliyor',
        'Paid': 'Ödendi',
        'Overdue': 'Gecikmiş',
        'Partial': 'Kısmi Ödeme',
    }
    return (
        <Badge variant="secondary" className={`${styles[status] || 'bg-gray-100'} text-[10px] h-5`}>
            {labels[status] || status}
        </Badge>
    )
}


function calculatePaid(payments: any[]) {
    return payments?.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0) || 0
}

function translatePaymentType(type: string) {
    const types: Record<string, string> = {
        'DownPayment': 'Peşinat',
        'Installment': 'Taksit',
        'Balloon': 'Ara Ödeme',
        'DeliveryPayment': 'Teslim Ödemesi',
        'Other': 'Diğer'
    }
    return types[type] || type
}
