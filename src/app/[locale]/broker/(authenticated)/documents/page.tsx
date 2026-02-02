import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Library,
    FileText,
    Download,
    Search,
    Video,
    Map,
    Scale,
    GripVertical,
    Building2,
    Eye,
    BadgeTurkishLira,
    MessageCircle
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { getWhatsAppLink, MessageTemplates } from '@/lib/whatsapp'

export default async function BrokerDocumentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch documents
    const { data: documents } = await supabase
        .from('document_library')
        .select('*, projects(name)')
        .order('created_at', { ascending: false })

    const categories = [
        { id: 'all', label: 'Tümü', icon: Library },
        { id: 'Brochure', label: 'Broşürler', icon: FileText },
        { id: 'Floor Plan', label: 'Kat Planları', icon: Map },
        { id: 'Price List', label: 'Fiyat Listeleri', icon: BadgeTurkishLira },
        { id: '3D/Virtual', label: '3D & Görsel', icon: Video },
        { id: 'Legal', label: 'Hukuki / Sözleşme', icon: Scale },
    ]

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Satış Materyalleri</h1>
                <p className="text-slate-500 text-sm">Satış süreçlerinizde kullanabileceğiniz tüm görsel ve teknik dökümanlar.</p>
            </div>

            {/* Search and Quick Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Döküman adı veya proje ara..." className="pl-9 rounded-xl border-slate-200" />
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto h-auto grid grid-cols-2 sm:flex sm:flex-wrap gap-1">
                    {categories.map((cat) => (
                        <TabsTrigger
                            key={cat.id}
                            value={cat.id}
                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium transition-all"
                        >
                            {cat.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {categories.map((cat) => (
                    <TabsContent key={cat.id} value={cat.id} className="mt-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {documents && documents.filter(d => cat.id === 'all' || d.category === cat.id).length > 0 ? (
                                documents.filter(d => cat.id === 'all' || d.category === cat.id).map((doc) => (
                                    <Card key={doc.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                                        <div className="aspect-video bg-slate-100 relative group-hover:bg-slate-200/50 transition-colors">
                                            {doc.thumbnail_url ? (
                                                <img src={doc.thumbnail_url} alt={doc.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <FileText className="h-12 w-12 opacity-20" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 bg-white/90 hover:bg-white text-blue-600 shadow-xl">
                                                    <Eye className="h-5 w-5" />
                                                </Button>
                                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                                    <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 bg-white/90 hover:bg-white text-blue-600 shadow-xl">
                                                        <Download className="h-5 w-5" />
                                                    </Button>
                                                </a>
                                                <a
                                                    href={getWhatsAppLink('', MessageTemplates.shareDocument(doc.projects?.name || 'Proje', doc.name, doc.file_url))}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 bg-white/90 hover:bg-white text-green-600 shadow-xl">
                                                        <MessageCircle className="h-5 w-5" />
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>
                                        <CardContent className="p-4">
                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{doc.category}</p>
                                            <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{doc.name}</h3>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium italic">
                                                    <Building2 className="h-3 w-3" />
                                                    {doc.projects?.name || 'Tüm Projeler'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-2xl">
                                    <Library className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                    Bu kategoride döküman bulunamadı.
                                </div>
                            )}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
