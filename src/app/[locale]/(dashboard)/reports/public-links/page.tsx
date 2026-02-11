import { getPublicLinksReport } from '../../inventory/actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, MousePointerClick, Calendar, User, Link as LinkIcon, ExternalLink, BarChart3, TrendingUp, Users } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function PublicLinksReportPage() {
    const links = await getPublicLinksReport()

    const totalViews = links.reduce((acc, curr) => acc + (curr.views_count || 0), 0)
    const totalLeads = links.reduce((acc, curr) => acc + (curr.leads_count || 0), 0)
    const avgConversion = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : 0

    return (
        <div className="space-y-8 p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <BarChart3 className="h-10 w-10 text-blue-600" />
                        Katalog & Link Takibi
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Paylaşılan katalogların görüntülenme ve talep istatistikleri.</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-w-[140px]">
                        <Eye className="h-5 w-5 text-blue-500 mb-2" />
                        <span className="text-2xl font-black text-slate-900">{totalViews}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Görüntülenme</span>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-w-[140px]">
                        <Users className="h-5 w-5 text-emerald-500 mb-2" />
                        <span className="text-2xl font-black text-slate-900">{totalLeads}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gelen Talepler</span>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-w-[140px]">
                        <TrendingUp className="h-5 w-5 text-purple-500 mb-2" />
                        <span className="text-2xl font-black text-slate-900">%{avgConversion}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dönüşüm Oranı</span>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-800">Aktif Paylaşımlar</CardTitle>
                            <CardDescription className="text-sm">Paylaşılan tüm katalog linkleri ve performansları.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-slate-50/30 border-slate-100">
                                <TableHead className="pl-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Katalog Başlığı</TableHead>
                                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Durum</TableHead>
                                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Görüntülenme</TableHead>
                                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Başvuru</TableHead>
                                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Dönüşüm</TableHead>
                                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Son Görülme</TableHead>
                                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Bitiş Tarihi</TableHead>
                                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {links.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-48 text-center text-slate-400 font-medium">
                                        Henüz bir paylaşım yapılmamış. Envanter sayfasından yeni bir katalog oluşturabilirsiniz.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                links.map((link) => {
                                    const isExpired = link.expires_at && new Date(link.expires_at) < new Date()
                                    const convRate = link.views_count > 0 ? ((link.leads_count / link.views_count) * 100).toFixed(1) : 0

                                    return (
                                        <TableRow key={link.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                                            <TableCell className="pl-8 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                        {link.title || 'İsimsiz Katalog'}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                        <User className="h-3 w-3" />
                                                        {(link.created_by as any)?.full_name || 'Bilinmiyor'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={
                                                    isExpired
                                                        ? "bg-slate-100 text-slate-400 border-none font-bold"
                                                        : "bg-green-100 text-green-600 border-none font-bold"
                                                }>
                                                    {isExpired ? 'Süresi Doldu' : 'Aktif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-black text-sm">
                                                    <Eye className="h-3.5 w-3.5" />
                                                    {link.views_count || 0}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-black text-sm">
                                                    <MousePointerClick className="h-3.5 w-3.5" />
                                                    {link.leads_count || 0}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-sm font-black text-slate-900 tracking-tighter">%{convRate}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {link.last_viewed_at
                                                        ? format(new Date(link.last_viewed_at), 'd MMM HH:mm', { locale: tr })
                                                        : '-'
                                                    }
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {link.expires_at ? format(new Date(link.expires_at), 'd MMMM yyyy', { locale: tr }) : 'Belirtilmedi'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <Button size="icon" variant="ghost" asChild className="h-9 w-9 rounded-full hover:bg-blue-50 hover:text-blue-600">
                                                    <a href={`/p/${link.slug}`} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4.5 w-4.5" />
                                                    </a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl bg-slate-900 text-white overflow-hidden">
                    <CardHeader className="border-b border-white/5">
                        <CardTitle className="text-lg">İstatistik Bilgisi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Bu rapor, müşterilerinize gönderdiğiniz özel envanter kataloglarının performansını gerçek zamanlı olarak izlemenizi sağlar.
                            Hangi kataloğun ne kadar ilgi gördüğünü ve kaç tane "Bilgi Al" talebi oluşturduğunu takip ederek satış stratejinizi optimize edebilirsiniz.
                        </p>
                        <ul className="grid gap-3">
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                En yüksek dönüşüm sağlayan katalogları analiz edin.
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                Brokerların paylaştığı linklerin performansını ölçün.
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                Süresi dolan katalogları güncelleyin.
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 flex flex-col justify-between shadow-2xl shadow-blue-500/20 text-white">
                    <div>
                        <h3 className="text-2xl font-black mb-2">Daha fazla başvuru alın!</h3>
                        <p className="text-blue-100 text-sm leading-relaxed opacity-90">
                            Kataloglarınızı paylaştıktan sonra müşterilerinize "Bilgi Al" butonunu kullanmalarını hatırlatın.
                            Gelen her talep anlık olarak Lead havuzuna düşecek ve size bildirim gönderilecektir.
                        </p>
                    </div>
                    <div className="pt-8">
                        <Link href="/inventory">
                            <Button className="bg-white text-blue-700 hover:bg-blue-50 font-black px-8 py-6 rounded-2xl h-auto shadow-lg shadow-black/10">
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Kataloglarım Sayfasına Git
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
