import type { EvaluationStep, Goal } from './types';

export const EVALUATION_FLOW_PROCESS_PHASES: EvaluationStep['task'][] = [
    'Worker Self-Evaluation', 
    'Manager Evaluation', 
    'Normalization', 
    'Share Document', 
    'Confirm Review Meeting', 
    'Provide Final Feedback', 
    'Close Document'
];

export const EVALUATION_FLOW_ROLES: string[] = [
    'Worker', 
    'Primary Appraiser', 
    'Secondary Appraiser', 
    'HR'
];

export const GOAL_STATUSES: Goal['status'][] = ['Not Started', 'In Progress', 'Completed'];

export const TECHNOLOGIST_TYPES: Goal['technologist_type'][] = ['SENIOR', 'JUNIOR'];

export const GOAL_TYPES: Goal['type'][] = ['Work', 'Home'];
