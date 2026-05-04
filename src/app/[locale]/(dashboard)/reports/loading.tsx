export default function ReportsLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-8 w-32 bg-muted rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-card p-6 h-64">
                    <div className="h-5 w-32 bg-muted rounded mb-4" />
                    <div className="h-full bg-muted/30 rounded" />
                </div>
                <div className="rounded-lg border bg-card p-6 h-64">
                    <div className="h-5 w-32 bg-muted rounded mb-4" />
                    <div className="h-full bg-muted/30 rounded" />
                </div>
            </div>
        </div>
    )
}
