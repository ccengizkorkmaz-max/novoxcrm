export default function OffersLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-8 w-32 bg-muted rounded-md" />
                <div className="h-10 w-32 bg-muted rounded-md" />
            </div>
            <div className="rounded-md border bg-card p-6">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4 py-4 border-b border-muted/50">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-4 w-28 bg-muted rounded" />
                        <div className="h-6 w-20 bg-muted rounded-full" />
                        <div className="h-4 w-20 bg-muted rounded ml-auto" />
                    </div>
                ))}
            </div>
        </div>
    )
}
