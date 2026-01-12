
'use client';

import { useReducer, useState, useEffect } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { configReducer, initialState } from '@/lib/state';
import { useToast } from '@/hooks/use-toast';
import type { PerformanceTemplate as PerformanceTemplateType } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PerformanceTemplatesPage() {
    const [state, dispatch] = useReducer(configReducer, initialState);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<PerformanceTemplateType | null>(null);
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [category, setCategory] = useState<'Performance' | 'Survey' | undefined>();
    const [supportsRatings, setSupportsRatings] = useState(true);
    const [supportsComments, setSupportsComments] = useState(true);

    useEffect(() => {
        if (editingTemplate) {
            setName(editingTemplate.name);
            setCategory(editingTemplate.category);
            setSupportsRatings(editingTemplate.supportsRatings);
            setSupportsComments(editingTemplate.supportsComments);
        } else {
            setName('');
            setCategory(undefined);
            setSupportsRatings(true);
            setSupportsComments(true);
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
        if (!name || !category) {
            toast({ title: 'Missing Information', description: 'Please provide a name and select a category.', variant: 'destructive' });
            return;
        }

        if (editingTemplate) {
            const updatedTemplate = { ...editingTemplate, name, category, supportsRatings, supportsComments };
            dispatch({ type: 'UPDATE_PERFORMANCE_TEMPLATE', payload: updatedTemplate });
            toast({ title: 'Success', description: `Template "${name}" updated.` });
        } else {
            const newTemplate: PerformanceTemplateType = { id: `pt-${Date.now()}`, name, category, supportsRatings, supportsComments, status: 'Active' };
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

    const tableColumns = columns({ onEdit: handleOpenDialog, onDelete: handleDelete, onToggleStatus: handleToggleStatus, isTemplateInUse });

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
                        <div className="flex items-center space-x-4 pt-2">
                            <div className="flex items-center space-x-2"><Switch id="ratings-switch" checked={supportsRatings} onCheckedChange={setSupportsRatings} /><Label htmlFor="ratings-switch">Supports Ratings</Label></div>
                            <div className="flex items-center space-x-2"><Switch id="comments-switch" checked={supportsComments} onCheckedChange={setSupportsComments} /><Label htmlFor="comments-switch">Supports Comments</Label></div>
                        </div>
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
