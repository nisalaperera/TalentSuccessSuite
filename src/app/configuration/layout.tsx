
export default function ConfigurationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8">
          <div className="flex justify-between items-center">
             <div>
                <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2 tracking-tight">Talent Suite</h1>
                <p className="text-lg text-foreground/80 font-body">
                  Seamless Performance Management Configuration
                </p>
             </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
