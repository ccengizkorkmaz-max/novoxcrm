import { MessageSquare, MousePointer2 } from 'lucide-react'

export default function ConversationsPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
            <div className="relative mb-8">
                <div className="h-24 w-24 rounded-3xl bg-blue-600 flex items-center justify-center rotate-12 shadow-2xl shadow-blue-200">
                    <MessageSquare className="h-12 w-12 text-white -rotate-12" />
                </div>
                <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-xl animate-bounce">
                    <MousePointer2 className="h-5 w-5 text-slate-400" />
                </div>
            </div>

            <h1 className="text-2xl font-black text-slate-900 mb-2">
                Görüşme Seçin
            </h1>
            <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                Mesajlaşmaya başlamak için sol taraftaki listeden bir görüşme seçin veya yeni bir mesaj gelmesini bekleyin.
            </p>

            <div className="mt-12 flex gap-4">
                <div className="px-4 py-2 bg-white rounded-full border border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest shadow-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    WhatsApp Hazır
                </div>
                <div className="px-4 py-2 bg-white rounded-full border border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest shadow-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    Messenger Hazır
                </div>
            </div>
        </div>
    )
}

