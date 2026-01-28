'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Gift, Info, Loader2 } from 'lucide-react'
import { updateIncentiveCampaign } from '@/app/broker/actions'
import { toast } from 'sonner'

interface Project {
    id: string
    name: string
}

export default function CampaignEditForm({ projects, campaign }: { projects: Project[], campaign: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)

        const data = {
            project_id: formData.get('project_id') === 'all' ? null : formData.get('project_id') as string,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            type: formData.get('type') as string,
            bonus_value: Number(formData.get('bonus_value')),
            target_count: formData.get('target_count') ? Number(formData.get('target_count')) : undefined,
            start_date: formData.get('start_date') as string || null,
            end_date: formData.get('end_date') as string || null,
        }

        if (!data.name || !data.bonus_value) {
            toast.error('Lütfen zorunlu alanları doldurun.')
            setLoading(false)
            return
        }

        const result = await updateIncentiveCampaign(campaign.id, data)

        if (result.error) {
            toast.error(result.error)
            setLoading(false)
        } else {
            toast.success('Kampanya güncellendi.')
            router.push('/admin/broker-leads/campaigns')
            router.refresh()
        }
    }

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Kampanyayı Düzenle</h1>
                <p className="text-muted-foreground">{campaign.name} kampanyasının detaylarını güncelleyin.</p>
            </div>

            <form action={handleSubmit}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-600" />
                                Temel Bilgiler
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Kampanya Adı *</Label>
                                <Input id="name" name="name" defaultValue={campaign.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Açıklama / Şartlar</Label>
                                <Textarea id="description" name="description" defaultValue={campaign.description} rows={3} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="project_id">Geçerli Proje</Label>
                                    <Select name="project_id" defaultValue={campaign.project_id || 'all'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tüm Projeler" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tüm Projeler</SelectItem>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Kampanya Türü</Label>
                                    <Select name="type" defaultValue={campaign.type}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Unit Sales">Satış Adedi</SelectItem>
                                            <SelectItem value="Volume">Satış Hacmi (₺)</SelectItem>
                                            <SelectItem value="Visits">Ziyaret Adedi</SelectItem>
                                            <SelectItem value="Special">Özel Bonus</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Gift className="h-5 w-5 text-green-600" />
                                Hedef ve Ödül
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="bonus_value">Bonus Tutarı (₺) *</Label>
                                    <Input id="bonus_value" name="bonus_value" type="number" defaultValue={campaign.bonus_value} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="target_count">Hedef Sayı</Label>
                                    <Input id="target_count" name="target_count" type="number" defaultValue={campaign.target_count} />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Başlangıç Tarihi</Label>
                                    <Input id="start_date" name="start_date" type="date" defaultValue={campaign.start_date ? campaign.start_date.split('T')[0] : ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">Bitiş Tarihi</Label>
                                    <Input id="end_date" name="end_date" type="date" defaultValue={campaign.end_date ? campaign.end_date.split('T')[0] : ''} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Vazgeç</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-bold px-8" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Güncelle"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
