
'use client';

import { useReducer, useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useToast } from '@/hooks/use-toast';
import type { PerformanceTemplateSection as PerformanceTemplateSectionType, SectionType, AccessPermission, PerformanceTemplate } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Trash2, Settings, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const ROLES = ['Worker', 'Primary Appraiser', 'Secondary Appraiser', 'HR'];
const performanceSectionTypes: SectionType[] = ['Performance Goals', 'Overall Summary'];
const surveySectionTypes: SectionType[] = [];

function PerformanceTemplateSectionsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();

    const templatesQuery = useMemoFirebase(() => collection(firestore, 'performance_templates'), [firestore]);
    const { data: performanceTemplates } = useCollection<PerformanceTemplate>(templatesQuery);

    const sectionsQuery = useMemoFirebase(() => collection(firestore, 'performance_template_sections'), [firestore]);
    const { data: allSections, isLoading } = useCollection<PerformanceTemplateSectionType>(sectionsQuery);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState<Partial<PerformanceTemplateSectionType> | null>(null);
    const [sections, setSections] = useState<PerformanceTemplateSectionType[]>([]);
    const { toast } = useToast();

    const selectedTemplateId = searchParams.get('templateId');

    const selectedTemplate = useMemo(() => 
        performanceTemplates?.find(t => t.id === selectedTemplateId),
        [selectedTemplateId, performanceTemplates]
    );

    const handleSetupClick = (section: PerformanceTemplateSectionType) => {
        setCurrentSection({...section});
        setIsDialogOpen(true);
    };

    const handleDelete = (sectionId: string) => {
        const docRef = doc(firestore, 'performance_template_sections', sectionId);
        deleteDocumentNonBlocking(docRef);
        toast({ title: 'Success', description: 'Section deleted.'});
    };

    const getTemplateName = (id: string) => performanceTemplates?.find(t => t.id === id)?.name || 'N/A';
    
    const tableColumns = columns({ onEdit: handleSetupClick, onDelete: handleDelete, getTemplateName });

    const handleConfigChange = (key: keyof PerformanceTemplateSectionType, value: any) => {
        if(!currentSection) return;
        setCurrentSection(prev => prev ? { ...prev, [key]: value } : null);
    }

    const handlePermissionChange = (role: string, key: keyof Omit<AccessPermission, 'role'>, value: boolean) => {
        if(!currentSection?.permissions) return;
        const newPermissions = currentSection.permissions.map(p => p.role === role ? {...p, [key]: value} : p);
        handleConfigChange('permissions', newPermissions);
    };

    const handleSaveSection = () => {
        if (!currentSection || !currentSection.id) return;
        
        const docRef = doc(firestore, 'performance_template_sections', currentSection.id);
        const { id, ...sectionData } = currentSection;
        updateDocumentNonBlocking(docRef, sectionData);

        toast({ title: 'Success', description: `Configuration for "${currentSection.name}" has been saved.` });
        setIsDialogOpen(false);
        setCurrentSection(null);
    };

    useEffect(() => {
        if (selectedTemplateId && allSections) {
        const templateSections = allSections
            .filter(s => s.performanceTemplateId === selectedTemplateId)
            .sort((a, b) => a.order - b.order);
        setSections(templateSections);
        } else {
        setSections([]);
        }
    }, [selectedTemplateId, allSections]);
    
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        
        const items = Array.from(sections);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedOrder = items.map((item, index) => ({ ...item, order: index + 1 }));
        setSections(updatedOrder);

        updatedOrder.forEach(section => {
            const docRef = doc(firestore, 'performance_template_sections', section.id);
            updateDocumentNonBlocking(docRef, { order: section.order });
        });
    };

    const availableSectionTypes = useMemo(() => {
        if (!selectedTemplate) return [];
        return selectedTemplate.category === 'Performance' ? performanceSectionTypes : surveySectionTypes;
    }, [selectedTemplate]);
    
    const handleAddSection = (type: SectionType) => {
        if (!type || !selectedTemplateId) return;

        const newSection: Omit<PerformanceTemplateSectionType, 'id'> = {
            name: type,
            type: type,
            performanceTemplateId: selectedTemplateId,
            order: sections.length + 1,
            permissions: ROLES.map(role => {
                const defaults: AccessPermission = {
                  role,
                  view: true,
                  rate: false,
                  viewWorkerRatings: false,
                  viewPrimaryAppraiserRatings: false,
                  viewSecondaryAppraiserRatings: false,
                };
                switch(role) {
                    case 'Worker':
                        defaults.rate = true;
                        defaults.viewWorkerRatings = true;
                        break;
                    case 'Primary Appraiser':
                        defaults.rate = true;
                        defaults.viewWorkerRatings = true;
                        defaults.viewPrimaryAppraiserRatings = true;
                        break;
                    case 'Secondary Appraiser':
                         defaults.rate = true;
                         defaults.viewWorkerRatings = true;
                         defaults.viewSecondaryAppraiserRatings = true;
                        break;
                    case 'HR':
                        defaults.rate = false;
                        defaults.viewWorkerRatings = true;
                        defaults.viewPrimaryAppraiserRatings = true;
                        defaults.viewSecondaryAppraiserRatings = true;
                        break;
                }
                return defaults;
            }),
            enableSectionRatings: true,
            sectionRatingMandatory: false,
            ratingScale: 5,
            ratingCalculationMethod: 'Manual',
            enableSectionComments: false,
            sectionCommentMandatory: false,
            minLength: 0,
            maxLength: 500,
            enableItemRatings: false,
            itemRatingMandatory: false,
            enableItemComments: false,
            itemCommentMandatory: false,
        };
        
        const collRef = collection(firestore, 'performance_template_sections');
        addDocumentNonBlocking(collRef, newSection);
        toast({ title: "Success", description: `Section "${type}" added.`});
    };
    
    const handleTemplateSelection = (templateId: string) => {
        router.push(`/configuration/performance-template-sections?templateId=${templateId}`);
    };
    
    const handleClearFilter = () => {
        router.push('/configuration/performance-template-sections');
    };

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Performance Template Sections"
                description="Manage all your performance template sections here."
                showAddNew={false}
            />
            <div className="mb-4 flex items-center gap-4">
                <Select onValueChange={handleTemplateSelection} value={selectedTemplateId || ''}>
                    <SelectTrigger className="w-[300px]"><SelectValue placeholder="Select a template to add/view sections..." /></SelectTrigger>
                    <SelectContent>
                        {(performanceTemplates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                 {selectedTemplateId && (
                    <Badge variant="secondary" className="flex items-center gap-2">
                        Template: {getTemplateName(selectedTemplateId)}
                        <button onClick={handleClearFilter} className="rounded-full hover:bg-muted-foreground/20">
                            <X className="h-3 w-3"/>
                        </button>
                    </Badge>
                )}
            </div>

            {selectedTemplateId ? (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex justify-between items-center">
                            <span>Sections for: {selectedTemplate?.name}</span>
                             <div className="flex gap-2">
                                <Select onValueChange={(v: SectionType) => handleAddSection(v)} value="">
                                    <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select a section type to add..." /></SelectTrigger>
                                    <SelectContent>
                                        {availableSectionTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardTitle>
                        <CardDescription>Add and configure the content blocks for this performance template. You can drag and drop to reorder the sections.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="sections">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                {sections.map((section, index) => (
                                    <Draggable key={section.id} draggableId={section.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`bg-card p-4 rounded-lg border shadow-sm flex items-center justify-between ${snapshot.isDragging ? 'opacity-80 shadow-lg' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium font-headline">{section.name}</p>
                                                    <p className="text-sm text-muted-foreground">{section.type}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" onClick={() => handleSetupClick(section)}>
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Setup
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(section.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                                </div>
                            )}
                            </Droppable>
                        </DragDropContext>
                        {sections.length === 0 && <p className="text-center text-muted-foreground py-4">No sections for this template yet.</p>}
                    </CardContent>
                 </Card>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">Please select a Performance Template above to see its sections.</p>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Configure: {currentSection?.name}</DialogTitle>
                    </DialogHeader>
                    {currentSection && (
                        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div className="space-y-2">
                                <Label>Section Name</Label>
                                <Input value={currentSection.name || ''} onChange={e => handleConfigChange('name', e.target.value)} />
                            </div>

                            {currentSection.type === 'Performance Goals' && (
                                <>
                                <Card>
                                    <CardHeader><CardTitle>Section Ratings</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                            <div className="flex items-center justify-between"><Label>Enable Section Ratings</Label><Switch checked={currentSection.enableSectionRatings} onCheckedChange={v => handleConfigChange('enableSectionRatings', v)} /></div>
                                            <div className="flex items-center justify-between"><Label htmlFor="section-rating-mandatory">Ratings Mandatory</Label><Switch id="section-rating-mandatory" disabled={!currentSection.enableSectionRatings} checked={currentSection.sectionRatingMandatory} onCheckedChange={v => handleConfigChange('sectionRatingMandatory', v)} /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="rating-scale">Maximum Rating Scale</Label>
                                                <Input id="rating-scale" type="number" disabled={!currentSection.enableSectionRatings} value={currentSection.ratingScale || 5} onChange={e => handleConfigChange('ratingScale', parseInt(e.target.value, 10))} min="1" max="10"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="rating-calculation-method">Rating Calculation Method</Label>
                                                <Select disabled={!currentSection.enableSectionRatings} onValueChange={(v: 'Manual' | 'Automatic') => handleConfigChange('ratingCalculationMethod', v)} value={currentSection.ratingCalculationMethod}>
                                                <SelectTrigger id="rating-calculation-method"><SelectValue placeholder="Select Method" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Manual">Manual</SelectItem>
                                                    <SelectItem value="Automatic">Automatic</SelectItem>
                                                </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle>Section Comments</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                            <div className="flex items-center justify-between"><Label>Enable Section Comments</Label><Switch checked={currentSection.enableSectionComments} onCheckedChange={v => handleConfigChange('enableSectionComments', v)} /></div>
                                            <div className="flex items-center justify-between"><Label htmlFor="section-comment-mandatory">Comments Mandatory</Label><Switch id="section-comment-mandatory" disabled={!currentSection.enableSectionComments} checked={currentSection.sectionCommentMandatory} onCheckedChange={v => handleConfigChange('sectionCommentMandatory', v)} /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="min-length">Min Length</Label>
                                                <Input id="min-length" type="number" disabled={!currentSection.enableSectionComments} value={currentSection.minLength} onChange={e => handleConfigChange('minLength', e.target.valueAsNumber)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="max-length">Max Length</Label>
                                                <Input id="max-length" type="number" disabled={!currentSection.enableSectionComments} value={currentSection.maxLength} onChange={e => handleConfigChange('maxLength', e.target.valueAsNumber)} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader><CardTitle>Performance Goals</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                            <div className="flex items-center justify-between"><Label>Ratings Enabled for Goals</Label><Switch checked={currentSection.enableItemRatings} onCheckedChange={v => handleConfigChange('enableItemRatings', v)} /></div>
                                            <div className="flex items-center justify-between"><Label>Ratings Mandatory for Goals</Label><Switch disabled={!currentSection.enableItemRatings} checked={currentSection.itemRatingMandatory} onCheckedChange={v => handleConfigChange('itemRatingMandatory', v)} /></div>
                                            <div className="flex items-center justify-between"><Label>Comments Enabled for Goals</Label><Switch checked={currentSection.enableItemComments} onCheckedChange={v => handleConfigChange('enableItemComments', v)} /></div>
                                            <div className="flex items-center justify-between"><Label>Comments Mandatory for Goals</Label><Switch disabled={!currentSection.enableItemComments} checked={currentSection.itemCommentMandatory} onCheckedChange={v => handleConfigChange('itemCommentMandatory', v)} /></div>
                                        </div>
                                    </CardContent>
                                </Card>
                                </>
                            )}
                            
                            {currentSection.type === 'Overall Summary' &&
                                <Card>
                                    <CardHeader><CardTitle>Overall Normalized Rating Weights</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground">Configure weights for blending scores.</p>
                                        <Label>Current Document Score Weights</Label>
                                        <div className="flex gap-4">
                                            <Input type="number" placeholder="Primary Appraiser Weight % (e.g., 70)" />
                                            <Input type="number" placeholder="Secondary Appraisers Weight % (e.g., 30)" />
                                        </div>
                                        <Label>Final Overall Normalized Rating Weights</Label>
                                        <div className="flex gap-4">
                                            <Input type="number" placeholder="Current Performance Weight % (e.g., 70)" />
                                            <Input type="number" placeholder="Historical Performance Weight % (e.g., 30)" />
                                        </div>
                                    </CardContent>
                                </Card>
                            }

                            <Card>
                                <CardHeader><CardTitle>Section Access & Permissions</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Role</TableHead>
                                                <TableHead className="text-center">View</TableHead>
                                                <TableHead className="text-center">Rate</TableHead>
                                                <TableHead className="text-center">View Worker Ratings</TableHead>
                                                <TableHead className="text-center">View Primary Appraiser Ratings</TableHead>
                                                <TableHead className="text-center">View Secondary Appraiser Ratings</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {currentSection.permissions?.map((p) => {
                                                const role = p.role;
                                                const isWorker = role === 'Worker';
                                                const isPrimary = role === 'Primary Appraiser';
                                                const isSecondary = role === 'Secondary Appraiser';

                                                return (
                                                    <TableRow key={role}>
                                                        <TableCell className="font-medium">{role}</TableCell>
                                                        <TableCell className="text-center"><Switch checked={p.view} onCheckedChange={(val) => handlePermissionChange(role, 'view', val)}/></TableCell>
                                                        <TableCell className="text-center"><Switch checked={p.rate} onCheckedChange={(val) => handlePermissionChange(role, 'rate', val)}/></TableCell>
                                                        <TableCell className="text-center"><Switch checked={p.viewWorkerRatings} onCheckedChange={(val) => handlePermissionChange(role, 'viewWorkerRatings', val)} disabled={isWorker} /></TableCell>
                                                        <TableCell className="text-center"><Switch checked={p.viewPrimaryAppraiserRatings} onCheckedChange={(val) => handlePermissionChange(role, 'viewPrimaryAppraiserRatings', val)} disabled={isPrimary} /></TableCell>
                                                        <TableCell className="text-center"><Switch checked={p.viewSecondaryAppraiserRatings} onCheckedChange={(val) => handlePermissionChange(role, 'viewSecondaryAppraiserRatings', val)} disabled={isSecondary} /></TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSection}>Save Configuration</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


export default function PerformanceTemplateSectionsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PerformanceTemplateSectionsContent />
        </Suspense>
    )
}
