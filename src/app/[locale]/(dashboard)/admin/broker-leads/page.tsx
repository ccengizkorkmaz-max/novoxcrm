import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Users,
    ArrowRightLeft,
    CheckCircle2,
    XCircle,
    Clock,
    UserPlus,
    Building2,
    Calendar,
    Search,
    Filter,
    MessageCircle
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import BrokerLeadStatusAction from './components/BrokerLeadStatusAction'
import { getWhatsAppLink } from '@/lib/whatsapp'

export default async function AdminBrokerLeadsPage() {
    const supabase = await createClient()

    // Fetch broker leads with broker and project info
    const { data: leads } = await supabase
        .from('broker_leads')
        .select('*, profiles!broker_id(full_name), projects(name)')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Broker Lead Yönetimi</h1>
                    <p className="text-muted-foreground">Brokerlar tarafından gönderilen tüm talepleri buradan yönetin.</p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Broker veya müşteri ara..." className="pl-9" />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtrele
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Müşteri / Tarih</TableHead>
                                <TableHead>Broker / Kanal</TableHead>
                                <TableHead>Proje / Talep</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leads && leads.length > 0 ? (
                                leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell>
                                            <div className="flex items-center justify-between group/cell">
                                                <div>
                                                    <p className="font-bold">{lead.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                                                </div>
                                                <a href={getWhatsAppLink(lead.phone, '')} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                                                        <MessageCircle className="h-4 w-4" />
                                                    </Button>
                                                </a>
                                            </div>
                                            <p className="text-[10px] mt-1 flex items-center gap-1 opacity-70 italic">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(lead.created_at).toLocaleDateString('tr-TR')}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-between group/cell">
                                                <div>
                                                    <p className="font-medium">{lead.profiles?.full_name || 'Bilinmiyor'}</p>
                                                    <p className="text-[10px] uppercase font-bold text-blue-600">Dış Broker</p>
                                                </div>
                                                {lead.profiles?.id && (
                                                    <a href={getWhatsAppLink('', `Merhaba ${lead.profiles.full_name}, yönlendirdiğiniz ${lead.full_name} isimli müşteri hakkında...`)} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                            <MessageCircle className="h-4 w-4" />
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium">{lead.projects?.name || 'Belirtilmedi'}</p>
                                            <p className="text-xs text-muted-foreground">{lead.property_type || '-'} / {lead.purpose || '-'}</p>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${lead.status === 'Contract Signed' ? 'bg-green-100 text-green-700' :
                                                lead.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {lead.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <BrokerLeadStatusAction leadId={lead.id} currentStatus={lead.status} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                        Henüz broker başvurusu bulunmamaktadır.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
