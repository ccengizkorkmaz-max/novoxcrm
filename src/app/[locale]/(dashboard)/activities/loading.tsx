export default function ActivitiesLoading() {
    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-100px)] animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-8 w-36 bg-muted rounded-md" />
            </div>
            <div className="flex-1 rounded-lg border bg-card p-6">
                {/* Filter bar skeleton */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-32 bg-muted rounded-md" />
                    <div className="h-10 w-32 bg-muted rounded-md" />
                    <div className="h-10 w-32 bg-muted rounded-md" />
                    <div className="h-10 w-10 bg-muted rounded-md ml-auto" />
                </div>
                {/* Calendar / List skeleton */}
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className="h-24 bg-muted/50 rounded-md border" />
                    ))}
                </div>
            </div>
        </div>
    )
}
