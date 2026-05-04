export default function CRMLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            {/* Header + Pipeline Stats skeleton */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur pb-2 pt-1 border-b mb-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 px-1">
                        <div className="h-8 w-40 bg-muted rounded-md" />
                        <div className="h-9 w-24 bg-muted rounded-md" />
                        <div className="h-10 w-64 bg-muted rounded-md" />
                        <div className="h-9 w-28 bg-muted rounded-md" />
                    </div>
                </div>
                {/* Pipeline stats skeleton */}
                <div className="hidden lg:flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex-1 rounded-lg border bg-card p-3">
                            <div className="h-3 w-16 bg-muted rounded mb-2" />
                            <div className="h-6 w-10 bg-muted rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Sales list skeleton */}
            <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="rounded-lg border bg-card p-4 flex items-center gap-4">
                        <div className="h-10 w-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-48 bg-muted rounded" />
                            <div className="h-3 w-32 bg-muted rounded" />
                        </div>
                        <div className="h-6 w-20 bg-muted rounded-full" />
                        <div className="h-8 w-8 bg-muted rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}
