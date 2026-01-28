import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, ChevronLeft, PlusCircle, LayoutGrid, Info } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"
import { BrokerUnitList } from '@/components/broker/BrokerUnitList'
import { BackButton } from '@/components/back-button'

export default async function BrokerProjectDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch Project Details (RLS will check access)
    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (!project) {
        notFound()
    }

    // Fetch Units (Only 'For Sale' for brokers)
    const { data: units } = await supabase
        .from('units')
        .select(`
            id, 
            unit_number, 
            block, 
            floor, 
            type, 
            price, 
            currency, 
            area_gross, 
            area_net, 
            heating_type, 
            parking_type, 
            direction, 
            kitchen_type, 
            has_builtin_kitchen, 
            has_master_bathroom, 
            room_areas, 
            status,
            image_url
        `)
        .eq('project_id', id)
        .eq('status', 'For Sale')
        .order('unit_number', { ascending: true })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <BackButton
                    className="w-fit p-0 h-auto text-xs text-slate-500 hover:text-blue-600 transition-colors bg-transparent hover:bg-transparent"
                    label="Tüm Projelere Dön"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
                            <div className="flex items-center gap-2 text-slate-500 text-sm mt-0.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {project.city}
                                <span className="text-slate-300">|</span>
                                <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 px-1.5 h-auto">
                                    {project.visibility_type}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Link href={`/broker/leads/new?project_id=${project.id}`}>
                        <Button className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-sm font-semibold text-xs h-10 px-6 rounded-xl">
                            <PlusCircle className="h-4 w-4" />
                            Bu Projeye Lead Ekle
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Information Card */}
                <Card className="lg:col-span-1 border-slate-200 shadow-sm">
                    <CardHeader className="pb-4 border-b border-slate-50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-500" />
                            Proje Bilgileri
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {project.image_url && (
                            <img
                                src={project.image_url}
                                alt={project.name}
                                className="w-full aspect-video object-cover"
                            />
                        )}
                        <div className="p-4 space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Açıklama</p>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {project.description || 'Bu proje için henüz bir açıklama girilmemiş.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Ada No</p>
                                    <p className="text-sm font-bold text-slate-700">{project.ada_no || '-'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Parsel No</p>
                                    <p className="text-sm font-bold text-slate-700">{project.parsel_no || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Inventory Card */}
                <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader className="pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4 text-blue-500" />
                                Güncel Envanter
                            </CardTitle>
                            <CardDescription className="text-xs">Satışa uygun ünitelerin listesi. Detay için satıra tıklayın.</CardDescription>
                        </div>
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 font-bold">
                            {units?.length || 0} Ünite Satışta
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <BrokerUnitList units={(units || []) as any} projectId={project.id} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
