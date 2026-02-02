'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BadgeTurkishLira, ChevronRight, Info } from "lucide-react"
import CommissionModelDetailDialog from './CommissionModelDetailDialog'

interface CommissionModel {
    id: string
    name: string
    type: string
    value: number
    payable_stage: string
    payment_terms: string
    currency: string
    project_id: string
    projects?: { name: string }
}

export default function CommissionModelsList({ models }: { models: CommissionModel[] }) {
    const [selectedModel, setSelectedModel] = useState<CommissionModel | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleOpenDetail = (model: CommissionModel) => {
        setSelectedModel(model)
        setIsDialogOpen(true)
    }

    return (
        <>
            <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden border border-slate-100">
                <CardHeader className="px-4 py-3 border-b border-slate-50 flex flex-row items-center justify-between">
                    <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <BadgeTurkishLira className="h-3 w-3 text-green-500" />
                        Komisyon Modelleri
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-50/60 font-medium">
                        {models && models.length > 0 ? (
                            models.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => handleOpenDetail(model)}
                                    className="w-full p-3 px-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between text-left group"
                                >
                                    <div className="min-w-0">
                                        <p className="text-[12px] font-bold text-slate-900 truncate">{model.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                            {model.projects?.name || 'Tüm Projeler'} • {model.type}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                        <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                                            %{model.value}
                                        </span>
                                        <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-6 text-center">
                                <Info className="h-6 w-6 mx-auto mb-2 opacity-10 text-slate-900" />
                                <p className="text-[10px] text-slate-400">Aktif model bulunmuyor.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <CommissionModelDetailDialog
                model={selectedModel}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </>
    )
}
