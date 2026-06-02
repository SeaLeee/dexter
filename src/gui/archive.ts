/**
 * Archive manager — persists completed research conversations to disk
 * so users can browse and re-analyze past results in the GUI.
 */
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import type { AgentEvent } from '@/agent/types';

const ARCHIVE_DIR = join(process.cwd(), '.dexter', 'archive');

export interface ArchiveMeta {
  id: string;
  timestamp: string;
  query: string;
  summary: string;
  answerPreview: string;
  eventCount: number;
  hasStats: boolean;
}

export interface ArchiveEntry extends ArchiveMeta {
  events: AgentEvent[];
  answer: string;
  stats: {
    iterations: number;
    totalTime: number;
    tokenUsage?: { totalTokens: number; inputTokens: number; outputTokens: number };
    tokensPerSecond?: number;
  } | null;
}

function ensureDir(): void {
  if (!existsSync(ARCHIVE_DIR)) {
    mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
}

function filePath(id: string): string {
  return join(ARCHIVE_DIR, `${id}.json`);
}

function generateId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  const rand = Math.random().toString(36).slice(2, 8);
  return `${date}-${time}-${rand}`;
}

function buildSummary(query: string, answer: string): string {
  const firstLine = answer
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\n{2,}/g, ' ')
    .trim();
  return firstLine.slice(0, 200) || query;
}

export function saveArchive(payload: {
  query: string;
  events: AgentEvent[];
  answer: string;
  stats: ArchiveEntry['stats'];
}): ArchiveEntry {
  ensureDir();
  const id = generateId();
  const entry: ArchiveEntry = {
    id,
    timestamp: new Date().toISOString(),
    query: payload.query,
    summary: buildSummary(payload.query, payload.answer),
    answerPreview: payload.answer.replace(/[#*`\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150),
    eventCount: payload.events.length,
    hasStats: payload.stats !== null,
    events: payload.events,
    answer: payload.answer,
    stats: payload.stats,
  };
  writeFileSync(filePath(id), JSON.stringify(entry, null, 2), 'utf-8');
  return entry;
}

export function listArchives(): ArchiveMeta[] {
  ensureDir();
  const files = readdirSync(ARCHIVE_DIR).filter((f) => f.endsWith('.json'));
  const metas: ArchiveMeta[] = [];
  for (const file of files) {
    try {
      const raw = readFileSync(join(ARCHIVE_DIR, file), 'utf-8');
      const entry = JSON.parse(raw) as ArchiveEntry;
      metas.push({
        id: entry.id,
        timestamp: entry.timestamp,
        query: entry.query,
        summary: entry.summary,
        answerPreview: entry.answerPreview,
        eventCount: entry.eventCount,
        hasStats: entry.hasStats,
      });
    } catch {
      // skip corrupt files
    }
  }
  metas.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return metas;
}

export function getArchive(id: string): ArchiveEntry | null {
  const path = filePath(id);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as ArchiveEntry;
  } catch {
    return null;
  }
}

export function deleteArchive(id: string): boolean {
  const path = filePath(id);
  if (!existsSync(path)) return false;
  unlinkSync(path);
  return true;
}
