/**
 * Alert Service - Email (nodemailer) and SMS (Twilio) notifications
 * Both channels fail gracefully if env vars are not configured.
 */

let transporter = null;
let twilioClient = null;

// Initialize nodemailer if SMTP is configured
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('[AlertService] SMTP transporter initialized');
  } catch (err) {
    console.warn('[AlertService] nodemailer init failed:', err.message);
  }
} else {
  console.log('[AlertService] SMTP not configured — email alerts disabled');
}

// Initialize Twilio if credentials are configured
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('[AlertService] Twilio client initialized');
  } catch (err) {
    console.warn('[AlertService] Twilio init failed:', err.message);
  }
} else {
  console.log('[AlertService] Twilio not configured — SMS alerts disabled');
}

/**
 * Send an email alert. Silently skips if SMTP not configured.
 */
async function sendEmail(to, subject, text) {
  if (!transporter) return;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  try {
    await transporter.sendMail({ from, to, subject, text });
    console.log(`[AlertService] Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error('[AlertService] Email send failed:', err.message);
  }
}

/**
 * Send an SMS alert. Silently skips if Twilio not configured.
 */
async function sendSMS(to, body) {
  if (!twilioClient) return;
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_FROM_NUMBER,
      to,
      body
    });
    console.log(`[AlertService] SMS sent to ${to}`);
  } catch (err) {
    console.error('[AlertService] SMS send failed:', err.message);
  }
}

/**
 * sendSafetyAlert - triggered for individual worker events
 * @param {string|number} worker_id
 * @param {string} alert_type  e.g. 'heat_stress', 'fall_detected', 'ppe_violation'
 * @param {string} message
 */
async function sendSafetyAlert(worker_id, alert_type, message) {
  const subject = `[SAFETY ALERT] ${alert_type.toUpperCase()} — Worker #${worker_id}`;
  const body = `Safety Alert\nType: ${alert_type}\nWorker ID: ${worker_id}\nDetails: ${message}\nTime: ${new Date().toISOString()}`;

  const recipients = (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').map(e => e.trim()).filter(Boolean);
  const smsRecipients = (process.env.ALERT_SMS_RECIPIENTS || '').split(',').map(n => n.trim()).filter(Boolean);

  await Promise.all([
    ...recipients.map(email => sendEmail(email, subject, body)),
    ...smsRecipients.map(phone => sendSMS(phone, `${subject}\n${message}`))
  ]);
}

/**
 * sendEmergencyAlert - triggered for site-wide emergencies
 * @param {string|number} site_id
 * @param {object} incident_details  { title, type, severity, location, description }
 */
async function sendEmergencyAlert(site_id, incident_details) {
  const subject = `[EMERGENCY] Critical Incident at Site #${site_id} — ${incident_details.title || incident_details.type}`;
  const body = [
    '*** EMERGENCY ALERT ***',
    `Site ID: ${site_id}`,
    `Incident: ${incident_details.title || 'N/A'}`,
    `Type: ${incident_details.type || 'N/A'}`,
    `Severity: ${incident_details.severity || 'N/A'}`,
    `Location: ${incident_details.location || 'N/A'}`,
    `Description: ${incident_details.description || 'N/A'}`,
    `Time: ${new Date().toISOString()}`,
    '',
    'Immediate action required. Review dashboard for full details.'
  ].join('\n');

  const smsBody = `EMERGENCY at Site #${site_id}: ${incident_details.title || incident_details.type} (${incident_details.severity}). Immediate action required.`;

  const recipients = (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').map(e => e.trim()).filter(Boolean);
  const smsRecipients = (process.env.ALERT_SMS_RECIPIENTS || '').split(',').map(n => n.trim()).filter(Boolean);

  await Promise.all([
    ...recipients.map(email => sendEmail(email, subject, body)),
    ...smsRecipients.map(phone => sendSMS(phone, smsBody))
  ]);
}

module.exports = { sendSafetyAlert, sendEmergencyAlert };
