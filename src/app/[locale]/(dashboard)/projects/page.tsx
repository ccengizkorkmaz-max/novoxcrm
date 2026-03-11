import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Link } from '@/i18n/routing'
import { createProject } from './actions'
import { Plus, MapPin, Building2 } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export default async function ProjectsPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const t = await getTranslations('Projects')
    const tc = await getTranslations('Common')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Get profile to check tenant and role
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user?.id)
        .single()

    const isManager = profile?.role === 'manager' || profile?.role === 'admin' || profile?.role === 'owner'

    // Get projects for this user's tenant with unit counts
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*, units(status)')
        .order('created_at', { ascending: false })

    console.log('Projects Page - Debug:', {
        userId: user?.id,
        tenantId: profile?.tenant_id,
        projectsCount: projects?.length,
        error
    })

    async function handleCreateProject(formData: FormData) {
        'use server'
        await createProject(formData)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                {isManager && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> {t('addProject')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{t('createModal.title')}</DialogTitle>
                                <DialogDescription>
                                    {t('createModal.description')}
                                </DialogDescription>
                            </DialogHeader>
                            <form action={handleCreateProject}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">
                                            {t('createModal.nameLabel')}
                                        </Label>
                                        <Input id="name" name="name" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="city" className="text-right">
                                            {t('createModal.cityLabel')}
                                        </Label>
                                        <Input id="city" name="city" className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">{t('createModal.submit')}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
                {error ? (
                    <div className="col-span-full p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <p className="font-medium">{t('error.title')}:</p>
                        <p className="text-sm">{error.message}</p>
                    </div>
                ) : !profile?.tenant_id ? (
                    <div className="col-span-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                        <p className="font-medium">{t('error.tenant')}</p>
                        <p className="text-sm">{t('error.tenantDesc')}</p>
                    </div>
                ) : projects && projects.length > 0 ? (
                    projects.map((project: any) => {
                        const units = project.units || []
                        const totalUnits = units.length
                        const soldUnits = units.filter((u: any) => u.status === 'Sold').length
                        const remainingUnits = units.filter((u: any) => u.status === 'For Sale' || u.status === 'Stock').length

                        return (
                            <Card key={project.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200">
                                {project.image_url ? (
                                    <div className="relative h-56 w-full bg-muted/50">
                                        <Image
                                            src={project.image_url}
                                            alt={project.name}
                                            fill
                                            className="object-contain transition-all group-hover:scale-105"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-56 w-full bg-slate-100 flex items-center justify-center border-b border-slate-100">
                                        <Building2 className="h-16 w-16 text-slate-300" />
                                    </div>
                                )}
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-1.5 font-medium">
                                        <MapPin className="h-3.5 w-3.5 text-blue-500" /> {project.city || t('card.location')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tc('total')}</span>
                                            <span className="text-sm font-black text-slate-700">{totalUnits}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5 border-x border-slate-200">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tc('sold')}</span>
                                            <span className="text-sm font-black text-emerald-600">{soldUnits}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tc('remaining')}</span>
                                            <span className="text-sm font-black text-blue-600">{remainingUnits}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Link href={`/projects/${project.id}`} className="w-full">
                                        <Button variant="outline" className="w-full h-10 border-slate-200 font-bold text-xs uppercase hover:bg-slate-50 transition-all rounded-xl">
                                            {t('card.details')}
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        )
                    })
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/50">
                        <p className="text-muted-foreground mb-4">{t('empty.title')}</p>
                        <Button variant="secondary" disabled>{t('empty.action')}</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
