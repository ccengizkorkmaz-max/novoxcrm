export default function InventoryLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-8 w-32 bg-muted rounded-md" />
                <div className="flex gap-2">
                    <div className="h-10 w-24 bg-muted rounded-md" />
                    <div className="h-10 w-10 bg-muted rounded-md" />
                </div>
            </div>
            {/* Filter bar */}
            <div className="flex gap-3">
                <div className="h-10 w-48 bg-muted rounded-md" />
                <div className="h-10 w-32 bg-muted rounded-md" />
                <div className="h-10 w-32 bg-muted rounded-md" />
            </div>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="rounded-lg border bg-card p-4">
                        <div className="h-4 w-20 bg-muted rounded mb-3" />
                        <div className="h-6 w-28 bg-muted rounded mb-2" />
                        <div className="flex gap-2 mb-3">
                            <div className="h-5 w-12 bg-muted rounded-full" />
                            <div className="h-5 w-16 bg-muted rounded-full" />
                        </div>
                        <div className="h-8 w-full bg-muted rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}
