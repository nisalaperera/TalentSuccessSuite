
'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function EvaluationPage() {
    const params = useParams();
    const documentId = params.id;

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Evaluation Page</CardTitle>
                    <CardDescription>This page is for evaluating document: {documentId}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Evaluation form and content will be displayed here based on document status and user permissions.</p>
                </CardContent>
            </Card>
        </div>
    );
}
