
import Link from "next/link";

export default function PerformanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <main>
        {children}
      </main>
    </div>
  )
}
