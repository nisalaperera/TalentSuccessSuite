
'use client';

import { useState, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, doc, getDocs } from 'firebase/firestore';
import type { EmployeePerformanceDocument, PerformanceCycle, ReviewPeriod, Employee, PerformanceTemplate, AppraiserMapping, EvaluationFlow, PerformanceDocument } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, ArrowUpWideNarrow, Trash2, Users, Upload, Download } from 'lucide-react';
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

    // Data for dialogs
    const [documentToManage, setDocumentToManage] = useState<EmployeePerformanceDocument | null>(null);
    const [documentToView, setDocumentToView] = useState<EmployeePerformanceDocument | null>(null);
    const [appraisersToManage, setAppraisersToManage] = useState<AppraiserMapping[]>([]);
    const [originalAppraisers, setOriginalAppraisers] = useState<AppraiserMapping[]>([]);
    const [promotionDetails, setPromotionDetails] = useState<{ count: number; currentStatus: string; nextStatus: string; docsToUpdate: EmployeePerformanceDocument[]; } | null>(null);
    
    // Bulk appraiser form state
    const [bulkPrimaryAppraiser, setBulkPrimaryAppraiser] = useState('');
    const [bulkSecondaryAppraiser, setBulkSecondaryAppraiser] = useState('');
    const [bulkPrimaryEvalTypes, setBulkPrimaryEvalTypes] = useState<string[]>([]);
    const [bulkSecondaryEvalTypes, setBulkSecondaryEvalTypes] = useState<string[]>([]);
    const [selectedDocsForBulkUpdate, setSelectedDocsForBulkUpdate] = useState<EmployeePerformanceDocument[]>([]);


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
        const docEmployee = employees?.find(e => e.id === doc.employeeId);
        if (!docEmployee) {
            toast({ title: 'Error', description: 'Could not find employee for this document.', variant: 'destructive'});
            return;
        };

        const currentAppraisers = (allAppraiserMappings || []).filter(
            m => m.employeePersonNumber === docEmployee.personNumber && m.performanceCycleId === doc.performanceCycleId
        ).sort((a, b) => a.appraiserType.localeCompare(b.appraiserType));
        
        setDocumentToManage(doc);
        setAppraisersToManage(JSON.parse(JSON.stringify(currentAppraisers)));
        setOriginalAppraisers(currentAppraisers);
        setIsManageAppraisersOpen(true);
    }, [employees, allAppraiserMappings, toast]);
    
    const handleViewDetails = useCallback((doc: EmployeePerformanceDocument) => {
        setDocumentToView(doc);
        setIsViewDetailsOpen(true);
    }, []);

    const handleAppraiserPropChange = useCallback((appraiserId: string, prop: keyof AppraiserMapping, value: any) => {
        setAppraisersToManage(current =>
            current.map(appraiser =>
                appraiser.id === appraiserId
                    ? { ...appraiser, [prop]: value }
                    : appraiser
            )
        );
    }, []);

    const handleAppraiserTypeChange = (appraiserIdToChange: string, newType: 'Primary' | 'Secondary') => {
        setAppraisersToManage(current => {
            let newAppraisers = [...current];

            if (newType === 'Primary') {
                 newAppraisers = newAppraisers.map(a => {
                    if (a.id === appraiserIdToChange) return { ...a, appraiserType: 'Primary' };
                    if (a.appraiserType === 'Primary') return { ...a, appraiserType: 'Secondary' };
                    return a;
                });
            } else { // newType is 'Secondary'
                newAppraisers = newAppraisers.map(a => 
                    a.id === appraiserIdToChange ? { ...a, appraiserType: 'Secondary' } : a
                );
            }

            return newAppraisers;
        });
    };

    const handleAppraiserPersonChange = (appraiserId: string, newPersonNumber: string) => {
        setAppraisersToManage(current => 
            current.map(appraiser => 
                appraiser.id === appraiserId 
                    ? { ...appraiser, appraiserPersonNumber: newPersonNumber } 
                    : appraiser
            )
        );
    };

    const handleDeleteAppraiser = (appraiserId: string) => {
        setAppraisersToManage(current => current.filter(appraiser => appraiser.id !== appraiserId));
    };

    const handleSaveAppraisers = async () => {
        if (!documentToManage) return;

        if (appraisersToManage.length > 0 && appraisersToManage.filter(a => a.appraiserType === 'Primary').length !== 1) {
            toast({ title: 'Validation Error', description: 'There must be exactly one Primary Appraiser.', variant: 'destructive'});
            return;
        }

        try {
            const batch = writeBatch(firestore);

            originalAppraisers.forEach(orig => {
                if (!appraisersToManage.find(managed => managed.id === orig.id)) {
                    batch.delete(doc(firestore, 'employee_appraiser_mappings', orig.id));
                }
            });

            appraisersToManage.forEach(managed => {
                const orig = originalAppraisers.find(o => o.id === managed.id);
                if (orig && JSON.stringify(orig) !== JSON.stringify(managed)) {
                    const { id, ...data } = managed;
                    batch.update(doc(firestore, 'employee_appraiser_mappings', id), data);
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

        let nextSequence = Infinity;
        for (const step of sortedSteps) {
            if (step.sequence > currentStep.sequence) {
                nextSequence = step.sequence;
                break;
            }
        }
        
        if (nextSequence === Infinity) {
            toast({ title: "Workflow End", description: "Documents are already at the final step.", variant: "destructive" });
            return;
        }
        const nextStep = sortedSteps.find(step => step.sequence === nextSequence);
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
        setSelectedDocsForBulkUpdate(table.getFilteredSelectedRowModel().rows.map(r => r.original));
        setBulkPrimaryAppraiser('');
        setBulkSecondaryAppraiser('');
        setBulkPrimaryEvalTypes([]);
        setBulkSecondaryEvalTypes([]);
        setIsBulkUpdateOpen(true);
    };

    const executeBulkAppraiserUpdate = async () => {
        if (selectedDocsForBulkUpdate.length === 0) return;
        if (!bulkPrimaryAppraiser && !bulkSecondaryAppraiser) {
            toast({ title: "Input Required", description: "Please select at least one appraiser to apply.", variant: "destructive"});
            return;
        }
        if (bulkPrimaryAppraiser && bulkPrimaryAppraiser === bulkSecondaryAppraiser) {
            toast({ title: "Validation Error", description: "Primary and Secondary appraisers cannot be the same person.", variant: "destructive" });
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
                if (bulkSecondaryAppraiser) {
                     batch.set(doc(collection(firestore, 'employee_appraiser_mappings')), {
                        employeePersonNumber: personNumber,
                        performanceCycleId: cycleId,
                        appraiserType: 'Secondary',
                        appraiserPersonNumber: bulkSecondaryAppraiser,
                        evalGoalTypes: bulkSecondaryEvalTypes.join(','),
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
        const header = "EmployeePersonNumber,PrimaryAppraiserPersonNumber,SecondaryAppraiserPersonNumber,PrimaryEvalGoalTypes,SecondaryEvalGoalTypes\n";
        downloadCSV(header, 'appraiser_template.csv');
    };

    const handleDownloadExisting = async () => {
        if (!cycleFilter) {
            toast({ title: "Cycle Required", description: "Please select a performance cycle to download its appraiser data.", variant: "destructive" });
            return;
        }
        
        const cycleMappingsQuery = query(collection(firestore, 'employee_appraiser_mappings'), where('performanceCycleId', '==', cycleFilter));
        const snapshot = await getDocs(cycleMappingsQuery);

        const mappingsByEmployee: Record<string, Partial<Record<'Primary' | 'Secondary', AppraiserMapping>>> = {};

        snapshot.forEach(doc => {
            const data = doc.data() as AppraiserMapping;
            if (!mappingsByEmployee[data.employeePersonNumber]) {
                mappingsByEmployee[data.employeePersonNumber] = {};
            }
            mappingsByEmployee[data.employeePersonNumber][data.appraiserType] = data;
        });

        let csvContent = "EmployeePersonNumber,PrimaryAppraiserPersonNumber,SecondaryAppraiserPersonNumber,PrimaryEvalGoalTypes,SecondaryEvalGoalTypes\n";
        for (const empNum in mappingsByEmployee) {
            const primary = mappingsByEmployee[empNum].Primary;
            const secondary = mappingsByEmployee[empNum].Secondary;
            csvContent += `${empNum},${primary?.appraiserPersonNumber || ''},${secondary?.appraiserPersonNumber || ''},${primary?.evalGoalTypes || ''},${secondary?.evalGoalTypes || ''}\n`;
        }
        
        downloadCSV(csvContent, `appraisers_${getCycleName(cycleFilter)}.csv`);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !cycleFilter) {
            toast({ title: "File or Cycle Missing", description: "Please select a file and ensure a cycle is filtered.", variant: 'destructive' });
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            const lines = content.split('\n').filter(line => line.trim() !== '');
            const header = lines[0].trim();
            if (header !== "EmployeePersonNumber,PrimaryAppraiserPersonNumber,SecondaryAppraiserPersonNumber,PrimaryEvalGoalTypes,SecondaryEvalGoalTypes") {
                toast({ title: "Invalid CSV", description: "CSV header does not match the template.", variant: "destructive" });
                return;
            }

            const rows = lines.slice(1);
            try {
                const batch = writeBatch(firestore);
                const empPersonNumbers = rows.map(row => row.split(',')[0].trim());
                
                const existingMappingsQuery = query(collection(firestore, 'employee_appraiser_mappings'), where('performanceCycleId', '==', cycleFilter), where('employeePersonNumber', 'in', empPersonNumbers));
                const existingMappingsSnapshot = await getDocs(existingMappingsQuery);
                existingMappingsSnapshot.forEach(doc => batch.delete(doc.ref));

                rows.forEach(row => {
                    const [emp, primary, secondary, primaryTypes, secondaryTypes] = row.split(',').map(v => v.trim());
                    if (emp && primary) {
                        batch.set(doc(collection(firestore, 'employee_appraiser_mappings')), { employeePersonNumber: emp, performanceCycleId: cycleFilter, appraiserType: 'Primary', appraiserPersonNumber: primary, evalGoalTypes: primaryTypes || 'Work', isCompleted: false });
                    }
                    if (emp && secondary) {
                        batch.set(doc(collection(firestore, 'employee_appraiser_mappings')), { employeePersonNumber: emp, performanceCycleId: cycleFilter, appraiserType: 'Secondary', appraiserPersonNumber: secondary, evalGoalTypes: secondaryTypes || 'Home', isCompleted: false });
                    }
                });

                await batch.commit();
                toast({ title: 'Upload Successful', description: `Processed ${rows.length} records.`});
                setIsUploadDialogOpen(false);
            } catch (error) {
                console.error(error);
                toast({ title: 'Upload Failed', description: 'An error occurred during the upload process.', variant: 'destructive'});
            }
        };
        reader.readAsText(file);
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
                <Button onClick={() => setIsUploadDialogOpen(true)} size="sm" variant="outline">
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline">Manage Appraisers</DialogTitle>
                        <DialogDescription>
                            Modify the appraisers for {documentToManage ? getEmployeeName(documentToManage.employeeId) : ''}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        {appraisersToManage.map(appraiser => (
                            <div key={appraiser.id} className="p-4 border rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2 md:col-span-3">
                                    <Label>Appraiser</Label>
                                    <Combobox
                                        options={appraiserOptions}
                                        value={appraiser.appraiserPersonNumber}
                                        onChange={(val) => handleAppraiserPersonChange(appraiser.id, val)}
                                        placeholder="Select an appraiser..."
                                        triggerClassName='w-full'
                                    />
                                </div>
                                <div className="space-y-2">
                                     <Label>Appraiser Type</Label>
                                     <Select value={appraiser.appraiserType} onValueChange={(v: 'Primary' | 'Secondary') => handleAppraiserTypeChange(appraiser.id, v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Primary">Primary</SelectItem>
                                            <SelectItem value="Secondary">Secondary</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label>Evaluation Goal Type(s)</Label>
                                    <div className="flex items-center gap-4 pt-2">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`work-goal-${appraiser.id}`}
                                                checked={appraiser.evalGoalTypes.includes('Work')}
                                                onCheckedChange={(checked) => {
                                                    const currentTypes = appraiser.evalGoalTypes.split(',').filter(t => t);
                                                    let newTypes;
                                                    if (checked) {
                                                        newTypes = [...new Set([...currentTypes, 'Work'])];
                                                    } else {
                                                        newTypes = currentTypes.filter(t => t !== 'Work');
                                                    }
                                                    handleAppraiserPropChange(appraiser.id, 'evalGoalTypes', newTypes.join(','));
                                                }}
                                            />
                                            <Label htmlFor={`work-goal-${appraiser.id}`} className="font-normal">Work</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`home-goal-${appraiser.id}`}
                                                checked={appraiser.evalGoalTypes.includes('Home')}
                                                onCheckedChange={(checked) => {
                                                    const currentTypes = appraiser.evalGoalTypes.split(',').filter(t => t);
                                                    let newTypes;
                                                    if (checked) {
                                                        newTypes = [...new Set([...currentTypes, 'Home'])];
                                                    } else {
                                                        newTypes = currentTypes.filter(t => t !== 'Home');
                                                    }
                                                    handleAppraiserPropChange(appraiser.id, 'evalGoalTypes', newTypes.join(','));
                                                }}
                                            />
                                            <Label htmlFor={`home-goal-${appraiser.id}`} className="font-normal">Home</Label>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => handleDeleteAppraiser(appraiser.id)}
                                        disabled={appraiser.appraiserType === 'Primary'}
                                        className="w-full"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
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

             <AlertDialog open={isPromoteConfirmOpen} onOpenChange={setIsPromoteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Status Promotion</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to promote <span className="font-bold">{promotionDetails?.count}</span> document(s).
                            <div className="mt-2 space-y-1 text-foreground">
                                <p>From: <Badge variant="secondary">{promotionDetails?.currentStatus}</Badge></p>
                                <p>To: <Badge>{promotionDetails?.nextStatus}</Badge></p>
                            </div>
                            Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => executePromotion(null!)}>Promote</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
             <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Update Appraisers</DialogTitle>
                        <DialogDescription>
                            Apply new appraisers to the <span className="font-bold">{selectedDocsForBulkUpdate.length}</span> selected document(s). This will replace all existing appraisers.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {/* Primary Appraiser */}
                        <div className="space-y-2">
                             <Label>Primary Appraiser</Label>
                             <Combobox options={appraiserOptions} value={bulkPrimaryAppraiser} onChange={setBulkPrimaryAppraiser} placeholder="Select Primary Appraiser" triggerClassName="w-full" />
                             <div className="flex items-center gap-4 pl-1">
                                <div className="flex items-center gap-2"><Checkbox id="bulk-p-work" checked={bulkPrimaryEvalTypes.includes('Work')} onCheckedChange={(c) => setBulkPrimaryEvalTypes(c ? [...bulkPrimaryEvalTypes, 'Work'] : bulkPrimaryEvalTypes.filter(t => t !== 'Work'))} /><Label htmlFor="bulk-p-work">Work</Label></div>
                                <div className="flex items-center gap-2"><Checkbox id="bulk-p-home" checked={bulkPrimaryEvalTypes.includes('Home')} onCheckedChange={(c) => setBulkPrimaryEvalTypes(c ? [...bulkPrimaryEvalTypes, 'Home'] : bulkPrimaryEvalTypes.filter(t => t !== 'Home'))} /><Label htmlFor="bulk-p-home">Home</Label></div>
                             </div>
                        </div>
                        {/* Secondary Appraiser */}
                        <div className="space-y-2">
                             <Label>Secondary Appraiser</Label>
                             <Combobox options={appraiserOptions} value={bulkSecondaryAppraiser} onChange={setBulkSecondaryAppraiser} placeholder="Select Secondary Appraiser" triggerClassName="w-full" />
                             <div className="flex items-center gap-4 pl-1">
                                <div className="flex items-center gap-2"><Checkbox id="bulk-s-work" checked={bulkSecondaryEvalTypes.includes('Work')} onCheckedChange={(c) => setBulkSecondaryEvalTypes(c ? [...bulkSecondaryEvalTypes, 'Work'] : bulkSecondaryEvalTypes.filter(t => t !== 'Work'))} /><Label htmlFor="bulk-s-work">Work</Label></div>
                                <div className="flex items-center gap-2"><Checkbox id="bulk-s-home" checked={bulkSecondaryEvalTypes.includes('Home')} onCheckedChange={(c) => setBulkSecondaryEvalTypes(c ? [...bulkSecondaryEvalTypes, 'Home'] : bulkSecondaryEvalTypes.filter(t => t !== 'Home'))} /><Label htmlFor="bulk-s-home">Home</Label></div>
                             </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkUpdateOpen(false)}>Cancel</Button>
                        <Button onClick={executeBulkAppraiserUpdate}>Apply to All</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Appraiser List</DialogTitle>
                        <DialogDescription>
                            Download a template or existing data, then upload a CSV to bulk-update appraiser mappings for the currently selected performance cycle.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Button onClick={handleDownloadTemplate} variant="outline" className="w-full justify-start"><Download className="mr-2" /> Download CSV Template</Button>
                        <Button onClick={handleDownloadExisting} variant="outline" className="w-full justify-start" disabled={!cycleFilter}><Download className="mr-2" /> Download Existing Appraisers for "{cycleFilter ? getCycleName(cycleFilter) : ''}"</Button>
                        <div>
                            <Label htmlFor="csv-upload" className={!cycleFilter ? 'text-muted-foreground' : ''}>Upload CSV</Label>
                            <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} disabled={!cycleFilter} />
                            {!cycleFilter && <p className="text-xs text-muted-foreground mt-1">Please select a Performance Cycle filter before uploading.</p>}
                        </div>
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Close</Button>
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
