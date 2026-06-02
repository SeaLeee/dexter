/**
 * Dexter GUI server.
 *
 * Lightweight HTTP + WebSocket layer built on top of Bun.serve that exposes
 * the existing agent, finance tools, and configuration system to a local web
 * UI. Designed to be launched via `bun run gui` or the start.command script.
 */
import { existsSync, readFileSync } from 'fs';
import { join, dirname, resolve, normalize } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import { Agent } from '@/agent/agent';
import type { AgentEvent } from '@/agent/types';
import { PROVIDERS, getProviderById } from '@/providers';
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from '@/model/llm';
import {
  checkApiKeyExistsForProvider,
  saveApiKeyForProvider,
  saveApiKeyToEnv,
  checkApiKeyExists,
} from '@/utils/env';
import { getSetting, setSetting } from '@/utils/config';
import { getToolRegistry } from '@/tools/registry';
import { discoverSkills } from '@/skills/index';
import { callApi } from '@/tools/finance/api';
import { saveArchive, listArchives, getArchive, deleteArchive } from '@/gui/archive';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIR = resolve(__dirname, 'web');
const PORT = Number(process.env.DEXTER_GUI_PORT ?? 4317);

// ---------------------------------------------------------------------------
// Static file serving
// ---------------------------------------------------------------------------

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveStatic(pathname: string): Response {
  // Default to index.html for root or unknown paths (SPA fallback)
  let rel = pathname === '/' ? '/index.html' : pathname;
  // Prevent path traversal
  const filePath = normalize(join(WEB_DIR, rel));
  if (!filePath.startsWith(WEB_DIR)) {
    return new Response('Forbidden', { status: 403 });
  }
  if (!existsSync(filePath)) {
    // SPA fallback
    const fallback = join(WEB_DIR, 'index.html');
    if (existsSync(fallback)) {
      return new Response(readFileSync(fallback), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    return new Response('Not Found', { status: 404 });
  }
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  return new Response(readFileSync(filePath), {
    headers: { 'Content-Type': MIME[ext] ?? 'application/octet-stream' },
  });
}

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function readJson<T = unknown>(req: Request): Promise<T> {
  return (await req.json()) as T;
}

// ---------------------------------------------------------------------------
// API handlers
// ---------------------------------------------------------------------------

function buildProviderSummary() {
  return PROVIDERS.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    modelPrefix: p.modelPrefix,
    apiKeyEnvVar: p.apiKeyEnvVar ?? null,
    fastModel: p.fastModel ?? null,
    hasKey: checkApiKeyExistsForProvider(p.id),
  }));
}

// Curated model catalogue per provider. Kept short — users can pick any model
// by typing a custom id in the GUI.
const MODEL_CATALOGUE: Record<string, string[]> = {
  openai: ['gpt-5.2', 'gpt-5.1', 'gpt-4.1', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o3-mini'],
  anthropic: [
    'claude-sonnet-4-5',
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
    'claude-haiku-4-5',
  ],
  google: ['gemini-3', 'gemini-3-flash-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'],
  xai: ['grok-4', 'grok-4-1-fast-reasoning'],
  moonshot: ['kimi-k2-5', 'kimi-k2'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  openrouter: [
    'openrouter:openai/gpt-4o',
    'openrouter:anthropic/claude-sonnet-4',
    'openrouter:meta-llama/llama-3.3-70b',
  ],
  ollama: ['ollama:llama3.1', 'ollama:qwen2.5', 'ollama:mistral'],
};

function handleGetConfig(): Response {
  const providers = buildProviderSummary();
  const currentProvider = getSetting<string>('provider', DEFAULT_PROVIDER);
  const currentModel = getSetting<string>('modelId', DEFAULT_MODEL);
  return json({
    providers,
    catalogue: MODEL_CATALOGUE,
    current: { provider: currentProvider, modelId: currentModel },
    extras: {
      financialDatasets: checkApiKeyExists('FINANCIAL_DATASETS_API_KEY'),
      exa: checkApiKeyExists('EXASEARCH_API_KEY'),
      tavily: checkApiKeyExists('TAVILY_API_KEY'),
      perplexity: checkApiKeyExists('PERPLEXITY_API_KEY'),
      langsmith: checkApiKeyExists('LANGSMITH_API_KEY'),
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434',
    },
  });
}

interface SaveConfigPayload {
  provider?: string;
  modelId?: string;
  apiKeys?: Record<string, string>;
  extras?: Record<string, string>;
}

async function handleSaveConfig(req: Request): Promise<Response> {
  const body = await readJson<SaveConfigPayload>(req);

  if (body.provider) {
    const provider = getProviderById(body.provider);
    if (!provider) return json({ error: `Unknown provider: ${body.provider}` }, 400);
    setSetting('provider', provider.id);
  }
  if (body.modelId && typeof body.modelId === 'string') {
    setSetting('modelId', body.modelId);
  }

  // Provider-scoped API keys: keyed by provider id
  if (body.apiKeys) {
    for (const [providerId, key] of Object.entries(body.apiKeys)) {
      if (!key) continue;
      saveApiKeyForProvider(providerId, key);
    }
  }

  // Generic environment-variable keys (financial data, search, tracing, etc.)
  if (body.extras) {
    for (const [envVar, value] of Object.entries(body.extras)) {
      if (!value) continue;
      saveApiKeyToEnv(envVar, value);
    }
  }

  return handleGetConfig();
}

function handleGetTools(): Response {
  const model = getSetting<string>('modelId', DEFAULT_MODEL);
  const tools = getToolRegistry(model).map((t) => ({
    name: t.name,
    description: t.description.split('\n').slice(0, 3).join(' '),
  }));
  const skills = discoverSkills().map((s) => ({ name: s.name, description: s.description }));
  return json({ tools, skills });
}

interface PricesPayload {
  prices?: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }>;
}

async function handleGetPrices(url: URL): Promise<Response> {
  const ticker = url.searchParams.get('ticker');
  if (!ticker) return json({ error: 'ticker is required' }, 400);

  const interval = url.searchParams.get('interval') ?? 'day';
  const days = Number(url.searchParams.get('days') ?? 90);
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  try {
    const { data } = await callApi(
      '/prices/',
      {
        ticker,
        interval,
        interval_multiplier: 1,
        start_date: fmt(start),
        end_date: fmt(end),
      },
      { cacheable: false }
    );
    const payload = data as PricesPayload;
    return json({ ticker, prices: payload.prices ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: message }, 502);
  }
}

async function handleGetSnapshot(url: URL): Promise<Response> {
  const ticker = url.searchParams.get('ticker');
  if (!ticker) return json({ error: 'ticker is required' }, 400);
  try {
    const { data } = await callApi('/prices/snapshot/', { ticker });
    return json({ ticker, snapshot: data.snapshot ?? null });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
}

async function handleGetMetrics(url: URL): Promise<Response> {
  const ticker = url.searchParams.get('ticker');
  if (!ticker) return json({ error: 'ticker is required' }, 400);
  try {
    const { data } = await callApi('/financial-metrics/snapshot/', { ticker });
    return json({ ticker, metrics: data.snapshot ?? data });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
}

// ---------------------------------------------------------------------------
// Archive handlers
// ---------------------------------------------------------------------------

function handleGetArchives(): Response {
  return json({ archives: listArchives() });
}

async function handleSaveArchive(req: Request): Promise<Response> {
  const body = await readJson<{
    query: string;
    events: AgentEvent[];
    answer: string;
    stats: { iterations: number; totalTime: number; tokenUsage?: { totalTokens: number; inputTokens: number; outputTokens: number }; tokensPerSecond?: number } | null;
  }>(req);
  if (!body.query || !body.events) {
    return json({ error: 'query and events are required' }, 400);
  }
  const entry = saveArchive(body);
  return json({ archive: entry }, 201);
}

function handleGetArchive(pathname: string): Response {
  const id = pathname.slice('/api/archives/'.length);
  const entry = getArchive(id);
  if (!entry) return json({ error: 'Archive not found' }, 404);
  return json({ archive: entry });
}

function handleDeleteArchive(pathname: string): Response {
  const id = pathname.slice('/api/archives/'.length);
  const ok = deleteArchive(id);
  if (!ok) return json({ error: 'Archive not found' }, 404);
  return json({ deleted: true });
}

// ---------------------------------------------------------------------------
// WebSocket: streaming agent run
// ---------------------------------------------------------------------------

interface WsData {
  controller?: AbortController;
}

interface ClientMessage {
  type: 'run' | 'cancel';
  query?: string;
  model?: string;
}

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------

const server = Bun.serve<WsData, never>({
  port: PORT,
  async fetch(req, srv) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname === '/ws/agent') {
      const upgraded = srv.upgrade(req, { data: {} });
      if (upgraded) return undefined as unknown as Response;
      return new Response('WebSocket upgrade failed', { status: 400 });
    }

    // API routes
    if (url.pathname.startsWith('/api/')) {
      try {
        if (url.pathname === '/api/config' && req.method === 'GET') return handleGetConfig();
        if (url.pathname === '/api/config' && req.method === 'POST') return handleSaveConfig(req);
        if (url.pathname === '/api/tools' && req.method === 'GET') return handleGetTools();
        if (url.pathname === '/api/finance/prices') return handleGetPrices(url);
        if (url.pathname === '/api/finance/snapshot') return handleGetSnapshot(url);
        if (url.pathname === '/api/finance/metrics') return handleGetMetrics(url);
        if (url.pathname === '/api/archives' && req.method === 'GET') return handleGetArchives();
        if (url.pathname === '/api/archives' && req.method === 'POST') return handleSaveArchive(req);
        if (url.pathname.startsWith('/api/archives/') && req.method === 'GET')
          return handleGetArchive(url.pathname);
        if (url.pathname.startsWith('/api/archives/') && req.method === 'DELETE')
          return handleDeleteArchive(url.pathname);
        return json({ error: 'Not Found' }, 404);
      } catch (e) {
        return json({ error: e instanceof Error ? e.message : String(e) }, 500);
      }
    }

    return serveStatic(url.pathname);
  },
  websocket: {
    open(ws) {
      ws.data = {};
    },
    async message(ws, raw) {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
        return;
      }

      if (msg.type === 'cancel') {
        ws.data.controller?.abort();
        return;
      }

      if (msg.type !== 'run' || !msg.query) {
        ws.send(JSON.stringify({ type: 'error', error: 'Expected {type:"run", query}' }));
        return;
      }

      // Abort any previous run on the same connection
      ws.data.controller?.abort();
      const controller = new AbortController();
      ws.data.controller = controller;

      const model = msg.model || getSetting<string>('modelId', DEFAULT_MODEL);

      try {
        const agent = Agent.create({ model, signal: controller.signal });
        for await (const event of agent.run(msg.query)) {
          ws.send(JSON.stringify(event satisfies AgentEvent));
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        ws.send(JSON.stringify({ type: 'error', error: message }));
      } finally {
        ws.data.controller = undefined;
      }
    },
    close(ws) {
      ws.data?.controller?.abort();
    },
  },
});

console.log(`\n  Dexter GUI ready → http://localhost:${server.port}\n`);
