import { BackButton } from "@/components/back-button"
import { getActivityTrackingReport } from "../actions"
import ActivityTrackingClient from "./ActivityTrackingClient"

export default async function ActivityTrackingPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const data = await getActivityTrackingReport()

    if ('error' in data) {
        return (
            <div className="flex flex-col gap-6 p-1">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <h1 className="text-2xl font-bold tracking-tight">Aktivite Takip Raporu</h1>
                </div>
                <div className="p-8 text-center text-red-500">Hata: {data.error}</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-1">
            <div className="flex items-center gap-4">
                <BackButton variant="ghost" size="icon" />
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Aktivite Takip Raporu</h1>
                    <p className="text-sm text-muted-foreground">
                        Satış danışmanlarının aktivite durumları, geciken işler ve hareketsizlik süresi.
                    </p>
                </div>
            </div>
            <ActivityTrackingClient data={data} />
        </div>
    )
}
