export default function CustomersLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-8 w-40 bg-muted rounded-md" />
            </div>
            <div className="rounded-md border bg-card p-6">
                {/* Search bar skeleton */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 flex-1 bg-muted rounded-md" />
                    <div className="h-10 w-24 bg-muted rounded-md" />
                </div>
                {/* Table header skeleton */}
                <div className="flex items-center gap-4 py-3 border-b">
                    <div className="h-4 w-8 bg-muted rounded" />
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-4 w-28 bg-muted rounded" />
                    <div className="h-4 w-36 bg-muted rounded" />
                    <div className="h-4 w-24 bg-muted rounded" />
                </div>
                {/* Table rows skeleton */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="flex items-center gap-4 py-4 border-b border-muted/50">
                        <div className="h-4 w-8 bg-muted rounded" />
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-4 w-28 bg-muted rounded" />
                        <div className="h-4 w-36 bg-muted rounded" />
                        <div className="h-4 w-24 bg-muted rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}
