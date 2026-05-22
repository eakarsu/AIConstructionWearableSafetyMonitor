const router = require('express').Router();
const auth = require('../middleware/auth');

let rows = [
  { id: 1, drill_id: 'EVAC-2026-05-A', zone: 'North Deck', assembly_point: 'Gate 3', workers_expected: 47, workers_confirmed: 44, missing_workers: 3, status: 'reconcile', response_time_min: 8 },
  { id: 2, drill_id: 'EVAC-2026-05-B', zone: 'South Yard', assembly_point: 'Lot B', workers_expected: 32, workers_confirmed: 32, missing_workers: 0, status: 'complete', response_time_min: 6 },
];
const nextId = () => rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

router.use(auth);
router.get('/', (req, res) => res.json(rows));
router.post('/', (req, res) => {
  const row = { id: nextId(), ...req.body };
  rows.unshift(row);
  res.status(201).json(row);
});
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = rows.findIndex((row) => row.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  rows[idx] = { ...rows[idx], ...req.body, id };
  res.json(rows[idx]);
});
router.delete('/:id', (req, res) => {
  rows = rows.filter((row) => row.id !== Number(req.params.id));
  res.json({ message: 'deleted' });
});

module.exports = router;
