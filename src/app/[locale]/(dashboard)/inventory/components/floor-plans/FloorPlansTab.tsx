'use client'

import { useState, useEffect } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UploadFloorPlanDialog } from './UploadDialog'
import { PlanViewer } from './PlanViewer'
import { PlanEditor } from './PlanEditor'
import { getProjectFloorPlans, getFloorPlanPositions, deleteFloorPlan, FloorPlan, UnitPosition } from '../../floor-plan-actions'
import { LayoutGrid, Edit, Trash2, Undo, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FloorPlansTabProps {
    projects: { id: string; name: string }[]
    currentProject?: string // Default selected project from URL
}

export function FloorPlansTab({ projects, currentProject }: FloorPlansTabProps) {
    const router = useRouter()
    const [selectedProjectId, setSelectedProjectId] = useState<string>(currentProject || projects[0]?.id || '')
    const [plans, setPlans] = useState<FloorPlan[]>([])
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
    const [positions, setPositions] = useState<UnitPosition[]>([])
    const [loading, setLoading] = useState(false)
    const [editMode, setEditMode] = useState(false)

    // Fetch plans when project changes
    useEffect(() => {
        if (!selectedProjectId) return

        const fetchPlans = async () => {
            setLoading(true)
            const data = await getProjectFloorPlans(selectedProjectId)
            setPlans(data || [])
            setLoading(false)
            if (data && data.length > 0) {
                // Select first plan automatically if none selected
                if (!selectedPlanId) setSelectedPlanId(data[0].id)
            } else {
                setSelectedPlanId(null)
            }
        }

        fetchPlans()
    }, [selectedProjectId, selectedPlanId]) // Only re-run when projectId changes, selectedPlanId dependency removed to prevent loop

    // Fetch positions when plan changes
    useEffect(() => {
        if (!selectedPlanId) {
            setPositions([])
            return
        }

        const fetchPositions = async () => {
            setLoading(true)
            const data = await getFloorPlanPositions(selectedPlanId)
            setPositions(data || [])
            setLoading(false)
        }

        fetchPositions()
    }, [selectedPlanId])

    const handleDeletePlan = async () => {
        if (!selectedPlanId) return
        if (!confirm('Bu kat planını silmek istediğinize emin misiniz?')) return

        const result = await deleteFloorPlan(selectedPlanId)
        if (result.success) {
            toast.success('Plan silindi.')
            setPlans(prev => prev.filter(p => p.id !== selectedPlanId))
            setSelectedPlanId(null)
            setPositions([])
        } else {
            toast.error('Silinemedi.')
        }
    }

    const activePlan = plans.find(p => p.id === selectedPlanId)

    if (projects.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Henüz proje bulunmuyor.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Select value={selectedProjectId} onValueChange={(val) => {
                        setSelectedProjectId(val)
                        setSelectedPlanId(null) // Reset plan when project changes
                    }}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Proje Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedProjectId && (
                        <UploadFloorPlanDialog
                            projectId={selectedProjectId}
                            onSuccess={() => {
                                // Refresh plans
                                getProjectFloorPlans(selectedProjectId).then(setPlans)
                            }}
                        />
                    )}
                </div>

                {selectedPlanId && !editMode && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="gap-2">
                            <Edit className="h-4 w-4" /> Düzenle
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDeletePlan} className="gap-2">
                            <Trash2 className="h-4 w-4" /> Sil
                        </Button>
                    </div>
                )}

                {editMode && (
                    <Button variant="secondary" size="sm" onClick={() => setEditMode(false)} className="gap-2">
                        <Undo className="h-4 w-4" /> Düzenlemeyi Bitir
                    </Button>
                )}
            </div>

            {loading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

            {!loading && plans.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                        <LayoutGrid className="h-12 w-12 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium mb-1">Kat Planı Bulunamadı</h3>
                        <p className="text-sm mb-4">Bu projeye ait henüz yüklenmiş bir kat planı veya vaziyet planı yok.</p>
                        {selectedProjectId && (
                            <UploadFloorPlanDialog
                                projectId={selectedProjectId}
                                onSuccess={() => getProjectFloorPlans(selectedProjectId).then(setPlans)}
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            {!loading && plans.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
                    {/* Plan List Sidebar */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Planlar</h3>
                        <div className="flex flex-col gap-2">
                            {plans.map(plan => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={`text-left px-4 py-3 rounded-lg text-sm transition-colors border ${selectedPlanId === plan.id
                                        ? 'bg-white border-primary shadow-sm font-medium text-primary'
                                        : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600'
                                        }`}
                                >
                                    {plan.title}
                                    <span className="block text-[10px] text-muted-foreground mt-1">
                                        {new Date(plan.created_at).toLocaleDateString('tr-TR')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="min-h-[500px]">
                        {activePlan ? (
                            editMode ? (
                                <PlanEditorWrapper
                                    plan={activePlan}
                                    currentPositions={positions}
                                    onSave={() => getFloorPlanPositions(activePlan.id).then(setPositions)}
                                />
                            ) : (
                                <PlanViewer
                                    imageUrl={activePlan.image_url}
                                    title={activePlan.title}
                                    positions={positions.map(p => ({
                                        id: p.id,
                                        x: p.position_data.x,
                                        y: p.position_data.y,
                                        unit: {
                                            id: p.unit_id,
                                            unit_number: p.unit?.unit_number || '?',
                                            status: p.unit?.status || 'Bilinmiyor',
                                            price: p.unit?.price || 0,
                                            currency: p.unit?.currency || 'TRY',
                                            type: p.unit?.type || '',
                                            area_gross: p.unit?.area_gross || null,
                                            area_net: p.unit?.area_net || null
                                        }
                                    }))}
                                    onUnitClick={(id) => router.push(`/inventory/${id}`)}
                                />
                            )
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-xl">
                                Bir plan seçin
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function PlanEditorWrapper({ plan, currentPositions, onSave }: { plan: FloorPlan, currentPositions: UnitPosition[], onSave: () => void }) {
    const [availableUnits, setAvailableUnits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUnits = async () => {
            const supabase = createClient()
            // Get all units for this project
            const { data } = await supabase
                .from('units')
                .select('id, unit_number, status, type')
                .eq('project_id', plan.project_id)
                .order('unit_number', { ascending: true })

            if (data) {
                // Filter out units that are already placed on THIS plan
                const placedUnitIds = currentPositions.map(p => p.unit_id)
                const unplaced = data.filter(u => !placedUnitIds.includes(u.id))

                setAvailableUnits(unplaced)
            }
            setLoading(false)
        }
        fetchUnits()
    }, [plan.project_id, currentPositions])

    if (loading) return <div>Yükleniyor...</div>

    return (
        <PlanEditor
            floorPlanId={plan.id}
            imageUrl={plan.image_url}
            title={plan.title}
            initialPositions={currentPositions.map(p => ({
                id: p.id,
                x: p.position_data.x,
                y: p.position_data.y,
                unit: {
                    id: p.unit_id,
                    unit_number: p.unit?.unit_number || '?',
                    status: p.unit?.status || 'Bilinmiyor',
                    type: p.unit?.type || ''
                }
            }))}
            availableUnits={availableUnits}
            onSave={onSave}
        />
    )
}
