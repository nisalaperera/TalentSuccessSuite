'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface PageHeaderProps {
    title: string;
    description: string;
    onAddNew?: () => void;
    showAddNew?: boolean;
}

export function PageHeader({ title, description, onAddNew, showAddNew = true }: PageHeaderProps) {
    return (
        <>
            <Breadcrumb className="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                    <BreadcrumbLink href="/admin">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                    <BreadcrumbPage>{title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{title}</h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>
                {showAddNew && onAddNew && (
                     <Button onClick={onAddNew}>
                        <PlusCircle className="mr-2" />
                        Add New
                    </Button>
                )}
            </div>
        </>
    );
}
