import { ChecklistItem, ChecklistState } from '../../core/types';

export interface ValidationResult {
  canTransition: boolean;
  totalRequired: number;
  completedRequired: number;
  pending: ChecklistState[];
}

export function createChecklistState(item: ChecklistItem): ChecklistState {
  return { item, completed: false, notApplicable: false, fieldValue: undefined };
}

export function isItemComplete(state: ChecklistState): boolean {
  if (state.notApplicable) return true;
  if (state.completed) return true;

  switch (state.item.type) {
    case 'field_check':
      return state.fieldValue !== null && state.fieldValue !== undefined && state.fieldValue !== '';
    case 'confirm':
      return state.completed || state.notApplicable;
    case 'link_action':
      return state.completed;
    default:
      return false;
  }
}

export function validateChecklist(states: ChecklistState[]): ValidationResult {
  const requiredStates = states.filter(s => s.item.required);
  const completedRequired = requiredStates.filter(s => isItemComplete(s));
  const pending = states.filter(s => !isItemComplete(s));

  return {
    canTransition: requiredStates.length === completedRequired.length,
    totalRequired: requiredStates.length,
    completedRequired: completedRequired.length,
    pending,
  };
}
