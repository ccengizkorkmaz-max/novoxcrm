export default function SharedLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="tr">
            <body>{children}</body>
        </html>
    )
}
