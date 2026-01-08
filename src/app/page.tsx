
'use client';

import { useReducer, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import type { ConfigState, Action } from '@/lib/types';

import { ReviewPeriod } from '@/app/components/config-flow/review-period';
import { GoalPlan } from '@/app/components/config-flow/goal-plan';
import { PerformanceTemplate } from '@/app/components/config-flow/performance-template';
import { PerformanceTemplateSection } from '@/app/components/config-flow/performance-template-section';
import { EvaluationFlow } from '@/app/components/config-flow/evaluation-flow';
import { EligibilityCriteria } from '@/app/components/config-flow/eligibility-criteria';
import { PerformanceDocument } from '@/app/components/config-flow/performance-document';

const initialState: ConfigState = {
  reviewPeriods: [],
  goalPlans: [],
  performanceTemplates: [],
  performanceTemplateSections: [],
  evaluationFlows: [],
  eligibility: [],
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

const steps = [
  'reviewPeriod', 
  'goalPlan', 
  'performanceTemplate', 
  'performanceTemplateSection', 
  'evaluationFlow', 
  'eligibility', 
  'performanceDocument'
];

const stepComponents = {
  reviewPeriod: {
    title: 'Review Period Management',
    Component: ReviewPeriod,
  },
  goalPlan: {
    title: 'Goal Plan Configuration',
    Component: GoalPlan,
  },
  performanceTemplate: {
    title: 'Performance Template Setup',
    Component: PerformanceTemplate,
  },
  performanceTemplateSection: {
    title: 'Performance Template Section Setup',
    Component: PerformanceTemplateSection,
  },
  evaluationFlow: {
    title: 'Evaluation Flow Setup',
    Component: EvaluationFlow,
  },
  eligibility: {
    title: 'Eligibility Criteria Definition',
    Component: EligibilityCriteria,
  },
  performanceDocument: {
    title: 'Performance Document Setup',
    Component: PerformanceDocument,
  }
};

const flowStructure = [
  {
    title: "Periods & Goals",
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
]


export default function Home() {
  const [state, dispatch] = useReducer(configReducer, initialState);
  const [openItem, setOpenItem] = useState('reviewPeriod');

  const handleNext = (currentItem: string) => {
    const currentIndex = steps.indexOf(currentItem);
    
    if (openItem === currentItem) {
        for (let i = currentIndex + 1; i < steps.length; i++) {
            const nextStep = steps[i];
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
      case 'reviewPeriod': return state.reviewPeriods.length > 0;
      case 'goalPlan': return state.goalPlans.length > 0;
      case 'performanceTemplate': return state.performanceTemplates.length > 0;
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
      case 'performanceTemplate':
      case 'evaluationFlow':
      case 'eligibility':
        return false;
      case 'goalPlan':
        return !isStepComplete('reviewPeriod');
      case 'performanceTemplateSection':
        return !isStepComplete('performanceTemplate');
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
                        return (
                            <AccordionItem value={stepKey} key={stepKey} className="border-none">
                            <AccordionTrigger
                                disabled={isDisabled}
                                className="bg-card hover:bg-card/90 p-4 rounded-lg shadow-sm text-lg font-headline disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <div className="flex items-center gap-4">
                                {getStepStatusIcon(stepKey)}
                                {stepInfo.title}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 bg-card rounded-b-lg shadow-sm mt-[-1px]">
                                <stepInfo.Component state={state} dispatch={dispatch} onComplete={() => handleNext(stepKey)} />
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
