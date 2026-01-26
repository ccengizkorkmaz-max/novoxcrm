'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, X } from 'lucide-react'
import { addMemberToTeam, removeMemberFromTeam } from '../actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MemberManagementProps {
    team: any
    profiles: any[]
}

export default function MemberManagement({ team, profiles }: MemberManagementProps) {
    const router = useRouter()
    const [selectedProfileId, setSelectedProfileId] = useState<string>('')
    const [selectedRole, setSelectedRole] = useState<string>('member')
    const [isPending, setIsPending] = useState(false)

    // Filter out profiles that are already members
    const existingMemberIds = new Set(team.team_members?.map((m: any) => m.profiles.id))
    const availableProfiles = profiles.filter(p => !existingMemberIds.has(p.id))

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <Plus className="w-3 h-3 mr-1" /> Yönet
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{team.name} - Üye Yönetimi</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {/* Add Member Form */}
                    <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
                        <h4 className="text-sm font-medium">Yeni Üye Ekle</h4>
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="flex-1">
                                <Select value={selectedProfileId} onValueChange={setSelectedProfileId} disabled={isPending}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kullanıcı seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableProfiles.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.full_name} ({p.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full sm:w-[120px]">
                                <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isPending}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">Üye</SelectItem>
                                        <SelectItem value="leader">Lider</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <form action={async () => {
                                if (!selectedProfileId) return
                                setIsPending(true)
                                const formData = new FormData()
                                formData.append('team_id', team.id)
                                formData.append('profile_id', selectedProfileId)
                                formData.append('role', selectedRole)
                                await addMemberToTeam(formData)
                                setSelectedProfileId('')
                                setIsPending(false)
                                router.refresh()
                            }}>
                                <Button type="submit" disabled={!selectedProfileId || isPending}>
                                    {isPending ? 'Ekle...' : 'Ekle'}
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Member List */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Mevcut Üyeler</h4>
                        <div className="divide-y rounded-lg border">
                            {team.team_members?.length > 0 ? (
                                team.team_members.map((member: any) => (
                                    <div key={member.id} className="flex items-center justify-between p-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{member.profiles?.full_name}</span>
                                            <span className="text-xs text-muted-foreground capitalize">{member.role === 'leader' ? 'Ekip Lideri' : 'Üye'}</span>
                                        </div>
                                        <form action={async () => {
                                            const formData = new FormData()
                                            formData.append('team_id', team.id)
                                            formData.append('profile_id', member.profiles.id)
                                            await removeMemberFromTeam(formData)
                                            router.refresh()
                                        }}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </form>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    Henüz üye eklenmemiş.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
