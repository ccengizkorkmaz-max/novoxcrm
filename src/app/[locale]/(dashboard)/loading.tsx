export default function DashboardLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-8 w-48 bg-muted rounded-md" />
                <div className="h-8 w-24 bg-muted rounded-md" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-lg border bg-card p-6">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-4 w-24 bg-muted rounded" />
                            <div className="h-4 w-4 bg-muted rounded" />
                        </div>
                        <div className="h-8 w-20 bg-muted rounded mb-1" />
                        <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                ))}
            </div>

            {/* Content skeleton */}
            <div className="rounded-lg border bg-card p-6">
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-muted rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-muted rounded" />
                                <div className="h-3 w-1/2 bg-muted rounded" />
                            </div>
                            <div className="h-6 w-16 bg-muted rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
