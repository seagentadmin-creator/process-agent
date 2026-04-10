// === Jira Types ===
export interface JiraIssue {
  key: string;
  id: string;
  fields: Record<string, any>;
  summary: string;
  status: JiraStatus;
  assignee: JiraUser | null;
  dueDate: string | null;
  issueType: JiraIssueType;
  priority: JiraPriority;
  description: string | null;
  created: string;
  updated: string;
  resolutionDate: string | null;
  components: JiraComponent[];
  labels: string[];
  attachments: JiraAttachment[];
}

export interface JiraStatus { id: string; name: string; category: string; }
export interface JiraUser { key: string; name: string; displayName: string; emailAddress: string; }
export interface JiraIssueType { id: string; name: string; subtask: boolean; }
export interface JiraPriority { id: string; name: string; }
export interface JiraComponent { id: string; name: string; }
export interface JiraAttachment { id: string; filename: string; mimeType: string; }
export interface JiraField { id: string; name: string; custom: boolean; schema?: { type: string; custom?: string }; }
export interface JiraTransition { id: string; name: string; to: JiraStatus; }
export interface JiraIssueLink { id: string; type: { name: string; inward: string; outward: string }; inwardIssue?: JiraIssue; outwardIssue?: JiraIssue; }

// === Confluence Types ===
export interface ConfluencePage { id: string; title: string; version: { number: number }; body: { storage: { value: string } }; space: { key: string }; _links: { webui: string }; }
export interface ConfluenceSearchResult { results: ConfluencePage[]; totalSize: number; }

// === Hierarchy Types ===
export type HierarchyLevel = 'Project' | 'L4' | 'L5' | 'L6' | 'L7' | 'Checklist';
export type GeneralLevel = 'Epic' | 'Story' | 'Task';

export interface HierarchyNode {
  issue: JiraIssue;
  level: HierarchyLevel | GeneralLevel;
  children: HierarchyNode[];
  parent?: HierarchyNode;
  depth: number;
}

// === Config Types ===
export interface ConnectionConfig {
  jira: { baseUrl: string; pat: string };
  confluence: { baseUrl: string; pat?: string; useJiraPat: boolean };
  bitbucket: { baseUrl: string; pat?: string; useJiraPat: boolean };
  configSpace: string;
  manualSpace?: string;
}

export interface IssueTypeMapping {
  levels: Record<HierarchyLevel, { issueType: string; linkType?: string }>;
  vocIssueType: string;
}

export interface OutputFieldMapping {
  outputType: string;
  outputUrl: string;
  mpUse: string;
}

export interface EnvironmentSet {
  id: string;
  type: 'slm' | 'general';
  name: string;
  project: string;
  structure: string;
  board?: string;
  isActive: boolean;
}

export interface AdminUser {
  userId: string;
  email: string;
  name: string;
  role: 'primary' | 'secondary';
  permissions: string[];
  addedAt: string;
  addedBy: string;
}

// === Guide Types ===
export interface GuideMapping {
  priority: number;
  matchType: 'exact' | 'pattern' | 'keyword' | 'default';
  issueType: string;
  condition: string;
  guideCode: string;
}

export interface GuideConfig {
  code: string;
  issueType: string;
  title: string;
  version: string;
  keywords: string[];
  summary: string;
  manualLink?: string;
  bpCases: BPCase[];
  qualityCheck?: QualityCheckConfig;
}

export interface BPCase { title: string; link: string; }

export interface QualityCheckConfig {
  checkLevel: '1-2' | '1-4';
  keywords: { word: string; required: boolean }[];
  aiDirective?: string;
}

// === Checklist Types ===
export type ChecklistItemType = 'field_check' | 'confirm' | 'link_action';

export interface ChecklistItem {
  order: number;
  type: ChecklistItemType;
  question: string;
  required: boolean;
  fieldKey?: string;
  link?: string;
  helpMessage: string;
}

export interface ChecklistState {
  item: ChecklistItem;
  completed: boolean;
  notApplicable: boolean;
  fieldValue?: any;
}

export interface ResolvedFields {
  fields: FieldConfig[];
  hasVariable: boolean;
  checklist: {
    common: ChecklistItem[];
    variable: ChecklistItem[] | null;
    hasVariable: boolean;
  };
}

export interface FieldConfig {
  fieldKey: string;
  fieldName: string;
  fieldType: FieldType;
  required: boolean;
  value?: any;
}

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'user' | 'label' | 'url' | 'attachment' | 'cascading';
export type ReusePolicy = 'always' | 'never' | 'conditional';

// === Version Types ===
export interface ManifestData {
  currentVersion: string;
  publishedAt: string;
  changes: VersionChanges;
  versions: VersionEntry[];
}

export interface VersionChanges {
  guide: string[];
  checklist: string[];
  aiDirectives: string[];
  commonFields: boolean;
  commonChecklist: boolean;
}

export interface VersionEntry {
  version: string;
  date: string;
  releaseNotes: string;
  type: 'release' | 'rollback' | 'restore';
  author: string;
  changes: VersionChanges;
}

// === AI Types ===
export type AIProviderType = 'openai-compatible' | 'anthropic' | 'ollama' | 'custom';

export interface AIProviderConfig {
  id: string;
  name: string;
  type: AIProviderType;
  apiUrl: string;
  apiKey?: string;
  model: string;
  isDefault: boolean;
}

export interface AIMessage { role: 'system' | 'user' | 'assistant'; content: string; }
export interface AIContext { systemPrompt: string; documents: AIDocument[]; guideContent?: string; }
export interface AIDocument { title: string; content: string; link: string; score: number; }

// === VOC Types ===
export interface VOCTemplate {
  fields: VOCField[];
}

export interface VOCField {
  name: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export interface VOCRecipient { name: string; email: string; role: string; }

// === KPI Types ===
export interface KPIMetrics {
  onTimeRate: number;
  avgDuration: number;
  delayRate: number;
  resolveQuality: number;
  outputMissRate: number;
}

export interface UsageMetrics {
  dauRate: number;
  featureUsage: Record<string, number>;
  adoptionRate: number;
  reuseRate: number;
}

// === Error Types ===
export interface ErrorReport {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  browser: string;
  extensionVersion: string;
  errorType: string;
  errorCode: string;
  errorMessage: string;
  targetIssue?: string;
  targetAction?: string;
  failedStep: number;
  totalSteps: number;
  steps: StepResult[];
  possibleCauses: PossibleCause[];
  userActions: UserAction[];
}

export interface StepResult { order: number; name: string; result: 'success' | 'failed' | 'skipped'; duration: number; }
export interface PossibleCause { priority: number; cause: string; resolution: string; }
export interface UserAction { description: string; link?: string; }

// === Common Types ===
export interface Result<T> { data: T | null; error: AppError | null; success: boolean; }
export interface AppError { code: string; message: string; details?: any; }
export interface Snapshot { timestamp: string; author: string; reason: string; category: string; data: any; diff: any; }

// === Alert Types ===
export interface AlertConfig {
  preAlerts: AlertItem[];
  delayAlerts: AlertItem[];
}

export interface AlertItem {
  days: number;
  enabled: boolean;
  source: 'admin' | 'user';
}

export type AlertMode = 'individual' | 'summary';
