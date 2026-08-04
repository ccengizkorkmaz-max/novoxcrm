'use client'

import React, { useState, useEffect } from 'react'
import { PhoneCall, UserCheck, Lock, RefreshCw, LogOut } from 'lucide-react'
import { authenticate, logout, getAgentLeads } from './actions'

export default function AgentClient({ 
    initialAuthed, 
    slug, 
    agentName 
}: { 
    initialAuthed: boolean, 
    slug: string, 
    agentName: string 
}) {
    const [isAuthed, setIsAuthed] = useState(initialAuthed)
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [leads, setLeads] = useState<any[]>([])
    const [fetchLoading, setFetchLoading] = useState(false)

    useEffect(() => {
        if (isAuthed) {
            loadLeads()
        }
    }, [isAuthed])

    const loadLeads = async () => {
        setFetchLoading(true)
        const res = await getAgentLeads(slug)
        if (res.success) {
            setLeads(res.leads || [])
        } else {
            if (res.error === 'Unauthorized') setIsAuthed(false)
            else alert(res.error)
        }
        setFetchLoading(false)
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const res = await authenticate(slug, password)
        if (res.success) {
            setIsAuthed(true)
        } else {
            alert(res.error)
        }
        setLoading(false)
    }

    const handleLogout = async () => {
        await logout(slug)
        setIsAuthed(false)
        setLeads([])
        setPassword('')
    }

    if (!isAuthed) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4">
                <div className="w-full max-w-sm bg-slate-800/90 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
                            <UserCheck className="h-8 w-8" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight">{agentName}</h1>
                        <p className="text-xs text-slate-400 font-semibold">Özel Lead Sayfası</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sayfa Şifresi</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                            <span>Giriş Yap</span>
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">{agentName}</h1>
                    <p className="text-xs font-medium text-slate-500">Müşteri Adayları ({leads.length})</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={loadLeads} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                        <RefreshCw className={`h-5 w-5 ${fetchLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="p-4 pb-24 space-y-3 max-w-lg mx-auto">
                {fetchLoading && leads.length === 0 ? (
                    <div className="flex justify-center p-10"><RefreshCw className="h-6 w-6 animate-spin text-blue-500" /></div>
                ) : leads.length === 0 ? (
                    <div className="text-center p-10 text-slate-500 text-sm">Gösterilecek lead bulunamadı.</div>
                ) : (
                    leads.map(lead => (
                        <div key={lead.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">{lead.full_name}</h3>
                                    <p className="text-xs text-slate-500 font-medium">{new Date(lead.updated_at).toLocaleDateString('tr-TR')} • {lead.projects?.name || 'Proje Belirtilmemiş'}</p>
                                </div>
                                <div className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600 border border-slate-200">
                                    {lead.lead_score?.toUpperCase() || 'YENI'}
                                </div>
                            </div>
                            
                            {lead.notes && (
                                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg line-clamp-2 leading-relaxed">
                                    {lead.notes}
                                </p>
                            )}

                            {lead.phone && (
                                <a 
                                    href={`tel:${lead.phone.replace(/\D/g, '')}`}
                                    className="mt-1 w-full h-11 bg-[#00A859] hover:bg-[#00924e] active:scale-[0.98] transition-all text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm"
                                >
                                    <PhoneCall className="h-4 w-4" />
                                    <span>{lead.phone} (Arama Yap)</span>
                                </a>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
