import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, MessageSquare, Clock, CheckCircle2 } from "lucide-react"

export default async function PortalServiceRequests() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get customer profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('customer_id, tenant_id')
        .eq('id', user?.id)
        .single()

    // Get requests
    const { data: requests } = await supabase
        .from('service_requests')
        .select('*')
        .eq('customer_id', profile?.customer_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Servis Talepleri</h1>
                    <p className="text-slate-500">Teslimat sonrası teknik destek ve arıza bildirimleriniz.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                            <Plus className="h-4 w-4" />
                            Yeni Talep Oluştur
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form action={async (formData) => {
                            const { createServiceRequest } = await import('./actions')
                            const res = await createServiceRequest(formData)
                            if (res.error) alert(res.error)
                            else {
                                alert('Talebiniz başarıyla oluşturuldu.')
                                window.location.reload() // Close dialog and refresh
                            }
                        }}>
                            <DialogHeader>
                                <DialogTitle>Yeni Destek Talebi</DialogTitle>
                                <DialogDescription>
                                    Lütfen yaşadığınız sorunu detaylıca açıklayın. Teknik ekibimiz en kısa sürede dönüş yapacaktır.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Konu Başlığı</Label>
                                    <Input id="title" name="title" placeholder="Örn: Mutfak dolabı kapak ayarı" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Detaylı Açıklama</Label>
                                    <Textarea id="description" name="description" placeholder="Sorunu buraya yazınız..." rows={4} required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Talebi Gönder</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6">
                {requests?.map((req) => (
                    <Card key={req.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg">{req.title}</CardTitle>
                                    <Badge variant={req.status === 'Resolved' ? 'default' : 'outline'} className={req.status === 'Resolved' ? 'bg-emerald-500 hover:bg-emerald-600' : 'text-blue-600 border-blue-100 bg-blue-50'}>
                                        {req.status === 'Open' ? 'Açık' : req.status === 'In Progress' ? 'İşlemde' : 'Çözüldü'}
                                    </Badge>
                                </div>
                                <CardDescription className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    {new Date(req.created_at).toLocaleDateString('tr-TR')}
                                </CardDescription>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-4">
                                "{req.description}"
                            </p>
                        </CardContent>
                    </Card>
                ))}

                {(!requests || requests.length === 0) && (
                    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed text-slate-400">
                        <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                        <p>Henüz bir destek talebiniz bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
