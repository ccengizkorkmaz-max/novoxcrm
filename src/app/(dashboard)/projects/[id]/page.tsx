import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { updateProject, batchCreateUnits } from './actions'
import { uploadDocument, deleteDocument } from './documents-actions'
import { importUnitsFromExcel } from './import-actions'
import { deleteUnit } from '../../inventory/[id]/actions'
import { Globe, ExternalLink, MapPin, FileText, Download, Trash2, Home, Users } from 'lucide-react'
import Link from 'next/link'
import { FormImageUpload } from '@/components/ui/form-image-upload'
import { LocationPicker } from '@/components/location-picker'
import { DocumentUpload } from '@/components/document-upload'
import { BatchUnitCreator } from '@/components/batch-unit-creator'
import { ExcelImport } from '@/components/excel-import'

const AMENITIES_LIST = [
    "Yetişkin Havuzu", "Güvenlik", "Çocuk Yüzme Havuzu", "Yürüyüş Parkuru",
    "Fitness", "Çocuk oyun parkı", "Cafe", "Market", "Tenis kortu", "Basketbol sahası"
]

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ tab?: string }>
}) {
    const supabase = await createClient()
    const { id } = await params
    const { tab } = await searchParams
    const activeTab = tab || 'info'

    // Fetch project
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (projectError || !project) {
        return (
            <div className="p-8 text-center border border-red-200 bg-red-50 rounded-lg text-red-700">
                <h2 className="text-xl font-bold mb-2">Proje Yüklenemedi</h2>
                <p>{projectError?.message || 'Proje bulunamadı.'}</p>
                <Link href="/projects" className="mt-4 inline-block">
                    <Button variant="outline">Listeye Dön</Button>
                </Link>
            </div>
        )
    }

    // Fetch teams separately (Safe fetch)
    const { data: teamAssignments, error: teamsError } = await supabase
        .from('team_project_assignments')
        .select(`
            sales_teams(
                id,
                name,
                region,
                office_name,
                team_members(
                    profiles(full_name, role)
                )
            )
        `)
        .eq('project_id', id)

    if (teamsError) {
        console.warn('Teams could not be fetched (schema might be missing):', teamsError.message)
    }

    // Fetch project documents
    const { data: documents, error: docsError } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false })

    // Fetch uploader names for each document
    if (documents && documents.length > 0) {
        const uploaderIds = [...new Set(documents.map(d => d.uploaded_by).filter(Boolean))]
        const { data: uploaders } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', uploaderIds)

        // Map uploader names to documents
        const uploaderMap = new Map(uploaders?.map(u => [u.id, u.full_name]) || [])
        documents.forEach((doc: any) => {
            doc.uploader_name = uploaderMap.get(doc.uploaded_by) || 'Unknown'
        })
    }

    // Fetch units for this project
    const { data: units } = await supabase
        .from('units')
        .select('*')
        .eq('project_id', id)
        .order('unit_number', { ascending: true })

    async function handleUpdateProject(formData: FormData) {
        'use server'
        await updateProject(formData)
    }

    async function handleDeleteUnit(unitId: string) {
        'use server'
        await deleteUnit(unitId, id)
    }

    async function handleDeleteDocument(docId: string) {
        'use server'
        await deleteDocument(docId, id)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Proje Detayları</h1>
                <Link href="/projects">
                    <Button variant="outline">Listeye Dön</Button>
                </Link>
            </div>

            <Tabs defaultValue={activeTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="info">Proje Bilgileri</TabsTrigger>
                    <TabsTrigger value="units">
                        <Home className="w-4 h-4 mr-2" />
                        Üniteler
                        {units && units.length > 0 && (
                            <Badge variant="secondary" className="ml-2">{units.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="documents">
                        <FileText className="w-4 h-4 mr-2" />
                        Proje Dokümanları
                        {documents && documents.length > 0 && (
                            <Badge variant="secondary" className="ml-2">{documents.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="teams">
                        <Users className="w-4 h-4 mr-2" />
                        Satış Ekipleri
                    </TabsTrigger>
                </TabsList>

                {/* Project Info Tab */}
                <TabsContent value="info" className="space-y-6">
                    <form action={handleUpdateProject}>
                        <input type="hidden" name="id" value={project.id} />

                        <Card>
                            <CardHeader>
                                <CardTitle>Proje Bilgileri</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Project Image */}
                                <div className="space-y-2">
                                    <Label>Proje Görseli</Label>
                                    <FormImageUpload name="image_url" defaultValue={project.image_url} />
                                </div>

                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="project_code">Proje Kodu</Label>
                                        <Input id="project_code" name="project_code" defaultValue={project.project_code} placeholder="Örn: NP4K" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Proje Adı</Label>
                                        <Input id="name" name="name" defaultValue={project.name} required />
                                    </div>
                                </div>

                                {/* Manager, Phase, Status */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="manager_name">Proje Yöneticisi</Label>
                                        <Input id="manager_name" name="manager_name" defaultValue={project.manager_name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phase_count">Etap Sayısı</Label>
                                        <Input id="phase_count" name="phase_count" type="number" defaultValue={project.phase_count} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Proje Durumu</Label>
                                        <select
                                            id="status"
                                            name="status"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            defaultValue={project.status}
                                        >
                                            <option value="Active">Satışa AÇIK</option>
                                            <option value="Planned">Planlanıyor</option>
                                            <option value="Completed">KAPALI</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">Adres</Label>
                                    <Input id="address" name="address" defaultValue={project.address} />
                                </div>

                                {/* Location Picker */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Lokasyon
                                    </Label>
                                    <LocationPicker
                                        address={project.address ? `${project.address}, ${project.district || ''}, ${project.city || ''}`.trim() : ''}
                                        latitude={project.latitude}
                                        longitude={project.longitude}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Lokasyon seçmek için harita ikonuna tıklayın. Seçili lokasyonu görüntülemek için dış bağlantı ikonuna tıklayın.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="district">İlçe</Label>
                                        <Input id="district" name="district" defaultValue={project.district} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">İl</Label>
                                        <Input id="city" name="city" defaultValue={project.city} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ada_no">Ada No</Label>
                                        <Input id="ada_no" name="ada_no" defaultValue={project.ada_no} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="parsel_no">Parsel No</Label>
                                        <Input id="parsel_no" name="parsel_no" defaultValue={project.parsel_no} />
                                    </div>
                                </div>

                                {/* Website */}
                                <div className="space-y-2">
                                    <Label htmlFor="website_url" className="flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Proje Web Sitesi
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input id="website_url" name="website_url" defaultValue={project.website_url} className="flex-1" />
                                        {project.website_url && (
                                            <Link href={project.website_url} target="_blank">
                                                <Button size="icon" variant="outline" type="button">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start_date">Başlama Tarihi</Label>
                                        <Input id="start_date" name="start_date" type="date" defaultValue={project.start_date?.split('T')[0]} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="delivery_date_planned">Teslim Tarihi (Planlanan)</Label>
                                        <Input id="delivery_date_planned" name="delivery_date_planned" type="date" defaultValue={project.delivery_date_planned?.split('T')[0]} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="delivery_date_actual">Teslim Tarihi (Gerçekleşen)</Label>
                                        <Input id="delivery_date_actual" name="delivery_date_actual" type="date" defaultValue={project.delivery_date_actual?.split('T')[0]} />
                                    </div>
                                </div>

                                {/* Amenities */}
                                <div className="space-y-2">
                                    <Label>Projedeki Sosyal Alanlar</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-4 border rounded-lg bg-muted/30">
                                        {AMENITIES_LIST.map((item) => {
                                            const isChecked = project.amenities?.includes(item)
                                            return (
                                                <div key={item} className="flex items-center space-x-2">
                                                    <Checkbox id={`amenity-${item}`} name="amenities" value={item} defaultChecked={isChecked} />
                                                    <Label htmlFor={`amenity-${item}`} className="text-sm font-normal cursor-pointer">
                                                        {item}
                                                    </Label>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" size="lg">
                                        Değişiklikleri Kaydet
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </TabsContent>

                {/* Units Tab */}
                <TabsContent value="units" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Proje Üniteleri</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Projeye ait tüm bağımsız bölümleri buradan yönetebilirsiniz.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <BatchUnitCreator projectId={project.id} action={batchCreateUnits} />
                                <ExcelImport projectId={project.id} onImport={importUnitsFromExcel} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Ünite No</TableHead>
                                        <TableHead className="w-[120px]">Ünite Türü</TableHead>
                                        <TableHead className="w-[120px]">Oda Tipi</TableHead>
                                        <TableHead className="w-[100px]">Durum</TableHead>
                                        <TableHead className="w-[150px]">Fiyat</TableHead>
                                        <TableHead className="w-[100px]">Brüt m²</TableHead>
                                        <TableHead className="w-[80px]">Kat</TableHead>
                                        <TableHead className="w-[80px]">Blok</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {units && units.length > 0 ? (
                                        units.map((unit: any) => (
                                            <TableRow key={unit.id}>
                                                <TableCell className="font-medium">{unit.unit_number}</TableCell>
                                                <TableCell>{unit.unit_category || '-'}</TableCell>
                                                <TableCell>{unit.type}</TableCell>
                                                <TableCell>
                                                    <Badge variant={unit.status === 'For Sale' ? 'default' : unit.status === 'Sold' ? 'destructive' : 'secondary'}>
                                                        {unit.status === 'For Sale' ? 'Satılık' :
                                                            unit.status === 'Reserved' ? 'Rezerve' :
                                                                unit.status === 'Sold' ? 'Satıldı' : unit.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {unit.price ? `${unit.price.toLocaleString('tr-TR')} ${unit.currency || 'TRY'}` : '-'}
                                                </TableCell>
                                                <TableCell>{unit.area_gross ? `${unit.area_gross} m²` : '-'}</TableCell>
                                                <TableCell>{unit.floor || '-'}</TableCell>
                                                <TableCell>{unit.block || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/inventory/${unit.id}`}>
                                                            <Button size="sm" variant="outline">Detay</Button>
                                                        </Link>
                                                        <form action={handleDeleteUnit.bind(null, unit.id)}>
                                                            <Button size="sm" variant="ghost" type="submit">
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </form>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                                Henüz ünite eklenmemiş. Yukarıdaki butonları kullanarak ünite ekleyebilirsiniz.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Proje Dokümanları</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Projeye ait tüm dokümanları buradan yönetebilirsiniz.
                                </p>
                            </div>
                            <DocumentUpload projectId={project.id} onUpload={uploadDocument} />
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Döküman Adı</TableHead>
                                        <TableHead>Açıklama</TableHead>
                                        <TableHead>Dosya Tipi</TableHead>
                                        <TableHead>Yükleme Tarihi</TableHead>
                                        <TableHead>Yükleyen</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents && documents.length > 0 ? (
                                        documents.map((doc: any) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium">{doc.document_name}</TableCell>
                                                <TableCell className="max-w-xs truncate">{doc.description || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{doc.file_type || 'Unknown'}</Badge>
                                                </TableCell>
                                                <TableCell>{new Date(doc.created_at).toLocaleDateString('tr-TR')}</TableCell>
                                                <TableCell>{doc.uploader_name || 'Unknown'}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={doc.file_url} target="_blank">
                                                            <Button size="sm" variant="outline">
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <form action={handleDeleteDocument.bind(null, doc.id)}>
                                                            <Button size="sm" variant="destructive" type="submit">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </form>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                Henüz döküman yüklenmemiş.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Teams Tab */}
                <TabsContent value="teams" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teamAssignments?.map((assignment: any) => (
                            <Card key={assignment.sales_teams.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{assignment.sales_teams.name}</CardTitle>
                                        <Badge variant="outline">{assignment.sales_teams.region || 'Genel'}</Badge>
                                    </div>
                                    <CardDescription>{assignment.sales_teams.office_name}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            <Users className="w-4 h-4" /> Ekip Üyeleri
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {assignment.sales_teams.team_members?.map((member: any, idx: number) => (
                                                <Badge key={idx} variant="secondary">
                                                    {member.profiles.full_name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {(!teamAssignments || teamAssignments.length === 0) && (
                            <Card className="col-span-full border-dashed">
                                <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                                    <Users className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Bu projeye henüz bir satış ekibi atanmamış.</p>
                                    <Link href="/teams" className="mt-4">
                                        <Button variant="outline">Ekipleri Yönet</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
