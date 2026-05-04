export default function ContactsLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-8 w-32 bg-muted rounded-md" />
                <div className="h-10 w-28 bg-muted rounded-md" />
            </div>
            <div className="rounded-md border bg-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 flex-1 bg-muted rounded-md" />
                    <div className="h-10 w-24 bg-muted rounded-md" />
                </div>
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="flex items-center gap-4 py-4 border-b border-muted/50">
                        <div className="h-10 w-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-muted rounded" />
                            <div className="h-3 w-24 bg-muted rounded" />
                        </div>
                        <div className="h-6 w-16 bg-muted rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}
