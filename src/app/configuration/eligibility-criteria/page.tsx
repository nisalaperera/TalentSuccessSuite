
'use client';

import { useReducer, useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { configReducer, initialState } from '@/lib/state';
import { useToast } from '@/hooks/use-toast';
import type { Eligibility as EligibilityType, ExclusionRule } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Upload, X } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentData } from 'firebase/firestore';

type RuleType = 'Person Type' | 'Department' | 'Legal Entity';

export default function EligibilityCriteriaPage() {
    const [state, dispatch] = useReducer(configReducer, initialState);
    const firestore = useFirestore();
    
    const eligibilityQuery = useMemoFirebase(() => collection(firestore, 'eligibility_criteria'), [firestore]);
    const { data: eligibilityCriteria } = useCollection<EligibilityType>(eligibilityQuery);

    const performanceDocumentsQuery = useMemoFirebase(() => collection(firestore, 'performance_documents'), [firestore]);
    const { data: performanceDocuments } = useCollection<DocumentData>(performanceDocumentsQuery);


    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEligibility, setEditingEligibility] = useState<EligibilityType | null>(null);
    const { toast } = useToast();

    // Form state
    const [eligibilityName, setEligibilityName] = useState('');
    const [rules, setRules] = useState<ExclusionRule[]>([]);
    const [newRuleType, setNewRuleType] = useState<RuleType | undefined>();
    const [newRuleValues, setNewRuleValues] = useState<string[]>([]);
    const [newLovValue, setNewLovValue] = useState('');
    
    useEffect(() => {
        if (editingEligibility) {
            setEligibilityName(editingEligibility.name);
            setRules(editingEligibility.rules);
        } else {
            setEligibilityName('');
            setRules([]);
        }
    }, [editingEligibility]);

    const handleOpenDialog = (eligibility: EligibilityType | null = null) => {
        setEditingEligibility(eligibility);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditingEligibility(null);
        setIsDialogOpen(false);
    };

    const handleAddValueToRule = (value: string) => {
        if (!newRuleType || !value || newRuleValues.includes(value)) return;
        setNewRuleValues([...newRuleValues, value]);
    };
    const handleRemoveValueFromRule = (value: string) => setNewRuleValues(newRuleValues.filter(v => v !== value));
    
    const handleAddRule = () => {
        if (!newRuleType || newRuleValues.length === 0) {
            toast({ title: "Rule type and values are required", variant: "destructive" });
            return;
        }
        setRules([...rules, { id: `rule-${Date.now()}`, type: newRuleType, values: newRuleValues }]);
        setNewRuleType(undefined);
        setNewRuleValues([]);
    };

    const handleAddLov = () => {
        if (!newRuleType || !newLovValue) return;
        const lovMap = { 'Person Type': 'personTypes', 'Department': 'departments', 'Legal Entity': 'legalEntities' };
        dispatch({ type: 'ADD_LOV_VALUE', payload: { lovType: lovMap[newRuleType] as any, value: newLovValue } });
        toast({ title: "Success", description: `Value "${newLovValue}" added to ${newRuleType}.` });
        setNewLovValue('');
    };

    const handleSave = () => {
        if (!eligibilityName) {
            toast({ title: "Eligibility configuration name is required", variant: "destructive" });
            return;
        }

        const eligibilityData = {
            name: eligibilityName,
            rules,
            status: editingEligibility?.status || 'Active'
        }
        
        if (editingEligibility) {
            const docRef = doc(firestore, 'eligibility_criteria', editingEligibility.id);
            updateDocumentNonBlocking(docRef, eligibilityData);
            toast({ title: "Success", description: `Eligibility "${eligibilityName}" updated.` });
        } else {
            const collRef = collection(firestore, 'eligibility_criteria');
            addDocumentNonBlocking(collRef, eligibilityData);
            toast({ title: "Success", description: `Eligibility configuration "${eligibilityName}" saved.` });
        }
        handleCloseDialog();
    };

    const isEligibilityInUse = (id: string) => (performanceDocuments || []).some(pd => pd.eligibilityId === id);

    const handleDelete = (id: string) => {
        const docRef = doc(firestore, 'eligibility_criteria', id);
        deleteDocumentNonBlocking(docRef);
        toast({ title: 'Success', description: 'Eligibility criteria deleted.' });
    };

    const handleToggleStatus = (eligibility: EligibilityType) => {
        const newStatus = eligibility.status === 'Active' ? 'Inactive' : 'Active';
        const docRef = doc(firestore, 'eligibility_criteria', eligibility.id);
        updateDocumentNonBlocking(docRef, { status: newStatus });
        toast({ title: 'Success', description: `Eligibility status set to ${newStatus}.` });
    };

    const getLovForType = (type: RuleType | undefined) => {
        if (!type) return [];
        const map = { 'Person Type': state.lovs.personTypes, 'Department': state.lovs.departments, 'Legal Entity': state.lovs.legalEntities };
        return map[type];
    };

    const tableColumns = useMemo(() => columns({ onEdit: handleOpenDialog, onDelete: handleDelete, onToggleStatus: handleToggleStatus, isEligibilityInUse }), [performanceDocuments]);

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Eligibility Criteria"
                description="Manage all your eligibility criteria here."
                onAddNew={() => handleOpenDialog()}
            />
            <DataTable columns={tableColumns} data={eligibilityCriteria ?? []} />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">{editingEligibility ? 'Edit' : 'Define'} Eligibility Criteria</DialogTitle>
                        <DialogDescription>Define a named set of exclusion rules. Employees matching any rule will be ineligible.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <Input placeholder="Eligibility Config Name (e.g., 'FY25 Annual Exclusions')" value={eligibilityName} onChange={e => setEligibilityName(e.target.value)} />
                        
                        <div className="p-4 border rounded-lg space-y-4">
                            <h4 className="font-semibold font-headline">Exclusion Rules</h4>
                            {rules.map(rule => (
                                <div key={rule.id} className="flex justify-between items-center text-sm p-2 bg-muted rounded-md">
                                    <span>Exclude if <strong>{rule.type}</strong> is one of [{rule.values.join(', ')}]</span>
                                    <Button variant="ghost" size="icon" onClick={() => setRules(rules.filter(r => r.id !== rule.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                            {rules.length === 0 && <p className="text-sm text-muted-foreground">No rules defined yet.</p>}
                        </div>

                        <div className="p-4 border rounded-lg space-y-4">
                            <h4 className="font-semibold font-headline">Add New Exclusion Rule</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select onValueChange={(v: RuleType) => { setNewRuleType(v); setNewRuleValues([]); }} value={newRuleType || ''}><SelectTrigger><SelectValue placeholder="Exclusion Rule Type" /></SelectTrigger><SelectContent><SelectItem value="Person Type">Person Type</SelectItem><SelectItem value="Department">Department</SelectItem><SelectItem value="Legal Entity">Legal Entity</SelectItem></SelectContent></Select>
                                <Select onValueChange={handleAddValueToRule} disabled={!newRuleType} value=""><SelectTrigger><SelectValue placeholder="Select Values to Exclude" /></SelectTrigger><SelectContent>{getLovForType(newRuleType).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
                            </div>

                            {newRuleValues.length > 0 && <div className="flex flex-wrap gap-2">{newRuleValues.map(val => (<Badge key={val} variant="secondary" className="flex items-center gap-1">{val}<button onClick={() => handleRemoveValueFromRule(val)} className="rounded-full hover:bg-muted-foreground/20"><X className="h-3 w-3"/></button></Badge>))}</div>}
                            <Button onClick={handleAddRule} variant="secondary"><PlusCircle className="mr-2"/>Add Rule</Button>

                            {newRuleType && <div className="flex gap-2 items-end pt-4 border-t"><div className="flex-grow"><Label>Add a new value for "{newRuleType}"</Label><Input placeholder="New value..." value={newLovValue} onChange={e => setNewLovValue(e.target.value)} /></div><Button onClick={handleAddLov}><PlusCircle className="mr-2"/>Add Value</Button></div>}
                        </div>

                        <div className="p-4 border rounded-lg space-y-4"><h4 className="font-semibold font-headline">Upload Employee Exclusion List</h4><p className="text-sm text-muted-foreground">Upload a list of employees under the "Commercial Transferred (2in1 Box)" category.</p><div className="flex gap-2 items-center"><Input type="file" className="flex-grow"/><Button variant="secondary"><Upload className="mr-2"/>Upload</Button></div></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSave}>{editingEligibility ? 'Save Changes' : 'Save Eligibility Config'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
