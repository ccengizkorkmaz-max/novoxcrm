'use client'

import { useState } from 'react'
import { Building2, MapPin, X, Send, Loader2 } from 'lucide-react'
import { submitContactForm } from './actions'

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

interface BrokerInfo {
    id: string
    email: string
    name: string
    tenantId: string
}

function formatCurrency(amount: number, currency: string = 'TRY') {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function ProjectTabs({ projects, broker }: { projects: Project[]; broker: BrokerInfo }) {
    const [activeTab, setActiveTab] = useState(projects[0]?.id || '')
    const [selectedUnit, setSelectedUnit] = useState<{ unit: Unit; project: Project } | null>(null)
    const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')

    if (projects.length === 0) return null

    const activeProject = projects.find(p => p.id === activeTab) || projects[0]

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!selectedUnit) return
        setFormState('loading')

        const form = e.currentTarget
        const formData = new FormData(form)
        formData.set('broker_id', broker.id)
        formData.set('broker_email', broker.email)
        formData.set('broker_name', broker.name)
        formData.set('tenant_id', broker.tenantId)
        formData.set('subject', `Ünite Bilgi Talebi: ${selectedUnit.project.name} - ${selectedUnit.unit.unit_number}`)

        // Auto-generate message with unit details
        const unitInfo = [
            `Proje: ${selectedUnit.project.name}`,
            `Ünite No: ${selectedUnit.unit.unit_number}`,
            selectedUnit.unit.type ? `Tip: ${selectedUnit.unit.type}` : null,
            selectedUnit.unit.unit_category ? `Kategori: ${selectedUnit.unit.unit_category}` : null,
            selectedUnit.unit.area_net ? `Alan: ${selectedUnit.unit.area_net} m²` : null,
            selectedUnit.unit.floor ? `Kat: ${selectedUnit.unit.floor}` : null,
            selectedUnit.unit.price ? `Fiyat: ${formatCurrency(selectedUnit.unit.price, selectedUnit.unit.currency || 'TRY')}` : null,
        ].filter(Boolean).join('\n')

        const userMessage = formData.get('message') as string
        formData.set('message', `${unitInfo}\n\n---\nMüşteri Notu:\n${userMessage || 'Bilgi almak istiyorum.'}`)

        const result = await submitContactForm(formData)
        if (result.success) {
            setFormState('success')
            setTimeout(() => {
                setSelectedUnit(null)
                setFormState('idle')
            }, 2000)
        } else {
            setFormState('error')
            setErrorMsg(result.error || 'Bir hata oluştu.')
        }
    }

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
                                            <th className="px-5 py-2.5">Kategori</th>
                                            <th className="px-5 py-2.5">m²</th>
                                            <th className="px-5 py-2.5">Kat</th>
                                            <th className="px-5 py-2.5 text-right">Fiyat</th>
                                            <th className="px-5 py-2.5 text-center"></th>
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
                                                <td className="px-3 py-3 text-center">
                                                    <button
                                                        onClick={() => { setSelectedUnit({ unit, project: activeProject }); setFormState('idle') }}
                                                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-colors whitespace-nowrap"
                                                    >
                                                        Bilgi İste
                                                    </button>
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

            {/* Unit Info Request Modal */}
            {selectedUnit && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUnit(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold text-sm">Ünite Bilgi Talebi</h3>
                                <p className="text-blue-200 text-xs mt-0.5">
                                    {selectedUnit.project.name} — {selectedUnit.unit.unit_number}
                                </p>
                            </div>
                            <button onClick={() => setSelectedUnit(null)} className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                <X className="h-4 w-4 text-white" />
                            </button>
                        </div>

                        {/* Unit Summary */}
                        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-700">
                            {selectedUnit.unit.type && <span>Tip: <strong>{selectedUnit.unit.type}</strong></span>}
                            {selectedUnit.unit.unit_category && <span>Kategori: <strong>{selectedUnit.unit.unit_category}</strong></span>}
                            {selectedUnit.unit.area_net && <span>Alan: <strong>{selectedUnit.unit.area_net} m²</strong></span>}
                            {selectedUnit.unit.floor && <span>Kat: <strong>{selectedUnit.unit.floor}</strong></span>}
                            {selectedUnit.unit.price && <span>Fiyat: <strong>{formatCurrency(selectedUnit.unit.price, selectedUnit.unit.currency || 'TRY')}</strong></span>}
                        </div>

                        {formState === 'success' ? (
                            <div className="px-6 py-12 text-center">
                                <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                                    <Send className="h-6 w-6 text-emerald-600" />
                                </div>
                                <h4 className="text-base font-bold text-slate-900">Talebiniz İletildi!</h4>
                                <p className="text-sm text-slate-500 mt-1">En kısa sürede dönüş yapılacaktır.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ad Soyad *</label>
                                        <input name="sender_name" required className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" placeholder="Adınız Soyadınız" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefon *</label>
                                        <input name="sender_phone" required type="tel" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" placeholder="05XX XXX XX XX" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-posta</label>
                                    <input name="sender_email" type="email" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" placeholder="email@ornek.com" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mesajınız</label>
                                    <textarea name="message" rows={3} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none" placeholder="Bu ünite hakkında bilgi almak istiyorum..." />
                                </div>

                                {formState === 'error' && (
                                    <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={formState === 'loading'}
                                    className="w-full h-11 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {formState === 'loading' ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor...</>
                                    ) : (
                                        <><Send className="h-4 w-4" /> Bilgi Talebi Gönder</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
