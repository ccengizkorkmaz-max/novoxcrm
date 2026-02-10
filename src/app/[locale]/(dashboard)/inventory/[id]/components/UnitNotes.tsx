'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, Trash2, StickyNote, Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { addUnitNote, deleteUnitNote } from '../../unit-details-actions'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Note {
    id: string
    content: string
    created_at: string
    created_by: { full_name: string }
}

export function UnitNotes({ unitId, notes }: { unitId: string, notes: Note[] }) {
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (!content.trim()) return

        setLoading(true)
        const result = await addUnitNote(unitId, content)
        setLoading(false)

        if (result.success) {
            setContent('')
            toast.success('Not eklendi.')
        } else {
            toast.error(result.error || 'Eklenemedi.')
        }
    }

    const handleDelete = async (noteId: string) => {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return

        setDeletingId(noteId)
        const result = await deleteUnitNote(noteId, unitId)
        setDeletingId(null)

        if (result.success) {
            toast.success('Not silindi.')
        } else {
            toast.error('Silinemedi.')
        }
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="py-3 px-4 border-b bg-slate-50">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-amber-500" />
                    İç Notlar
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 h-[250px] p-4">
                    {notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-2">
                            <MessageSquare className="h-8 w-8" />
                            <p className="text-xs">Henüz not eklenmemiş.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notes.map(note => (
                                <div key={note.id} className="group relative bg-amber-50/50 p-3 rounded-lg border border-amber-100 text-sm">
                                    <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-100/50">
                                        <span className="text-[10px] font-medium text-amber-800">
                                            {note.created_by?.full_name || 'Bilinmeyen Kullanıcı'}
                                        </span>
                                        <span className="text-[10px] text-amber-600/70">
                                            {format(new Date(note.created_at), 'd MMM HH:mm', { locale: tr })}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        disabled={deletingId === note.id}
                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        {deletingId === note.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-3 border-t bg-white">
                    <div className="relative">
                        <Textarea
                            placeholder="Not ekleyin..."
                            className="text-xs min-h-[60px] pr-10 resize-none"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSubmit()
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            className="h-7 w-7 absolute bottom-2 right-2"
                            disabled={!content.trim() || loading}
                            onClick={handleSubmit}
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
