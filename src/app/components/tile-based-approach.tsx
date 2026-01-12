
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConfigState } from "@/lib/types";

interface TileBasedProps {
    state: ConfigState;
}

export function TileBasedApproach({ state }: TileBasedProps) {

    const configItems = [
        {
            title: "Review Periods",
            description: "Define the time boundary for all performance-related activities.",
            count: state.reviewPeriods.length,
            href: "/configuration/review-periods"
        },
        {
            title: "Goal Plans",
            description: "Define goal containers and link them to review periods.",
            count: state.goalPlans.length,
            href: "/configuration/goal-plans"
        },
        {
            title: "Performance Templates",
            description: "Define what kind of document is being created and how it behaves.",
            count: state.performanceTemplates.length,
            href: "/configuration/performance-templates"
        },
        {
            title: "Evaluation Flows",
            description: "Define who does what, when, and in what order for a document.",
            count: state.evaluationFlows.length,
            href: "/configuration/evaluation-flows"
        },
        {
            title: "Eligibility Criteria",
            description: "Define named sets of exclusion rules for participants.",
            count: state.eligibility.length,
            href: "/configuration/eligibility-criteria"
        },
        {
            title: "Performance Documents",
            description: "Assemble and create the final performance documents.",
            count: state.performanceDocuments.length,
            href: "/configuration/performance-documents"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configItems.map(item => (
                <Link key={item.title} href={item.href} className="block hover:shadow-lg transition-shadow rounded-lg">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="font-headline">{item.title}</CardTitle>
                            <CardDescription>{item.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{item.count}</p>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
