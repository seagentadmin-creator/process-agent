export interface SimilarityResult {
  issueKey: string;
  title: string;
  score: number;
  issueType?: string;
}

const DATE_PATTERNS = [
  /\d{4}[QH]\d/i, /\d{4}년/, /\d{2}월/, /\d{4}-\d{2}/, /\d{4}/,
];

export function tokenize(title: string): string[] {
  let cleaned = title;
  for (const pattern of DATE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.split(/[-_\s/\\]+/).map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
}

function charOverlap(a: string, b: string): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let common = 0;
  setA.forEach(c => { if (setB.has(c)) common++; });
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? common / union : 0;
}

export function calculateSimilarity(
  currentTitle: string, candidateTitle: string,
  sameIssueType: boolean = false, isRecentlyCompleted: boolean = false,
): number {
  const currentTokens = tokenize(currentTitle);
  const candidateTokens = tokenize(candidateTitle);
  if (currentTokens.length === 0 || candidateTokens.length === 0) return 0;

  let score = 0;
  const currentJoined = currentTokens.join('');
  const candidateJoined = candidateTokens.join('');

  if (currentJoined === candidateJoined) {
    score += 60;
  } else {
    for (const token of currentTokens) {
      if (candidateTokens.includes(token)) {
        score += 25;
      } else {
        let bestOverlap = 0;
        for (const ct of candidateTokens) {
          const overlap = charOverlap(token, ct);
          if (overlap > bestOverlap) bestOverlap = overlap;
        }
        score += Math.round(bestOverlap * 20);
      }
    }
  }

  if (sameIssueType) score += 10;
  if (isRecentlyCompleted) score += 5;
  return Math.min(score, 100);
}

export function rankBySimilarity(
  currentTitle: string,
  candidates: { key: string; title: string; issueType?: string; completed?: boolean }[],
  currentIssueType?: string, topN: number = 5,
): SimilarityResult[] {
  return candidates
    .map(c => ({
      issueKey: c.key, title: c.title,
      score: calculateSimilarity(currentTitle, c.title,
        currentIssueType ? c.issueType === currentIssueType : false, c.completed ?? false),
      issueType: c.issueType,
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
