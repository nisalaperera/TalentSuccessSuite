
import Link from "next/link";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
       <header className="p-4 border-b">
          <div className="container mx-auto flex justify-between items-center">
             <div>
                <Link href="/"><h1 className="text-2xl font-headline font-bold text-primary hover:text-primary/90">Talent Suite</h1></Link>
             </div>
          </div>
        </header>
      <main>
        {children}
      </main>
    </div>
  )
}
