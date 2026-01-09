
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Settings, Trash2 } from 'lucide-react';
import type { StepProps, PerformanceTemplateSection as PerformanceTemplateSectionType, AccessPermission, SectionType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from './shared/star-rating';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLES = ['Worker', 'Primary Appraiser', 'Secondary Appraiser 1', 'Secondary Appraiser 2', 'HR / Department Head'];

const performanceSectionTypes: SectionType[] = ['Performance Goals', 'Overall Summary', 'Competencies', 'Comment'];
const surveySectionTypes: SectionType[] = ['Survey Question Group', 'Rating', 'Comment'];


interface PerformanceTemplateSectionProps extends StepProps {
    selectedPerformanceTemplateId?: string;
}

export function PerformanceTemplateSection({ state, dispatch, onComplete, selectedPerformanceTemplateId }: PerformanceTemplateSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<Partial<PerformanceTemplateSectionType> | null>(null);
  const { toast } = useToast();

  const selectedTemplate = useMemo(() => 
    state.performanceTemplates.find(t => t.id === selectedPerformanceTemplateId),
    [selectedPerformanceTemplateId, state.performanceTemplates]
  );
  
  const availableSectionTypes = useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedTemplate.category === 'Performance' ? performanceSectionTypes : surveySectionTypes;
  }, [selectedTemplate]);
  
  const templateSections = useMemo(() => 
    state.performanceTemplateSections.filter(s => s.performanceTemplateId === selectedPerformanceTemplateId),
    [selectedPerformanceTemplateId, state.performanceTemplateSections]
  );

  const handleAddSection = (type: SectionType) => {
    if (!type || !selectedPerformanceTemplateId) return;

    const newSection: PerformanceTemplateSectionType = {
        id: `ds-${Date.now()}`,
        name: type, // Default name to type, can be changed in setup
        type: type,
        performanceTemplateId: selectedPerformanceTemplateId,
        ratingScale: 5,
        permissions: ROLES.map(role => ({ role, view: true, edit: false }))
    };
    
    dispatch({ type: 'SET_PERFORMANCE_TEMPLATE_SECTIONS', payload: [...state.performanceTemplateSections, newSection] });
  };
  
  const handleRemoveSection = (sectionId: string) => {
    dispatch({ type: 'SET_PERFORMANCE_TEMPLATE_SECTIONS', payload: state.performanceTemplateSections.filter(s => s.id !== sectionId) });
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
    if (!currentSection) return;
    
    const updatedSections = state.performanceTemplateSections.map(s => s.id === currentSection.id ? currentSection as PerformanceTemplateSectionType : s);
    
    dispatch({ type: 'SET_PERFORMANCE_TEMPLATE_SECTIONS', payload: updatedSections });
    toast({
        title: 'Success',
        description: `Configuration for "${currentSection.name}" has been saved.`,
    });
    setIsDialogOpen(false);
    setCurrentSection(null);
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
          <CardDescription>Add and configure the content blocks for this performance template.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-2">
                <Select onValueChange={(v: SectionType) => handleAddSection(v)} value="">
                    <SelectTrigger><SelectValue placeholder="Select a section type to add..." /></SelectTrigger>
                    <SelectContent>
                        {availableSectionTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button variant="outline"><PlusCircle className="mr-2"/> Add Section</Button>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateSections.map(section => (
                <Card key={section.id}>
                  <CardHeader>
                      <CardTitle className="font-headline text-lg">{section.name}</CardTitle>
                      <CardDescription>{section.type}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <Button onClick={() => handleSetupClick(section)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Setup
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveSection(section.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {templateSections.length === 0 && (
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

              {currentSection.type !== 'Comment' && (
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
