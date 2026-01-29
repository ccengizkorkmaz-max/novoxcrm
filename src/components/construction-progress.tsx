'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Trash2, Save, HardHat, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Stage {
    id: string
    name: string
    weight: number
}

interface Unit {
    id: string
    unit_number: string
    block?: string
}

interface UnitProgress {
    unit_id: string
    stage_id: string
    completion_percentage: number
}

interface ConstructionProgressProps {
    projectId: string
    stages: Stage[]
    units: Unit[]
    unitProgress: UnitProgress[]
    onAddStage: (projectId: string, name: string, weight: number) => Promise<any>
    onUpdateStage: (stageId: string, projectId: string, updates: any) => Promise<any>
    onDeleteStage: (stageId: string, projectId: string) => Promise<any>
    onUpdateUnitProgress: (unitId: string, stageId: string, percentage: number, projectId: string) => Promise<any>
}

export function ConstructionProgress({
    projectId,
    stages,
    units,
    unitProgress,
    onAddStage,
    onUpdateStage,
    onDeleteStage,
    onUpdateUnitProgress
}: ConstructionProgressProps) {
    const [newStageName, setNewStageName] = useState('')
    const [newStageWeight, setNewStageWeight] = useState(0)
    const [isAdding, setIsAdding] = useState(false)

    const handleAddStage = async () => {
        if (!newStageName) return
        const res = await onAddStage(projectId, newStageName, newStageWeight)
        if (res.success) {
            setNewStageName('')
            setNewStageWeight(0)
            toast.success('Aşama eklendi')
        } else {
            toast.error(res.error)
        }
    }

    const calculateOverallProgress = () => {
        if (stages.length === 0) return 0
        let totalWeight = stages.reduce((acc, s) => acc + Number(s.weight), 0)
        if (totalWeight === 0) return 0

        let weightedProgress = 0
        stages.forEach(stage => {
            const progresses = unitProgress.filter(p => p.stage_id === stage.id)
            if (progresses.length > 0) {
                const avgProgress = progresses.reduce((acc, p) => acc + Number(p.completion_percentage), 0) / units.length
                weightedProgress += (avgProgress * Number(stage.weight)) / totalWeight
            }
        })
        return Math.round(weightedProgress)
    }

    return (
        <div className="grid gap-6">
            {/* Global Progress Dashboard */}
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                        <HardHat className="w-5 h-5 text-primary" />
                        Genel İnşaat İlerlemesi
                    </CardTitle>
                    <CardDescription>Tüm ünitelerin ve aşamaların ağırlıklı ortalaması.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-3xl font-bold">{calculateOverallProgress()}%</span>
                            <span className="text-sm text-muted-foreground">Hedef: %100</span>
                        </div>
                        <Progress value={calculateOverallProgress()} className="h-3" />
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Stage Management */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>İnşaat Aşamaları</CardTitle>
                        <CardDescription>Proje geneli ana iş kalemleri.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {stages.map((stage) => (
                                <div key={stage.id} className="flex items-center justify-between p-2 border rounded-md">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{stage.name}</span>
                                        <span className="text-xs text-muted-foreground">Ağırlık: %{stage.weight}</span>
                                    </div>
                                    <Button size="icon" variant="ghost" onClick={() => onDeleteStage(stage.id, projectId)}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t space-y-3">
                            <div className="grid gap-2">
                                <Label>Yeni Aşama Adı</Label>
                                <Input
                                    placeholder="Örn: Kaba İnşaat"
                                    value={newStageName}
                                    onChange={(e) => setNewStageName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Ağırlık (%)</Label>
                                <Input
                                    type="number"
                                    value={newStageWeight}
                                    onChange={(e) => setNewStageWeight(Number(e.target.value))}
                                />
                            </div>
                            <Button className="w-full" onClick={handleAddStage}>
                                <Plus className="w-4 h-4 mr-2" /> Ekle
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Unit Progress Grid */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Ünite Bazlı İlerleme Girişi</CardTitle>
                        <CardDescription>Her dairenin aşama bazlı gerçekleşme yüzdesi.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[600px] overflow-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ünite</TableHead>
                                        {stages.map(s => (
                                            <TableHead key={s.id} className="text-center min-w-[100px]">{s.name}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {units.map(unit => (
                                        <TableRow key={unit.id}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {unit.block}-{unit.unit_number}
                                            </TableCell>
                                            {stages.map(stage => {
                                                const progress = unitProgress.find(p => p.unit_id === unit.id && p.stage_id === stage.id)
                                                return (
                                                    <TableCell key={stage.id} className="p-2">
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-center text-xs"
                                                            defaultValue={progress?.completion_percentage || 0}
                                                            onBlur={async (e) => {
                                                                const val = Number(e.target.value)
                                                                if (val !== (progress?.completion_percentage || 0)) {
                                                                    await onUpdateUnitProgress(unit.id, stage.id, val, projectId)
                                                                }
                                                            }}
                                                        />
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
