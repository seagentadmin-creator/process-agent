// === version-manager.ts ===
import { ManifestData, VersionChanges } from '../../core/types';

export function hasUpdate(localVersion: string, remoteManifest: ManifestData): boolean {
  return localVersion !== remoteManifest.currentVersion;
}

export function hasPublishedAtChanged(localTimestamp: string, remoteTimestamp: string): boolean {
  return localTimestamp !== remoteTimestamp;
}

export function getChangedItems(changes: VersionChanges): string[] {
  const items: string[] = [];
  items.push(...changes.guide.map(g => `guide:${g}`));
  items.push(...changes.checklist.map(c => `checklist:${c}`));
  items.push(...changes.aiDirectives.map(a => `ai:${a}`));
  if (changes.commonFields) items.push('commonFields');
  if (changes.commonChecklist) items.push('commonChecklist');
  return items;
}

export function isTestVersion(version: string): boolean {
  return version.includes('-test') || version.includes('-draft');
}
