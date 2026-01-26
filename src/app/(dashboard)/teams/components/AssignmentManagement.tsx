'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Building2, Trash2 } from 'lucide-react'
import { assignTeamToProject } from '../actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AssignmentManagementProps {
    team: any
    projects: any[]
}

export default function AssignmentManagement({ team, projects }: AssignmentManagementProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const existingProjectIds = new Set(team.team_project_assignments?.map((a: any) => a.projects.id))
    const availableProjects = projects.filter(p => !existingProjectIds.has(p.id))

    const handleRemove = async (assignmentId: string) => {
        const supabase = createClient()
        const { error } = await supabase
            .from('team_project_assignments')
            .delete()
            .eq('id', assignmentId)

        if (!error) {
            router.refresh()
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <Plus className="w-3 h-3 mr-1" /> Ata
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{team.name} - Proje Atamaları</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {/* Add Assignment Form */}
                    <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
                        <h4 className="text-sm font-medium">Yeni Proje Ata</h4>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Proje seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableProjects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={async () => {
                                    if (!selectedProjectId) return
                                    setIsSubmitting(true)
                                    const formData = new FormData()
                                    formData.append('team_id', team.id)
                                    formData.append('project_id', selectedProjectId)
                                    await assignTeamToProject(formData)
                                    setSelectedProjectId('')
                                    setIsSubmitting(false)
                                    router.refresh()
                                }}
                                disabled={!selectedProjectId || isSubmitting}
                            >
                                Ata
                            </Button>
                        </div>
                    </div>

                    {/* Assignment List */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Atanmış Projeler</h4>
                        <div className="divide-y rounded-lg border">
                            {team.team_project_assignments?.length > 0 ? (
                                team.team_project_assignments.map((assignment: any) => (
                                    <div key={assignment.id} className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">{assignment.projects?.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600"
                                            onClick={() => handleRemove(assignment.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    Atanmış proje yok.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
