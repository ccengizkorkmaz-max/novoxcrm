import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Building2, Search, X, Loader2, Link2, 
  Send, Sparkles, Check, ChevronRight 
} from 'lucide-react'

interface StockTabProps {
  userId: string
  tenantId: string
}

export default function StockTab({ userId, tenantId }: StockTabProps) {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [loadingProjects, setLoadingProjects] = useState(true)

  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null)
  
  // Quick Offer Generation State
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch projects on load
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoadingProjects(true)
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, status')
          .order('name', { ascending: true })

        if (error) throw error
        setProjects(data || [])
      } catch (err) {
        console.error('Fetch projects error:', err)
      } finally {
        setLoadingProjects(false)
      }
    }
    fetchProjects()
  }, [])

  // Fetch units when selectedProject changes
  useEffect(() => {
    async function fetchUnits() {
      if (!selectedProject) {
        setUnits([])
        return
      }
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('units')
          .select('id, unit_number, type, status, price, currency, floor, direction')
          .eq('project_id', selectedProject.id)
          .order('unit_number', { ascending: true })

        if (error) throw error
        setUnits(data || [])
      } catch (err) {
        console.error('Fetch units error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUnits()
  }, [selectedProject])

  const filteredUnits = units.filter(u => 
    u.unit_number?.toLowerCase().includes(search.toLowerCase()) ||
    u.type?.toLowerCase().includes(search.toLowerCase())
  )

  // Generate random 16 characters proposal token
  const generateToken = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }

  // Handle Quick Proposal Generation
  const handleGenerateProposal = async () => {
    if (!custName || !custPhone) {
      alert('Lütfen müşteri bilgilerini doldurun.')
      return
    }

    setGenerating(true)
    try {
      // 1. Create or Find Customer
      let customerId = ''
      
      const { data: existingCust } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', custPhone)
        .maybeSingle()

      if (existingCust) {
        customerId = existingCust.id
      } else {
        const { data: newCust, error: custErr } = await supabase
          .from('customers')
          .insert({
            tenant_id: tenantId,
            full_name: custName,
            phone: custPhone,
            customer_type: 'Lead', // Default to Lead
            created_by: userId,
            assigned_to: userId
          })
          .select('id')
          .single()

        if (custErr) throw custErr
        customerId = newCust.id
      }

      // 2. Create Offer
      const token = generateToken()
      const offerPrice = customPrice ? parseFloat(customPrice) : selectedUnit.price
      
      const { error: offerErr } = await supabase
        .from('offers')
        .insert({
          tenant_id: tenantId,
          customer_id: customerId,
          unit_id: selectedUnit.id,
          user_id: userId,
          price: offerPrice,
          currency: selectedUnit.currency || 'TL',
          status: 'Active',
          proposal_token: token
        })

      if (offerErr) throw offerErr

      // 3. Set Generated Link (Use host domain dynamically)
      const host = window.location.host
      const protocol = window.location.protocol
      const link = `${protocol}//${host}/tr/teklif/${token}`
      setGeneratedLink(link)
    } catch (err: any) {
      console.error('Proposal gen error:', err)
      alert('Teklif oluşturulurken bir hata oluştu.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Müsait':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'Opsiyonlu':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default:
        return 'bg-red-500/10 text-red-500/40 border-red-500/10 cursor-not-allowed'
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in-30 slide-in-from-bottom-2 duration-300">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-teal-950/40">
        <p className="text-[10px] font-bold text-teal-200 uppercase tracking-widest mb-1">DİNAMİK STOK HAVUZU</p>
        <h2 className="text-2xl font-black">{selectedProject ? selectedProject.name : 'Projeler'}</h2>
        <p className="text-xs text-teal-100 font-medium mt-1">
          {selectedProject ? 'Daireleri durumuna göre süzün, anında teklif linki üretin.' : 'Lütfen incelemek istediğiniz projeyi seçin.'}
        </p>
      </div>

      {!selectedProject ? (
        /* Project Selection Mode */
        loadingProjects ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="text-xs font-semibold">Projeler yükleniyor...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((proj) => (
              <div 
                key={proj.id}
                onClick={() => setSelectedProject(proj)}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{proj.name}</h4>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 inline-block mt-1">
                      {proj.status || 'Aktif'}
                    </span>
                  </div>
                </div>
                <div className="text-slate-500">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Unit Selection Mode */
        <>
          {/* Back to Projects Button */}
          <button 
            type="button"
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-1 text-xs font-black text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Projelere Dön
          </button>

          {/* Search Filter */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Daire no veya oda tipi ara (örn: 101, 2+1)..."
              className="w-full bg-slate-800/40 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-xs font-semibold">Stok listesi çekiliyor...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredUnits.map((unit) => (
                <div 
                  key={unit.id}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-all ${getStatusColor(unit.status)}`}
                  onClick={() => {
                    if (unit.status !== 'Satıldı') {
                      setSelectedUnit(unit)
                      setCustomPrice(unit.price?.toString() || '')
                      setCustName('')
                      setCustPhone('')
                      setGeneratedLink(null)
                    }
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-80">{unit.type}</span>
                      {unit.floor && (
                        <span className="text-[9px] font-black opacity-60">K: {unit.floor}</span>
                      )}
                    </div>
                    <h4 className="text-lg font-black tracking-tight mt-0.5">{unit.unit_number}</h4>
                  </div>
                  <div className="mt-3.5 flex items-end justify-between border-t border-current/10 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest">{unit.status}</span>
                    <span className="text-xs font-black">
                      {unit.price ? `${unit.price.toLocaleString()} ${unit.currency || 'TL'}` : 'Fiyat Yok'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Quick Proposal Modal Overlay */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-md font-black text-white">{selectedUnit.unit_number} Hızlı Teklif</h3>
              </div>
              <button 
                onClick={() => setSelectedUnit(null)}
                className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Generated Link Result Section */}
            {generatedLink ? (
              <div className="space-y-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Teklif Hazırlandı!</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Link kopyalanıp müşterinizle paylaşıma hazırdır.</p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="flex-1 bg-slate-800 border border-slate-700/60 hover:bg-slate-800/80 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4 text-slate-400" />}
                    {copied ? 'Kopyalandı' : 'Linki Kopyala'}
                  </button>
                  <a 
                    href={`https://wa.me/${custPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Merhaba ${custName}, size özel hazırlanan teklif belgesini aşağıdaki linkten inceleyebilirsiniz:\n\n${generatedLink}`)}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4" /> WhatsApp Gönder
                  </a>
                </div>
              </div>
            ) : (
              /* Input Form Fields */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Müşteri İsmi</label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Adı Soyadı"
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Müşteri Telefonu</label>
                  <input
                    type="tel"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="Örn: 905330000000"
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fiyat ({selectedUnit.currency || 'TL'})</label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={handleGenerateProposal}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Teklif Linki Üretiliyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Teklif Linki Oluştur
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
