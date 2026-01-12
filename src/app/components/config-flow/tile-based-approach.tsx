'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import type { TileBasedProps } from "@/lib/types";

export function TileBasedApproach({ state, dispatch, dialogs, openDialog, closeDialog }: TileBasedProps) {

    const configItems = [
        {
            title: "Review Periods",
            description: "Define the time boundary for all performance-related activities.",
            count: state.reviewPeriods.length,
            dialogKey: "reviewPeriod"
        },
        {
            title: "Goal Plans",
            description: "Define goal containers and link them to review periods.",
            count: state.goalPlans.length,
            dialogKey: "goalPlan"
        },
        {
            title: "Performance Templates",
            description: "Define what kind of document is being created and how it behaves.",
            count: state.performanceTemplates.length,
            dialogKey: "performanceTemplate"
        },
        {
            title: "Evaluation Flows",
            description: "Define who does what, when, and in what order for a document.",
            count: state.evaluationFlows.length,
            dialogKey: "evaluationFlow"
        },
        {
            title: "Eligibility Criteria",
            description: "Define named sets of exclusion rules for participants.",
            count: state.eligibility.length,
            dialogKey: "eligibility"
        },
        {
            title: "Performance Documents",
            description: "Assemble and create the final performance documents.",
            count: state.performanceDocuments.length,
            dialogKey: "performanceDocument"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configItems.map(item => (
                <Card key={item.title}>
                    <CardHeader>
                        <CardTitle className="font-headline">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center">
                            <p className="text-2xl font-bold">{item.count}</p>
                            <Button onClick={() => openDialog(item.dialogKey)}>
                                <PlusCircle className="mr-2"/>
                                Add New
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
