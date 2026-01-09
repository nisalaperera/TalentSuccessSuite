
'use client';

import { useReducer, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import type { ConfigState, Action } from '@/lib/types';
import { format } from 'date-fns';

import { ReviewPeriod } from '@/app/components/config-flow/review-period';
import { GoalPlan } from '@/app/components/config-flow/goal-plan';
import { PerformanceTemplate } from '@/app/components/config-flow/performance-template';
import { PerformanceTemplateSection } from '@/app/components/config-flow/performance-template-section';
import { EvaluationFlow } from '@/app/components/config-flow/evaluation-flow';
import { EligibilityCriteria } from '@/app/components/config-flow/eligibility-criteria';
import { PerformanceDocument } from '@/app/components/config-flow/performance-document';
import { Badge } from '@/components/ui/badge';

const initialState: ConfigState = {
  reviewPeriods: [
    { id: 'rp-1', name: 'FY 2024 Annual', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), status: 'Active' },
    { id: 'rp-2', name: 'FY 2025 Mid-Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-06-30'), status: 'Active' },
  ],
  goalPlans: [
    { id: 'gp-1', name: 'FY 2024 Goal Plan', reviewPeriodId: 'rp-1' },
    { id: 'gp-2', name: 'FY 2025 Mid-Year Goals', reviewPeriodId: 'rp-2' },
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
      ratingScale: 5,
      permissions: [
        { role: 'Worker', view: true, edit: true },
        { role: 'Primary Appraiser', view: true, edit: true },
        { role: 'Secondary Appraiser 1', view: true, edit: false },
        { role: 'Secondary Appraiser 2', view: false, edit: false },
        { role: 'HR / Department Head', view: true, edit: false },
      ],
    },
    {
      id: 'ds-2',
      name: 'Overall Summary',
      type: 'Overall Summary',
      performanceTemplateId: 'pt-1',
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
        rules: [
            { id: 'rule-1', type: 'Person Type', values: ['Intern', 'Contractor'] }
        ]
    }
  ],
  performanceDocuments: [],
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
    case 'ADD_GOAL_PLAN':
      return { ...state, goalPlans: [...state.goalPlans, action.payload] };
    case 'ADD_PERFORMANCE_TEMPLATE':
      return { ...state, performanceTemplates: [...state.performanceTemplates, action.payload] };
    case 'SET_PERFORMANCE_TEMPLATE_SECTIONS':
      return { ...state, performanceTemplateSections: action.payload };
    case 'ADD_EVALUATION_FLOW':
      return { ...state, evaluationFlows: [...state.evaluationFlows, action.payload] };
    case 'ADD_ELIGIBILITY':
        return { ...state, eligibility: [...state.eligibility, action.payload] };
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
  const [openItem, setOpenItem] = useState('reviewPeriod');
  const [selectedReviewPeriodId, setSelectedReviewPeriodId] = useState<string | undefined>();
  const [selectedGoalPlanId, setSelectedGoalPlanId] = useState<string | undefined>();
  const [selectedPerformanceTemplateId, setSelectedPerformanceTemplateId] = useState<string | undefined>();

  const handleNext = (currentItem: string) => {
    if (currentItem === 'reviewPeriod') {
      setOpenItem('goalPlan');
      return;
    }

    const allSteps = flowStructure.flatMap(g => g.steps);
    const currentIndex = allSteps.indexOf(currentItem);
    
    if (openItem === currentItem) {
        for (let i = currentIndex + 1; i < allSteps.length; i++) {
            const nextStep = allSteps[i];
            if (!isStepDisabled(nextStep)) {
                setOpenItem(nextStep);
                return;
            }
        }
        setOpenItem(''); 
    } else {
        setOpenItem(currentItem);
    }
  };

  const isStepComplete = (step: string): boolean => {
    switch (step) {
      case 'reviewPeriod': return state.reviewPeriods.length > 0 && !!selectedReviewPeriodId;
      case 'goalPlan': return state.goalPlans.length > 0 && !!selectedGoalPlanId;
      case 'performanceTemplate': return state.performanceTemplates.length > 0 && !!selectedPerformanceTemplateId;
      case 'performanceTemplateSection': return state.performanceTemplateSections.length > 0;
      case 'evaluationFlow': return state.evaluationFlows.length > 0;
      case 'eligibility': return state.eligibility.length > 0;
      case 'performanceDocument': return state.performanceDocuments.length > 0;
      default: return false;
    }
  };

  const isStepDisabled = (step: string): boolean => {
     switch (step) {
      case 'reviewPeriod':
        return false;
      case 'goalPlan':
        return !isStepComplete('reviewPeriod');
      case 'performanceTemplate':
        return false;
      case 'performanceTemplateSection':
        return state.performanceTemplates.length === 0;
      case 'evaluationFlow':
        return false;
      case 'eligibility':
        return false;
      case 'performanceDocument':
        return !isStepComplete('goalPlan') || !isStepComplete('performanceTemplateSection') || !isStepComplete('evaluationFlow') || !isStepComplete('eligibility');
      default:
        return true;
    }
  };

  const getStepStatusIcon = (step: string) => {
    if (isStepDisabled(step)) {
      return <Lock className="h-5 w-5 text-muted-foreground" />;
    }
    return isStepComplete(step) ? (
      <CheckCircle2 className="h-5 w-5 text-accent" />
    ) : (
      <Circle className="h-5 w-5 text-muted-foreground" />
    );
  };
  
  const selectedReviewPeriod = state.reviewPeriods.find(p => p.id === selectedReviewPeriodId);
  const selectedGoalPlan = state.goalPlans.find(p => p.id === selectedGoalPlanId);
  const selectedPerformanceTemplate = state.performanceTemplates.find(p => p.id === selectedPerformanceTemplateId);

  const stepComponents: { [key: string]: { title: string; Component: React.FC<any> } } = {
    reviewPeriod: { 
      title: 'Review Period Management', 
      Component: ReviewPeriod,
    },
    goalPlan: { title: 'Goal Plan Configuration', Component: GoalPlan },
    performanceTemplate: { title: 'Performance Template Setup', Component: PerformanceTemplate },
    performanceTemplateSection: { title: 'Performance Template Section Setup', Component: PerformanceTemplateSection },
    evaluationFlow: { title: 'Evaluation Flow Setup', Component: EvaluationFlow },
    eligibility: { title: 'Eligibility Criteria Definition', Component: EligibilityCriteria },
    performanceDocument: { title: 'Performance Document Setup', Component: PerformanceDocument },
  };

  const flowStructure = [
    {
      title: `Periods & Goals`,
      steps: ['reviewPeriod', 'goalPlan'],
    },
    {
      title: "Templates & Sections",
      steps: ['performanceTemplate', 'performanceTemplateSection'],
    },
    {
      title: "Workflows & Eligibility",
      steps: ['evaluationFlow', 'eligibility'],
    },
    {
      title: "Final Document Assembly",
      steps: ['performanceDocument'],
    },
  ];

  const componentProps = {
    reviewPeriod: { state, dispatch, onComplete: () => handleNext('reviewPeriod'), selectedReviewPeriodId, setSelectedReviewPeriodId },
    goalPlan: { state, dispatch, onComplete: () => handleNext('goalPlan'), selectedReviewPeriodId, selectedGoalPlanId, setSelectedGoalPlanId },
    performanceTemplate: { state, dispatch, onComplete: () => handleNext('performanceTemplate'), selectedPerformanceTemplateId, setSelectedPerformanceTemplateId },
    performanceTemplateSection: { state, dispatch, onComplete: () => handleNext('performanceTemplateSection') },
    evaluationFlow: { state, dispatch, onComplete: () => handleNext('evaluationFlow') },
    eligibility: { state, dispatch, onComplete: () => handleNext('eligibility') },
    performanceDocument: { state, dispatch, onComplete: () => handleNext('performanceDocument') },
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:px-8 md:py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2 tracking-tight">EvalFlow</h1>
          <p className="text-lg text-foreground/80 font-body">
            Seamless Performance Management Configuration
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-8">
            {flowStructure.map((group, index) => (
                <div key={index}>
                    <h2 className="text-2xl font-headline font-semibold mb-4 text-foreground/90">{group.title}</h2>
                    <Accordion type="single" value={openItem} onValueChange={setOpenItem} className="w-full space-y-4">
                        {group.steps.map(stepKey => {
                        const stepInfo = stepComponents[stepKey as keyof typeof stepComponents];
                        const isDisabled = isStepDisabled(stepKey);
                        const StepComponent = stepInfo.Component;
                        
                        return (
                            <AccordionItem value={stepKey} key={stepKey} className="border-none">
                            <AccordionTrigger
                                disabled={isDisabled}
                                className="bg-card hover:bg-card/90 p-4 rounded-lg shadow-sm text-lg font-headline disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-4">
                                    {getStepStatusIcon(stepKey)}
                                    {stepInfo.title}
                                  </div>
                                  {stepKey === 'reviewPeriod' && selectedReviewPeriod && (
                                      <Badge variant="secondary" className="px-5 py-1 text-lg">
                                        {selectedReviewPeriod.name} ({format(selectedReviewPeriod.startDate, 'MMM d')} - {format(selectedReviewPeriod.endDate, 'MMM d, yyyy')})
                                      </Badge>
                                  )}
                                  {stepKey === 'goalPlan' && selectedGoalPlan && (
                                      <Badge variant="secondary" className="px-5 py-1 text-lg">
                                        {selectedGoalPlan.name}
                                      </Badge>
                                  )}
                                  {stepKey === 'performanceTemplate' && selectedPerformanceTemplate && (
                                      <Badge variant="secondary" className="px-5 py-1 text-lg">
                                        {selectedPerformanceTemplate.name}
                                      </Badge>
                                  )}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 bg-card rounded-b-lg shadow-sm mt-[-1px]">
                                <StepComponent {...componentProps[stepKey as keyof typeof componentProps]} />
                            </AccordionContent>
                            </AccordionItem>
                        );
                        })}
                    </Accordion>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
