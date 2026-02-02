import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Eye, Info, LayoutGrid, PlusCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function BrokerProjectsPage() {
    const supabase = await createClient()

    // Fetch projects - RLS will automatically filter based on:
    // 1. visibility_type = 'public'
    // 2. visibility_type = 'level_restricted' AND broker level meets requirements
    // 3. Manual override exists in project_broker_access
    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
            id,
            name,
            city,
            description,
            image_url,
            visibility_type,
            status
        `)
        .eq('status', 'Active')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projeler & Envanter</h1>
                <p className="text-slate-500 text-sm">Satış yetkiniz olan projeleri ve güncel stok durumlarını inceleyin.</p>
            </div>

            {error ? (
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="pt-6">
                        <p className="text-red-600 text-sm">Projeler yüklenirken bir hata oluştu: {error.message}</p>
                    </CardContent>
                </Card>
            ) : projects && projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {projects.map((project) => (
                        <Card key={project.id} className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow flex flex-col">
                            <div className="h-32 w-full bg-slate-100 relative overflow-hidden shrink-0">
                                {project.image_url ? (
                                    <img
                                        src={project.image_url}
                                        alt={project.name}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Building2 className="h-8 w-8" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <Badge variant={project.visibility_type === 'public' ? 'secondary' : 'default'} className="bg-white/95 backdrop-blur-sm text-[9px] font-bold h-5 px-1.5">
                                        {project.visibility_type === 'public' ? 'GENEL' :
                                            project.visibility_type === 'level_restricted' ? 'SEVİYE' : 'ÖZEL'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-3 flex-1 flex flex-col gap-2">
                                <div>
                                    <h3 className="text-sm font-bold truncate text-slate-900 leading-tight">{project.name}</h3>
                                    <div className="flex items-center gap-1 text-slate-500 text-[10px] mt-0.5">
                                        <MapPin className="h-3 w-3" />
                                        {project.city}
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-1.5 pt-1">
                                    <Link href={`/broker/projects/${project.id}`} className="flex-1">
                                        <Button variant="outline" className="w-full gap-1.5 text-[10px] font-bold h-8 px-2">
                                            <LayoutGrid className="h-3 w-3" />
                                            Envanter
                                        </Button>
                                    </Link>
                                    <Link href={`/broker/leads/new?project_id=${project.id}`}>
                                        <Button className="bg-blue-600 hover:bg-blue-700 h-8 px-2.5">
                                            <PlusCircle className="h-3.5 w-3.5 text-white" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <Building2 className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Henüz Atanmış Proje Yok</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">
                        Şu an için erişim yetkiniz olan bir proje bulunamadı. Lütfen yönetici ile iletişime geçin.
                    </p>
                </div>
            )}
        </div>
    )
}
