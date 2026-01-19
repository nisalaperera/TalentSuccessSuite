'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConfigState } from "@/lib/types";

interface TileBasedProps {
    state: ConfigState;
}

export function TileBasedApproach({ state }: TileBasedProps) {

    const groupedConfigItems = [
        {
            groupTitle: "Review Periods, Cycles, and Goals",
            items: [
                {
                    title: "Review Periods",
                    description: "Define the time boundary for all performance-related activities.",
                    href: "/configuration/review-periods"
                },
                {
                    title: "Goal Plans",
                    description: "Define goal containers and link them to review periods.",
                    href: "/configuration/goal-plans"
                },
                {
                    title: "Performance Cycles",
                    description: "Define the specific evaluation cycles within a review period.",
                    href: "/configuration/performance-cycles"
                },
            ]
        },
        {
            groupTitle: "Performance Template Management",
            items: [
                 {
                    title: "Performance Templates",
                    description: "Define what kind of document is being created and how it behaves.",
                    href: "/configuration/performance-templates"
                },
                {
                    title: "Performance Template Sections",
                    description: "Add and configure the content blocks for this performance template.",
                    href: "/configuration/performance-template-sections"
                },
            ]
        },
        {
            groupTitle: "Evaluation Flows and Eligilibilty",
            items: [
                {
                    title: "Evaluation Flows",
                    description: "Define who does what, when, and in what order for a document.",
                    href: "/configuration/evaluation-flows"
                },
                {
                    title: "Eligibility Criteria",
                    description: "Define named sets of exclusion rules for participants.",
                    href: "/configuration/eligibility-criteria"
                },
            ]
        },
        {
            groupTitle: "Performance Cycle Config",
            items: [
                 {
                    title: "Performance Documents",
                    description: "Assemble and create the final performance documents.",
                    href: "/configuration/performance-documents"
                }
            ]
        },
        {
            groupTitle: "Temporary (To be Removed)",
            items: [
                 {
                    title: "Employees",
                    description: "Manage employee records.",
                    href: "/configuration/employees"
                },
                {
                    title: "Employee Performance Documents",
                    description: "View and manage launched employee performance documents.",
                    href: "/configuration/employee-documents"
                },
                {
                    title: "Appraiser Mappings",
                    description: "View employee to appraiser mappings.",
                    href: "/configuration/appraiser-mappings"
                }
            ]
        }
    ];

    return (
        <div className="space-y-8">
            {groupedConfigItems.map(group => (
                <div key={group.groupTitle}>
                    <h2 className="text-2xl font-headline font-semibold mb-4">{group.groupTitle}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {group.items.map(item => (
                            <Link key={item.title} href={item.href} className="block hover:shadow-lg transition-shadow rounded-lg">
                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle className="font-headline">{item.title}</CardTitle>
                                        <CardDescription>{item.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                    {/* Count removed as requested */}
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
