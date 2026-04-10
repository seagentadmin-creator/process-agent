import { JiraIssue } from '../../core/types';

export interface FilterOptions {
  assignee?: string;
  favoritesOnly?: boolean;
  favorites?: Set<string>;
  keyword?: string;
  statuses?: string[];
  excludeClosed?: boolean;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export function filterTasks(issues: JiraIssue[], options: FilterOptions): JiraIssue[] {
  return issues.filter(issue => {
    if (options.assignee && issue.assignee?.key !== options.assignee) return false;

    if (options.favoritesOnly && options.favorites && !options.favorites.has(issue.key)) return false;

    if (options.keyword) {
      const kw = options.keyword.toLowerCase();
      if (!issue.summary.toLowerCase().includes(kw)) return false;
    }

    if (options.statuses && options.statuses.length > 0) {
      if (!options.statuses.includes(issue.status.name)) return false;
    }

    if (options.excludeClosed && issue.status.category === 'done' && issue.status.name.toLowerCase() === 'closed') {
      return false;
    }

    if (options.dueDateFrom && issue.dueDate) {
      if (new Date(issue.dueDate) < options.dueDateFrom) return false;
    }

    if (options.dueDateTo && issue.dueDate) {
      if (new Date(issue.dueDate) > options.dueDateTo) return false;
    }

    return true;
  });
}

export type DueDateGroup = 'delay' | 'week' | 'twoWeeks' | 'month' | 'custom' | 'noDueDate';

export function groupByDueDate(issues: JiraIssue[], today: Date = new Date(), customDays?: number): Record<DueDateGroup, JiraIssue[]> {
  const groups: Record<DueDateGroup, JiraIssue[]> = {
    delay: [], week: [], twoWeeks: [], month: [], custom: [], noDueDate: [],
  };

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (const issue of issues) {
    if (!issue.dueDate) { groups.noDueDate.push(issue); continue; }

    const due = new Date(issue.dueDate);
    const diffDays = Math.ceil((due.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) groups.delay.push(issue);
    else if (diffDays <= 7) groups.week.push(issue);
    else if (diffDays <= 14) groups.twoWeeks.push(issue);
    else if (diffDays <= 30) groups.month.push(issue);
    else if (customDays && diffDays <= customDays) groups.custom.push(issue);
    else groups.custom.push(issue);
  }

  return groups;
}

export function getDelayDays(dueDate: string, today: Date = new Date()): number {
  const due = new Date(dueDate);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((todayStart.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDaysUntilDue(dueDate: string, today: Date = new Date()): number {
  const due = new Date(dueDate);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((due.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
}
