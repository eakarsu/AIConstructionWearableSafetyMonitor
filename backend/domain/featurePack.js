'use strict';
// Feature-pack domain helpers (wave 31B): deterministic, dependency-free.
function filterRecords(records, query = {}) {
  const list = Array.isArray(records) ? records : [];
  const q = String(query.q || query.search || '').trim().toLowerCase();
  const reserved = new Set(['q','search','format','page','limit']);
  const filters = Object.entries(query).filter(([k,v]) => !reserved.has(k) && v !== undefined && v !== '');
  return list.filter((r) => {
    if (q) {
      const hay = Object.values(r || {}).filter(v => v !== null && typeof v !== 'object').join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return filters.every(([k,v]) => String((r||{})[k] ?? '').toLowerCase() === String(v).toLowerCase());
  });
}
function toCsv(records) {
  const list = Array.isArray(records) ? records : [];
  if (!list.length) return '';
  const cols = [...new Set(list.flatMap(r => Object.keys(r || {})))];
  const esc = (v) => { if (v === null || v === undefined) return ''; const s = typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; };
  return [cols.join(','), ...list.map(r => cols.map(c => esc((r||{})[c])).join(','))].join('\n') + '\n';
}
function breakdown(records, field) {
  const out = {};
  for (const r of (records||[])) { const k = String((r||{})[field] ?? ''); out[k] = (out[k]||0)+1; }
  return out;
}
function sumField(records, field) { return (records||[]).reduce((a,r)=> a + (Number((r||{})[field])||0), 0); }
function sections(pairs) { return pairs.map(([label, value]) => ({ label, value })); }

function workerRisk(records) {
  const hrs=(records||[]).map(r=>Number(r.heart_rate)).filter(Number.isFinite);
  return { summary:'Deterministic worker risk summary.', sections: sections([['Record count',records.length],['Average heart rate',hrs.length?hrs.reduce((a,b)=>a+b,0)/hrs.length:0],['Risk breakdown',breakdown(records,'risk_level')],['Status breakdown',breakdown(records,'status')]]) };
}
function fatigueRisk(records) {
  const high=(records||[]).filter(r=>['high','critical'].includes(String(r.risk_level||'').toLowerCase())).length;
  return { summary:'Deterministic fatigue / high-risk summary.', sections: sections([['Record count',records.length],['High-risk workers',high],['Risk breakdown',breakdown(records,'risk_level')]]) };
}
function siteSafety(records) {
  return { summary:'Deterministic site safety summary.', sections: sections([['Record count',records.length],['Site breakdown',breakdown(records,'site')],['Status breakdown',breakdown(records,'status')]]) };
}

async function runAi(feature, records, builder) {
  const list = Array.isArray(records) ? records : [];
  const built = builder(list);
  const key = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) return { aiGenerated: false, provider: null, feature, ...built };
  try {
    const base = process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
    const model = process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || 'anthropic/claude-haiku-4.5';
    const ctrl = new AbortController(); const t = setTimeout(()=>ctrl.abort(), 8000);
    const resp = await fetch(base + '/chat/completions', { method:'POST', signal: ctrl.signal,
      headers:{ Authorization:'Bearer '+key, 'Content-Type':'application/json' },
      body: JSON.stringify({ model, messages:[{role:'user', content: 'Summarize these records for '+feature+': '+JSON.stringify(list).slice(0,4000)}] }) });
    clearTimeout(t);
    if (!resp.ok) throw new Error('provider '+resp.status);
    const data = await resp.json();
    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) throw new Error('empty provider response');
    return { aiGenerated: true, provider: process.env.OPENROUTER_API_KEY ? 'openrouter' : 'openai', feature, text, ...built };
  } catch (_) { return { aiGenerated: false, provider: null, feature, ...built }; }
}
module.exports = { filterRecords, toCsv, breakdown, runAi, workerRisk, fatigueRisk, siteSafety };
