

import { DocumentData } from "firebase/firestore";

export type ReviewPeriod = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'Active' | 'Inactive';
};

export type PerformanceCycle = {
  id: string;
  name: string;
  reviewPeriodId: string;
  goalPlanId: string;
  status: 'Active' | 'Inactive';
  startDate: Date;
  endDate: Date;
};

export type GoalPlan = {
  id: string;
  name: string;
  reviewPeriodId: string;
  status: 'Active' | 'Inactive';
};

export type PerformanceTemplate = {
  id: string;
  name: string;
  description: string;
  category: 'Performance' | 'Survey';
  status: 'Active' | 'Inactive';
};

export type AccessPermission = {
  role: string;
  view: boolean;
  rate: boolean;
  viewWorkerRatings: boolean;
  viewPrimaryAppraiserRatings: boolean;
  viewSecondaryAppraiserRatings: boolean;
};

export type SectionType = 
  // Performance
  | 'Performance Goals' 
  | 'Overall Summary';


export type PerformanceTemplateSection = {
  id: string;
  name: string;
  type: SectionType;
  performanceTemplateId: string;
  order: number;
  permissions: AccessPermission[];

  // Section Ratings & Comments
  enableSectionRatings?: boolean;
  sectionRatingMandatory?: boolean;
  ratingScale?: number;
  ratingCalculationMethod?: 'Manual Rating' | 'Mid Year Rating Calculation' | 'Annual Year RatingCalculation';
  
  enableSectionComments?: boolean;
  sectionCommentMandatory?: boolean;
  maxLength?: number;
  minLength?: number;

  // Performance Goals Section Item Attributes
  enableItemRatings?: boolean;
  itemRatingMandatory?: boolean;
  enableItemComments?: boolean;
  itemCommentMandatory?: boolean;

  // Section Weights
  enableSectionWeights?: boolean;
  sectionWeight?: number;
  sectionMinimumWeight?: number;

};

export type EvaluationStep = {
  id: string;
  sequence: number;
  task: 'Worker Self-Evaluation' | 'Manager Evaluation' | 'Normalization' | 'Share Document' | 'Confirm Review Meeting' | 'Provide Final Feedback' | 'Close Document';
  role: 'Primary (Worker)' | 'Secondary (Manager)' | 'Sec. Appraiser 1' | 'Sec. Appraiser 2' | 'HR / Dept Head';
  flowType: 'Start' | 'Parallel' | 'Sequential';
  startDate?: Date;
  endDate?: Date;
};

export type EvaluationFlow = {
  id:string;
  name: string;
  steps: EvaluationStep[];
  status: 'Active' | 'Inactive';
};

export type ExclusionRule = {
    id: string;
    type: 'Person Type' | 'Department' | 'Legal Entity';
    values: string[];
};

export type Eligibility = {
    id: string;
    name: string;
    rules: ExclusionRule[];
    status: 'Active' | 'Inactive';
};

export type PerformanceDocument = {
  id: string;
  name: string;
  performanceCycleId: string;
  goalPlanId: string;
  performanceTemplateId: string;
  sectionIds: string[];
  evaluationFlowId: string;
  eligibilityId: string;
  isLaunched?: boolean;
};

export type EmployeePerformanceDocument = {
    id: string;
    performanceDocumentId: string;
    employeeId: string;
    performanceCycleId: string;
    performanceTemplateId: string;
    evaluationFlowId: string;
    status: string;
}

export type AppraiserMapping = {
  id: string;
  employeePersonNumber: string;
  performanceCycleId: string;
  appraiserType: 'Primary' | 'Secondary';
  appraiserPersonNumber: string;
  evalGoalTypes: string;
  isCompleted: boolean;
};

export type Employee = {
  id: string;
  personNumber: string;
  personEmail: string;
  firstName: string;
  lastName: string;
  designation: string;
  personType: string;
  department: string;
  entity: string;
  workManager: string;
  homeManager: string;
};

export type EmployeeEvaluation = {
  id: string;
  employeePerformanceDocumentId: string;
  sectionId: string;
  evaluatorPersonNumber: string;
  rating?: number;
  comment?: string;
  submittedAt: Date;
}

export type LOVs = {
  personTypes: string[];
  departments: string[];
  legalEntities: string[];
};

export type ConfigState = {
  reviewPeriods: ReviewPeriod[] | DocumentData[];
  performanceCycles: PerformanceCycle[] | DocumentData[];
  goalPlans: GoalPlan[] | DocumentData[];
  performanceTemplates: PerformanceTemplate[] | DocumentData[];
  performanceTemplateSections: PerformanceTemplateSection[] | DocumentData[];
  evaluationFlows: EvaluationFlow[] | DocumentData[];
  eligibility: Eligibility[] | DocumentData[];
  performanceDocuments: PerformanceDocument[] | DocumentData[];
  employees: Employee[] | DocumentData[];
  lovs: LOVs;
};

export type Action =
  | { type: 'SET_DATA', payload: Partial<ConfigState> }
  | { type: 'ADD_REVIEW_PERIOD'; payload: ReviewPeriod }
  | { type: 'UPDATE_REVIEW_PERIOD'; payload: ReviewPeriod }
  | { type: 'DELETE_REVIEW_PERIOD'; payload: string }
  | { type: 'ADD_PERFORMANCE_CYCLE'; payload: PerformanceCycle }
  | { type: 'UPDATE_PERFORMANCE_CYCLE'; payload: PerformanceCycle }
  | { type: 'DELETE_PERFORMANCE_CYCLE'; payload: string }
  | { type: 'ADD_GOAL_PLAN'; payload: GoalPlan }
  | { type: 'UPDATE_GOAL_PLAN'; payload: GoalPlan }
  | { type: 'DELETE_GOAL_PLAN'; payload: string }
  | { type: 'ADD_PERFORMANCE_TEMPLATE'; payload: PerformanceTemplate }
  | { type: 'UPDATE_PERFORMANCE_TEMPLATE'; payload: PerformanceTemplate }
  | { type: 'DELETE_PERFORMANCE_TEMPLATE'; payload: string }
  | { type: 'SET_PERFORMANCE_TEMPLATE_SECTIONS'; payload: PerformanceTemplateSection[] }
  | { type: 'ADD_EVALUATION_FLOW'; payload: EvaluationFlow }
  | { type: 'UPDATE_EVALUATION_FLOW'; payload: EvaluationFlow }
  | { type: 'DELETE_EVALUATION_FLOW'; payload: string }
  | { type: 'ADD_ELIGIBILITY'; payload: Eligibility }
  | { type: 'UPDATE_ELIGIBILITY'; payload: Eligibility }
  | { type: 'DELETE_ELIGIBILITY'; payload: string }
  | { type: 'ADD_PERFORMANCE_DOCUMENT'; payload: PerformanceDocument }
  | { type: 'ADD_LOV_VALUE'; payload: { lovType: keyof LOVs; value: string } };

export interface StepProps {
    state: ConfigState;
    dispatch: React.Dispatch<Action>;
    onComplete: () => void;
}
