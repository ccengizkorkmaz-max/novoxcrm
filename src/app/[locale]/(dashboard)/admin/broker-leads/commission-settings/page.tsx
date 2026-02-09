

import { getCommissionModels } from '@/app/broker/actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Settings2,
    Plus,
    Layers,
    Building2,
    BadgeTurkishLira,
    ChevronRight,
    Calendar,
    Archive
} from "lucide-react"
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getTranslations } from 'next-intl/server'

export default async function CommissionSettingsPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const models = await getCommissionModels()
    const t = await getTranslations('CommissionSettings')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activeModels = models.filter((m: any) => {
        if (m.status === 'Archived') return false
        if (m.end_date) {
            const end = new Date(m.end_date)
            if (end < today) return false
        }
        return true
    })

    const archivedModels = models.filter((m: any) => !activeModels.includes(m))

    function ModelsTable({ data, readonly = false }: { data: any[], readonly?: boolean }) {
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('table.name')}</TableHead>
                        <TableHead>{t('table.project')}</TableHead>
                        <TableHead>{t('table.validity')}</TableHead>
                        <TableHead>{t('table.type')}</TableHead>
                        <TableHead>{t('table.standardValue')}</TableHead>
                        <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data && data.length > 0 ? (
                        data.map((model) => (
                            <TableRow key={model.id} className={readonly ? "opacity-75 bg-slate-50" : ""}>
                                <TableCell className="font-bold">
                                    {model.name}
                                    {readonly && <Badge variant="secondary" className="ml-2 text-[10px]">{t('table.indefinite')}</Badge>}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-3 w-3 text-muted-foreground" />
                                        <span>{model.projects?.name || t('table.allProjects')}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-xs text-muted-foreground">
                                        {model.start_date && <span>{t('table.start')}: {new Date(model.start_date).toLocaleDateString('tr-TR')}</span>}
                                        {model.end_date ? (
                                            <span className={new Date(model.end_date) < today ? "text-red-500 font-bold" : ""}>
                                                {t('table.end')}: {new Date(model.end_date).toLocaleDateString('tr-TR')}
                                            </span>
                                        ) : (
                                            <span>{t('table.indefinite')}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${model.type === 'Tiered' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                        {model.type === 'Tiered' ? t('types.Tiered') : model.type}
                                    </span>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {model.value.toLocaleString('tr-TR')} {model.currency}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/admin/broker-leads/commission-settings/${model.id}`}>
                                        <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                                            {t('table.details')} <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                                <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                {t('table.empty')}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>
                <Link href="/admin/broker-leads/commission-settings/new">
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4" />
                        {t('newModel')}
                    </Button>
                </Link>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
                    <TabsTrigger value="active">{t('tabs.active')}</TabsTrigger>
                    <TabsTrigger value="archived">{t('tabs.archived')}</TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-green-600" />
                                {t('activeTitle')}
                            </CardTitle>
                            <CardDescription>{t('activeDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ModelsTable data={activeModels} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="archived">
                    <Card className="bg-slate-50 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-500">
                                <Archive className="h-5 w-5" />
                                {t('archivedTitle')}
                            </CardTitle>
                            <CardDescription>{t('archivedDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ModelsTable data={archivedModels} readonly={true} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <Layers className="h-5 w-5 text-purple-600" />
                            {t('info.tierTitle')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 space-y-3">
                        <p>{t('info.tierDesc')}</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>10 satışa kadar: %3</li>
                            <li>11-20 satış arası: %4</li>
                            <li>21 ve üzeri: %5</li>
                        </ul>
                        <p className="text-xs italic text-slate-400 mt-2">Bu yapı, brokerları daha fazla satış yapmaya teşvik eder.</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            {t('info.dateTitle')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-800 space-y-3">
                        <p>{t('info.dateDesc')}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
