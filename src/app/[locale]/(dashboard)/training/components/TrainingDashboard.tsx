'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { createCourse, markLessonComplete } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    GraduationCap, Play, BookOpen, Award, Clock, CheckCircle,
    Plus, Video, FileText, HelpCircle, Star, Lock, Trophy,
    BarChart3, Loader2, ChevronRight
} from 'lucide-react'

interface Props {
    courses: any[]
    progress: any[]
    certificates: any[]
    isManager: boolean
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
    general: { label: 'Genel', color: 'bg-slate-100 text-slate-600' },
    onboarding: { label: 'Oryantasyon', color: 'bg-blue-100 text-blue-600' },
    sales: { label: 'Satış', color: 'bg-emerald-100 text-emerald-600' },
    marketing: { label: 'Pazarlama', color: 'bg-pink-100 text-pink-600' },
    legal: { label: 'Hukuk', color: 'bg-amber-100 text-amber-600' },
    technology: { label: 'Teknoloji', color: 'bg-cyan-100 text-cyan-600' },
    certification: { label: 'Sertifika', color: 'bg-violet-100 text-violet-600' },
}

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; stars: number }> = {
    beginner: { label: 'Başlangıç', color: 'text-emerald-600', stars: 1 },
    intermediate: { label: 'Orta', color: 'text-amber-600', stars: 2 },
    advanced: { label: 'İleri', color: 'text-red-600', stars: 3 },
}

const CONTENT_TYPE_ICONS: Record<string, any> = {
    video: Video,
    article: FileText,
    quiz: HelpCircle,
    mixed: BookOpen,
}

export function TrainingDashboard({ courses, progress, certificates, isManager }: Props) {
    const router = useRouter()
    const [showNewCourse, setShowNewCourse] = useState(false)
    const [saving, setSaving] = useState(false)
    const [filterCat, setFilterCat] = useState('all')

    // KPI calculations
    const completedCourses = new Set<string>()
    const completedLessons = progress.filter(p => p.status === 'completed')
    completedLessons.forEach(p => {
        const course = courses.find(c => c.id === p.course_id)
        if (course) {
            const totalLessons = course.training_lessons?.length || 0
            const done = completedLessons.filter(l => l.course_id === p.course_id).length
            if (done >= totalLessons && totalLessons > 0) completedCourses.add(p.course_id)
        }
    })

    const totalDuration = courses.reduce((s, c) => s + (c.duration_minutes || 0), 0)
    const mandatoryCount = courses.filter(c => c.is_mandatory && c.is_published).length
    const mandatoryComplete = courses.filter(c => c.is_mandatory && completedCourses.has(c.id)).length

    const filteredCourses = filterCat === 'all' ? courses : courses.filter(c => c.category === filterCat)

    function getCourseProgress(courseId: string) {
        const course = courses.find(c => c.id === courseId)
        const totalLessons = course?.training_lessons?.length || 0
        if (!totalLessons) return { completed: 0, total: 0, pct: 0 }
        const done = completedLessons.filter(l => l.course_id === courseId).length
        return { completed: done, total: totalLessons, pct: Math.round((done / totalLessons) * 100) }
    }

    // New Course form state
    const [cTitle, setCTitle] = useState('')
    const [cDesc, setCDesc] = useState('')
    const [cCategory, setCCategory] = useState('general')
    const [cDifficulty, setCDifficulty] = useState('beginner')
    const [cType, setCType] = useState('video')
    const [cUrl, setCUrl] = useState('')
    const [cDuration, setCDuration] = useState(30)
    const [cMandatory, setCMandatory] = useState(false)
    const [cPublished, setCPublished] = useState(false)

    async function handleCreateCourse() {
        setSaving(true)
        try {
            const fd = new FormData()
            fd.set('title', cTitle)
            fd.set('description', cDesc)
            fd.set('category', cCategory)
            fd.set('difficulty', cDifficulty)
            fd.set('content_type', cType)
            fd.set('content_url', cUrl)
            fd.set('duration_minutes', String(cDuration))
            fd.set('is_mandatory', String(cMandatory))
            fd.set('is_published', String(cPublished))
            await createCourse(fd)
            toast.success('Kurs oluşturuldu')
            setShowNewCourse(false)
            setCTitle(''); setCDesc(''); setCUrl('')
            router.refresh()
        } catch (err: any) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-blue-600">{courses.filter(c => c.is_published).length}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Toplam Kurs</p>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-emerald-600">{completedCourses.size}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Tamamlanan</p>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                <Award className="h-4 w-4 text-amber-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-amber-600">{certificates.length}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Sertifika</p>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-violet-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-violet-600">{Math.round(totalDuration / 60)}s</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Toplam Süre</p>
                    </CardContent>
                </Card>
            </div>

            {/* Mandatory Progress */}
            {mandatoryCount > 0 && (
                <Card className="border border-amber-200 bg-amber-50/50 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-amber-800">⚠️ Zorunlu Eğitimler</span>
                            <span className="text-xs font-bold text-amber-600">{mandatoryComplete}/{mandatoryCount}</span>
                        </div>
                        <div className="h-2.5 bg-amber-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${mandatoryCount ? (mandatoryComplete / mandatoryCount) * 100 : 0}%` }} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filter + Action */}
            <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setFilterCat('all')} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all", filterCat === 'all' ? "bg-slate-900 text-white" : "bg-white text-slate-500 border hover:bg-slate-50")}>
                    Tümü
                </button>
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                    <button key={k} onClick={() => setFilterCat(k)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all", filterCat === k ? "bg-slate-900 text-white" : "bg-white text-slate-500 border hover:bg-slate-50")}>
                        {v.label}
                    </button>
                ))}
                <div className="flex-1" />
                {isManager && (
                    <Button onClick={() => setShowNewCourse(true)} className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> Kurs Ekle
                    </Button>
                )}
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map(course => {
                    const catCfg = CATEGORY_CONFIG[course.category] || CATEGORY_CONFIG.general
                    const diffCfg = DIFFICULTY_CONFIG[course.difficulty] || DIFFICULTY_CONFIG.beginner
                    const ContentIcon = CONTENT_TYPE_ICONS[course.content_type] || BookOpen
                    const prog = getCourseProgress(course.id)
                    const hasCert = certificates.some(c => c.course_id === course.id)
                    const isComplete = completedCourses.has(course.id)

                    return (
                        <Card key={course.id} className={cn("border shadow-sm hover:shadow-md transition-all overflow-hidden",
                            !course.is_published && "opacity-60",
                            isComplete && "ring-1 ring-emerald-300"
                        )}>
                            {/* Thumbnail */}
                            <div className="h-36 bg-gradient-to-br from-blue-600 via-violet-600 to-emerald-500 relative flex items-center justify-center">
                                <ContentIcon className="h-12 w-12 text-white/30" />
                                {course.is_mandatory && (
                                    <Badge className="absolute top-2 left-2 bg-red-500 text-white text-[8px]">Zorunlu</Badge>
                                )}
                                {!course.is_published && (
                                    <Badge className="absolute top-2 right-2 bg-slate-700 text-white text-[8px]">Taslak</Badge>
                                )}
                                {isComplete && (
                                    <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                )}
                                <div className="absolute bottom-2 right-2 bg-black/50 rounded-lg px-2 py-0.5 backdrop-blur-sm">
                                    <span className="text-[10px] text-white font-bold">{course.duration_minutes || 0} dk</span>
                                </div>
                            </div>
                            <CardContent className="p-4 space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <Badge className={cn("text-[8px]", catCfg.color)}>{catCfg.label}</Badge>
                                    <span className={cn("text-[9px] font-bold", diffCfg.color)}>
                                        {'⭐'.repeat(diffCfg.stars)} {diffCfg.label}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold">{course.title}</h3>
                                {course.description && (
                                    <p className="text-[10px] text-muted-foreground line-clamp-2">{course.description}</p>
                                )}

                                {/* Progress bar */}
                                {prog.total > 0 && (
                                    <div>
                                        <div className="flex justify-between text-[9px] mb-1">
                                            <span className="text-muted-foreground">{prog.completed}/{prog.total} ders</span>
                                            <span className={cn("font-bold", prog.pct === 100 ? "text-emerald-600" : "text-blue-600")}>{prog.pct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all", prog.pct === 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${prog.pct}%` }} />
                                        </div>
                                    </div>
                                )}

                                {hasCert && (
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] gap-1">
                                        <Trophy className="h-2.5 w-2.5" /> Sertifika Kazanıldı
                                    </Badge>
                                )}

                                <div className="flex items-center justify-between text-[10px] pt-2 border-t text-muted-foreground">
                                    <span>{course.training_lessons?.length || 0} ders</span>
                                    {course.profiles?.full_name && <span>📝 {course.profiles.full_name}</span>}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {filteredCourses.length === 0 && (
                    <div className="col-span-full text-center py-16 text-muted-foreground">
                        <GraduationCap className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium">Henüz kurs yok</p>
                        {isManager && <p className="text-sm mt-1">İlk kursu oluşturarak başlayın.</p>}
                    </div>
                )}
            </div>

            {/* Certificates Section */}
            {certificates.length > 0 && (
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            Sertifikalarım
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {certificates.map(cert => (
                                <div key={cert.id} className="p-4 rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 text-center">
                                    <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                    <p className="text-xs font-bold">{cert.training_courses?.title}</p>
                                    <p className="text-[9px] text-muted-foreground mt-1">Sertifika No: {cert.certificate_number}</p>
                                    <p className="text-[9px] text-muted-foreground">{new Date(cert.issued_at).toLocaleDateString('tr-TR')}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create Course Dialog */}
            <Dialog open={showNewCourse} onOpenChange={setShowNewCourse}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Yeni Kurs Oluştur</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label className="text-xs font-bold">Kurs Başlığı *</Label>
                            <Input value={cTitle} onChange={e => setCTitle(e.target.value)} placeholder="Örn: Gayrimenkul Hukuku 101" className="mt-1" />
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Açıklama</Label>
                            <textarea value={cDesc} onChange={e => setCDesc(e.target.value)} rows={3}
                                className="w-full px-3 py-2 rounded-lg border text-sm resize-none mt-1" placeholder="Kurs hakkında kısa açıklama..."
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label className="text-[10px] font-bold">Kategori</Label>
                                <select value={cCategory} onChange={e => setCCategory(e.target.value)} className="w-full h-9 px-2 rounded-lg border text-xs bg-white mt-1">
                                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold">Zorluk</Label>
                                <select value={cDifficulty} onChange={e => setCDifficulty(e.target.value)} className="w-full h-9 px-2 rounded-lg border text-xs bg-white mt-1">
                                    {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold">İçerik Tipi</Label>
                                <select value={cType} onChange={e => setCType(e.target.value)} className="w-full h-9 px-2 rounded-lg border text-xs bg-white mt-1">
                                    <option value="video">📹 Video</option>
                                    <option value="article">📄 Makale</option>
                                    <option value="quiz">❓ Quiz</option>
                                    <option value="mixed">📚 Karma</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">İçerik URL (opsiyonel)</Label>
                            <Input value={cUrl} onChange={e => setCUrl(e.target.value)} placeholder="https://youtube.com/..." className="mt-1" />
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Süre (dakika)</Label>
                            <Input type="number" value={cDuration} onChange={e => setCDuration(Number(e.target.value))} className="mt-1" />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={cMandatory} onChange={e => setCMandatory(e.target.checked)} className="rounded" />
                                <span className="text-xs font-bold">Zorunlu</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={cPublished} onChange={e => setCPublished(e.target.checked)} className="rounded" />
                                <span className="text-xs font-bold">Yayınla</span>
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowNewCourse(false)}>İptal</Button>
                        <Button onClick={handleCreateCourse} disabled={saving || !cTitle} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? 'Oluşturuluyor...' : 'Kurs Oluştur'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
