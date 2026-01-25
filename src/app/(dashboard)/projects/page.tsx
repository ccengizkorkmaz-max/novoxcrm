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
import Link from 'next/link'
import { createProject } from './actions'
import { Plus, MapPin } from 'lucide-react'
import Image from 'next/image'

export default async function ProjectsPage() {
    const supabase = await createClient()

    // Get projects for this user's tenant
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

    const statusMap: Record<string, string> = {
        'Active': 'Satışa AÇIK',
        'Planned': 'Planlanıyor',
        'Completed': 'KAPALI'
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Projeler</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Yeni Proje Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Yeni Proje Oluştur</DialogTitle>
                            <DialogDescription>
                                Projenize bir isim verin ve konumunu belirtin.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            "use server"
                            await createProject(formData)
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Proje Adı
                                    </Label>
                                    <Input id="name" name="name" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="city" className="text-right">
                                        Şehir
                                    </Label>
                                    <Input id="city" name="city" className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Kaydet</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {projects && projects.length > 0 ? (
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
                                    <MapPin className="h-3 w-3" /> {project.city || 'Belirtilmemiş'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    Durum: <span className="font-medium text-foreground">{statusMap[project.status] || project.status}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Link href={`/projects/${project.id}`} className="w-full">
                                    <Button variant="outline" className="w-full">Detaylar</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/50">
                        <p className="text-muted-foreground mb-4">Henüz hiç proje bulunmuyor.</p>
                        <Button variant="secondary" disabled>Yukarıdan Ekle</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
