import { JiraIssue } from '../../core/types';

export function getWeeklyTarget(issues: JiraIssue[], today: Date = new Date()): number {
  const weekEnd = new Date(today);
  const daysUntilSunday = 7 - weekEnd.getDay();
  weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
  weekEnd.setHours(23, 59, 59, 999);

  return issues.filter(issue => {
    if (!issue.dueDate) return false;
    if (issue.status.category === 'done') return false;
    const due = new Date(issue.dueDate);
    return due <= weekEnd;
  }).length;
}

export function getCompletionRate(issues: JiraIssue[], days: number = 30, today: Date = new Date()): number {
  const since = new Date(today);
  since.setDate(since.getDate() - days);
  const completed = issues.filter(i =>
    i.status.category === 'done' && i.resolutionDate && new Date(i.resolutionDate) >= since
  );
  if (completed.length === 0) return 0;
  const onTime = completed.filter(i => {
    if (!i.dueDate || !i.resolutionDate) return false;
    return new Date(i.resolutionDate) <= new Date(i.dueDate);
  });
  return Math.round((onTime.length / completed.length) * 100);
}

export function getAvgDuration(issues: JiraIssue[], days: number = 30, today: Date = new Date()): number {
  const since = new Date(today);
  since.setDate(since.getDate() - days);
  const completed = issues.filter(i =>
    i.status.category === 'done' && i.resolutionDate && new Date(i.resolutionDate) >= since
  );
  if (completed.length === 0) return 0;
  const totalDays = completed.reduce((sum, i) => {
    const created = new Date(i.created);
    const resolved = new Date(i.resolutionDate!);
    return sum + Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }, 0);
  return Math.round((totalDays / completed.length) * 10) / 10;
}
