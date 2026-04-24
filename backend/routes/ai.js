const router = require('express').Router();
const auth = require('../middleware/auth');
const axios = require('axios');

const callOpenRouter = async (systemPrompt, userMessage) => {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: process.env.OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data.choices[0].message.content;
};

// Safety Analysis
router.post('/safety-analysis', auth, async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await callOpenRouter(
      'You are an expert AI construction safety analyst. You monitor wearable sensor data, environmental conditions, and site hazards to provide comprehensive safety assessments. Analyze the provided data and give a detailed safety report with risk scores, immediate concerns, and actionable recommendations. Format your response with clear sections: Overall Safety Score, Critical Concerns, Risk Areas, and Recommended Actions.',
      `Perform a comprehensive safety analysis for this construction site data:\n${JSON.stringify(data || 'Provide a general construction site safety analysis covering common hazards, wearable monitoring best practices, and safety protocol recommendations.')}`
    );
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Risk Prediction
router.post('/risk-prediction', auth, async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await callOpenRouter(
      'You are an AI risk prediction specialist for construction sites. You use historical data, current conditions, and predictive modeling to forecast potential safety risks. Provide probability-based risk predictions with timelines, contributing factors, and preventive measures. Format response with: Risk Predictions (ranked by probability), Contributing Factors, Timeline, and Preventive Measures.',
      `Predict potential safety risks based on this construction site data:\n${JSON.stringify(data || 'Provide general risk predictions for a large commercial construction site with 150 workers, heavy equipment operations, and steel structure work at height.')}`
    );
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Incident Analysis
router.post('/incident-analysis', auth, async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await callOpenRouter(
      'You are an AI incident analysis specialist for construction safety. You perform root cause analysis, identify patterns in incident data, and provide evidence-based recommendations to prevent recurrence. Format response with: Incident Pattern Analysis, Root Causes, Contributing Factors, Corrective Actions, and Prevention Strategy.',
      `Analyze these construction site incident patterns:\n${JSON.stringify(data || 'Analyze common construction incident patterns including falls from height, struck-by incidents, caught-in/between hazards, and electrical incidents. Provide trend analysis and prevention strategies.')}`
    );
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Equipment Health
router.post('/equipment-health', auth, async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await callOpenRouter(
      'You are an AI equipment health specialist for construction sites. You analyze equipment sensor data, maintenance records, and usage patterns to assess equipment condition and predict failures. Format response with: Equipment Health Summary, Critical Equipment Alerts, Maintenance Priorities, Predicted Failures, and Cost Optimization Recommendations.',
      `Assess construction equipment health based on this data:\n${JSON.stringify(data || 'Provide a comprehensive equipment health assessment for a construction fleet including cranes, excavators, concrete pumps, and scaffolding systems. Include maintenance scheduling recommendations.')}`
    );
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Worker Wellness
router.post('/worker-wellness', auth, async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await callOpenRouter(
      'You are an AI worker wellness specialist for construction sites. You analyze wearable sensor data including heart rate, body temperature, fatigue levels, and stress indicators to assess worker health and safety. Format response with: Wellness Overview, At-Risk Workers, Fatigue Analysis, Health Recommendations, and Shift Optimization Suggestions.',
      `Analyze worker wellness data from wearable sensors:\n${JSON.stringify(data || 'Provide a comprehensive worker wellness analysis for construction workers wearing safety monitoring devices. Cover heart rate monitoring, body temperature tracking, fatigue detection, and hydration status.')}`
    );
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Environmental Risk
router.post('/environmental-risk', auth, async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await callOpenRouter(
      'You are an AI environmental risk specialist for construction sites. You analyze weather conditions, air quality, noise levels, and environmental hazards to ensure worker safety and regulatory compliance. Format response with: Environmental Risk Score, Weather Hazards, Air Quality Assessment, Noise Exposure Risks, and Work Modification Recommendations.',
      `Assess environmental risks at this construction site:\n${JSON.stringify(data || 'Provide an environmental risk assessment for an outdoor construction site considering temperature extremes, wind conditions, air quality from demolition dust, and noise from pile driving operations.')}`
    );
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compliance Report
router.post('/compliance-report', auth, async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await callOpenRouter(
      'You are an AI compliance specialist for construction safety. You assess OSHA compliance, PPE usage, training certifications, and safety protocol adherence. Generate detailed compliance reports with violation tracking and corrective action plans. Format response with: Compliance Score, OSHA Violations, PPE Compliance, Training Gaps, and Corrective Action Plan.',
      `Generate a safety compliance report based on this data:\n${JSON.stringify(data || 'Generate a comprehensive OSHA compliance report for a commercial construction project. Cover fall protection, scaffolding safety, electrical safety, PPE compliance, and hazard communication standards.')}`
    );
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Emergency Plan
router.post('/emergency-plan', auth, async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await callOpenRouter(
      'You are an AI emergency response planning specialist for construction sites. You develop emergency action plans, evacuation procedures, and response protocols for various emergency scenarios. Format response with: Emergency Scenarios, Response Protocols, Evacuation Procedures, Communication Plan, Resource Requirements, and Drill Schedule.',
      `Generate an emergency response plan for this construction site:\n${JSON.stringify(data || 'Create a comprehensive emergency response plan for a multi-story building construction site with 200 workers. Include plans for structural collapse, fire, severe weather, medical emergencies, and hazardous material spills.')}`
    );
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Training Recommendations
router.post('/training-recommend', auth, async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await callOpenRouter(
      'You are an AI training and development specialist for construction safety. You analyze worker skill gaps, incident trends, and compliance requirements to recommend targeted training programs. Format response with: Training Needs Assessment, Priority Courses, Certification Renewals, Skill Gap Analysis, and Training Schedule.',
      `Recommend training programs based on this workforce data:\n${JSON.stringify(data || 'Recommend a comprehensive safety training program for construction workers covering OSHA 30-hour, fall protection, confined space entry, scaffolding competency, crane operation, and first aid/CPR certifications.')}`
    );
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Predictive Alerts
router.post('/predictive-alert', auth, async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await callOpenRouter(
      'You are an AI predictive alert specialist for construction safety. You analyze trends in sensor data, environmental conditions, and worker behavior to predict upcoming safety events before they occur. Format response with: Predicted Alerts (next 24-72 hours), Probability Assessment, Contributing Factors, Preventive Actions, and Monitoring Recommendations.',
      `Generate predictive safety alerts based on this data:\n${JSON.stringify(data || 'Generate predictive safety alerts for a construction site based on trending sensor data showing increasing fatigue levels, rising temperatures, equipment vibration anomalies, and approaching severe weather.')}`
    );
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// General AI Chat
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const analysis = await callOpenRouter(
      'You are an expert AI assistant for construction site safety management. You have deep knowledge of OSHA regulations, wearable safety technology, hazard detection, environmental monitoring, PPE compliance, equipment maintenance, and emergency response planning. Provide helpful, accurate, and actionable responses to questions about construction safety. Always prioritize worker safety in your recommendations.',
      message
    );
    res.json({ response: analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
