import { GuideMapping, GuideConfig } from '../../core/types';

export class GuideMatcher {
  private exactMap: Map<string, string> = new Map();
  private patterns: { regex: RegExp; issueType: string; guideCode: string }[] = [];
  private keywords: { words: string[]; issueType: string; guideCode: string }[] = [];
  private defaults: Map<string, string> = new Map();

  constructor(mappings: GuideMapping[]) {
    this.buildIndex(mappings);
  }

  private buildIndex(mappings: GuideMapping[]): void {
    const sorted = [...mappings].sort((a, b) => a.priority - b.priority);

    for (const m of sorted) {
      switch (m.matchType) {
        case 'exact':
          this.exactMap.set(`${m.issueType}:${m.condition}`, m.guideCode);
          break;
        case 'pattern':
          try {
            this.patterns.push({
              regex: new RegExp(m.condition),
              issueType: m.issueType,
              guideCode: m.guideCode,
            });
          } catch { /* invalid regex ignored */ }
          break;
        case 'keyword':
          this.keywords.push({
            words: m.condition.split(',').map(w => w.trim().toLowerCase()),
            issueType: m.issueType,
            guideCode: m.guideCode,
          });
          break;
        case 'default':
          this.defaults.set(m.issueType, m.guideCode);
          break;
      }
    }
  }

  match(issueTitle: string, issueType: string): string | null {
    // Stage 1: Exact match
    const exactKey = `${issueType}:${issueTitle}`;
    const exactResult = this.exactMap.get(exactKey);
    if (exactResult) return exactResult;

    // Stage 2: Pattern/Keyword match
    const titleLower = issueTitle.toLowerCase();

    for (const p of this.patterns) {
      if (p.issueType === issueType && p.regex.test(issueTitle)) {
        return p.guideCode;
      }
    }

    for (const k of this.keywords) {
      if (k.issueType === issueType && k.words.some(w => titleLower.includes(w))) {
        return k.guideCode;
      }
    }

    // Stage 3: Default fallback
    return this.defaults.get(issueType) ?? null;
  }
}
