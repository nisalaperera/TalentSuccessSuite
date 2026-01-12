
'use client';

import { useReducer, useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { configReducer, initialState } from '@/lib/state';
import { useToast } from '@/hooks/use-toast';
import type { PerformanceTemplate as PerformanceTemplateType } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function PerformanceTemplatesContent() {
    const router = useRouter();
    const [state, dispatch] = useReducer(configReducer, initialState);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<PerformanceTemplateType | null>(null);
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<'Performance' | 'Survey' | undefined>();

    useEffect(() => {
        if (editingTemplate) {
            setName(editingTemplate.name);
            setDescription(editingTemplate.description);
            setCategory(editingTemplate.category);
        } else {
            setName('');
            setDescription('');
            setCategory(undefined);
        }
    }, [editingTemplate]);

    const handleOpenDialog = (template: PerformanceTemplateType | null = null) => {
        setEditingTemplate(template);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditingTemplate(null);
        setIsDialogOpen(false);
    };

    const handleSave = () => {
        if (!name || !category || !description) {
            toast({ title: 'Missing Information', description: 'Please provide a name, description, and select a category.', variant: 'destructive' });
            return;
        }

        if (editingTemplate) {
            const updatedTemplate = { ...editingTemplate, name, description, category };
            dispatch({ type: 'UPDATE_PERFORMANCE_TEMPLATE', payload: updatedTemplate });
            toast({ title: 'Success', description: `Template "${name}" updated.` });
        } else {
            const newTemplate: PerformanceTemplateType = { id: `pt-${Date.now()}`, name, description, category, status: 'Active' };
            dispatch({ type: 'ADD_PERFORMANCE_TEMPLATE', payload: newTemplate });
            toast({ title: 'Success', description: `Template "${name}" created.` });
        }
        handleCloseDialog();
    };
    
    const isTemplateInUse = (id: string) => state.performanceDocuments.some(pd => pd.performanceTemplateId === id);

    const handleDelete = (id: string) => {
        dispatch({ type: 'DELETE_PERFORMANCE_TEMPLATE', payload: id });
        toast({ title: 'Success', description: 'Performance template deleted.' });
    };

    const handleToggleStatus = (template: PerformanceTemplateType) => {
        const newStatus = template.status === 'Active' ? 'Inactive' : 'Active';
        dispatch({ type: 'UPDATE_PERFORMANCE_TEMPLATE', payload: { ...template, status: newStatus } });
        toast({ title: 'Success', description: `Template status set to ${newStatus}.` });
    };

    const handleManageSections = (template: PerformanceTemplateType) => {
        router.push(`/configuration/performance-template-sections?templateId=${template.id}`);
    }

    const tableColumns = columns({ onEdit: handleOpenDialog, onDelete: handleDelete, onToggleStatus: handleToggleStatus, isTemplateInUse, onManageSections: handleManageSections });

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Performance Templates"
                description="Manage all your performance templates here."
                onAddNew={() => handleOpenDialog()}
            />
            <DataTable columns={tableColumns} data={state.performanceTemplates} />
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-headline">{editingTemplate ? 'Edit' : 'Create New'} Performance Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <Input placeholder="e.g., Annual Performance Document" value={name} onChange={(e) => setName(e.target.value)} />
                            <Select onValueChange={(value: 'Performance' | 'Survey') => setCategory(value)} value={category}>
                                <SelectTrigger><SelectValue placeholder="Select a Document Category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Performance">Performance Document</SelectItem>
                                    <SelectItem value="Survey">Survey Document</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Textarea placeholder="Template description..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSave}>{editingTemplate ? 'Save Changes' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function PerformanceTemplatesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PerformanceTemplatesContent />
        </Suspense>
    )
}
