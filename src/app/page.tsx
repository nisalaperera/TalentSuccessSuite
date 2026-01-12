
'use client';

import { useReducer, useState } from 'react';
import type { ConfigState, Action } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ReviewPeriod } from '@/app/components/config-flow/review-period';
import { GoalPlan } from '@/app/components/config-flow/goal-plan';
import { PerformanceTemplate } from '@/app/components/config-flow/performance-template';
import { PerformanceTemplateSection } from '@/app/components/config-flow/performance-template-section';
import { EvaluationFlow } from '@/app/components/config-flow/evaluation-flow';
import { EligibilityCriteria } from '@/app/components/config-flow/eligibility-criteria';
import { PerformanceDocument } from '@/app/components/config-flow/performance-document';
import { TileBasedApproach } from '@/app/components/tile-based-approach';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const initialState: ConfigState = {
  reviewPeriods: [
    { id: 'rp-1', name: 'FY 2024 Annual', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), status: 'Active' },
    { id: 'rp-2', name: 'FY 2025 Mid-Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-06-30'), status: 'Active' },
  ],
  goalPlans: [
    { id: 'gp-1', name: 'FY 2024 Goal Plan', reviewPeriodId: 'rp-1', status: 'Active' },
    { id: 'gp-2', name: 'FY 2025 Mid-Year Goals', reviewPeriodId: 'rp-2', status: 'Active' },
  ],
  performanceTemplates: [
    { id: 'pt-1', name: 'Annual Performance Review', category: 'Performance', supportsRatings: true, supportsComments: true, status: 'Active' },
    { id: 'pt-2', name: 'Q3 Employee Engagement Survey', category: 'Survey', supportsRatings: true, supportsComments: true, status: 'Active' },
  ],
  performanceTemplateSections: [
    {
      id: 'ds-1',
      name: 'Performance Goals',
      type: 'Performance Goals',
      performanceTemplateId: 'pt-1',
      order: 1,
      ratingScale: 5,
      permissions: [
        { role: 'Worker', view: true, edit: true },
        { role: 'Primary Appraiser', view: true, edit: true },
        { role: 'Secondary Appraiser 1', view: true, edit: false },
        { role: 'Secondary Appraiser 2', view: false, edit: false },
        { role: 'HR / Department Head', view: true, edit: false },
      ],
      enableSectionRatings: true,
      enableSectionComments: true,
      sectionRatingMandatory: false,
      sectionCommentMandatory: false,
      enableSectionWeights: false,
      enableItemRatings: true,
      enableItemComments: true,
      itemRatingMandatory: false,
      itemCommentMandatory: false,
    },
    {
      id: 'ds-2',
      name: 'Overall Summary',
      type: 'Overall Summary',
      performanceTemplateId: 'pt-1',
      order: 2,
      ratingScale: 5,
      permissions: [
        { role: 'Worker', view: true, edit: false },
        { role: 'Primary Appraiser', view: true, edit: true },
        { role: 'Secondary Appraiser 1', view: true, edit: true },
        { role: 'Secondary Appraiser 2', view: true, edit: true },
        { role: 'HR / Department Head', view: true, edit: true },
      ],
    },
  ],
  evaluationFlows: [
    {
        id: 'flow-1',
        name: 'Standard Annual Review Flow',
        status: 'Active',
        steps: [
            { id: 'step-1', sequence: 1, task: 'Worker Self-Evaluation', role: 'Primary (Worker)', flowType: 'Start' },
            { id: 'step-2', sequence: 2, task: 'Manager Evaluation', role: 'Secondary (Manager)', flowType: 'Sequential' },
            { id: 'step-3', sequence: 3, task: 'Share Document', role: 'Secondary (Manager)', flowType: 'Sequential' },
            { id: 'step-4', sequence: 4, task: 'Confirm Review Meeting', role: 'Primary (Worker)', flowType: 'Sequential' },
        ]
    }
  ],
  eligibility: [
    {
        id: 'elig-1',
        name: 'Standard Exclusions',
        status: 'Active',
        rules: [
            { id: 'rule-1', type: 'Person Type', values: ['Intern', 'Contractor'] }
        ]
    }
  ],
  performanceDocuments: [
    {
        id: 'pd-1',
        name: 'FY24 Annual Performance Document',
        reviewPeriodId: 'rp-1',
        goalPlanId: 'gp-1',
        performanceTemplateId: 'pt-1',
        sectionIds: ['ds-1', 'ds-2'],
        evaluationFlowId: 'flow-1',
        eligibilityId: 'elig-1',
        managerRatingEnabled: true,
        employeeRatingEnabled: true,
        managerCommentsEnabled: true,
        employeeCommentsEnabled: true,
    },
    {
        id: 'pd-2',
        name: 'Q3 Engagement Survey Document',
        reviewPeriodId: 'rp-1',
        goalPlanId: 'gp-1',
        performanceTemplateId: 'pt-2',
        sectionIds: [],
        evaluationFlowId: 'flow-1',
        eligibilityId: 'elig-1',
        managerRatingEnabled: false,
        employeeRatingEnabled: true,
        managerCommentsEnabled: false,
        employeeCommentsEnabled: true,
    }
  ],
  lovs: {
    personTypes: ['Full-Time', 'Part-Time', 'Intern', 'Contractor'],
    departments: ['Engineering', 'HR', 'Sales', 'Marketing', 'Delivery', 'AMST-VNL-SBU-Core'],
    legalEntities: ['Global Corp', 'US Division', 'EU Division'],
  },
};

function configReducer(state: ConfigState, action: Action): ConfigState {
  switch (action.type) {
    case 'ADD_REVIEW_PERIOD':
      return { ...state, reviewPeriods: [...state.reviewPeriods, action.payload] };
    case 'UPDATE_REVIEW_PERIOD':
      return { ...state, reviewPeriods: state.reviewPeriods.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_REVIEW_PERIOD':
      return { ...state, reviewPeriods: state.reviewPeriods.filter(p => p.id !== action.payload) };
    
    case 'ADD_GOAL_PLAN':
      return { ...state, goalPlans: [...state.goalPlans, action.payload] };
    case 'UPDATE_GOAL_PLAN':
      return { ...state, goalPlans: state.goalPlans.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_GOAL_PLAN':
      return { ...state, goalPlans: state.goalPlans.filter(p => p.id !== action.payload) };
      
    case 'ADD_PERFORMANCE_TEMPLATE':
      return { ...state, performanceTemplates: [...state.performanceTemplates, action.payload] };
    case 'UPDATE_PERFORMANCE_TEMPLATE':
        return { ...state, performanceTemplates: state.performanceTemplates.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PERFORMANCE_TEMPLATE':
        return { ...state, performanceTemplates: state.performanceTemplates.filter(p => p.id !== action.payload) };

    case 'SET_PERFORMANCE_TEMPLATE_SECTIONS':
      return { ...state, performanceTemplateSections: action.payload };

    case 'ADD_EVALUATION_FLOW':
      return { ...state, evaluationFlows: [...state.evaluationFlows, action.payload] };
    case 'UPDATE_EVALUATION_FLOW':
      return { ...state, evaluationFlows: state.evaluationFlows.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_EVALUATION_FLOW':
      return { ...state, evaluationFlows: state.evaluationFlows.filter(p => p.id !== action.payload) };

    case 'ADD_ELIGIBILITY':
        return { ...state, eligibility: [...state.eligibility, action.payload] };
    case 'UPDATE_ELIGIBILITY':
      return { ...state, eligibility: state.eligibility.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_ELIGIBILITY':
      return { ...state, eligibility: state.eligibility.filter(p => p.id !== action.payload) };
        
    case 'ADD_PERFORMANCE_DOCUMENT':
      return { ...state, performanceDocuments: [...state.performanceDocuments, action.payload] };
    case 'ADD_LOV_VALUE':
      const { lovType, value } = action.payload;
      if (state.lovs[lovType].includes(value)) return state;
      return {
        ...state,
        lovs: {
          ...state.lovs,
          [lovType]: [...state.lovs[lovType], value],
        },
      };
    default:
      return state;
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(configReducer, initialState);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>('item-1');
  const [selectedReviewPeriodId, setSelectedReviewPeriodId] = useState<string>();
  const [selectedGoalPlanId, setSelectedGoalPlanId] = useState<string>();
  const [selectedPerformanceTemplateId, setSelectedPerformanceTemplateId] = useState<string>();
  const [selectedEvaluationFlowId, setSelectedEvaluationFlowId] = useState<string>();
  const [selectedEligibilityId, setSelectedEligibilityId] = useState<string>();
  const [isSinglePage, setIsSinglePage] = useState(false);

  const selectedReviewPeriod = state.reviewPeriods.find(p => p.id === selectedReviewPeriodId);
  const selectedGoalPlan = state.goalPlans.find(p => p.id === selectedGoalPlanId);
  const selectedPerformanceTemplate = state.performanceTemplates.find(p => p.id === selectedPerformanceTemplateId);
  const selectedTemplateSectionNames = state.performanceTemplateSections
    .filter(s => s.performanceTemplateId === selectedPerformanceTemplateId)
    .map(s => s.name)
    .join(', ');
  const selectedEvaluationFlow = state.evaluationFlows.find(f => f.id === selectedEvaluationFlowId);
  const selectedEligibility = state.eligibility.find(e => e.id === selectedEligibilityId);
  

  const handleStepComplete = (nextItemId: string) => {
    setActiveAccordionItem(nextItemId);
  };
  
  const configSteps = [
    {
      id: 'item-1',
      title: 'Review Period Setup',
      selection: selectedReviewPeriod?.name,
      content: <ReviewPeriod state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-2')} selectedReviewPeriodId={selectedReviewPeriodId} setSelectedReviewPeriodId={setSelectedReviewPeriodId} />
    },
    {
      id: 'item-2',
      title: 'Goal Plan Setup',
      selection: selectedGoalPlan?.name,
      disabled: !selectedReviewPeriodId,
      content: <GoalPlan state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-3')} selectedReviewPeriodId={selectedReviewPeriodId} selectedGoalPlanId={selectedGoalPlanId} setSelectedGoalPlanId={setSelectedGoalPlanId} />
    },
    {
      id: 'item-3',
      title: 'Performance Template',
      selection: selectedPerformanceTemplate?.name,
      content: <PerformanceTemplate state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-4')} selectedPerformanceTemplateId={selectedPerformanceTemplateId} setSelectedPerformanceTemplateId={setSelectedPerformanceTemplateId} />
    },
    {
      id: 'item-4',
      title: 'Performance Template Section Setup',
      selection: selectedTemplateSectionNames,
      disabled: !selectedPerformanceTemplateId,
      content: <PerformanceTemplateSection state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-5')} selectedPerformanceTemplateId={selectedPerformanceTemplateId} />
    },
    {
      id: 'item-5',
      title: 'Evaluation Flow',
      selection: selectedEvaluationFlow?.name,
      content: <EvaluationFlow state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-6')} selectedEvaluationFlowId={selectedEvaluationFlowId} setSelectedEvaluationFlowId={setSelectedEvaluationFlowId} />
    },
     {
      id: 'item-6',
      title: 'Eligibility Criteria',
      selection: selectedEligibility?.name,
      content: <EligibilityCriteria state={state} dispatch={dispatch} onComplete={() => handleStepComplete('item-7')} selectedEligibilityId={selectedEligibilityId} setSelectedEligibilityId={setSelectedEligibilityId} />
    },
    {
      id: 'item-7',
      title: 'Performance Documents',
      content: <PerformanceDocument state={state} dispatch={dispatch} onComplete={() => {}} />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8">
          <div className="flex justify-between items-center">
             <div>
                <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2 tracking-tight">EvalFlow</h1>
                <p className="text-lg text-foreground/80 font-body">
                  Seamless Performance Management Configuration
                </p>
             </div>
             <div className="flex items-center space-x-2">
                <Switch id="view-mode-switch" checked={isSinglePage} onCheckedChange={setIsSinglePage} />
                <Label htmlFor="view-mode-switch">Single Page View</Label>
             </div>
          </div>
        </header>

         <div className="max-w-5xl mx-auto py-6">
            {isSinglePage ? (
                 <Accordion type="single" value={activeAccordionItem} onValueChange={setActiveAccordionItem} collapsible className="w-full">
                    {configSteps.map(step => (
                    <AccordionItem value={step.id} key={step.id} disabled={step.disabled}>
                        <AccordionTrigger>
                        <div className="flex justify-between items-center w-full pr-4">
                            <span className="text-lg font-headline">{step.title}</span>
                            {step.selection && (
                            <div className="flex-shrink w-1/2 text-right whitespace-normal">
                                <Badge variant="secondary" className="text-sm font-normal">{step.selection}</Badge>
                            </div>
                            )}
                        </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4">
                        {step.content}
                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <TileBasedApproach state={state} />
            )}
        </div>
      </main>
    </div>
  );
}

    