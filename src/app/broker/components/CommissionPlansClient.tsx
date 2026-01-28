'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BadgeTurkishLira, ChevronRight, Search, Filter, Layers, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import CommissionModelDetailDialog from '../components/CommissionModelDetailDialog'

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

export default function CommissionPlansClient({ initialModels }: { initialModels: CommissionModel[] }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedModel, setSelectedModel] = useState<CommissionModel | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const filteredModels = initialModels.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.projects?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleOpenDetail = (model: CommissionModel) => {
        setSelectedModel(model)
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Plan veya proje adı ara..."
                        className="pl-10 h-10 rounded-xl bg-white border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredModels.map((model) => (
                    <Card
                        key={model.id}
                        className="group border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer border border-slate-100"
                        onClick={() => handleOpenDetail(model)}
                    >
                        <CardHeader className="p-5 pb-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                    <BadgeTurkishLira className="h-5 w-5" />
                                </div>
                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                                    {model.type}
                                </Badge>
                            </div>
                            <CardTitle className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {model.name}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-slate-400">
                                {model.projects?.name || 'Genel Plan'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 pt-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Komisyon Oranı</p>
                                    <p className="text-xl font-black text-green-600">%{model.value}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                                <span>{model.payable_stage || 'Sözleşme İmzası'}</span>
                                <span className="mx-1">•</span>
                                <span>{model.currency}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredModels.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Layers className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">Aradığınız kriterlere uygun komisyon planı bulunamadı.</p>
                    </div>
                )}
            </div>

            <CommissionModelDetailDialog
                model={selectedModel}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </div>
    )
}
