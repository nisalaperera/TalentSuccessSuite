
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, User, Briefcase } from 'lucide-react';

export default function Home() {
  const views = [
    {
      title: 'Admin View',
      description: 'Configure and manage performance cycles, templates, and documents.',
      href: '/admin',
      icon: <ShieldCheck className="h-12 w-12 text-primary" />,
    },
    {
      title: 'Employee View',
      description: 'View your goals, submit self-evaluations, and track your performance.',
      href: '/employee',
      icon: <User className="h-12 w-12 text-primary" />,
    },
    {
      title: 'Manager View',
      description: 'Evaluate your team, provide feedback, and monitor performance progress.',
      href: '/manager',
      icon: <Briefcase className="h-12 w-12 text-primary" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:px-8 md:py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2 tracking-tight">EvalFlow</h1>
          <p className="text-lg text-foreground/80 font-body">
            Choose your view to get started
          </p>
        </header>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {views.map((view) => (
            <Link key={view.title} href={view.href} className="block hover:shadow-lg transition-shadow rounded-lg">
              <Card className="h-full text-center hover:border-primary/50">
                <CardHeader className="flex flex-col items-center gap-4">
                  <div>{view.icon}</div>
                  <div className="space-y-1">
                    <CardTitle className="font-headline text-xl">{view.title}</CardTitle>
                    <CardDescription>{view.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
