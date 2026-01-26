'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, Filter } from 'lucide-react'
import { ActivityTimeline } from '@/components/activities/activity-timeline'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ShieldCheck } from 'lucide-react'

interface CustomerViewProps {
    customer: any
    activities: any[]
    contracts?: any[]
}

const ACTIVITY_TYPES = [
    { id: 'Call', label: 'Telefon' },
    { id: 'Meeting', label: 'Toplantı' },
    { id: 'Site Visit', label: 'Ziyaret' },
    { id: 'Email', label: 'Email' },
    { id: 'Whatsapp', label: 'Whatsapp' },
]

const ACTIVITY_TOPICS = [
    { id: 'General', label: 'Genel' },
    { id: 'Sales', label: 'Satış Görüşmesi' },
    { id: 'Negotiation', label: 'Pazarlık / Teklif' },
    { id: 'Contract', label: 'Sözleşme' },
    { id: 'Support', label: 'Destek' },
    { id: 'After Sales', label: 'Satış Sonrası' },
    { id: 'Collection', label: 'Tahsilat' },
]

export function CustomerView({ customer, activities, contracts = [] }: CustomerViewProps) {
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        )
    }

    const toggleTopic = (topic: string) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        )
    }

    // Filter Logic
    const filteredActivities = activities.filter(a => {
        // Type Filter
        if (selectedTypes.length > 0) {
            if (!selectedTypes.includes(a.type)) return false
        }

        // Topic Filter
        if (selectedTopics.length > 0) {
            const topic = a.topic || 'General'
            if (!selectedTopics.includes(topic)) return false
        }

        return true
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{customer.full_name}</h1>
                <Badge className={contracts.length > 0 ? 'bg-blue-600' : customer.customer_demands?.length ? 'bg-green-600' : ''} variant={contracts.length > 0 || customer.customer_demands?.length ? 'default' : 'secondary'}>
                    {contracts.length > 0 ? 'Müşteri' : customer.customer_demands?.length ? 'Lead' : 'Kontak'}
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Sidebar */}
                <div className="md:col-span-1 space-y-6">
                    {/* Contact Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">İletişim Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{customer.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{customer.email || '-'}</span>
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold block mb-1">Kaynak</span>
                                <span className="text-muted-foreground">{customer.source || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Filters Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <CardTitle className="text-base">Aktivite Filtreleri</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Types */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-foreground">Aktivite Tipi</label>
                                <div className="space-y-2">
                                    {ACTIVITY_TYPES.map(type => (
                                        <div key={type.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`type-${type.id}`}
                                                checked={selectedTypes.includes(type.id)}
                                                onCheckedChange={() => toggleType(type.id)}
                                            />
                                            <Label htmlFor={`type-${type.id}`} className="text-sm font-normal cursor-pointer">
                                                {type.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-border" />

                            {/* Topics */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-foreground">Konular</label>
                                <div className="space-y-2">
                                    {ACTIVITY_TOPICS.map(topic => (
                                        <div key={topic.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`topic-${topic.id}`}
                                                checked={selectedTopics.includes(topic.id)}
                                                onCheckedChange={() => toggleTopic(topic.id)}
                                            />
                                            <Label htmlFor={`topic-${topic.id}`} className="text-sm font-normal cursor-pointer">
                                                {topic.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Portal Access Card */}
                    <Card className="border-blue-100 bg-blue-50/30">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-blue-700">
                                <ShieldCheck className="h-4 w-4" />
                                <CardTitle className="text-base font-bold">Portal Erişimi</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="portal_user" className="text-xs">Kullanıcı Adı</Label>
                                <Input
                                    id="portal_user"
                                    placeholder="Kullanıcı adı..."
                                    defaultValue={customer.portal_username || ''}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="portal_pass" className="text-xs">Şifre</Label>
                                <Input
                                    id="portal_pass"
                                    type="password"
                                    placeholder="Şifre belirleyin..."
                                    defaultValue={customer.portal_password || ''}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <Button
                                className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700"
                                onClick={async () => {
                                    const user = (document.getElementById('portal_user') as HTMLInputElement).value
                                    const pass = (document.getElementById('portal_pass') as HTMLInputElement).value
                                    if (!user || !pass) return alert('Lütfen bilgileri eksiksiz girin.')

                                    const { syncPortalAccess } = await import('@/lib/actions/customer-portal')
                                    const res = await syncPortalAccess(customer.id, user, pass)
                                    if (res.success) alert('Portal erişimi güncellendi!')
                                    else alert('Hata: ' + res.error)
                                }}
                            >
                                Kaydet & Yetkilendir
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Demands */}
                    {customer.customer_demands && customer.customer_demands.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Talep Özeti</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                {customer.customer_demands.map((d: any) => (
                                    <div key={d.id} className="grid gap-1 border-b pb-2 last:border-0 last:pb-0">
                                        <div>Bütçe: {d.min_price} - {d.max_price}</div>
                                        <div>Oda: {d.room_count}</div>
                                        <div>Konum: {d.location_preference}</div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Contracts Section */}
                    {contracts && contracts.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span>Sözleşmeler</span>
                                    <Badge variant="outline">{contracts.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {contracts.map((contract: any) => (
                                        <div key={contract.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-semibold text-sm">{contract.contract_number}</div>
                                                <p className="text-xs text-muted-foreground">
                                                    {contract.project?.name} - {contract.unit?.block} / {contract.unit?.unit_number}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-sm">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: contract.currency || 'TRY' }).format(contract.total_amount)}
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] h-5 mt-1">
                                                    {contract.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <ActivityTimeline activities={filteredActivities} customer={customer} />
                </div>
            </div>
        </div>
    )
}
