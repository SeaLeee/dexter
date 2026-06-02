/**
 * Dexter GUI frontend.
 *
 * Vanilla ES module — no build step. Talks to /api/* for config / finance data
 * and to /ws/agent for streaming agent events.
 */

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
const navButtons = document.querySelectorAll('#nav .nav-btn');
const views = document.querySelectorAll('main .view');

function switchView(name) {
  navButtons.forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  views.forEach((v) => v.classList.toggle('hidden', v.dataset.view !== name));
  if (name === 'dashboard' && !priceChart) loadTicker();
  if (name === 'tools') loadTools();
  if (name === 'archives') loadArchives();
}
navButtons.forEach((b) => b.addEventListener('click', () => switchView(b.dataset.view)));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtNumber = (n, digits = 2) => {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return Number(n).toFixed(digits);
};

// ---------------------------------------------------------------------------
// Settings & model state
// ---------------------------------------------------------------------------
let CONFIG = null;

async function loadConfig() {
  const res = await fetch('/api/config');
  CONFIG = await res.json();
  renderSidebar();
  renderSettings();
}

function renderSidebar() {
  $('#sidebar-model').textContent = CONFIG.current.modelId || '—';
  const p = CONFIG.providers.find((x) => x.id === CONFIG.current.provider);
  $('#sidebar-provider').textContent = p ? p.displayName : CONFIG.current.provider;
}

function renderSettings() {
  // Providers dropdown
  const provSel = $('#provider-select');
  provSel.innerHTML = CONFIG.providers
    .map((p) => `<option value="${p.id}" ${p.id === CONFIG.current.provider ? 'selected' : ''}>${p.displayName} ${p.hasKey ? '✓' : '·'} </option>`)
    .join('');

  const refreshModels = () => {
    const pid = provSel.value;
    const models = CONFIG.catalogue[pid] || [];
    const selected = CONFIG.current.modelId;
    $('#model-select').innerHTML = models
      .map((m) => `<option value="${m}" ${m === selected ? 'selected' : ''}>${m}</option>`)
      .join('');
  };
  provSel.onchange = refreshModels;
  refreshModels();

  $('#save-model').onclick = saveModel;

  // API keys for each provider
  const keysHost = $('#api-keys');
  keysHost.innerHTML = CONFIG.providers
    .filter((p) => p.apiKeyEnvVar)
    .map(
      (p) => `
      <div class="border-b border-ink-800 pb-2">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm">${p.displayName}</span>
          <span class="text-xs ${p.hasKey ? 'text-accent-400' : 'text-slate-500'}">${p.hasKey ? '已配置 ✓' : '未配置'}</span>
        </div>
        <div class="flex gap-2">
          <input type="password" data-provider-key="${p.id}" placeholder="${p.apiKeyEnvVar}" class="flex-1 bg-ink-800 border border-ink-700 rounded px-2 py-1 text-xs" />
          <button data-save-key="${p.id}" class="btn-secondary">保存</button>
        </div>
      </div>`
    )
    .join('');

  keysHost.querySelectorAll('[data-save-key]').forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.saveKey;
      const input = keysHost.querySelector(`input[data-provider-key="${id}"]`);
      const value = input.value.trim();
      if (!value) return;
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys: { [id]: value } }),
      });
      input.value = '';
      await loadConfig();
    };
  });

  // Extras
  const extrasHost = $('#extra-keys');
  const extraDefs = [
    { env: 'FINANCIAL_DATASETS_API_KEY', label: '金融数据 (Financial Datasets)', key: 'financialDatasets' },
    { env: 'EXASEARCH_API_KEY', label: 'Exa 搜索', key: 'exa' },
    { env: 'TAVILY_API_KEY', label: 'Tavily 搜索', key: 'tavily' },
    { env: 'PERPLEXITY_API_KEY', label: 'Perplexity 搜索', key: 'perplexity' },
    { env: 'LANGSMITH_API_KEY', label: 'LangSmith 追踪', key: 'langsmith' },
  ];
  extrasHost.innerHTML = extraDefs
    .map(
      (d) => `
      <div class="border border-ink-800 rounded-lg p-3">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm">${d.label}</span>
          <span class="text-xs ${CONFIG.extras[d.key] ? 'text-accent-400' : 'text-slate-500'}">${CONFIG.extras[d.key] ? '已配置 ✓' : '未配置'}</span>
        </div>
        <div class="flex gap-2">
          <input type="password" data-extra="${d.env}" placeholder="${d.env}" class="flex-1 bg-ink-800 border border-ink-700 rounded px-2 py-1 text-xs" />
          <button data-save-extra="${d.env}" class="btn-secondary">保存</button>
        </div>
      </div>`
    )
    .join('');
  extrasHost.querySelectorAll('[data-save-extra]').forEach((btn) => {
    btn.onclick = async () => {
      const env = btn.dataset.saveExtra;
      const input = extrasHost.querySelector(`input[data-extra="${env}"]`);
      const value = input.value.trim();
      if (!value) return;
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extras: { [env]: value } }),
      });
      input.value = '';
      await loadConfig();
    };
  });
}

async function saveModel() {
  const custom = $('#model-custom').value.trim();
  const modelId = custom || $('#model-select').value;
  const provider = $('#provider-select').value;
  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, modelId }),
  });
  if (res.ok) {
    CONFIG = await res.json();
    $('#save-status').textContent = `已保存 → ${modelId}`;
    setTimeout(() => ($('#save-status').textContent = ''), 2500);
    renderSidebar();
  } else {
    $('#save-status').textContent = '保存失败';
  }
}

// ---------------------------------------------------------------------------
// Research / Agent run
// ---------------------------------------------------------------------------
const eventsHost = $('#events');
const queryForm = $('#query-form');
const queryInput = $('#query-input');
const runStatus = $('#run-status');
const cancelBtn = $('#cancel-btn');

let ws = null;
let currentAnswerEl = null;
let answerBuffer = '';
let currentRunEvents = [];
let currentRunQuery = '';
let currentRunStats = null;

function ensureWs() {
  if (ws && ws.readyState === WebSocket.OPEN) return ws;
  ws = new WebSocket(`ws://${location.host}/ws/agent`);
  ws.onmessage = (e) => handleAgentEvent(JSON.parse(e.data));
  ws.onclose = () => {
    ws = null;
    runStatus.textContent = '连接断开';
    cancelBtn.classList.add('hidden');
  };
  ws.onerror = () => (runStatus.textContent = 'WebSocket 错误');
  return ws;
}

function pushEvent(html, cls = '') {
  const div = document.createElement('div');
  div.className = `evt ${cls}`;
  div.innerHTML = html;
  eventsHost.appendChild(div);
  eventsHost.scrollTop = eventsHost.scrollHeight;
  return div;
}

function handleAgentEvent(ev) {
  currentRunEvents.push(ev);
  switch (ev.type) {
    case 'thinking':
      pushEvent(`💭 ${escapeHtml(ev.message)}`, 'evt-thinking');
      runStatus.innerHTML = '<span class="spin"></span> 思考中…';
      break;
    case 'tool_start': {
      const args = JSON.stringify(ev.args, null, 2);
      const el = pushEvent(
        `<div class="tool-head"><span><span class="tool-name">▶ ${escapeHtml(ev.tool)}</span></span><span class="text-slate-500">运行中…</span></div>
         <div class="tool-args">${escapeHtml(args)}</div>`,
        'evt-tool'
      );
      el.dataset.tool = ev.tool;
      runStatus.innerHTML = `<span class="spin"></span> 调用 ${escapeHtml(ev.tool)}…`;
      break;
    }
    case 'tool_progress':
      pushEvent(`<span class="tool-pill">${escapeHtml(ev.tool)}</span> ${escapeHtml(ev.message)}`, 'evt-thinking');
      break;
    case 'tool_end': {
      const els = eventsHost.querySelectorAll(`.evt-tool[data-tool="${CSS.escape(ev.tool)}"]`);
      const last = els[els.length - 1];
      const resultText = typeof ev.result === 'string' ? ev.result : JSON.stringify(ev.result);
      const preview = resultText.length > 4000 ? resultText.slice(0, 4000) + '\n…(已截断)' : resultText;
      if (last) {
        last.innerHTML += `<div class="tool-result">${escapeHtml(preview)}</div>
          <div class="text-xs text-slate-500 mt-1">完成 · ${ev.duration}ms</div>`;
      }
      break;
    }
    case 'tool_error':
      pushEvent(`<span class="tool-pill">${escapeHtml(ev.tool)}</span> 错误: ${escapeHtml(ev.error)}`, 'evt-error');
      break;
    case 'tool_limit':
      if (ev.warning) pushEvent(`⚠️ ${escapeHtml(ev.warning)}`, 'evt-thinking');
      break;
    case 'context_cleared':
      pushEvent(`🧹 上下文压缩：清理了 ${ev.clearedCount} 个旧工具结果，保留最新 ${ev.keptCount} 个`, 'evt-thinking');
      break;
    case 'answer_start':
      answerBuffer = '';
      currentAnswerEl = pushEvent(`<div class="font-semibold text-accent-400 text-xs">📋 最终回答</div><div class="answer-body"></div>`, 'evt-answer');
      runStatus.innerHTML = '<span class="spin"></span> 生成答案…';
      break;
    case 'done': {
      if (!currentAnswerEl) {
        currentAnswerEl = pushEvent(`<div class="font-semibold text-accent-400 text-xs">📋 回答</div><div class="answer-body"></div>`, 'evt-answer');
      }
      const body = currentAnswerEl.querySelector('.answer-body');
      body.innerHTML = marked.parse(ev.answer || '');
      const tk = ev.tokenUsage
        ? `<div class="text-xs text-slate-500 mt-2">迭代 ${ev.iterations} · ${ev.totalTime}ms · ${ev.tokenUsage.totalTokens} tokens (in ${ev.tokenUsage.inputTokens} / out ${ev.tokenUsage.outputTokens})${ev.tokensPerSecond ? ` · ${ev.tokensPerSecond} tok/s` : ''}</div>`
        : `<div class="text-xs text-slate-500 mt-2">迭代 ${ev.iterations} · ${ev.totalTime}ms</div>`;
      currentAnswerEl.insertAdjacentHTML('beforeend', tk);
      currentRunStats = {
        iterations: ev.iterations,
        totalTime: ev.totalTime,
        tokenUsage: ev.tokenUsage || null,
        tokensPerSecond: ev.tokensPerSecond || null,
      };
      // Archive button
      const archiveBtn = document.createElement('button');
      archiveBtn.className = 'btn-archive';
      archiveBtn.textContent = '📋 归档本次对话';
      archiveBtn.onclick = () => archiveCurrentRun(archiveBtn);
      currentAnswerEl.appendChild(archiveBtn);
      currentAnswerEl = null;
      runStatus.textContent = '就绪';
      cancelBtn.classList.add('hidden');
      break;
    }
    case 'error':
      pushEvent(`错误: ${escapeHtml(ev.error)}`, 'evt-error');
      runStatus.textContent = '错误';
      cancelBtn.classList.add('hidden');
      break;
  }
}

queryForm.onsubmit = (e) => {
  e.preventDefault();
  const q = queryInput.value.trim();
  if (!q) return;
  currentRunEvents = [];
  currentRunQuery = q;
  currentRunStats = null;
  pushEvent(`<div class="text-xs text-slate-400 mb-1">你</div>${escapeHtml(q)}`, 'evt-user');
  queryInput.value = '';
  runStatus.innerHTML = '<span class="spin"></span> 启动…';
  cancelBtn.classList.remove('hidden');
  const sock = ensureWs();
  const send = () => sock.send(JSON.stringify({ type: 'run', query: q }));
  if (sock.readyState === WebSocket.OPEN) send();
  else sock.addEventListener('open', send, { once: true });
};

cancelBtn.onclick = () => {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'cancel' }));
  runStatus.textContent = '已取消';
  cancelBtn.classList.add('hidden');
};

// Skill quick-action chips: click → fill input with template, ticker placeholder selected
document.querySelectorAll('#skill-chips .skill-chip').forEach((c) => {
  c.onclick = () => {
    queryInput.value = c.dataset.template;
    queryInput.focus();
    const start = parseInt(c.dataset.selStart, 10);
    const end = parseInt(c.dataset.selEnd, 10);
    queryInput.setSelectionRange(start, end);
  };
});

// ---------------------------------------------------------------------------
// Dashboard / charts
// ---------------------------------------------------------------------------
let priceChart = null;
let volumeChart = null;

async function loadTicker() {
  const ticker = $('#ticker-input').value.trim().toUpperCase();
  const days = $('#range-select').value;
  if (!ticker) return;
  $('#price-status').textContent = '加载中…';

  const [pricesRes, snapRes, metricsRes] = await Promise.allSettled([
    fetch(`/api/finance/prices?ticker=${ticker}&days=${days}`).then((r) => r.json()),
    fetch(`/api/finance/snapshot?ticker=${ticker}`).then((r) => r.json()),
    fetch(`/api/finance/metrics?ticker=${ticker}`).then((r) => r.json()),
  ]);

  // Snapshot cards
  if (snapRes.status === 'fulfilled' && snapRes.value.snapshot) {
    const s = snapRes.value.snapshot;
    $('#snap-price').textContent = fmtNumber(s.price);
    const change = s.day_change ?? s.change ?? 0;
    const changePct = s.day_change_percent ?? s.change_percent ?? 0;
    $('#snap-change').innerHTML = `<span style="color:${change >= 0 ? '#5eead4' : '#f87171'}">${change >= 0 ? '+' : ''}${fmtNumber(change)} (${(changePct * 100).toFixed(2)}%)</span>`;
    $('#snap-high').textContent = fmtNumber(s.day_high ?? s.high);
    $('#snap-low').textContent = fmtNumber(s.day_low ?? s.low);
  }

  // Prices chart
  if (pricesRes.status === 'fulfilled' && Array.isArray(pricesRes.value.prices) && pricesRes.value.prices.length) {
    const prices = pricesRes.value.prices;
    const labels = prices.map((p) => p.time?.slice(0, 10) || p.date || '');
    const closes = prices.map((p) => p.close);
    const volumes = prices.map((p) => p.volume);
    drawPriceChart(labels, closes, ticker);
    drawVolumeChart(labels, volumes);
    $('#price-status').textContent = `${prices.length} 个数据点`;
  } else {
    $('#price-status').textContent = pricesRes.value?.error ?? '无数据（请先在设置中配置 FINANCIAL_DATASETS_API_KEY）';
  }

  // Metrics
  if (metricsRes.status === 'fulfilled' && metricsRes.value.metrics) {
    renderMetrics(metricsRes.value.metrics);
  } else {
    $('#metrics-grid').innerHTML = '<div class="text-slate-400 col-span-full">无关键比率数据</div>';
  }
}

function drawPriceChart(labels, closes, ticker) {
  const ctx = document.getElementById('price-chart').getContext('2d');
  if (priceChart) priceChart.destroy();
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: `${ticker} 收盘价`,
          data: closes,
          borderColor: '#5eead4',
          backgroundColor: 'rgba(94,234,212,0.15)',
          fill: true,
          tension: 0.25,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: chartOptions(),
  });
}

function drawVolumeChart(labels, volumes) {
  const ctx = document.getElementById('volume-chart').getContext('2d');
  if (volumeChart) volumeChart.destroy();
  volumeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: '成交量', data: volumes, backgroundColor: 'rgba(251,191,36,0.55)' }],
    },
    options: chartOptions(),
  });
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#cbd5e1', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#64748b', maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };
}

function renderMetrics(metrics) {
  const m = Array.isArray(metrics) ? metrics[0] : metrics;
  if (!m || typeof m !== 'object') {
    $('#metrics-grid').innerHTML = '<div class="text-slate-400 col-span-full">无数据</div>';
    return;
  }
  const labelMap = {
    market_cap: '市值',
    pe_ratio: 'P/E',
    price_to_sales_ratio: 'P/S',
    price_to_book_ratio: 'P/B',
    enterprise_value: '企业价值',
    ev_to_ebitda_ratio: 'EV/EBITDA',
    return_on_equity: 'ROE',
    return_on_assets: 'ROA',
    gross_margin: '毛利率',
    operating_margin: '运营利润率',
    net_margin: '净利率',
    debt_to_equity: 'D/E',
    current_ratio: '流动比率',
    dividend_yield: '股息率',
  };
  const cards = Object.entries(labelMap)
    .filter(([k]) => m[k] != null)
    .map(([k, lbl]) => {
      const v = m[k];
      const isPct = /margin|return|yield/.test(k);
      const display = isPct ? `${(v * 100).toFixed(2)}%` : fmtNumber(v, 3);
      return `<div class="card"><div class="label">${lbl}</div><div class="value">${display}</div></div>`;
    })
    .join('');
  $('#metrics-grid').innerHTML = cards || '<div class="text-slate-400 col-span-full">该 ticker 暂无可展示指标</div>';
}

$('#ticker-form').onsubmit = (e) => {
  e.preventDefault();
  loadTicker();
};

// ---------------------------------------------------------------------------
// Tools view
// ---------------------------------------------------------------------------
let toolsLoaded = false;
async function loadTools() {
  if (toolsLoaded) return;
  toolsLoaded = true;
  const res = await fetch('/api/tools').then((r) => r.json());
  $('#tools-list').innerHTML =
    res.tools
      .map(
        (t) => `
        <div class="bg-ink-900 border border-ink-800 rounded-lg p-3">
          <div class="font-mono text-accent-400 text-sm mb-1">${escapeHtml(t.name)}</div>
          <div class="text-xs text-slate-400">${escapeHtml(t.description)}</div>
        </div>`
      )
      .join('') || '<div class="text-slate-500 text-sm">无可用工具</div>';
  $('#skills-list').innerHTML =
    res.skills
      .map(
        (s) => `
        <div class="bg-ink-900 border border-ink-800 rounded-lg p-3">
          <div class="font-mono text-gold-400 text-sm mb-1">${escapeHtml(s.name)}</div>
          <div class="text-xs text-slate-400">${escapeHtml(s.description)}</div>
        </div>`
      )
      .join('') || '<div class="text-slate-500 text-sm">未发现 SKILL.md</div>';
}

// ---------------------------------------------------------------------------
// Archive
// ---------------------------------------------------------------------------
async function archiveCurrentRun(btn) {
  btn.disabled = true;
  btn.textContent = '归档中…';
  try {
    const answerEl = document.querySelector('.evt-answer .answer-body');
    const answer = answerEl ? answerEl.innerHTML : '';
    const res = await fetch('/api/archives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: currentRunQuery,
        events: currentRunEvents,
        answer: answer,
        stats: currentRunStats,
      }),
    });
    if (res.ok) {
      btn.textContent = '✓ 已归档';
      btn.classList.add('archived');
    } else {
      btn.textContent = '归档失败，重试';
      btn.disabled = false;
    }
  } catch {
    btn.textContent = '归档失败，重试';
    btn.disabled = false;
  }
}

async function loadArchives() {
  const list = $('#archive-list');
  list.innerHTML = '<div class="text-slate-500 text-sm">加载中…</div>';
  try {
    const res = await fetch('/api/archives');
    const data = await res.json();
    renderArchiveList(data.archives || []);
  } catch {
    $('#archive-list').innerHTML = '<div class="text-slate-500 text-sm">加载失败</div>';
  }
}

function renderArchiveList(archives) {
  const list = $('#archive-list');
  if (!archives.length) {
    list.innerHTML = '<div class="text-slate-500 text-sm">暂无归档记录。完成研究后点击「归档本次对话」按钮即可保存。</div>';
    return;
  }
  list.innerHTML = archives
    .map(
      (a) => `
      <div class="archive-card" data-id="${a.id}">
        <div class="flex justify-between items-start gap-3">
          <div class="flex-1 min-w-0">
            <div class="archive-query">${escapeHtml(a.query)}</div>
            <div class="archive-summary">${escapeHtml(a.summary)}</div>
            <div class="text-xs text-slate-500 mt-1">
              ${new Date(a.timestamp).toLocaleString('zh-CN')} · ${a.eventCount} 个事件
            </div>
          </div>
          <div class="flex gap-1 shrink-0">
            <button class="btn-secondary archive-view-btn" data-id="${a.id}">查看</button>
            <button class="btn-secondary archive-delete-btn" data-id="${a.id}">删除</button>
          </div>
        </div>
      </div>`
    )
    .join('');

  list.querySelectorAll('.archive-view-btn').forEach((btn) => {
    btn.onclick = () => viewArchiveDetail(btn.dataset.id);
  });
  list.querySelectorAll('.archive-delete-btn').forEach((btn) => {
    btn.onclick = () => deleteArchiveById(btn.dataset.id);
  });
  // Click card to view
  list.querySelectorAll('.archive-card').forEach((card) => {
    card.onclick = (e) => {
      if (e.target.tagName === 'BUTTON') return;
      viewArchiveDetail(card.dataset.id);
    };
  });
}

async function viewArchiveDetail(id) {
  try {
    const res = await fetch(`/api/archives/${id}`);
    const data = await res.json();
    if (!data.archive) return;
    renderArchiveDetail(data.archive);
  } catch {
    // ignore
  }
}

function renderArchiveDetail(archive) {
  $('#archive-list-view').classList.add('hidden');
  const detailView = $('#archive-detail-view');
  detailView.classList.remove('hidden');

  const statsHtml = archive.stats
    ? `<div class="text-xs text-slate-500 mt-2">
        迭代 ${archive.stats.iterations} · ${archive.stats.totalTime}ms
        ${archive.stats.tokenUsage ? ` · ${archive.stats.tokenUsage.totalTokens} tokens` : ''}
       </div>`
    : '';

  let eventsHtml = archive.events
    .map((ev) => {
      switch (ev.type) {
        case 'thinking':
          return `<div class="evt evt-thinking">💭 ${escapeHtml(ev.message)}</div>`;
        case 'tool_start':
          return `<div class="evt evt-tool">
            <div class="tool-head"><span class="tool-name">▶ ${escapeHtml(ev.tool)}</span></div>
            <div class="tool-args">${escapeHtml(JSON.stringify(ev.args, null, 2))}</div>
          </div>`;
        case 'tool_end': {
          const resultText = typeof ev.result === 'string' ? ev.result : JSON.stringify(ev.result);
          const preview = resultText.length > 4000 ? resultText.slice(0, 4000) + '\n…(已截断)' : resultText;
          return `<div class="evt evt-tool">
            <div class="tool-head"><span class="tool-name">✓ ${escapeHtml(ev.tool)}</span></div>
            <div class="tool-result">${escapeHtml(preview)}</div>
            <div class="text-xs text-slate-500 mt-1">完成 · ${ev.duration}ms</div>
          </div>`;
        }
        case 'tool_error':
          return `<div class="evt evt-error">❌ ${escapeHtml(ev.tool)}: ${escapeHtml(ev.error)}</div>`;
        case 'context_cleared':
          return `<div class="evt evt-thinking">🧹 上下文压缩：清理了 ${ev.clearedCount} 个旧工具结果，保留最新 ${ev.keptCount} 个</div>`;
        case 'tool_progress':
          return `<div class="evt evt-thinking">↻ ${escapeHtml(ev.tool)}: ${escapeHtml(ev.message)}</div>`;
        default:
          return '';
      }
    })
    .join('');

  const answerHtml = archive.answer
    ? `<div class="evt evt-answer"><div class="font-semibold text-accent-400 text-xs mb-2">📋 最终回答</div><div class="answer-body">${marked.parse(archive.answer)}</div></div>`
    : '';

  $('#archive-detail-content').innerHTML = `
    <div class="mb-4">
      <h2 class="text-base font-semibold">${escapeHtml(archive.query)}</h2>
      <div class="text-xs text-slate-400 mt-1">${new Date(archive.timestamp).toLocaleString('zh-CN')} · ${archive.eventCount} 个事件</div>
      ${statsHtml}
    </div>
    <div class="space-y-2">${eventsHtml}</div>
    ${answerHtml}
  `;
}

async function deleteArchiveById(id) {
  if (!confirm('确定删除该归档记录？')) return;
  try {
    await fetch(`/api/archives/${id}`, { method: 'DELETE' });
    loadArchives();
  } catch {
    // ignore
  }
}

$('#archive-back-btn').onclick = () => {
  $('#archive-detail-view').classList.add('hidden');
  $('#archive-list-view').classList.remove('hidden');
};

$('#refresh-archives-btn').onclick = loadArchives;

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
loadConfig().catch((e) => {
  pushEvent(`配置加载失败: ${escapeHtml(e.message)}`, 'evt-error');
});
