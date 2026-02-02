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
import { Plus, MapPin } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export default async function ProjectsPage() {
    const t = await getTranslations('Projects')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Get profile to check tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    // Get projects for this user's tenant
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
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
                    projects.map((project: any) => (
                        <Card key={project.id} className="overflow-hidden">
                            {project.image_url && (
                                <div className="relative h-56 w-full bg-muted/50">
                                    <Image
                                        src={project.image_url}
                                        alt={project.name}
                                        fill
                                        className="object-cover transition-all hover:scale-105"
                                    />
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle>{project.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {project.city || t('card.location')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    {t('card.statusLabel')}: <span className="font-medium text-foreground">
                                        {t(`status.${project.status}`) || project.status}
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Link href={`/projects/${project.id}`} className="w-full">
                                    <Button variant="outline" className="w-full">{t('card.details')}</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
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
