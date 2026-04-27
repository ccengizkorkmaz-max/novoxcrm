'use client'

import { useState } from 'react'
import { Building2, MapPin, ChevronRight } from 'lucide-react'

interface Unit {
    id: string
    unit_number: string
    type: string | null
    unit_category: string | null
    area_net: number | null
    area_gross: number | null
    floor: string | null
    price: number | null
    currency: string | null
    block: string | null
}

interface Project {
    id: string
    name: string
    city: string
    district: string
    image_url: string | null
    description: string | null
    units: Unit[]
}

function formatCurrency(amount: number, currency: string = 'TRY') {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function ProjectTabs({ projects }: { projects: Project[] }) {
    const [activeTab, setActiveTab] = useState(projects[0]?.id || '')

    if (projects.length === 0) return null

    const activeProject = projects.find(p => p.id === activeTab) || projects[0]

    return (
        <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" /> Projeler & Satışta Olan Üniteler
            </h2>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Tab Headers */}
                <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50">
                    {projects.map((project) => (
                        <button
                            key={project.id}
                            onClick={() => setActiveTab(project.id)}
                            className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 flex-shrink-0 ${
                                activeTab === project.id
                                    ? 'border-blue-600 text-blue-700 bg-white'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'
                            }`}
                        >
                            <div className={`h-7 w-7 rounded-lg overflow-hidden flex-shrink-0 ${activeTab === project.id ? 'ring-2 ring-blue-200' : ''}`}>
                                {project.image_url ? (
                                    <img src={project.image_url} alt={project.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center">
                                        <Building2 className="h-3.5 w-3.5 text-blue-400" />
                                    </div>
                                )}
                            </div>
                            {project.name}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                activeTab === project.id
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-400'
                            }`}>
                                {project.units?.length || 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Active Project Content */}
                {activeProject && (
                    <div>
                        {/* Project Info */}
                        <div className="flex items-start gap-4 p-5 border-b border-slate-50">
                            <div className="h-16 w-24 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 overflow-hidden flex-shrink-0">
                                {activeProject.image_url ? (
                                    <img src={activeProject.image_url} alt={activeProject.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <Building2 className="h-7 w-7 text-blue-300" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base text-slate-900">{activeProject.name}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3" /> {activeProject.district}{activeProject.district && activeProject.city ? ', ' : ''}{activeProject.city}
                                </p>
                                {activeProject.description && (
                                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{activeProject.description}</p>
                                )}
                                <span className="inline-block mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    {activeProject.units?.length || 0} Satışta Ünite
                                </span>
                            </div>
                        </div>

                        {/* Units Table */}
                        {activeProject.units && activeProject.units.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="px-5 py-2.5">No</th>
                                            <th className="px-5 py-2.5">Tip</th>
                                            <th className="px-5 py-2.5">Oda</th>
                                            <th className="px-5 py-2.5">m²</th>
                                            <th className="px-5 py-2.5">Kat</th>
                                            <th className="px-5 py-2.5 text-right">Fiyat</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeProject.units.map((unit) => (
                                            <tr key={unit.id} className="border-t border-slate-50 hover:bg-blue-50/30 transition-colors">
                                                <td className="px-5 py-3 text-xs font-semibold text-slate-700">{unit.unit_number}</td>
                                                <td className="px-5 py-3 text-xs text-slate-500">{unit.type || '-'}</td>
                                                <td className="px-5 py-3 text-xs text-slate-500">{unit.unit_category || '-'}</td>
                                                <td className="px-5 py-3 text-xs text-slate-500">{unit.area_net ? `${unit.area_net}` : unit.area_gross ? `${unit.area_gross}` : '-'}</td>
                                                <td className="px-5 py-3 text-xs text-slate-500">{unit.floor || '-'}</td>
                                                <td className="px-5 py-3 text-xs font-bold text-blue-600 text-right">
                                                    {unit.price ? formatCurrency(unit.price, unit.currency || 'TRY') : 'Sorunuz'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="px-5 py-10 text-center">
                                <Building2 className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-xs text-slate-400">Bu projede şu an satışta ünite bulunmuyor.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
