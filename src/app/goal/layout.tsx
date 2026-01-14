
import Link from "next/link";

export default function GoalLayout({
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
