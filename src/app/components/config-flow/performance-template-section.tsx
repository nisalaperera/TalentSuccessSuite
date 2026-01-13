
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Settings, Trash2, GripVertical } from 'lucide-react';
import type { StepProps, PerformanceTemplateSection as PerformanceTemplateSectionType, AccessPermission, SectionType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from './shared/star-rating';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const ROLES = ['Worker', 'Primary Appraiser', 'Secondary Appraiser 1', 'Secondary Appraiser 2', 'HR / Department Head', 'Secondary Appraiser', 'HR'];

const performanceSectionTypes: SectionType[] = ['Performance Goals', 'Overall Summary'];
const surveySectionTypes: SectionType[] = ['Comment'];

interface PerformanceTemplateSectionProps extends StepProps {
    selectedPerformanceTemplateId?: string;
}

export function PerformanceTemplateSection({ state, dispatch, onComplete, selectedPerformanceTemplateId }: PerformanceTemplateSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<Partial<PerformanceTemplateSectionType> | null>(null);
  const [sections, setSections] = useState<PerformanceTemplateSectionType[]>([]);
  const { toast } = useToast();

  const selectedTemplate = useMemo(() => 
    state.performanceTemplates.find(t => t.id === selectedPerformanceTemplateId),
    [selectedPerformanceTemplateId, state.performanceTemplates]
  );
  
  useEffect(() => {
    if (selectedPerformanceTemplateId) {
      const templateSections = state.performanceTemplateSections
        .filter(s => s.performanceTemplateId === selectedPerformanceTemplateId)
        .sort((a, b) => a.order - b.order);
      setSections(templateSections);
    } else {
      setSections([]);
    }
  }, [selectedPerformanceTemplateId, state.performanceTemplateSections]);


  const availableSectionTypes = useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedTemplate.category === 'Performance' ? performanceSectionTypes : surveySectionTypes;
  }, [selectedTemplate]);
  
  const handleAddSection = (type: SectionType) => {
    if (!type || !selectedPerformanceTemplateId) return;

    const newSection: PerformanceTemplateSectionType = {
        id: `ds-${Date.now()}`,
        name: type,
        type: type,
        performanceTemplateId: selectedPerformanceTemplateId,
        order: sections.length + 1,
        permissions: ROLES.map(role => ({ role, view: true, edit: false })),
        // Section Ratings
        enableSectionRatings: true,
        sectionRatingMandatory: false,
        ratingScale: 5,
        ratingCalculationMethod: 'Manual Rating',
        // Section Comments
        enableSectionComments: false,
        sectionCommentMandatory: false,
        minLength: 0,
        maxLength: 500,
        // Item Ratings & Comments
        enableItemRatings: false,
        itemRatingMandatory: false,
        enableItemComments: false,
        itemCommentMandatory: false,
    };
    
    const updatedSections = [...sections, newSection];
    setSections(updatedSections);
    dispatch({ type: 'SET_PERFORMANCE_TEMPLATE_SECTIONS', payload: [...state.performanceTemplateSections.filter(s => s.performanceTemplateId !== selectedPerformanceTemplateId), ...updatedSections] });
  };
  
  const handleRemoveSection = (sectionId: string) => {
    const newSections = sections.filter(s => s.id !== sectionId).map((s, i) => ({...s, order: i + 1}));
    setSections(newSections);
    dispatch({ type: 'SET_PERFORMANCE_TEMPLATE_SECTIONS', payload: [...state.performanceTemplateSections.filter(s => s.performanceTemplateId !== selectedPerformanceTemplateId), ...newSections] });
  };

  const handleSetupClick = (section: PerformanceTemplateSectionType) => {
    setCurrentSection({...section});
    setIsDialogOpen(true);
  };
  
  const handleConfigChange = (key: keyof PerformanceTemplateSectionType, value: any) => {
    if(!currentSection) return;
    setCurrentSection(prev => prev ? { ...prev, [key]: value } : null);
  }

  const handlePermissionChange = (role: string, key: 'view' | 'edit', value: boolean) => {
    if(!currentSection?.permissions) return;
    const newPermissions = currentSection.permissions.map(p => p.role === role ? {...p, [key]: value} : p);
    handleConfigChange('permissions', newPermissions);
  };

  const handleSaveSection = () => {
    if (!currentSection || !currentSection.id) return;
    
    const updatedLocalSections = sections.map(s => s.id === currentSection!.id ? currentSection as PerformanceTemplateSectionType : s);
    setSections(updatedLocalSections);
    
    const updatedGlobalSections = state.performanceTemplateSections.map(s => s.id === currentSection!.id ? currentSection as PerformanceTemplateSectionType : s);
    dispatch({ type: 'SET_PERFORMANCE_TEMPLATE_SECTIONS', payload: updatedGlobalSections });

    toast({
        title: 'Success',
        description: `Configuration for "${currentSection.name}" has been saved.`,
    });
    setIsDialogOpen(false);
    setCurrentSection(null);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedSections = items.map((item, index) => ({ ...item, order: index + 1 }));
    setSections(updatedSections);
    dispatch({ type: 'SET_PERFORMANCE_TEMPLATE_SECTIONS', payload: [...state.performanceTemplateSections.filter(s => s.performanceTemplateId !== selectedPerformanceTemplateId), ...updatedSections] });
  };

  if (!selectedTemplate) {
    return (
        <div className="text-center text-muted-foreground p-8">
            Please select a Performance Template first.
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Configure Sections for: {selectedTemplate?.name}</CardTitle>
          <CardDescription>Add and configure the content blocks for this performance template. You can drag and drop to reorder the sections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-2">
                <Select onValueChange={(v: SectionType) => handleAddSection(v)} value="">
                    <SelectTrigger><SelectValue placeholder="Select a section type to add..." /></SelectTrigger>
                    <SelectContent>
                        {availableSectionTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

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
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveSection(section.id)}>
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

            {sections.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No sections added yet.</p>
            )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Configure: {currentSection?.name}</DialogTitle>
          </DialogHeader>
          {currentSection && (
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
              
              <Card>
                <CardHeader><CardTitle>General</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <Label>Section Name</Label>
                   <Input value={currentSection.name || ''} onChange={e => handleConfigChange('name', e.target.value)} />
                </CardContent>
              </Card>

              {currentSection.type === 'Performance Goals' && (
                <>
                <Card>
                    <CardHeader><CardTitle>Ratings</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between"><Label>Enable Section Ratings</Label><Switch checked={currentSection.enableSectionRatings} onCheckedChange={v => handleConfigChange('enableSectionRatings', v)} /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between"><Label htmlFor="section-rating-mandatory">Ratings Mandatory</Label><Switch id="section-rating-mandatory" disabled={!currentSection.enableSectionRatings} checked={currentSection.sectionRatingMandatory} onCheckedChange={v => handleConfigChange('sectionRatingMandatory', v)} /></div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="rating-scale">Maximum Rating Scale</Label>
                                <Input id="rating-scale" type="number" disabled={!currentSection.enableSectionRatings} value={currentSection.ratingScale || 5} onChange={e => handleConfigChange('ratingScale', parseInt(e.target.value, 10))} min="1" max="10"/>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="rating-calculation-method">Rating Calculation Method</Label>
                                 <Select disabled={!currentSection.enableSectionRatings} onValueChange={(v) => handleConfigChange('ratingCalculationMethod', v)} value={currentSection.ratingCalculationMethod}>
                                    <SelectTrigger id="rating-calculation-method"><SelectValue placeholder="Select Method" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Manual Rating">Manual Rating</SelectItem>
                                        <SelectItem value="Mid Year Rating Calculation">Mid Year Rating Calculation</SelectItem>
                                        <SelectItem value="Annual Year Rating Calculation">Annual Year Rating Calculation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between"><Label>Enable Section Comments</Label><Switch checked={currentSection.enableSectionComments} onCheckedChange={v => handleConfigChange('enableSectionComments', v)} /></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between"><Label htmlFor="section-comment-mandatory">Comments Mandatory</Label><Switch id="section-comment-mandatory" disabled={!currentSection.enableSectionComments} checked={currentSection.sectionCommentMandatory} onCheckedChange={v => handleConfigChange('sectionCommentMandatory', v)} /></div>
                            </div>
                            <div/>
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

              {['Competencies', 'Survey Question Group', 'Rating'].includes(currentSection.type!) && (
                <Card>
                    <CardHeader><CardTitle>Rating Scale</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Label htmlFor="rating-scale">Star Rating Maximum (N)</Label>
                        <Input id="rating-scale" type="number" value={currentSection.ratingScale || 5} onChange={e => handleConfigChange('ratingScale', parseInt(e.target.value, 10))} min="1" max="10"/>
                        <Label>Example:</Label>
                        <StarRating count={currentSection.ratingScale || 5} value={Math.ceil((currentSection.ratingScale || 5)/2)} onChange={()=>{}}/>
                    </CardContent>
                </Card>
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
                                  <TableHead className="text-center">Rate / Edit</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {currentSection.permissions?.map(({role, view, edit}) => (
                                  <TableRow key={role}>
                                      <TableCell className="font-medium">{role}</TableCell>
                                      <TableCell className="text-center"><Switch checked={view} onCheckedChange={(val) => handlePermissionChange(role, 'view', val)}/></TableCell>
                                      <TableCell className="text-center"><Switch checked={edit} onCheckedChange={(val) => handlePermissionChange(role, 'edit', val)}/></TableCell>
                                  </TableRow>
                              ))}
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
      {state.performanceTemplateSections.some(s => s.performanceTemplateId === selectedPerformanceTemplateId) && (
         <div className="flex justify-end mt-6">
            <Button onClick={onComplete} variant="default">Next Step</Button>
        </div>
      )}
    </div>
  );
}
