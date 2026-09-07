'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import {
    Camera,
    Upload,
    X,
    Trash2,
    Loader2,
    ZoomIn,
    ImagePlus,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Download,
    Video,
    FileText,
    Folder,
    FolderPlus,
    Play,
    ExternalLink,
    Filter,
    Layers,
    CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
    saveConstructionMediaBatch,
    uploadConstructionPhotos,
    deleteConstructionPhoto,
    deleteConstructionFolder
} from '@/app/[locale]/(dashboard)/projects/[id]/documents-actions'
import { cn } from '@/lib/utils'

export interface ConstructionMediaItem {
    id: string
    file_url: string
    file_name: string
    file_type?: string
    file_size?: number
    document_name: string
    description: string | null
    folder_name?: string | null
    progress_date?: string | null
    progress_percentage?: number | null
    created_at: string
    uploader_name?: string
}

interface ConstructionGalleryProps {
    projectId: string
    photos: ConstructionMediaItem[]
    isAdmin: boolean
}

export function ConstructionGallery({ projectId, photos: initialItems, isAdmin }: ConstructionGalleryProps) {
    const [items, setItems] = useState<ConstructionMediaItem[]>(initialItems)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgressText, setUploadProgressText] = useState('')
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [previewUrls, setPreviewUrls] = useState<string[]>([])
    const [caption, setCaption] = useState('')
    const [selectedFolder, setSelectedFolder] = useState<string>('all')
    const [customFolders, setCustomFolders] = useState<string[]>([])
    const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)
    const [newFolderNameInput, setNewFolderNameInput] = useState('')
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [showUploadArea, setShowUploadArea] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'document'>('all')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Helper functions for media classification
    const isVideo = (item: { file_type?: string; file_name: string }) =>
        item.file_type?.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(item.file_name)

    const isDoc = (item: { file_type?: string; file_name: string }) =>
        item.file_type?.startsWith('application/pdf') ||
        item.file_type?.includes('word') ||
        item.file_type?.includes('document') ||
        /\.(pdf|doc|docx|xls|xlsx)$/i.test(item.file_name)

    const isImage = (item: { file_type?: string; file_name: string }) =>
        !isVideo(item) && !isDoc(item)

    // Grouping by folder
    const folderMap = useMemo(() => {
        const map = new Map<string, {
            name: string
            items: ConstructionMediaItem[]
            imageCount: number
            videoCount: number
            docCount: number
        }>()

        // Include any empty custom folders created during this session
        customFolders.forEach(name => {
            if (name && !map.has(name)) {
                map.set(name, {
                    name,
                    items: [],
                    imageCount: 0,
                    videoCount: 0,
                    docCount: 0
                })
            }
        })

        items.forEach(item => {
            const folder = (item.folder_name && item.folder_name.trim()) || 'Genel İlerlemeler'
            if (!map.has(folder)) {
                map.set(folder, {
                    name: folder,
                    items: [],
                    imageCount: 0,
                    videoCount: 0,
                    docCount: 0
                })
            }
            const f = map.get(folder)!
            f.items.push(item)

            if (isVideo(item)) f.videoCount++
            else if (isDoc(item)) f.docCount++
            else f.imageCount++
        })

        return map
    }, [items, customFolders])

    const availableFolders = useMemo(() => Array.from(folderMap.values()), [folderMap])

    const handleCreateFolder = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const trimmed = newFolderNameInput.trim()
        if (!trimmed) {
            toast.error('Lütfen bir klasör adı girin.')
            return
        }
        if (!customFolders.includes(trimmed)) {
            setCustomFolders(prev => [...prev, trimmed])
        }
        setSelectedFolder(trimmed)
        setNewFolderNameInput('')
        setIsNewFolderOpen(false)
        setShowUploadArea(true)
        toast.success(`"${trimmed}" klasörü oluşturuldu. Artık içine dosya yükleyebilirsiniz.`)
    }

    // Filtered items
    const filteredItems = useMemo(() => {
        let res = items

        if (selectedFolder !== 'all') {
            res = res.filter(i => ((i.folder_name && i.folder_name.trim()) || 'Genel İlerlemeler') === selectedFolder)
        }

        if (mediaFilter === 'image') res = res.filter(isImage)
        if (mediaFilter === 'video') res = res.filter(isVideo)
        if (mediaFilter === 'document') res = res.filter(isDoc)

        return res
    }, [items, selectedFolder, mediaFilter])

    // Group items by date for display
    const itemsByDate = useMemo(() => {
        return filteredItems.reduce((acc, item) => {
            const dateStr = item.progress_date || item.created_at
            const date = new Date(dateStr).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            if (!acc[date]) acc[date] = []
            acc[date].push(item)
            return acc
        }, {} as Record<string, ConstructionMediaItem[]>)
    }, [filteredItems])

    const handleFileSelect = useCallback((files: FileList | File[]) => {
        const fileList = Array.from(files).filter(f => {
            const isImg = f.type.startsWith('image/')
            const isVid = f.type.startsWith('video/')
            const isDc = f.type === 'application/pdf' ||
                f.type.includes('word') ||
                /\.(pdf|doc|docx|xls|xlsx)$/i.test(f.name)
            return isImg || isVid || isDc
        })

        if (fileList.length === 0) {
            toast.error('Lütfen resim, video veya PDF/belge dosyası seçin.')
            return
        }

        setSelectedFiles(prev => [...prev, ...fileList])
        const newPreviews = fileList.map(f => {
            if (f.type.startsWith('image/')) return URL.createObjectURL(f)
            return ''
        })
        setPreviewUrls(prev => [...prev, ...newPreviews])
    }, [])

    const removeSelectedFile = (index: number) => {
        if (previewUrls[index]) URL.revokeObjectURL(previewUrls[index])
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
        setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Lütfen yüklenecek en az bir dosya seçin.')
            return
        }

        const targetFolder = selectedFolder !== 'all' ? selectedFolder : (availableFolders[0]?.name || 'Genel İlerlemeler')

        setIsUploading(true)
        setUploadProgressText('Dosyalar yükleniyor...')

        try {
            const supabase = createClient()
            const payloadItems = []

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i]
                setUploadProgressText(`Dosya ${i + 1}/${selectedFiles.length} yükleniyor (${file.name})...`)

                const isVid = file.type.startsWith('video/')
                const isDc = file.type === 'application/pdf' || /\.(pdf|doc|docx|xls|xlsx)$/i.test(file.name)
                const prefix = isVid ? 'video' : isDc ? 'doc' : 'img'
                const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase()
                const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
                const filePath = `construction-media/${projectId}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('crm-images')
                    .upload(filePath, file, { upsert: true })

                if (uploadError) {
                    console.error('Storage upload error for', file.name, uploadError)
                    toast.error(`${file.name} yüklenemedi: ${uploadError.message}`)
                    continue
                }

                const { data: urlData } = supabase.storage
                    .from('crm-images')
                    .getPublicUrl(filePath)

                const defaultTitle = isVid
                    ? `Şantiye Videosu - ${new Date().toLocaleDateString('tr-TR')}`
                    : isDc
                        ? file.name
                        : `Şantiye Fotoğrafı - ${new Date().toLocaleDateString('tr-TR')}`

                payloadItems.push({
                    fileName: file.name,
                    fileUrl: urlData.publicUrl,
                    fileType: file.type || (isVid ? 'video/mp4' : isDc ? 'application/pdf' : 'image/jpeg'),
                    fileSize: file.size,
                    documentName: caption || defaultTitle,
                    description: caption || undefined,
                    folderName: targetFolder,
                    progressDate: new Date().toISOString().split('T')[0],
                    progressPercentage: null
                })
            }

            if (payloadItems.length === 0) {
                toast.error('Hiçbir dosya yüklenemedi.')
                setIsUploading(false)
                setUploadProgressText('')
                return
            }

            setUploadProgressText('Kayıt tamamlanıyor...')
            const result = await saveConstructionMediaBatch(projectId, payloadItems)

            if (result?.success) {
                toast.success(`${payloadItems.length} dosya "${targetFolder}" klasörüne başarıyla eklendi!`)
                previewUrls.forEach(url => { if (url) URL.revokeObjectURL(url) })
                setSelectedFiles([])
                setPreviewUrls([])
                setCaption('')
                setShowUploadArea(false)

                if (typeof window !== 'undefined') {
                    sessionStorage.setItem(`project_tab_${projectId}`, 'construction')
                    if (!window.location.search.includes('tab=')) {
                        window.location.href = `${window.location.pathname}?tab=construction`
                    } else {
                        window.location.reload()
                    }
                }
            } else {
                toast.error(result?.error || 'Kayıt sırasında hata oluştu.')
            }
        } catch (err: any) {
            console.error('Upload error:', err)
            toast.error(err?.message || 'Yükleme sırasında bir hata oluştu.')
        } finally {
            setIsUploading(false)
            setUploadProgressText('')
        }
    }

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Bu medyayı silmek istediğinize emin misiniz?')) return

        const result = await deleteConstructionPhoto(itemId, projectId)
        if (result?.success) {
            setItems(prev => prev.filter(p => p.id !== itemId))
            toast.success('Dosya silindi.')
            if (lightboxIndex !== null) setLightboxIndex(null)
        } else {
            toast.error(result?.error || 'Silme başarısız.')
        }
    }

    const handleDeleteFolder = async (folderName: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm(`"${folderName}" klasörünü ve içindeki TÜM medya dosyalarını silmek istediğinize emin misiniz?`)) return

        const result = await deleteConstructionFolder(projectId, folderName)
        if (result?.success) {
            setItems(prev => prev.filter(p => (p.folder_name || 'Genel İlerlemeler') !== folderName))
            if (selectedFolder === folderName) setSelectedFolder('all')
            toast.success('Klasör ve içeriği silindi.')
        } else {
            toast.error('Klasör silinemedi.')
        }
    }

    // Lightbox navigation
    const openLightbox = (index: number) => setLightboxIndex(index)
    const closeLightbox = () => setLightboxIndex(null)
    const prevItem = () => setLightboxIndex(prev => prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null)
    const nextItem = () => setLightboxIndex(prev => prev !== null ? (prev + 1) % filteredItems.length : null)

    const activeLightboxItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null

    return (
        <>
            <Card className="border border-slate-200/80 shadow-xs">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-black text-slate-900">
                            <Camera className="w-5 h-5 text-indigo-600" />
                            Şantiye Görüntüleri & İlerleme Belgeleri
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            İnşaat aşamaları, fotoğraf, video ve teknik ilerleme evrakları.
                            {items.length > 0 && (
                                <span className="ml-2 inline-flex items-center gap-1.5 font-semibold text-slate-700">
                                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-800">
                                        {items.length} Dosya
                                    </Badge>
                                    <Badge variant="outline" className="text-xs text-indigo-700 border-indigo-200 bg-indigo-50/50">
                                        {availableFolders.length} İlerleme Klasörü
                                    </Badge>
                                </span>
                            )}
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {isAdmin && (
                            <Button
                                onClick={() => setShowUploadArea(!showUploadArea)}
                                variant={showUploadArea ? "secondary" : "default"}
                                className={cn(
                                    "text-xs font-bold gap-1.5",
                                    !showUploadArea && "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                                )}
                            >
                                {showUploadArea ? (
                                    <><X className="w-4 h-4" /> Vazgeç</>
                                ) : (
                                    <><ImagePlus className="w-4 h-4" /> Medya / İlerleme Ekle</>
                                )}
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Folder Navigation & Overview Cards */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Folder className="w-3.5 h-3.5 text-indigo-500" />
                                İlerleme Klasörleri
                            </span>

                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setIsNewFolderOpen(true)}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 hover:underline"
                                >
                                    <FolderPlus className="w-3.5 h-3.5" />
                                    + Yeni Klasör Aç
                                </button>
                            )}
                        </div>

                        {/* Folder Pills Bar */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                            <button
                                type="button"
                                onClick={() => setSelectedFolder('all')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border",
                                    selectedFolder === 'all'
                                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <Layers className="w-3.5 h-3.5" />
                                <span>Tüm Klasörler</span>
                                <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", selectedFolder === 'all' ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600")}>
                                    {items.length}
                                </span>
                            </button>

                            {availableFolders.map(folder => {
                                const isSelected = selectedFolder === folder.name
                                return (
                                    <div
                                        key={folder.name}
                                        onClick={() => setSelectedFolder(folder.name)}
                                        className={cn(
                                            "group px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 border cursor-pointer select-none",
                                            isSelected
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        <Folder className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-indigo-500")} />
                                        <span>{folder.name}</span>

                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.2 rounded-full",
                                            isSelected ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-600"
                                        )}>
                                            {folder.items.length}
                                        </span>

                                        {isAdmin && folder.name !== 'Genel İlerlemeler' && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteFolder(folder.name, e)}
                                                className={cn(
                                                    "opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white rounded p-0.5 transition-all",
                                                    isSelected ? "text-indigo-200" : "text-slate-400"
                                                )}
                                                title="Klasörü Sil"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                )
                            })}

                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setIsNewFolderOpen(true)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border border-dashed border-indigo-300 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                                >
                                    <FolderPlus className="w-3.5 h-3.5" />
                                    <span>+ Yeni Klasör</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Media Type Filter Tabs (Hepsi, Fotoğraflar, Videolar, Belgeler) */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1">Filtrele:</span>
                            {(['all', 'image', 'video', 'document'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setMediaFilter(type)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md font-semibold text-xs transition-colors flex items-center gap-1",
                                        mediaFilter === type
                                            ? "bg-slate-800 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    )}
                                >
                                    {type === 'all' && <span>Tümü ({filteredItems.length})</span>}
                                    {type === 'image' && <span>📷 Fotoğraf</span>}
                                    {type === 'video' && <span>📹 Video</span>}
                                    {type === 'document' && <span>📄 Belge / PDF</span>}
                                </button>
                            ))}
                        </div>

                        {selectedFolder !== 'all' && (
                            <button
                                type="button"
                                onClick={() => setSelectedFolder('all')}
                                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" /> Tüm Klasörlere Dön
                            </button>
                        )}
                    </div>

                    {/* Upload Drawer / Section */}
                    {showUploadArea && (
                        <div className="space-y-4 p-5 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Upload className="w-4 h-4 text-indigo-600" />
                                        Şantiye Dosyası Yükle
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Seçilen klasöre fotoğraf, video ve teknik inşaat belgelerini yükleyin.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowUploadArea(false)}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Folder & Caption Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                        <span>Yüklenecek Klasör</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsNewFolderOpen(true)}
                                            className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold flex items-center gap-1"
                                        >
                                            <FolderPlus className="w-3 h-3" /> + Yeni Klasör Aç
                                        </button>
                                    </Label>
                                    <select
                                        value={selectedFolder === 'all' ? (availableFolders[0]?.name || 'Genel İlerlemeler') : selectedFolder}
                                        onChange={(e) => setSelectedFolder(e.target.value)}
                                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {availableFolders.map(f => (
                                            <option key={f.name} value={f.name}>{f.name}</option>
                                        ))}
                                        {availableFolders.length === 0 && (
                                            <option value="Genel İlerlemeler">Genel İlerlemeler</option>
                                        )}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">Açıklama / Not (Opsiyonel)</Label>
                                    <Input
                                        placeholder="Örn: Blok A beton dökümü..."
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        className="h-9 text-xs bg-white border-slate-200"
                                    />
                                </div>
                            </div>

                            {/* Drop Zone */}
                            <div
                                className={cn(
                                    "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all bg-white",
                                    isDragOver
                                        ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
                                        : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50'
                                )}
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={(e) => {
                                    e.preventDefault()
                                    setIsDragOver(false)
                                    if (e.dataTransfer.files) handleFileSelect(e.dataTransfer.files)
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-slate-800">
                                    Fotoğraf, video veya belgeleri buraya sürükleyin ya da <span className="text-indigo-600 underline">seçin</span>
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    JPG, PNG, WebP · MP4, MOV, WebM · PDF, DOC, DOCX
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*,.pdf,.doc,.docx"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                                />
                            </div>

                            {/* Selected Files Preview List */}
                            {selectedFiles.length > 0 && (
                                <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">
                                            Seçilen Dosyalar ({selectedFiles.length})
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                previewUrls.forEach(url => { if (url) URL.revokeObjectURL(url) })
                                                setSelectedFiles([])
                                                setPreviewUrls([])
                                            }}
                                            className="text-xs text-red-600 hover:underline font-semibold"
                                        >
                                            Hepsini Temizle
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                                        {selectedFiles.map((file, i) => {
                                            const isVid = file.type.startsWith('video/')
                                            const imgUrl = previewUrls[i]

                                            return (
                                                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-2 text-center">
                                                    {imgUrl ? (
                                                        <img src={imgUrl} alt="" className="w-full h-full object-cover rounded" />
                                                    ) : isVid ? (
                                                        <div className="flex flex-col items-center justify-center text-indigo-600">
                                                            <Video className="w-8 h-8 mb-1" />
                                                            <span className="text-[10px] font-bold uppercase text-slate-700">Video</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center text-amber-600">
                                                            <FileText className="w-8 h-8 mb-1" />
                                                            <span className="text-[10px] font-bold uppercase text-slate-700">Belge</span>
                                                        </div>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeSelectedFile(i) }}
                                                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                                                        <p className="text-[9px] text-white truncate">{file.name}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Upload Trigger Button */}
                                    <Button
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 gap-2 shadow-sm"
                                    >
                                        {isUploading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> {uploadProgressText || 'Yükleniyor...'}</>
                                        ) : (
                                            <><Upload className="w-4 h-4" /> {selectedFiles.length} Dosyayı "{selectedFolder !== 'all' ? selectedFolder : (availableFolders[0]?.name || 'Genel İlerlemeler')}" Klasörüne Yükle</>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Gallery Items Display */}
                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <Camera className="w-14 h-14 mb-3 opacity-20 text-slate-500" />
                            <p className="text-base font-bold text-slate-700">Henüz medya eklenmemiş</p>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                {selectedFolder !== 'all'
                                    ? `"${selectedFolder}" klasöründe seçilen filtreye uygun dosya bulunamadı.`
                                    : 'Güncel şantiye fotoğrafları, videolar veya teknik belgeler eklemek için yukarıdaki butonu kullanın.'}
                            </p>
                            {isAdmin && (
                                <Button
                                    size="sm"
                                    onClick={() => setShowUploadArea(true)}
                                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                                >
                                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Dosya Yükle
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(itemsByDate).map(([date, dateItems]) => (
                                <div key={date} className="space-y-3">
                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <CalendarDays className="w-4 h-4 text-indigo-600" />
                                        <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">{date}</h3>
                                        <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-600">
                                            {dateItems.length} dosya
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                                        {dateItems.map((item) => {
                                            const globalIndex = filteredItems.findIndex(p => p.id === item.id)
                                            const itemIsVideo = isVideo(item)
                                            const itemIsDoc = isDoc(item)

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200/90 bg-slate-900 cursor-pointer shadow-xs hover:shadow-lg transition-all hover:scale-[1.02]"
                                                    onClick={() => openLightbox(globalIndex)}
                                                >
                                                    {itemIsVideo ? (
                                                        <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                                                            <video
                                                                src={item.file_url}
                                                                preload="metadata"
                                                                className="w-full h-full object-cover opacity-80"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                                                <div className="h-10 w-10 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                                                </div>
                                                            </div>
                                                            <Badge className="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-black tracking-wider uppercase border-none">
                                                                VIDEO
                                                            </Badge>
                                                        </div>
                                                    ) : itemIsDoc ? (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50/90 p-3 text-center">
                                                            <FileText className="w-12 h-12 text-amber-600 mb-1.5" />
                                                            <p className="text-xs font-bold text-amber-950 line-clamp-2 px-1">
                                                                {item.description || item.document_name}
                                                            </p>
                                                            <Badge className="mt-2 bg-amber-200 text-amber-900 text-[9px] font-bold border-amber-300">
                                                                BELGE / PDF
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={item.file_url}
                                                            alt={item.document_name}
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            loading="lazy"
                                                        />
                                                    )}

                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                                            <p className="text-xs text-white truncate font-bold">{item.description || item.document_name}</p>
                                                            <div className="flex items-center justify-between text-[10px] text-white/70 mt-0.5">
                                                                <span>{item.folder_name || 'Genel'}</span>
                                                                {item.uploader_name && <span>{item.uploader_name}</span>}
                                                            </div>
                                                        </div>

                                                        {/* Top right icon */}
                                                        <div className="absolute top-2 right-2">
                                                            <div className="h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white/90 shadow-sm">
                                                                <ZoomIn className="w-3.5 h-3.5" />
                                                            </div>
                                                        </div>

                                                        {/* Delete Button */}
                                                        {isAdmin && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteItem(item.id)
                                                                }}
                                                                className="absolute top-2 left-2 p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm"
                                                                title="Dosyayı Sil"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rich Lightbox / Player Modal */}
            {activeLightboxItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={closeLightbox}
                >
                    {/* Close button */}
                    <button
                        className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20"
                        onClick={closeLightbox}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Nav prev */}
                    {filteredItems.length > 1 && (
                        <button
                            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20"
                            onClick={(e) => { e.stopPropagation(); prevItem() }}
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}

                    {/* Media Content Display */}
                    <div className="max-w-[92vw] max-h-[88vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {isVideo(activeLightboxItem) ? (
                            <video
                                src={activeLightboxItem.file_url}
                                controls
                                autoPlay
                                className="max-w-full max-h-[75vh] rounded-xl shadow-2xl bg-black"
                            />
                        ) : isDoc(activeLightboxItem) ? (
                            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md text-center">
                                <FileText className="w-20 h-20 text-amber-600 mb-4" />
                                <h3 className="text-lg font-black text-slate-900 mb-2">
                                    {activeLightboxItem.description || activeLightboxItem.document_name}
                                </h3>
                                <p className="text-xs text-slate-500 mb-6">
                                    Klasör: <span className="font-semibold text-slate-700">{activeLightboxItem.folder_name || 'Genel'}</span>
                                </p>
                                <a
                                    href={activeLightboxItem.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
                                >
                                    <ExternalLink className="w-4 h-4" /> Belgeyi Yeni Sekmede Aç / İndir
                                </a>
                            </div>
                        ) : (
                            <img
                                src={activeLightboxItem.file_url}
                                alt={activeLightboxItem.document_name}
                                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
                            />
                        )}

                        {/* Details Footer */}
                        <div className="mt-4 text-center text-white max-w-xl">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                {activeLightboxItem.folder_name && (
                                    <Badge className="bg-indigo-600/80 text-white text-[10px] font-bold">
                                        📁 {activeLightboxItem.folder_name}
                                    </Badge>
                                )}
                                {activeLightboxItem.progress_percentage !== null && activeLightboxItem.progress_percentage !== undefined && (
                                    <Badge className="bg-emerald-600/80 text-white text-[10px] font-bold">
                                        %{activeLightboxItem.progress_percentage} Tamamlandı
                                    </Badge>
                                )}
                            </div>

                            <p className="text-sm font-bold text-slate-100">
                                {activeLightboxItem.description || activeLightboxItem.document_name}
                            </p>
                            <p className="text-white/60 text-xs mt-1">
                                {new Date(activeLightboxItem.progress_date || activeLightboxItem.created_at).toLocaleDateString('tr-TR', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                                {activeLightboxItem.uploader_name && ` · Yükleyen: ${activeLightboxItem.uploader_name}`}
                            </p>

                            <div className="flex items-center justify-center gap-3 mt-3">
                                <span className="text-white/40 text-xs font-mono">{lightboxIndex! + 1} / {filteredItems.length}</span>
                                <a
                                    href={activeLightboxItem.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" /> İndir
                                </a>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDeleteItem(activeLightboxItem.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Sil
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Nav next */}
                    {filteredItems.length > 1 && (
                        <button
                            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20"
                            onClick={(e) => { e.stopPropagation(); nextItem() }}
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    )}
                </div>
            )}

            {/* Quick New Folder Dialog */}
            <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                            <FolderPlus className="w-4 h-4 text-indigo-600" />
                            Yeni İlerleme Klasörü
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Label className="text-xs font-semibold text-slate-700">Klasör Adı</Label>
                        <Input
                            placeholder="Örn: Blok A - Kaba İnşaat, 1. Kat..."
                            value={newFolderNameInput}
                            onChange={(e) => setNewFolderNameInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleCreateFolder()
                                }
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setIsNewFolderOpen(false)}>
                            Vazgeç
                        </Button>
                        <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                            onClick={() => handleCreateFolder()}
                        >
                            Klasör Oluştur
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
