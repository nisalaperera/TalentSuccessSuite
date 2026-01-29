
'use client';

import { useState, useMemo, Suspense, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, doc, getDocs } from 'firebase/firestore';
import type { EmployeePerformanceDocument, PerformanceCycle, ReviewPeriod, Employee, PerformanceTemplate, AppraiserMapping, EvaluationFlow, PerformanceDocument } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, ArrowUpWideNarrow, Trash2, Users, Upload, Download, PlusCircle, Eye } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EVALUATION_FLOW_PROCESS_PHASES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

function EmployeeDocumentsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Dialog states
    const [isManageAppraisersOpen, setIsManageAppraisersOpen] = useState(false);
    const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
    const [isPromoteConfirmOpen, setIsPromoteConfirmOpen] = useState(false);
    const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);

    // Data for dialogs
    const [documentToManage, setDocumentToManage] = useState<EmployeePerformanceDocument | null>(null);
    const [documentToView, setDocumentToView] = useState<EmployeePerformanceDocument | null>(null);
    const [promotionDetails, setPromotionDetails] = useState<{ count: number; currentStatus: string; nextStatus: string; docsToUpdate: EmployeePerformanceDocument[]; } | null>(null);
    const [selectedDocsForBulkUpdate, setSelectedDocsForBulkUpdate] = useState<EmployeePerformanceDocument[]>([]);
    
    // Manage appraisers state
    const [primaryAppraiserToManage, setPrimaryAppraiserToManage] = useState<Partial<AppraiserMapping> | null>(null);
    const [secondaryAppraisersToManage, setSecondaryAppraisersToManage] = useState<Partial<AppraiserMapping>[]>([]);
    const [originalAppraisers, setOriginalAppraisers] = useState<AppraiserMapping[]>([]);

    // Bulk appraiser form state
    const [bulkPrimaryAppraiser, setBulkPrimaryAppraiser] = useState('');
    const [bulkPrimaryEvalTypes, setBulkPrimaryEvalTypes] = useState<string[]>([]);
    const [bulkSecondaryAppraisers, setBulkSecondaryAppraisers] = useState<Array<{ id: string; personNumber: string; evalGoalTypes: string[] }>>([{ id: `new-${Date.now()}`, personNumber: '', evalGoalTypes: [] }]);

    const employeeDocumentsQuery = useMemoFirebase(() => collection(firestore, 'employee_performance_documents'), [firestore]);
    const { data: employeeDocuments } = useCollection<EmployeePerformanceDocument>(employeeDocumentsQuery);

    const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
    const { data: employees } = useCollection<Employee>(employeesQuery);

    const performanceCyclesQuery = useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]);
    const { data: performanceCycles } = useCollection<PerformanceCycle>(performanceCyclesQuery);

    const reviewPeriodsQuery = useMemoFirebase(() => collection(firestore, 'review_periods'), [firestore]);
    const { data: reviewPeriods } = useCollection<ReviewPeriod>(reviewPeriodsQuery);
    
    const performanceTemplatesQuery = useMemoFirebase(() => collection(firestore, 'performance_templates'), [firestore]);
    const { data: performanceTemplates } = useCollection<PerformanceTemplate>(performanceTemplatesQuery);

    const performanceDocumentsDataQuery = useMemoFirebase(() => collection(firestore, 'performance_documents'), [firestore]);
    const { data: allPerformanceDocuments } = useCollection<PerformanceDocument>(performanceDocumentsDataQuery);
    
    const appraiserMappingsQuery = useMemoFirebase(() => collection(firestore, 'employee_appraiser_mappings'), [firestore]);
    const { data: allAppraiserMappings } = useCollection<AppraiserMapping>(appraiserMappingsQuery);

    const evaluationFlowsQuery = useMemoFirebase(() => collection(firestore, 'evaluation_flows'), [firestore]);
    const { data: evaluationFlows } = useCollection<EvaluationFlow>(evaluationFlowsQuery);
    
    // State for filter inputs, initialized from URL params
    const [selectedCycleId, setSelectedCycleId] = useState(searchParams.get('cycleId') || '');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(searchParams.get('employeeId') || '');
    const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
    const [selectedPrimaryAppraiserId, setSelectedPrimaryAppraiserId] = useState(searchParams.get('primaryAppraiserId') || '');
    const [selectedSecondaryAppraiserId, setSelectedSecondaryAppraiserId] = useState(searchParams.get('secondaryAppraiserId') || '');

    // Filters from URL for data filtering
    const cycleFilter = searchParams.get('cycleId');
    const employeeFilter = searchParams.get('employeeId');
    const statusFilter = searchParams.get('status');
    const primaryAppraiserFilter = searchParams.get('primaryAppraiserId');
    const secondaryAppraiserFilter = searchParams.get('secondaryAppraiserId');

    const handleSearch = () => {
        if (!selectedCycleId) {
            toast({
                title: "Required Field",
                description: "Please select a Performance Cycle to begin your search.",
                variant: "destructive",
            });
            return;
        }

        const params = new URLSearchParams();
        if (selectedCycleId && selectedCycleId !== 'all') params.set('cycleId', selectedCycleId);
        if (selectedEmployeeId && selectedEmployeeId !== 'all') params.set('employeeId', selectedEmployeeId);
        if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);
        if (selectedPrimaryAppraiserId && selectedPrimaryAppraiserId !== 'all') params.set('primaryAppraiserId', selectedPrimaryAppraiserId);
        if (selectedSecondaryAppraiserId && selectedSecondaryAppraiserId !== 'all') params.set('secondaryAppraiserId', selectedSecondaryAppraiserId);

        router.push(`/configuration/employee-documents?${params.toString()}`);
    };

    const clearFilters = () => {
        setSelectedCycleId('');
        setSelectedEmployeeId('');
        setSelectedStatus('');
        setSelectedPrimaryAppraiserId('');
        setSelectedSecondaryAppraiserId('');
        router.push('/configuration/employee-documents');
    };

    const employeeOptions = useMemo(() => {
        if (!employees) return [];
        return employees.map(emp => ({
            value: emp.id,
            label: `${emp.firstName} ${emp.lastName} (${emp.personNumber})`,
        }));
    }, [employees]);
    
    const appraiserOptions = useMemo(() => {
        if (!employees) return [];
        return employees.map(emp => ({
            value: emp.personNumber,
            label: `${emp.firstName} ${emp.lastName} | ${emp.personNumber}`
        }));
    }, [employees]);

    const getEmployeeName = useCallback((id: string) => {
        const emp = employees?.find(e => e.id === id);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
    }, [employees]);

    const getEmployeeNameByPersonNumber = useCallback((personNumber: string) => {
        const emp = employees?.find(e => e.personNumber === personNumber);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
    }, [employees]);

    const getCycleName = useCallback((id: string) => {
        const cycle = performanceCycles?.find(c => c.id === id);
        if (!cycle) return 'N/A';
        const period = reviewPeriods?.find(p => p.id === cycle.reviewPeriodId);
        return `${cycle.name} (${period?.name || 'N/A'})`;
    }, [performanceCycles, reviewPeriods]);
    
    const getTemplateName = useCallback((id: string) => performanceTemplates?.find(t => t.id === id)?.name || 'N/A', [performanceTemplates]);
    
    const getAppraisersForDocument = useCallback((doc: EmployeePerformanceDocument): AppraiserMapping[] => {
        if (!allAppraiserMappings || !employees) return [];
        const docEmployee = employees.find(e => e.id === doc.employeeId);
        if (!docEmployee) return [];

        return allAppraiserMappings.filter(
            (mapping) =>
                mapping.employeePersonNumber === docEmployee.personNumber &&
                mapping.performanceCycleId === doc.performanceCycleId
        ).sort((a, b) => { // Sort by Primary first
            if (a.appraiserType === 'Primary' && b.appraiserType !== 'Primary') return -1;
            if (a.appraiserType !== 'Primary' && b.appraiserType === 'Primary') return 1;
            return 0;
        });
    }, [allAppraiserMappings, employees]);

    const handleManageAppraisers = useCallback((doc: EmployeePerformanceDocument) => {
        setDocumentToManage(doc);
        setIsManageAppraisersOpen(true);
    }, []);

     useEffect(() => {
        if (isManageAppraisersOpen && documentToManage && allAppraiserMappings && employees) {
            const docEmployee = employees.find(e => e.id === documentToManage.employeeId);
            if (!docEmployee) return;

            const currentAppraisers = allAppraiserMappings.filter(
                m => m.employeePersonNumber === docEmployee.personNumber && m.performanceCycleId === documentToManage.performanceCycleId
            );
            
            setOriginalAppraisers(currentAppraisers);
            setPrimaryAppraiserToManage(currentAppraisers.find(a => a.appraiserType === 'Primary') || {
                employeePersonNumber: docEmployee.personNumber,
                performanceCycleId: documentToManage.performanceCycleId,
                appraiserType: 'Primary',
                isCompleted: false,
                evalGoalTypes: 'Work'
            });
            setSecondaryAppraisersToManage(currentAppraisers.filter(a => a.appraiserType === 'Secondary'));

        } else {
            setPrimaryAppraiserToManage(null);
            setSecondaryAppraisersToManage([]);
            setOriginalAppraisers([]);
        }
    }, [isManageAppraisersOpen, documentToManage, allAppraiserMappings, employees]);
    
    const handleViewDetails = useCallback((doc: EmployeePerformanceDocument) => {
        setDocumentToView(doc);
        setIsViewDetailsOpen(true);
    }, []);

    const handleSaveAppraisers = async () => {
        if (!documentToManage || !primaryAppraiserToManage) return;

        const allNewAppraisers = [primaryAppraiserToManage, ...secondaryAppraisersToManage];
        if (!primaryAppraiserToManage.appraiserPersonNumber) {
             toast({ title: 'Validation Error', description: 'Primary Appraiser must be assigned.', variant: 'destructive'});
            return;
        }

        const appraiserPersonNumbers = allNewAppraisers.map(a => a.appraiserPersonNumber).filter(Boolean);
        const hasDuplicates = new Set(appraiserPersonNumbers).size !== appraiserPersonNumbers.length;
        if(hasDuplicates) {
            toast({ title: 'Validation Error', description: 'An employee cannot be assigned as an appraiser more than once.', variant: 'destructive'});
            return;
        }

        try {
            const batch = writeBatch(firestore);
            const finalMappings = [primaryAppraiserToManage, ...secondaryAppraisersToManage];

            // Delete mappings that are no longer in the list
            originalAppraisers.forEach(orig => {
                if (!finalMappings.find(managed => managed.id === orig.id)) {
                    batch.delete(doc(firestore, 'employee_appraiser_mappings', orig.id));
                }
            });

            // Update or add new mappings
            finalMappings.forEach(managed => {
                if (managed.id && !managed.id.startsWith('new-')) { // This is an existing mapping
                    const orig = originalAppraisers.find(o => o.id === managed.id);
                    if (orig && JSON.stringify(orig) !== JSON.stringify(managed)) {
                        const { id, ...data } = managed;
                        batch.update(doc(firestore, 'employee_appraiser_mappings', managed.id), data);
                    }
                } else { // This is a new secondary appraiser
                    if (managed.appraiserPersonNumber) { // Only add if an appraiser is selected
                        const { id, ...data } = managed;
                        batch.set(doc(collection(firestore, 'employee_appraiser_mappings')), data);
                    }
                }
            });
            
            await batch.commit();
            toast({ title: 'Success', description: 'Appraiser list updated.' });
            setIsManageAppraisersOpen(false);
        } catch (error) {
            console.error('Error updating appraisers:', error);
            toast({ title: 'Error', description: 'Failed to update appraisers.', variant: 'destructive' });
        }
    };
    
    // --- Bulk Action Handlers ---

    const handlePromoteClick = (table: TanstackTable<EmployeePerformanceDocument>) => {
        const selectedDocs = table.getFilteredSelectedRowModel().rows.map(row => row.original);
        
        if (selectedDocs.length === 0) {
            toast({ title: "No Selection", description: "Please select documents to promote.", variant: "destructive" });
            return;
        }

        const firstDoc = selectedDocs[0];
        const currentStatus = firstDoc.status;
        const currentCycleId = firstDoc.performanceCycleId;

        if (!selectedDocs.every(doc => doc.status === currentStatus && doc.performanceCycleId === currentCycleId)) {
            toast({ title: "Inconsistent Selection", description: "All selected documents must have the same status and performance cycle.", variant: "destructive" });
            return;
        }

        const flow = evaluationFlows?.find(f => f.id === firstDoc.evaluationFlowId);
        if (!flow) {
            toast({ title: "Workflow Error", description: "Could not find the evaluation flow.", variant: "destructive" });
            return;
        }
        
        const sortedSteps = [...flow.steps].sort((a,b) => a.sequence - b.sequence);
        const currentStep = sortedSteps.find(step => step.task === currentStatus);
        if (!currentStep) {
            toast({ title: "Workflow Error", description: "Could not determine current workflow step.", variant: "destructive" });
            return;
        }

        let nextStep = null;
        let minNextSequence = Infinity;

        // Find the lowest sequence number that is greater than the current one
        for (const step of sortedSteps) {
            if (step.sequence > currentStep.sequence) {
                if (step.sequence < minNextSequence) {
                    minNextSequence = step.sequence;
                }
            }
        }
        
        if (minNextSequence === Infinity) {
            toast({ title: "Workflow End", description: "Documents are already at the final step.", variant: "destructive" });
            return;
        }
        
        // Find the first step with that sequence number
        nextStep = sortedSteps.find(step => step.sequence === minNextSequence);

        if (!nextStep) {
            toast({ title: "Workflow Error", description: "Could not determine the next step.", variant: "destructive" });
            return;
        }

        setPromotionDetails({
            count: selectedDocs.length,
            currentStatus,
            nextStatus: nextStep.task,
            docsToUpdate: selectedDocs
        });
        setIsPromoteConfirmOpen(true);
    };
    
    const executePromotion = async (table: TanstackTable<EmployeePerformanceDocument>) => {
        if (!promotionDetails) return;
        
        try {
            const batch = writeBatch(firestore);
            promotionDetails.docsToUpdate.forEach(docToUpdate => {
                const docRef = doc(firestore, 'employee_performance_documents', docToUpdate.id);
                batch.update(docRef, { status: promotionDetails.nextStatus });
            });
            await batch.commit();

            toast({ title: "Success", description: `${promotionDetails.count} document(s) promoted to "${promotionDetails.nextStatus}".`});
            table.resetRowSelection();
        } catch (error) {
            console.error("Error promoting documents:", error);
            toast({ title: "Update Failed", description: "An error occurred while updating statuses.", variant: "destructive" });
        } finally {
            setIsPromoteConfirmOpen(false);
            setPromotionDetails(null);
        }
    };
    
    const handleBulkUpdateClick = (table: TanstackTable<EmployeePerformanceDocument>) => {
        const selected = table.getFilteredSelectedRowModel().rows.map(r => r.original);
        if (selected.length === 0) {
            toast({ title: "No Selection", description: "Please select documents to update.", variant: "destructive"});
            return;
        }
        setSelectedDocsForBulkUpdate(selected);
        setBulkPrimaryAppraiser('');
        setBulkPrimaryEvalTypes([]);
        setBulkSecondaryAppraisers([{ id: `new-${Date.now()}`, personNumber: '', evalGoalTypes: [] }]);
        setIsBulkUpdateOpen(true);
    };

    const executeBulkAppraiserUpdate = async () => {
        if (selectedDocsForBulkUpdate.length === 0) return;
        
        const validSecondaries = bulkSecondaryAppraisers.filter(s => s.personNumber);
        if (!bulkPrimaryAppraiser && validSecondaries.length === 0) {
            toast({ title: "Input Required", description: "Please select at least one appraiser to apply.", variant: "destructive"});
            return;
        }
        
        const allAppraiserPersonNumbers = [bulkPrimaryAppraiser, ...validSecondaries.map(s => s.personNumber)].filter(Boolean);
        const hasDuplicates = new Set(allAppraiserPersonNumbers).size !== allAppraiserPersonNumbers.length;
        if(hasDuplicates) {
            toast({ title: "Validation Error", description: "An employee cannot be assigned as an appraiser more than once.", variant: "destructive"});
            return;
        }

        try {
            const batch = writeBatch(firestore);
            const cycleId = selectedDocsForBulkUpdate[0].performanceCycleId;
            const employeePersonNumbers = selectedDocsForBulkUpdate.map(doc => employees?.find(e => e.id === doc.employeeId)?.personNumber).filter(Boolean) as string[];

            const mappingsQuery = query(collection(firestore, 'employee_appraiser_mappings'), where('performanceCycleId', '==', cycleId), where('employeePersonNumber', 'in', employeePersonNumbers));
            const existingMappingsSnapshot = await getDocs(mappingsQuery);
            existingMappingsSnapshot.forEach(doc => batch.delete(doc.ref));

            for (const personNumber of employeePersonNumbers) {
                if (bulkPrimaryAppraiser) {
                    batch.set(doc(collection(firestore, 'employee_appraiser_mappings')), {
                        employeePersonNumber: personNumber,
                        performanceCycleId: cycleId,
                        appraiserType: 'Primary',
                        appraiserPersonNumber: bulkPrimaryAppraiser,
                        evalGoalTypes: bulkPrimaryEvalTypes.join(','),
                        isCompleted: false
                    });
                }
                for (const secondary of validSecondaries) {
                     batch.set(doc(collection(firestore, 'employee_appraiser_mappings')), {
                        employeePersonNumber: personNumber,
                        performanceCycleId: cycleId,
                        appraiserType: 'Secondary',
                        appraiserPersonNumber: secondary.personNumber,
                        evalGoalTypes: secondary.evalGoalTypes.join(','),
                        isCompleted: false
                    });
                }
            }

            await batch.commit();
            toast({ title: "Success", description: `Appraisers updated for ${selectedDocsForBulkUpdate.length} document(s).`});
            setIsBulkUpdateOpen(false);

        } catch (error) {
            console.error("Error bulk updating appraisers:", error);
            toast({ title: "Bulk Update Failed", description: "An error occurred.", variant: "destructive" });
        }
    };
    
    // --- CSV Handlers ---
    const downloadCSV = (content: string, fileName: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadTemplate = () => {
        const header = "EmployeePersonNumber,PerformanceCycleId,AppraiserPersonNumber,AppraiserType,EvalGoalTypes\n";
        downloadCSV(header, 'appraiser_template.csv');
    };

    const handleDownloadSelected = async () => {
         if (selectedDocsForBulkUpdate.length === 0) {
            toast({ title: 'No Selection', description: 'Please select documents from the table to download their appraiser data.', variant: 'destructive'});
            return;
        }
        
        let csvContent = "EmployeePersonNumber,PerformanceCycleId,AppraiserPersonNumber,AppraiserType,EvalGoalTypes\n";

        const employeePersonNumbers = selectedDocsForBulkUpdate.map(doc => employees?.find(e => e.id === doc.employeeId)?.personNumber).filter((pn): pn is string => !!pn);
        const cycleIds = [...new Set(selectedDocsForBulkUpdate.map(doc => doc.performanceCycleId))];


        if (employeePersonNumbers.length === 0 || cycleIds.length === 0) {
            toast({ title: 'No Data Found', description: 'Could not find employee or cycle details for the selected documents.', variant: 'destructive'});
            return;
        }

        const relevantMappings = (allAppraiserMappings || []).filter(m => 
            employeePersonNumbers.includes(m.employeePersonNumber) && 
            cycleIds.includes(m.performanceCycleId)
        );

        for (const mapping of relevantMappings) {
            csvContent += `${mapping.employeePersonNumber},${mapping.performanceCycleId},${mapping.appraiserPersonNumber},${mapping.appraiserType},"${mapping.evalGoalTypes}"\n`;
        }
        
        downloadCSV(csvContent, `selected_appraisers.csv`);
    };

    const handleFileUpload = async () => {
        if (!fileToUpload) {
            toast({ title: "No File Selected", description: "Please select a CSV file to upload.", variant: 'destructive' });
            return;
        }

        try {
            const content = await fileToUpload.text();
            const lines = content.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) {
                 toast({ title: "Empty File", description: "The CSV file is empty or contains only a header.", variant: "destructive" });
                return;
            }

            const header = lines[0].trim().replace(/"/g, '');
            if (header.toLowerCase() !== "employeepersonnumber,performancecycleid,appraiserpersonnumber,appraisertype,evalgoaltypes") {
                toast({ title: "Invalid CSV", description: "CSV header does not match the template.", variant: "destructive" });
                return;
            }

            const rows = lines.slice(1);
            
            const groupedData = new Map<string, { emp: string; cycle: string; appraisers: any[] }>();
            for (const row of rows) {
                const [emp, cycle, appraiser, type, types] = row.split(',').map(v => v.trim().replace(/"/g, ''));
                 if (emp && cycle) {
                    const key = `${emp}-${cycle}`;
                    if (!groupedData.has(key)) {
                        groupedData.set(key, { emp, cycle, appraisers: [] });
                    }
                     if (appraiser && type) {
                        groupedData.get(key)!.appraisers.push({ appraiser, type, types: types || '' });
                    }
                }
            }
            
            toast({ title: 'Processing Upload...', description: `Found ${groupedData.size} employee-cycle groups to update.` });

            for (const [key, { emp, cycle, appraisers }] of groupedData.entries()) {
                const q = query(
                    collection(firestore, 'employee_appraiser_mappings'),
                    where('employeePersonNumber', '==', emp),
                    where('performanceCycleId', '==', cycle)
                );
                const existingMappingsSnapshot = await getDocs(q);
                
                const batch = writeBatch(firestore);

                existingMappingsSnapshot.forEach(doc => batch.delete(doc.ref));

                appraisers.forEach(({ appraiser, type, types }) => {
                    const newMappingRef = doc(collection(firestore, 'employee_appraiser_mappings'));
                    batch.set(newMappingRef, {
                        employeePersonNumber: emp,
                        performanceCycleId: cycle,
                        appraiserType: type as 'Primary' | 'Secondary',
                        appraiserPersonNumber: appraiser,
                        evalGoalTypes: types,
                        isCompleted: false,
                    });
                });
                
                await batch.commit();
            }

            toast({ title: 'Upload Successful', description: `Successfully updated appraisers for ${groupedData.size} employee-cycle group(s).` });
            setIsUploadDialogOpen(false);
            setFileToUpload(null);

        } catch (error) {
            console.error(error);
            toast({ title: 'Upload Failed', description: 'An error occurred during the upload process.', variant: 'destructive' });
        }
    };


    const tableColumns = useMemo(() => columns({ getEmployeeName, getCycleName, getTemplateName, getAppraisersForDocument, getEmployeeNameByPersonNumber, onManageAppraisers: handleManageAppraisers, onViewDetails: handleViewDetails }), [getEmployeeName, getCycleName, getTemplateName, getAppraisersForDocument, getEmployeeNameByPersonNumber, handleManageAppraisers, handleViewDetails]);

    const filteredData = useMemo(() => {
        if (!employeeDocuments || !cycleFilter) return [];
        return employeeDocuments.filter(doc => {
            const cycleMatch = doc.performanceCycleId === cycleFilter;
            const employeeMatch = !employeeFilter || doc.employeeId === employeeFilter;
            const statusMatch = !statusFilter || doc.status === statusFilter;
            
            const docEmployee = employees?.find(e => e.id === doc.employeeId);

            const primaryAppraiserMatch = !primaryAppraiserFilter || (allAppraiserMappings || []).some(mapping => {
                const appraiser = employees?.find(e => e.id === primaryAppraiserFilter);
                if (!appraiser || !docEmployee) return false;

                return mapping.employeePersonNumber === docEmployee.personNumber &&
                       mapping.performanceCycleId === doc.performanceCycleId &&
                       mapping.appraiserType === 'Primary' &&
                       mapping.appraiserPersonNumber === appraiser.personNumber;
            });
            
            const secondaryAppraiserMatch = !secondaryAppraiserFilter || (allAppraiserMappings || []).some(mapping => {
                const appraiser = employees?.find(e => e.id === secondaryAppraiserFilter);
                if (!appraiser || !docEmployee) return false;

                return mapping.employeePersonNumber === docEmployee.personNumber &&
                       mapping.performanceCycleId === doc.performanceCycleId &&
                       mapping.appraiserType === 'Secondary' &&
                       mapping.appraiserPersonNumber === appraiser.personNumber;
            });

            return cycleMatch && employeeMatch && statusMatch && primaryAppraiserMatch && secondaryAppraiserMatch;
        });
    }, [employeeDocuments, cycleFilter, employeeFilter, statusFilter, primaryAppraiserFilter, secondaryAppraiserFilter, employees, allAppraiserMappings]);
    
    const hasActiveFilters = cycleFilter || employeeFilter || statusFilter || primaryAppraiserFilter || secondaryAppraiserFilter;
    
    const toolbarActions = (table: TanstackTable<EmployeePerformanceDocument>) => {
        const hasSelection = table.getFilteredSelectedRowModel().rows.length > 0;
        return (
            <div className="flex items-center gap-2">
                <Button onClick={() => handlePromoteClick(table)} disabled={!hasSelection} size="sm">
                    <ArrowUpWideNarrow className="mr-2 h-4 w-4" /> Promote Status
                </Button>
                <Button onClick={() => handleBulkUpdateClick(table)} disabled={!hasSelection} size="sm">
                    <Users className="mr-2 h-4 w-4" /> Bulk Update Appraisers
                </Button>
                <Button onClick={() => {
                     setSelectedDocsForBulkUpdate(table.getFilteredSelectedRowModel().rows.map(r => r.original));
                     setIsUploadDialogOpen(true);
                }} size="sm" variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Upload Appraiser List
                </Button>
            </div>
        )
    };
    
    const viewedEmployee = useMemo(() => {
        if (!documentToView || !employees) return null;
        return employees.find(e => e.id === documentToView.employeeId);
    }, [documentToView, employees]);

    const viewedPerformanceDocument = useMemo(() => {
        if (!documentToView || !allPerformanceDocuments) return null;
        return allPerformanceDocuments.find(d => d.id === documentToView.performanceDocumentId);
    }, [documentToView, allPerformanceDocuments]);

    const viewedAppraisers = useMemo(() => {
        if (!documentToView) return [];
        return getAppraisersForDocument(documentToView);
    }, [documentToView, getAppraisersForDocument]);


    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Employee Performance Documents"
                description="Search for launched employee performance documents."
                showAddNew={false}
            />

            <div className="flex flex-wrap items-center gap-4 mb-4">
                <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
                    <SelectTrigger className="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]">
                        <SelectValue placeholder="Select Performance Cycle... (Required)" />
                    </SelectTrigger>
                    <SelectContent>
                        {(performanceCycles || []).map(cycle => (
                            <SelectItem key={cycle.id} value={cycle.id}>{getCycleName(cycle.id)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Combobox
                    options={employeeOptions}
                    value={selectedEmployeeId}
                    onChange={setSelectedEmployeeId}
                    placeholder="Filter by Employee..."
                    searchPlaceholder="Search employees..."
                    noResultsText="No employees found."
                    triggerClassName="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]"
                />
                 <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]">
                        <SelectValue placeholder="Filter by Status..." />
                    </SelectTrigger>
                    <SelectContent>
                         <SelectItem value="all">All Statuses</SelectItem>
                        {EVALUATION_FLOW_PROCESS_PHASES.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Combobox
                    options={employeeOptions}
                    value={selectedPrimaryAppraiserId}
                    onChange={setSelectedPrimaryAppraiserId}
                    placeholder="Filter by Primary Appraiser..."
                    searchPlaceholder="Search employees..."
                    noResultsText="No employees found."
                    triggerClassName="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]"
                />
                <Combobox
                    options={employeeOptions}
                    value={selectedSecondaryAppraiserId}
                    onChange={setSelectedSecondaryAppraiserId}
                    placeholder="Filter by Secondary Appraiser..."
                    searchPlaceholder="Search employees..."
                    noResultsText="No employees found."
                    triggerClassName="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]"
                />
                
                <Button onClick={handleSearch}>Search</Button>

                {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                        <X className="mr-2 h-4 w-4" />
                        Clear Search
                    </Button>
                )}
            </div>

            {cycleFilter ? (
                <DataTable 
                    columns={tableColumns} 
                    data={filteredData} 
                    toolbarActions={toolbarActions}
                />
            ) : (
                <Card className="mt-6">
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">Please select a Performance Cycle and click Search to view documents.</p>
                    </CardContent>
                </Card>
            )}

             <Dialog open={isManageAppraisersOpen} onOpenChange={setIsManageAppraisersOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline">Manage Appraisers</DialogTitle>
                        <DialogDescription>
                            Modify the appraisers for {documentToManage ? getEmployeeName(documentToManage.employeeId) : ''}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        {/* Primary Appraiser Section */}
                        {primaryAppraiserToManage && (
                             <Card>
                                <CardHeader><CardTitle className="font-headline text-lg">Primary Appraiser</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="space-y-2">
                                        <Label>Appraiser</Label>
                                        <Combobox
                                            options={appraiserOptions}
                                            value={primaryAppraiserToManage.appraiserPersonNumber || ''}
                                            onChange={(val) => setPrimaryAppraiserToManage(p => p ? {...p, appraiserPersonNumber: val} : null)}
                                            placeholder="Select an appraiser..."
                                            triggerClassName='w-full'
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Evaluation Goal Type(s)</Label>
                                        <div className="flex items-center gap-4 pt-2">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`primary-work-goal`}
                                                    checked={primaryAppraiserToManage.evalGoalTypes?.includes('Work')}
                                                    onCheckedChange={(checked) => {
                                                        const currentTypes = primaryAppraiserToManage.evalGoalTypes?.split(',').filter(t => t) || [];
                                                        let newTypes;
                                                        if (checked) {
                                                            newTypes = [...new Set([...currentTypes, 'Work'])];
                                                        } else {
                                                            newTypes = currentTypes.filter(t => t !== 'Work');
                                                        }
                                                        setPrimaryAppraiserToManage(p => p ? {...p, evalGoalTypes: newTypes.join(',')} : null);
                                                    }}
                                                />
                                                <Label htmlFor={`primary-work-goal`} className="font-normal">Work</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`primary-home-goal`}
                                                    checked={primaryAppraiserToManage.evalGoalTypes?.includes('Home')}
                                                    onCheckedChange={(checked) => {
                                                        const currentTypes = primaryAppraiserToManage.evalGoalTypes?.split(',').filter(t => t) || [];
                                                        let newTypes;
                                                        if (checked) {
                                                            newTypes = [...new Set([...currentTypes, 'Home'])];
                                                        } else {
                                                            newTypes = currentTypes.filter(t => t !== 'Home');
                                                        }
                                                        setPrimaryAppraiserToManage(p => p ? {...p, evalGoalTypes: newTypes.join(',')} : null);
                                                    }}
                                                />
                                                <Label htmlFor={`primary-home-goal`} className="font-normal">Home</Label>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* Secondary Appraisers Section */}
                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="font-headline text-lg">Secondary Appraisers</CardTitle>
                                <Button size="sm" variant="outline" onClick={() => setSecondaryAppraisersToManage(s => [...s, { id: `new-${Date.now()}`, appraiserType: 'Secondary', employeePersonNumber: primaryAppraiserToManage?.employeePersonNumber, performanceCycleId: primaryAppraiserToManage?.performanceCycleId, isCompleted: false }])}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Secondary
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {secondaryAppraisersToManage.length > 0 ? secondaryAppraisersToManage.map((appraiser, index) => (
                                    <div key={appraiser.id} className="p-4 border rounded-lg space-y-4 relative">
                                         <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => setSecondaryAppraisersToManage(s => s.filter(a => a.id !== appraiser.id))}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="space-y-2">
                                            <Label>Appraiser #{index + 1}</Label>
                                            <Combobox
                                                options={appraiserOptions}
                                                value={appraiser.appraiserPersonNumber || ''}
                                                onChange={(val) => setSecondaryAppraisersToManage(s => s.map(a => a.id === appraiser.id ? {...a, appraiserPersonNumber: val} : a))}
                                                placeholder="Select an appraiser..."
                                                triggerClassName='w-full'
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Evaluation Goal Type(s)</Label>
                                            <div className="flex items-center gap-4 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`secondary-work-goal-${appraiser.id}`}
                                                        checked={appraiser.evalGoalTypes?.includes('Work')}
                                                        onCheckedChange={(checked) => {
                                                            const currentTypes = appraiser.evalGoalTypes?.split(',').filter(t => t) || [];
                                                            let newTypes;
                                                            if (checked) { newTypes = [...new Set([...currentTypes, 'Work'])]; } 
                                                            else { newTypes = currentTypes.filter(t => t !== 'Work'); }
                                                            setSecondaryAppraisersToManage(s => s.map(a => a.id === appraiser.id ? {...a, evalGoalTypes: newTypes.join(',')} : a));
                                                        }}
                                                    />
                                                    <Label htmlFor={`secondary-work-goal-${appraiser.id}`} className="font-normal">Work</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`secondary-home-goal-${appraiser.id}`}
                                                        checked={appraiser.evalGoalTypes?.includes('Home')}
                                                        onCheckedChange={(checked) => {
                                                            const currentTypes = appraiser.evalGoalTypes?.split(',').filter(t => t) || [];
                                                            let newTypes;
                                                            if (checked) { newTypes = [...new Set([...currentTypes, 'Home'])]; } 
                                                            else { newTypes = currentTypes.filter(t => t !== 'Home'); }
                                                            setSecondaryAppraisersToManage(s => s.map(a => a.id === appraiser.id ? {...a, evalGoalTypes: newTypes.join(',')} : a));
                                                        }}
                                                    />
                                                    <Label htmlFor={`secondary-home-goal-${appraiser.id}`} className="font-normal">Home</Label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-center text-muted-foreground py-4">No secondary appraisers assigned.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsManageAppraisersOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveAppraisers}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline">Document Details</DialogTitle>
                        <DialogDescription>
                            Viewing details for the selected performance document.
                        </DialogDescription>
                    </DialogHeader>
                    {documentToView && (
                        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
                            <Card>
                                <CardHeader><CardTitle>Employee Details</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Name</span> <span>{viewedEmployee?.firstName} {viewedEmployee?.lastName}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Person Number</span> <span>{viewedEmployee?.personNumber}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Department</span> <span>{viewedEmployee?.department}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Designation</span> <span>{viewedEmployee?.designation}</span></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Performance Document Details</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Document Name</span> <span>{viewedPerformanceDocument?.name}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Cycle</span> <span>{getCycleName(documentToView.performanceCycleId)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Template</span> <span>{getTemplateName(documentToView.performanceTemplateId)}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span> <Badge variant="secondary">{documentToView.status}</Badge></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Appraiser Details</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Appraiser</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Eval Types</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewedAppraisers.length > 0 ? viewedAppraisers.map(appraiser => (
                                                <TableRow key={appraiser.id}>
                                                    <TableCell>{getEmployeeNameByPersonNumber(appraiser.appraiserPersonNumber)}</TableCell>
                                                    <TableCell>{appraiser.appraiserType}</TableCell>
                                                    <TableCell>{appraiser.evalGoalTypes}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={appraiser.isCompleted ? 'default' : 'secondary'}>
                                                            {appraiser.isCompleted ? 'Completed' : 'Pending'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center">No appraisers assigned.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             {promotionDetails && (
                <AlertDialog open={isPromoteConfirmOpen} onOpenChange={setIsPromoteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Status Promotion</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to promote {promotionDetails.count} document(s) from "{promotionDetails.currentStatus}" to "{promotionDetails.nextStatus}"?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setPromotionDetails(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => executePromotion(table)}>Promote</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
             
             <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Bulk Update Appraisers</DialogTitle>
                        <DialogDescription>
                            Apply new appraisers to the <span className="font-bold">{selectedDocsForBulkUpdate.length}</span> selected document(s). This will replace all existing appraisers for these employees in this cycle.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                        <Card>
                            <CardHeader><CardTitle className="font-headline text-lg">Primary Appraiser</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Appraiser</Label>
                                    <Combobox options={appraiserOptions} value={bulkPrimaryAppraiser} onChange={setBulkPrimaryAppraiser} placeholder="Select Primary Appraiser" triggerClassName="w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Evaluation Goal Type(s)</Label>
                                    <div className="flex items-center gap-4 pl-1">
                                        <div className="flex items-center gap-2"><Checkbox id="bulk-p-work" checked={bulkPrimaryEvalTypes.includes('Work')} onCheckedChange={(c) => setBulkPrimaryEvalTypes(c ? [...bulkPrimaryEvalTypes, 'Work'] : bulkPrimaryEvalTypes.filter(t => t !== 'Work'))} /><Label htmlFor="bulk-p-work" className="font-normal">Work</Label></div>
                                        <div className="flex items-center gap-2"><Checkbox id="bulk-p-home" checked={bulkPrimaryEvalTypes.includes('Home')} onCheckedChange={(c) => setBulkPrimaryEvalTypes(c ? [...bulkPrimaryEvalTypes, 'Home'] : bulkPrimaryEvalTypes.filter(t => t !== 'Home'))} /><Label htmlFor="bulk-p-home" className="font-normal">Home</Label></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="font-headline text-lg">Secondary Appraisers</CardTitle>
                                <Button size="sm" variant="outline" onClick={() => setBulkSecondaryAppraisers(s => [...s, { id: `new-${Date.now()}`, personNumber: '', evalGoalTypes: [] }])}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {bulkSecondaryAppraisers.map((secondary, index) => (
                                    <div key={secondary.id} className="p-4 border rounded-lg space-y-4 relative">
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => setBulkSecondaryAppraisers(s => s.filter(a => a.id !== secondary.id))}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                         <div className="space-y-2">
                                            <Label>Appraiser #{index + 1}</Label>
                                            <Combobox options={appraiserOptions} value={secondary.personNumber} onChange={(val) => setBulkSecondaryAppraisers(s => s.map(a => a.id === secondary.id ? { ...a, personNumber: val } : a))} placeholder="Select Secondary Appraiser" triggerClassName="w-full" />
                                         </div>
                                         <div className="space-y-2">
                                            <Label>Evaluation Goal Type(s)</Label>
                                            <div className="flex items-center gap-4 pl-1">
                                                <div className="flex items-center gap-2"><Checkbox id={`bulk-s-work-${secondary.id}`} checked={secondary.evalGoalTypes.includes('Work')} onCheckedChange={(c) => setBulkSecondaryAppraisers(s => s.map(a => a.id === secondary.id ? { ...a, evalGoalTypes: c ? [...a.evalGoalTypes, 'Work'] : a.evalGoalTypes.filter(t => t !== 'Work') } : a))} /><Label htmlFor={`bulk-s-work-${secondary.id}`} className="font-normal">Work</Label></div>
                                                <div className="flex items-center gap-2"><Checkbox id={`bulk-s-home-${secondary.id}`} checked={secondary.evalGoalTypes.includes('Home')} onCheckedChange={(c) => setBulkSecondaryAppraisers(s => s.map(a => a.id === secondary.id ? { ...a, evalGoalTypes: c ? [...a.evalGoalTypes, 'Home'] : a.evalGoalTypes.filter(t => t !== 'Home') } : a))} /><Label htmlFor={`bulk-s-home-${secondary.id}`} className="font-normal">Home</Label></div>
                                            </div>
                                         </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkUpdateOpen(false)}>Cancel</Button>
                        <Button onClick={executeBulkAppraiserUpdate}>Apply to All</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isUploadDialogOpen} onOpenChange={(isOpen) => { setIsUploadDialogOpen(isOpen); if (!isOpen) setFileToUpload(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Appraiser List</DialogTitle>
                        <DialogDescription>
                            Download a template or existing data, then upload a CSV to bulk-update appraiser mappings.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Button onClick={handleDownloadTemplate} variant="outline" className="w-full justify-start"><Download className="mr-2" /> Download CSV Template</Button>
                        <Button onClick={handleDownloadSelected} variant="outline" className="w-full justify-start" disabled={selectedDocsForBulkUpdate.length === 0}><Download className="mr-2" /> Download Selected Appraisers ({selectedDocsForBulkUpdate.length})</Button>
                        <div>
                            <Label htmlFor="csv-upload">Upload CSV</Label>
                            <Input id="csv-upload" type="file" accept=".csv" onChange={(e) => setFileToUpload(e.target.files?.[0] ?? null)} />
                        </div>
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => { setIsUploadDialogOpen(false); setFileToUpload(null); }}>Cancel</Button>
                         <Button onClick={handleFileUpload} disabled={!fileToUpload}><Upload className="mr-2"/> Upload File</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


export default function EmployeeDocumentsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EmployeeDocumentsContent />
        </Suspense>
    )
}
