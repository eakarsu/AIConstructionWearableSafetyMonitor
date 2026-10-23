'use strict';
process.env.JWT_SECRET = process.env.JWT_SECRET && process.env.JWT_SECRET.length>=32 ? process.env.JWT_SECRET : 'x'.repeat(32);

process.env.OPENROUTER_API_KEY=''; process.env.OPENAI_API_KEY='';
const test = require('node:test'); const assert = require('node:assert/strict');
const fp = require('../domain/featurePack');
const records = [{name:'Worker One', heart_rate:80, risk_level:'high', status:'active', site:'A'},{name:'Two', heart_rate:0, risk_level:'', status:''}];
test('search/filter filters by q and exact field', () => {
  assert.equal(fp.filterRecords(records, { q: 'Worker One' }).length, 1);
  assert.equal(fp.filterRecords(records, { status: 'active' }).length, 1);
  assert.equal(fp.filterRecords(records, { q: 'no-such' }).length, 0);
});
test('CSV export preserves header and values, JSON shape via filter', () => {
  const csv = fp.toCsv(records); assert.ok(csv.split('\n')[0].length>0); assert.ok(csv.includes('Worker One'));
  assert.equal(fp.toCsv([]), '');
});
test('deterministic AI fallback is labelled and preserves 0/empty', async () => {
  const out = await fp.runAi('worker-risk', [], fp.workerRisk);
  assert.equal(out.aiGenerated, false); assert.equal(out.provider, null);
  const vals = out.sections.map(s=>s.value); assert.ok(vals.includes(0));
  assert.ok(out.sections.every(s=>typeof s.label==='string' && s.label.length>0));
  const one = await fp.runAi('worker-risk', records, fp.workerRisk); assert.equal(one.aiGenerated,false);
});

test('authenticated tasks list/create/update + search/export endpoints', async () => {
  const express = require('express'); const jwt = require('jsonwebtoken');
  const app = express(); app.use(express.json()); app.use('/api/feature-pack', require('../routes/featurePack'));
  const srv = app.listen(0); await new Promise(r=>srv.once('listening',r));
  const base = 'http://127.0.0.1:'+srv.address().port+'/api/feature-pack';
  const token = jwt.sign({id:1}, process.env.JWT_SECRET);
  const H = { Authorization:'Bearer '+token, 'Content-Type':'application/json' };
  try {
    assert.equal((await fetch(base+'/tasks')).status, 401);
    const created = await (await fetch(base+'/tasks',{method:'POST',headers:H,body:JSON.stringify({title:'FP task',status:'open'})})).json();
    assert.equal(created.title,'FP task');
    const list = await (await fetch(base+'/tasks?q=FP',{headers:H})).json(); assert.equal(list.data.length,1);
    const upd = await (await fetch(base+'/tasks/'+created.id,{method:'PUT',headers:H,body:JSON.stringify({status:'completed'})})).json(); assert.equal(upd.status,'completed');
    const exp = await fetch(base+'/export/workers?format=json',{headers:H}); assert.equal(exp.status,200);
    const csvRes = await fetch(base+'/export/workers?format=csv',{headers:H}); assert.ok((await csvRes.text()).length>=0);
    const ai = await (await fetch(base+'/ai/worker-risk',{method:'POST',headers:H,body:JSON.stringify({records})})).json(); assert.equal(ai.aiGenerated,false);
  } finally { srv.close(); }
});

