'use strict';
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const fp = require('../domain/featurePack');
const router = express.Router();
const tasks = new Map(); let seq = 1;
async function ownRecords(req) {
  if (Array.isArray(req.body && req.body.records)) return req.body.records;
  try { const r = await pool.query('SELECT * FROM workers ORDER BY id DESC LIMIT 200'); return r.rows || []; } catch (_) { return []; }
}

router.get('/tasks', auth, (req,res)=> res.json({ data: fp.filterRecords([...tasks.values()], req.query) }));
router.post('/tasks', auth, (req,res)=>{ const title=String((req.body||{}).title||'').trim(); if(!title) return res.status(400).json({error:'title is required'}); const t={id:seq++, title, status:(req.body.status||'open'), priority:(req.body.priority||'medium'), description:(req.body.description??''), owner:(req.body.owner??req.user?.id??null), created_at:new Date().toISOString(), updated_at:new Date().toISOString()}; tasks.set(t.id,t); return res.status(201).json(t); });
router.put('/tasks/:id', auth, (req,res)=>{ const t=tasks.get(Number(req.params.id)); if(!t) return res.status(404).json({error:'Task not found'}); for(const k of ['title','status','priority','description','owner','due_date']) if(req.body[k]!==undefined) t[k]=req.body[k]; t.updated_at=new Date().toISOString(); return res.json(t); });
router.patch('/tasks/:id', auth, (req,res)=>{ const t=tasks.get(Number(req.params.id)); if(!t) return res.status(404).json({error:'Task not found'}); for(const k of ['title','status','priority','description','owner','due_date']) if(req.body[k]!==undefined) t[k]=req.body[k]; t.updated_at=new Date().toISOString(); return res.json(t); });

router.get('/workers/search', auth, async (req, res) => { const rows = await ownRecords(req); res.json({ data: fp.filterRecords(rows, req.query), total: fp.filterRecords(rows, req.query).length }); });
router.get('/export/workers', auth, async (req, res) => {
  const rows = fp.filterRecords(await ownRecords(req), req.query);
  if (String(req.query.format||'csv').toLowerCase() === 'json') return res.json({ data: rows });
  res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition','attachment; filename="workers.csv"');
  return res.send(fp.toCsv(rows) || 'id\n');
});
router.post('/ai/worker-risk', auth, async (req,res)=> res.json(await fp.runAi('worker-risk', await ownRecords(req), fp.workerRisk)));
router.post('/ai/fatigue-risk', auth, async (req,res)=> res.json(await fp.runAi('fatigue-risk', await ownRecords(req), fp.fatigueRisk)));
router.post('/ai/site-safety', auth, async (req,res)=> res.json(await fp.runAi('site-safety', await ownRecords(req), fp.siteSafety)));
module.exports = router;
