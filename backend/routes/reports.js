const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');

/**
 * GET /api/reports/safety-scorecard
 * Returns weekly safety score broken down by site.
 */
router.get('/safety-scorecard', auth, async (req, res) => {
  try {
    const { weeks_back = 4 } = req.query;
    const weeksNum = Math.min(parseInt(weeks_back) || 4, 52);

    // Aggregate incidents and hazards per site over the time window
    const incidentStats = await pool.query(`
      SELECT
        location AS site,
        COUNT(*) AS total_incidents,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) AS critical_incidents,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) AS high_incidents,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) AS medium_incidents,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) AS low_incidents
      FROM incidents
      WHERE created_at >= NOW() - INTERVAL '${weeksNum} weeks'
      GROUP BY location
      ORDER BY total_incidents DESC
    `);

    const hazardStats = await pool.query(`
      SELECT
        location AS site,
        COUNT(*) AS total_hazards,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) AS resolved_hazards
      FROM hazards
      WHERE created_at >= NOW() - INTERVAL '${weeksNum} weeks'
      GROUP BY location
    `);

    // Build score per site (100 - deductions)
    const hazardMap = {};
    hazardStats.rows.forEach(h => {
      hazardMap[h.site] = h;
    });

    const scorecards = incidentStats.rows.map(row => {
      const hazardData = hazardMap[row.site] || { total_hazards: 0, resolved_hazards: 0 };
      const hazardResolutionRate = hazardData.total_hazards > 0
        ? (hazardData.resolved_hazards / hazardData.total_hazards) * 100
        : 100;

      // Scoring: start at 100, deduct per incident severity
      let score = 100;
      score -= (row.critical_incidents * 15);
      score -= (row.high_incidents * 8);
      score -= (row.medium_incidents * 3);
      score -= (row.low_incidents * 1);
      // Bonus for hazard resolution
      score += (hazardResolutionRate - 50) * 0.1;
      score = Math.max(0, Math.min(100, Math.round(score)));

      return {
        site: row.site,
        safety_score: score,
        grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
        incidents: {
          total: parseInt(row.total_incidents),
          critical: parseInt(row.critical_incidents),
          high: parseInt(row.high_incidents),
          medium: parseInt(row.medium_incidents),
          low: parseInt(row.low_incidents)
        },
        hazards: {
          total: parseInt(hazardData.total_hazards),
          resolved: parseInt(hazardData.resolved_hazards),
          resolution_rate: Math.round(hazardResolutionRate)
        }
      };
    });

    res.json({
      period_weeks: weeksNum,
      period_start: new Date(Date.now() - weeksNum * 7 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date().toISOString(),
      scorecards,
      overall_average_score: scorecards.length > 0
        ? Math.round(scorecards.reduce((sum, s) => sum + s.safety_score, 0) / scorecards.length)
        : 100
    });
  } catch (err) {
    console.error('safety-scorecard error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reports/incident-analysis
 * Root cause analysis and OSHA recordable rate.
 */
router.get('/incident-analysis', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days) || 30, 365);

    const [typeStats, severityStats, statusStats, totalWorkers] = await Promise.all([
      pool.query(`
        SELECT type, COUNT(*) AS count
        FROM incidents
        WHERE created_at >= NOW() - INTERVAL '${daysNum} days'
        GROUP BY type ORDER BY count DESC
      `),
      pool.query(`
        SELECT severity, COUNT(*) AS count
        FROM incidents
        WHERE created_at >= NOW() - INTERVAL '${daysNum} days'
        GROUP BY severity ORDER BY count DESC
      `),
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM incidents
        WHERE created_at >= NOW() - INTERVAL '${daysNum} days'
        GROUP BY status
      `),
      pool.query('SELECT COUNT(*) AS count FROM workers')
    ]);

    const totalIncidents = typeStats.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
    const workerCount = parseInt(totalWorkers.rows[0]?.count) || 1;

    // OSHA recordable rate = (recordable incidents / total hours worked) * 200,000
    // Estimate: 8 hours/day * daysNum days * workerCount workers
    const totalHoursWorked = 8 * daysNum * workerCount;
    const recordableIncidents = severityStats.rows
      .filter(r => r.severity === 'high' || r.severity === 'critical')
      .reduce((sum, r) => sum + parseInt(r.count), 0);
    const oshaRecordableRate = totalHoursWorked > 0
      ? ((recordableIncidents / totalHoursWorked) * 200000).toFixed(2)
      : 0;

    res.json({
      period_days: daysNum,
      total_incidents: totalIncidents,
      osha_recordable_rate: parseFloat(oshaRecordableRate),
      osha_recordable_incidents: recordableIncidents,
      estimated_total_hours_worked: totalHoursWorked,
      root_causes_by_type: typeStats.rows.map(r => ({
        type: r.type,
        count: parseInt(r.count),
        percentage: totalIncidents > 0 ? Math.round((r.count / totalIncidents) * 100) : 0
      })),
      severity_breakdown: severityStats.rows.map(r => ({
        severity: r.severity,
        count: parseInt(r.count)
      })),
      status_breakdown: statusStats.rows.map(r => ({
        status: r.status,
        count: parseInt(r.count)
      }))
    });
  } catch (err) {
    console.error('incident-analysis error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/export/safety-report
 * PDF export of the safety report using pdfkit.
 */
router.get('/export/safety-report', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days) || 30, 365);

    // Fetch data
    const [incidents, hazards, workers] = await Promise.all([
      pool.query(`SELECT * FROM incidents WHERE created_at >= NOW() - INTERVAL '${daysNum} days' ORDER BY created_at DESC LIMIT 50`),
      pool.query(`SELECT * FROM hazards WHERE created_at >= NOW() - INTERVAL '${daysNum} days' ORDER BY created_at DESC LIMIT 50`),
      pool.query('SELECT COUNT(*) AS count FROM workers')
    ]);

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="safety-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('Construction Safety Report', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text(`Period: Last ${daysNum} days`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(16).font('Helvetica-Bold').text('Executive Summary');
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica');
    doc.text(`Total Incidents: ${incidents.rows.length}`);
    doc.text(`Total Hazards: ${hazards.rows.length}`);
    doc.text(`Active Workers: ${workers.rows[0]?.count || 0}`);

    const criticalIncidents = incidents.rows.filter(i => i.severity === 'critical').length;
    const highIncidents = incidents.rows.filter(i => i.severity === 'high').length;
    doc.text(`Critical Incidents: ${criticalIncidents}`);
    doc.text(`High Severity Incidents: ${highIncidents}`);
    doc.moveDown(1.5);

    // Incidents section
    doc.fontSize(16).font('Helvetica-Bold').text('Recent Incidents');
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    if (incidents.rows.length === 0) {
      doc.text('No incidents recorded in this period.');
    } else {
      incidents.rows.slice(0, 20).forEach((inc, idx) => {
        if (doc.y > 700) doc.addPage();
        doc.font('Helvetica-Bold').text(`${idx + 1}. ${inc.title || 'Incident'}`, { continued: false });
        doc.font('Helvetica').text(
          `  Type: ${inc.type || 'N/A'} | Severity: ${inc.severity || 'N/A'} | Location: ${inc.location || 'N/A'} | Status: ${inc.status || 'N/A'}`
        );
        if (inc.description) {
          doc.text(`  ${inc.description.substring(0, 150)}${inc.description.length > 150 ? '...' : ''}`);
        }
        doc.moveDown(0.3);
      });
    }
    doc.moveDown(1);

    // Hazards section
    if (doc.y > 650) doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('Recent Hazards');
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    if (hazards.rows.length === 0) {
      doc.text('No hazards recorded in this period.');
    } else {
      hazards.rows.slice(0, 20).forEach((haz, idx) => {
        if (doc.y > 700) doc.addPage();
        doc.font('Helvetica-Bold').text(`${idx + 1}. ${haz.type || 'Hazard'}`);
        doc.font('Helvetica').text(
          `  Severity: ${haz.severity || 'N/A'} | Location: ${haz.location || 'N/A'} | Zone: ${haz.zone || 'N/A'} | Status: ${haz.status || 'N/A'}`
        );
        doc.moveDown(0.3);
      });
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).fillColor('gray').text(
      'This report is auto-generated by the AI Construction Wearable Safety Monitor system.',
      { align: 'center' }
    );

    doc.end();
  } catch (err) {
    console.error('export safety-report error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
