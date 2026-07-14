import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, Phone, MessageSquare, Loader2 } from 'lucide-react'

interface AgendaTabProps {
  userId: string
}

export default function AgendaTab({ userId }: AgendaTabProps) {
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAgenda() {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('meetings')
          .select(`
            id,
            title,
            description,
            meeting_type,
            scheduled_at,
            notes,
            customers (
              full_name,
              phone
            )
          `)
          .eq('host_user_id', userId)
          .order('scheduled_at', { ascending: true })

        if (fetchError) throw fetchError
        setMeetings(data || [])
      } catch (err: any) {
        console.error('Fetch agenda error:', err)
        setError('Randevular yüklenemedi.')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchAgenda()
    }
  }, [userId])

  const formatDateTime = (isoString: string) => {
    if (!isoString) return { date: '', time: '' }
    const dateObj = new Date(isoString)
    
    const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long' }
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
    
    return {
      date: dateObj.toLocaleDateString('tr-TR', dateOptions),
      time: dateObj.toLocaleTimeString('tr-TR', timeOptions)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-xs font-semibold">Randevu listesi yükleniyor...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-2xl">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in-30 slide-in-from-bottom-2 duration-300">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-5 text-white shadow-lg shadow-indigo-950/40 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-xl translate-y-8 translate-x-8" />
        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">BUGÜNKÜ AJANDA</p>
        <h2 className="text-2xl font-black">{meetings.length} Randevu</h2>
        <p className="text-xs text-indigo-100 font-medium mt-1">
          {meetings.length > 0 ? 'Bugün sizi bekleyen görüşmeler aşağıda listelenmiştir.' : 'Bugün planlanmış bir randevunuz bulunmamaktadır.'}
        </p>
      </div>

      {meetings.length === 0 ? (
        <div className="p-8 rounded-3xl border border-slate-800/80 bg-slate-800/20 text-center space-y-2">
          <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-400">Harika! Bugünlük sakin bir gün.</p>
          <p className="text-xs text-slate-500">Yeni bir randevu atandığında bildirim alacaksınız.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Zaman Akışı</h3>
          {meetings.map((item) => {
            const { date, time } = formatDateTime(item.scheduled_at)
            const customer = item.customers as any
            
            return (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 hover:bg-slate-800/60 transition-colors space-y-3">
                <div className="flex gap-4 items-start">
                  {/* Date Badge */}
                  <div className="text-center bg-slate-800 border border-slate-700/60 rounded-xl px-2.5 py-1.5 shrink-0 flex flex-col justify-center min-w-[65px]">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">{date}</span>
                    <span className="text-sm font-black text-white">{time}</span>
                  </div>
                  
                  {/* Info details */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1.5">
                      {item.meeting_type || 'Görüşme'}
                    </span>
                    <h4 className="text-sm font-black text-white truncate">
                      {customer?.full_name || 'İsimsiz Müşteri'}
                    </h4>
                    <p className="text-xs text-slate-400 font-bold truncate mt-1">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer contact triggers */}
                {customer?.phone && (
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Danışman Destekli
                    </span>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${customer.phone}`} className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a href={`https://wa.me/${customer.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-green-400 hover:bg-green-500/10 transition-all">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
