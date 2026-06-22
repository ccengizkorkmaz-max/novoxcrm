'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    ArrowUp, ArrowDown, Plus, Trash2, Loader2, CheckCircle2,
    GripVertical, Palette, Save, RotateCcw
} from 'lucide-react'
import { updatePipelineStages } from '../crm-mode-actions'

interface PipelineStage {
    key: string
    label: string
    color: string
    order: number
}

interface PipelineEditorProps {
    stages: PipelineStage[]
}

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316',
    '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#64748b',
]

const DEFAULT_STAGES: PipelineStage[] = [
    { key: 'prospect', label: 'Aday', color: '#6366f1', order: 1 },
    { key: 'qualified', label: 'Nitelikli', color: '#8b5cf6', order: 2 },
    { key: 'reservation', label: 'Opsiyon', color: '#06b6d4', order: 3 },
    { key: 'proposal', label: 'Teklif', color: '#f59e0b', order: 4 },
    { key: 'negotiation', label: 'Müzakere', color: '#f97316', order: 5 },
    { key: 'won', label: 'Kazanıldı', color: '#22c55e', order: 6 },
    { key: 'lost', label: 'Kaybedildi', color: '#ef4444', order: 7 },
]

export default function PipelineEditor({ stages: initialStages }: PipelineEditorProps) {
    const [stages, setStages] = useState<PipelineStage[]>(initialStages)
    const [colorPickerOpen, setColorPickerOpen] = useState<number | null>(null)
    const [isPending, startTransition] = useTransition()
    const [saveResult, setSaveResult] = useState<{ success: boolean; error?: string } | null>(null)

    const hasChanges = JSON.stringify(stages) !== JSON.stringify(initialStages)

    const moveStage = (index: number, direction: 'up' | 'down') => {
        const newStages = [...stages]
        const swapIndex = direction === 'up' ? index - 1 : index + 1
        if (swapIndex < 0 || swapIndex >= newStages.length) return
        ;[newStages[index], newStages[swapIndex]] = [newStages[swapIndex], newStages[index]]
        setStages(newStages.map((s, i) => ({ ...s, order: i + 1 })))
        setSaveResult(null)
    }

    const updateStage = (index: number, field: keyof PipelineStage, value: string) => {
        const newStages = [...stages]
        if (field === 'label') {
            newStages[index] = { ...newStages[index], label: value }
            // key'i otomatik oluştur (label'dan)
            if (!initialStages.find(s => s.key === newStages[index].key)) {
                newStages[index].key = value.toLowerCase()
                    .replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ]/gi, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '')
            }
        } else {
            (newStages[index] as any)[field] = value
        }
        setStages(newStages)
        setSaveResult(null)
    }

    const addStage = () => {
        const order = stages.length + 1
        const usedColors = stages.map(s => s.color)
        const nextColor = PRESET_COLORS.find(c => !usedColors.includes(c)) || '#64748b'
        setStages([...stages, {
            key: `stage_${order}`,
            label: '',
            color: nextColor,
            order,
        }])
        setSaveResult(null)
    }

    const removeStage = (index: number) => {
        if (stages.length <= 2) return
        const newStages = stages.filter((_, i) => i !== index)
        setStages(newStages.map((s, i) => ({ ...s, order: i + 1 })))
        setSaveResult(null)
    }

    const resetToDefault = () => {
        setStages([...DEFAULT_STAGES])
        setSaveResult(null)
    }

    const handleSave = () => {
        // Validasyon
        const emptyLabels = stages.filter(s => !s.label.trim())
        if (emptyLabels.length > 0) {
            setSaveResult({ success: false, error: 'Tüm aşamalara isim verilmelidir.' })
            return
        }

        startTransition(async () => {
            const result = await updatePipelineStages(stages)
            setSaveResult(result)
        })
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Palette className="h-4 w-4 text-indigo-500" />
                            Pipeline Aşamaları
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Fırsatlar (Opportunities) Kanban board aşamalarını özelleştirin
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs gap-1"
                            onClick={resetToDefault}
                        >
                            <RotateCcw className="h-3 w-3" />
                            Varsayılan
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={addStage}
                        >
                            <Plus className="h-3 w-3" />
                            Aşama Ekle
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {/* Stage list */}
                {stages.map((stage, index) => (
                    <div
                        key={stage.key + '-' + index}
                        className="flex items-center gap-2 p-2.5 border rounded-lg bg-white hover:bg-muted/20 transition-colors group"
                    >
                        {/* Grip */}
                        <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />

                        {/* Order badge */}
                        <Badge variant="outline" className="text-[10px] w-6 h-6 flex items-center justify-center p-0 flex-shrink-0">
                            {index + 1}
                        </Badge>

                        {/* Color picker */}
                        <div className="relative">
                            <button
                                type="button"
                                className="w-8 h-8 rounded-md border-2 border-white shadow-sm flex-shrink-0 transition-transform hover:scale-110"
                                style={{ backgroundColor: stage.color }}
                                onClick={() => setColorPickerOpen(colorPickerOpen === index ? null : index)}
                            />
                            {colorPickerOpen === index && (
                                <div className="absolute top-10 left-0 z-50 p-2 bg-white border rounded-lg shadow-xl grid grid-cols-4 gap-1.5 w-[160px]">
                                    {PRESET_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`w-8 h-8 rounded-md transition-transform hover:scale-110 ${
                                                stage.color === color ? 'ring-2 ring-offset-1 ring-slate-800' : ''
                                            }`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => {
                                                updateStage(index, 'color', color)
                                                setColorPickerOpen(null)
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Label */}
                        <Input
                            className="h-8 flex-1 text-sm"
                            value={stage.label}
                            placeholder="Aşama adı..."
                            onChange={e => updateStage(index, 'label', e.target.value)}
                        />

                        {/* Key */}
                        <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded max-w-[80px] truncate hidden sm:block">
                            {stage.key}
                        </code>

                        {/* Move buttons */}
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                disabled={index === 0}
                                onClick={() => moveStage(index, 'up')}
                            >
                                <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                disabled={index === stages.length - 1}
                                onClick={() => moveStage(index, 'down')}
                            >
                                <ArrowDown className="h-3 w-3" />
                            </Button>
                        </div>

                        {/* Delete */}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={stages.length <= 2}
                            onClick={() => removeStage(index)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                ))}

                {/* Preview */}
                <div className="pt-3 border-t mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Önizleme:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {stages.map((stage) => (
                            <Badge
                                key={stage.key}
                                variant="outline"
                                className="text-xs py-1 px-2.5"
                                style={{
                                    backgroundColor: stage.color + '15',
                                    borderColor: stage.color + '40',
                                    color: stage.color,
                                }}
                            >
                                {stage.label || '...'}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Save */}
                {(hasChanges || saveResult) && (
                    <div className="flex items-center justify-between pt-3 border-t mt-3">
                        {saveResult ? (
                            <p className={`text-sm ${saveResult.success ? 'text-emerald-600' : 'text-red-600'} flex items-center gap-1.5`}>
                                {saveResult.success && <CheckCircle2 className="h-4 w-4" />}
                                {saveResult.success ? 'Pipeline aşamaları kaydedildi!' : saveResult.error}
                            </p>
                        ) : (
                            <p className="text-xs text-amber-600">Kaydedilmemiş değişiklikler var</p>
                        )}
                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={handleSave}
                            disabled={isPending || !hasChanges}
                        >
                            {isPending ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Kaydediliyor...</>
                            ) : (
                                <><Save className="h-3.5 w-3.5" />Kaydet</>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
