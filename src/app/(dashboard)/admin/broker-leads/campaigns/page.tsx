import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Gift,
    PlusCircle,
    Target,
    TrendingUp,
    Building2,
    CheckCircle2,
    XCircle,
    Clock
} from "lucide-react"
import Link from "next/link"
import { getIncentiveCampaigns } from '@/app/broker/actions'
import CampaignActions from "./components/CampaignActions"

export default async function BrokerCampaignsPage() {
    const campaigns = await getIncentiveCampaigns()

    const activeCampaigns = campaigns?.filter(c => c.is_active) || []
    const passiveCampaigns = campaigns?.filter(c => !c.is_active) || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Teşvik & Bonus Kampanyaları</h1>
                    <p className="text-muted-foreground">Broker performansını artıracak aktif ve gelecek kampanyaları yönetin.</p>
                </div>
                <Link href="/admin/broker-leads/campaigns/new">
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <PlusCircle className="h-4 w-4" />
                        Yeni Kampanya Oluştur
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-600 uppercase">Aktif Kampanyalar</p>
                                <p className="text-2xl font-bold">{activeCampaigns.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center text-white">
                                <Target className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-green-600 uppercase">Toplam Dağıtılan</p>
                                <p className="text-2xl font-bold">-- ₺</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-100">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-slate-600 flex items-center justify-center text-white">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-600 uppercase">Geçmiş / Pasif</p>
                                <p className="text-2xl font-bold">{passiveCampaigns.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="active">Aktif Kampanyalar</TabsTrigger>
                    <TabsTrigger value="passive">Geçmiş / Pasifler</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-4">
                    <CampaignsTable campaigns={activeCampaigns} showActions={true} />
                </TabsContent>

                <TabsContent value="passive" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Geçmiş Kampanyalar</CardTitle>
                            <CardDescription>Süresi dolmuş veya sonlandırılmış kampanyalar.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <CampaignsTable campaigns={passiveCampaigns} showActions={false} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function CampaignsTable({ campaigns, showActions }: { campaigns: any[], showActions: boolean }) {
    if (campaigns.length === 0) {
        return (
            <div className="py-12 text-center border rounded-lg bg-slate-50 border-dashed">
                <Gift className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">Bu listede kampanya bulunmuyor.</p>
            </div>
        )
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kampanya Adı</TableHead>
                            <TableHead>Proje</TableHead>
                            <TableHead>Tür / Hedef</TableHead>
                            <TableHead>Bonus Değeri</TableHead>
                            <TableHead>Tarih Aralığı</TableHead>
                            <TableHead>Durum</TableHead>
                            {showActions && <TableHead className="text-right">İşlem</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns.map((campaign) => (
                            <TableRow key={campaign.id} className={!showActions ? "opacity-75 bg-slate-50/50" : ""}>
                                <TableCell className="font-bold">
                                    {campaign.name}
                                    <p className="text-xs font-normal text-muted-foreground line-clamp-1">{campaign.description}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-3 w-3 text-muted-foreground" />
                                        <span>{campaign.projects?.name || 'Tüm Projeler'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded w-fit">{campaign.type}</span>
                                        {campaign.target_count && (
                                            <span className="text-[10px] text-muted-foreground italic">
                                                Hedef: {campaign.target_count} {campaign.type === 'Visits' ? 'Ziyaret' : campaign.type === 'Volume' ? '₺ Hacim' : 'Adet'}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-blue-600">
                                    {campaign.bonus_value.toLocaleString('tr-TR')} ₺
                                </TableCell>
                                <TableCell className="text-xs">
                                    {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('tr-TR') : 'Süresiz'}
                                    -
                                    {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('tr-TR') : 'Süresiz'}
                                </TableCell>
                                <TableCell>
                                    {campaign.is_active ? (
                                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                            <CheckCircle2 className="h-3 w-3" /> Aktif
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                            <XCircle className="h-3 w-3" /> Pasif
                                        </span>
                                    )}
                                </TableCell>
                                {showActions && (
                                    <TableCell className="text-right">
                                        <CampaignActions campaignId={campaign.id} isActive={!!campaign.is_active} />
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
