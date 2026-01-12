

import type { ConfigState, Action } from '@/lib/types';

export const initialState: ConfigState = {
  reviewPeriods: [
    { id: 'rp-1', name: 'FY 2024 Annual', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), status: 'Active' },
    { id: 'rp-2', name: 'FY 2025 Mid-Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-06-30'), status: 'Active' },
  ],
  performanceCycles: [
    { id: 'pc-1', name: 'Q1 Check-in', reviewPeriodId: 'rp-1', status: 'Active', startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31') },
    { id: 'pc-2', name: 'Q2 Check-in', reviewPeriodId: 'rp-1', status: 'Active', startDate: new Date('2024-04-01'), endDate: new Date('2024-06-30') },
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

export function configReducer(state: ConfigState, action: Action): ConfigState {
  switch (action.type) {
    case 'ADD_REVIEW_PERIOD':
      return { ...state, reviewPeriods: [...state.reviewPeriods, action.payload] };
    case 'UPDATE_REVIEW_PERIOD':
      return { ...state, reviewPeriods: state.reviewPeriods.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_REVIEW_PERIOD':
      return { ...state, reviewPeriods: state.reviewPeriods.filter(p => p.id !== action.payload) };

    case 'ADD_PERFORMANCE_CYCLE':
      return { ...state, performanceCycles: [...state.performanceCycles, action.payload] };
    case 'UPDATE_PERFORMANCE_CYCLE':
      return { ...state, performanceCycles: state.performanceCycles.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PERFORMANCE_CYCLE':
        return { ...state, performanceCycles: state.performanceCycles.filter(p => p.id !== action.payload) };
    
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
