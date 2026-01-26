'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users, MapPin, Building2, Pencil, Trash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createTeam, updateTeam, deleteTeam } from '@/app/(dashboard)/teams/actions'
import MemberManagement from '@/app/(dashboard)/teams/components/MemberManagement'
import AssignmentManagement from '@/app/(dashboard)/teams/components/AssignmentManagement'

interface TeamListProps {
    teams: any[]
    profiles: any[]
    projects: any[]
    sales: any[]
}

export default function TeamList({ teams, profiles, projects, sales }: TeamListProps) {
    const router = useRouter()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingTeam, setEditingTeam] = useState<any>(null)
    const [isPending, setIsPending] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex justify-start">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Yeni Ekip Oluştur
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Satış Ekibi</DialogTitle>
                            <DialogDescription>
                                Ekibin adını ve kapsamını belirleyin.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            setIsPending(true)
                            const result = await createTeam(formData)
                            setIsPending(false)
                            if (result.error) {
                                alert('Hata: ' + result.error)
                            } else {
                                setIsCreateOpen(false)
                                router.refresh()
                            }
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Ekip Adı</Label>
                                    <Input id="name" name="name" placeholder="Örn: Batı Bölgesi Satış Ekibi" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="region">Bölge</Label>
                                    <Input id="region" name="region" placeholder="Örn: Marmara" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="office_name">Ofis</Label>
                                    <Input id="office_name" name="office_name" placeholder="Örn: Merkez Ofis" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Açıklama</Label>
                                    <Textarea id="description" name="description" placeholder="Ekip hakkında kısa bilgi..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                    <Card key={team.id} className="relative overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">{team.name}</CardTitle>
                                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                            {sales.filter(s => team.team_members?.some((m: any) => m.profiles.id === s.assigned_to)).length} Satış
                                        </Badge>
                                    </div>
                                    <CardDescription>{team.description || 'Açıklama yok'}</CardDescription>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingTeam(team)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <form action={async (formData) => {
                                        if (confirm('Bu ekibi silmek istediğinize emin misiniz?')) {
                                            const result = await deleteTeam(formData)
                                            if (result.error) alert('Hata: ' + result.error)
                                            else router.refresh()
                                        }
                                    }}>
                                        <input type="hidden" name="id" value={team.id} />
                                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" type="submit">
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                {team.region && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {team.region}
                                    </div>
                                )}
                                {team.office_name && (
                                    <div className="flex items-center gap-1">
                                        <Building2 className="w-3 h-3" /> {team.office_name}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Üyeler ({team.team_members?.length || 0})
                                    </div>
                                    <MemberManagement team={team} profiles={profiles} />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {team.team_members?.map((m: any) => (
                                        <Badge key={m.id} variant="secondary">
                                            {m.profiles?.full_name}
                                            {m.role === 'leader' && " (Lider)"}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Projeler ({team.team_project_assignments?.length || 0})
                                    </div>
                                    <AssignmentManagement team={team} projects={projects} />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {team.team_project_assignments?.map((a: any) => (
                                        <Badge key={a.id} variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                            {a.projects?.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Edit Team Dialog */}
            <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ekibi Düzenle</DialogTitle>
                    </DialogHeader>
                    {editingTeam && (
                        <form action={async (formData) => {
                            setIsPending(true)
                            const result = await updateTeam(formData)
                            setIsPending(false)
                            if (result.error) {
                                alert('Hata: ' + result.error)
                            } else {
                                setEditingTeam(null)
                                router.refresh()
                            }
                        }}>
                            <input type="hidden" name="id" value={editingTeam.id} />
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Ekip Adı</Label>
                                    <Input id="edit-name" name="name" defaultValue={editingTeam.name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-region">Bölge</Label>
                                    <Input id="edit-region" name="region" defaultValue={editingTeam.region} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-office">Ofis</Label>
                                    <Input id="edit-office" name="office_name" defaultValue={editingTeam.office_name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-desc">Açıklama</Label>
                                    <Textarea id="edit-desc" name="description" defaultValue={editingTeam.description} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Güncelle</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
