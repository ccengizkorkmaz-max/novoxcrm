export default function FinanceLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-8 w-36 bg-muted rounded-md" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-lg border bg-card p-6">
                        <div className="h-4 w-20 bg-muted rounded mb-3" />
                        <div className="h-8 w-28 bg-muted rounded" />
                    </div>
                ))}
            </div>
            <div className="rounded-lg border bg-card p-6 h-80">
                <div className="h-5 w-32 bg-muted rounded mb-4" />
                <div className="h-full bg-muted/30 rounded" />
            </div>
        </div>
    )
}
