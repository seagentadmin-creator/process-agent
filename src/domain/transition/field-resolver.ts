import { FieldConfig, ChecklistItem, ResolvedFields } from '../../core/types';

export class FieldResolver {
  resolve(
    commonFields: FieldConfig[],
    variableFields: FieldConfig[] | null,
    commonChecklist: ChecklistItem[],
    variableChecklist: ChecklistItem[] | null,
  ): ResolvedFields {
    const fields = [...commonFields];
    if (variableFields && variableFields.length > 0) {
      fields.push(...variableFields);
    }

    const checklist = {
      common: commonChecklist,
      variable: variableChecklist && variableChecklist.length > 0 ? variableChecklist : null,
      hasVariable: variableChecklist !== null && variableChecklist.length > 0,
    };

    return {
      fields,
      hasVariable: variableFields !== null && variableFields.length > 0,
      checklist,
    };
  }

  getMergedChecklist(resolved: ResolvedFields): ChecklistItem[] {
    const items = [...resolved.checklist.common];
    if (resolved.checklist.variable) {
      items.push(...resolved.checklist.variable);
    }
    return items.sort((a, b) => a.order - b.order);
  }

  getRequiredFields(resolved: ResolvedFields): FieldConfig[] {
    return resolved.fields.filter(f => f.required);
  }

  getOptionalFields(resolved: ResolvedFields): FieldConfig[] {
    return resolved.fields.filter(f => !f.required);
  }
}
