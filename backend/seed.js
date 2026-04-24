require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('./db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    console.log('Creating tables...');

    await pool.query(`
      DROP TABLE IF EXISTS users, workers, hazards, incidents, equipment, environmental,
        fatigue, ppe, falls, heatstress, noise, airquality, proximity, training, emergency, maintenance CASCADE;

      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE workers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        site VARCHAR(255),
        heart_rate INTEGER,
        body_temp DECIMAL(5,2),
        oxygen_level DECIMAL(5,2),
        location VARCHAR(255),
        status VARCHAR(50),
        risk_level VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE hazards (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100),
        severity VARCHAR(50),
        location VARCHAR(255),
        zone VARCHAR(100),
        description TEXT,
        detected_by VARCHAR(100),
        status VARCHAR(50),
        ai_recommendation TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE incidents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        type VARCHAR(100),
        severity VARCHAR(50),
        location VARCHAR(255),
        worker_name VARCHAR(255),
        description TEXT,
        injuries VARCHAR(255),
        status VARCHAR(50),
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE equipment (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR(100),
        serial_number VARCHAR(100),
        location VARCHAR(255),
        last_inspection DATE,
        next_inspection DATE,
        condition VARCHAR(50),
        inspector VARCHAR(255),
        status VARCHAR(50),
        ai_assessment TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE environmental (
        id SERIAL PRIMARY KEY,
        zone VARCHAR(100),
        temperature DECIMAL(5,2),
        humidity DECIMAL(5,2),
        wind_speed DECIMAL(5,2),
        visibility DECIMAL(5,2),
        uv_index DECIMAL(4,2),
        weather VARCHAR(100),
        status VARCHAR(50),
        ai_recommendation TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE fatigue (
        id SERIAL PRIMARY KEY,
        worker_name VARCHAR(255),
        role VARCHAR(100),
        shift_start TIMESTAMP,
        hours_worked DECIMAL(4,2),
        fatigue_score INTEGER,
        heart_rate_variability DECIMAL(6,2),
        reaction_time DECIMAL(6,2),
        status VARCHAR(50),
        ai_recommendation TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE ppe (
        id SERIAL PRIMARY KEY,
        worker_name VARCHAR(255),
        role VARCHAR(100),
        zone VARCHAR(100),
        helmet BOOLEAN DEFAULT true,
        vest BOOLEAN DEFAULT true,
        gloves BOOLEAN DEFAULT true,
        boots BOOLEAN DEFAULT true,
        goggles BOOLEAN DEFAULT false,
        harness BOOLEAN DEFAULT false,
        compliance_score INTEGER,
        status VARCHAR(50),
        ai_note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE falls (
        id SERIAL PRIMARY KEY,
        worker_name VARCHAR(255),
        location VARCHAR(255),
        zone VARCHAR(100),
        fall_height DECIMAL(6,2),
        impact_force DECIMAL(6,2),
        sensor_triggered VARCHAR(100),
        response_time DECIMAL(6,2),
        status VARCHAR(50),
        severity VARCHAR(50),
        ai_assessment TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE heatstress (
        id SERIAL PRIMARY KEY,
        worker_name VARCHAR(255),
        zone VARCHAR(100),
        body_temp DECIMAL(5,2),
        ambient_temp DECIMAL(5,2),
        humidity DECIMAL(5,2),
        wbgt_index DECIMAL(5,2),
        hydration_level DECIMAL(5,2),
        work_rest_ratio VARCHAR(20),
        status VARCHAR(50),
        ai_recommendation TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE noise (
        id SERIAL PRIMARY KEY,
        zone VARCHAR(100),
        location VARCHAR(255),
        decibel_level DECIMAL(5,2),
        peak_level DECIMAL(5,2),
        duration_hours DECIMAL(4,2),
        exposure_limit DECIMAL(5,2),
        hearing_protection VARCHAR(100),
        workers_affected INTEGER,
        status VARCHAR(50),
        ai_recommendation TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE airquality (
        id SERIAL PRIMARY KEY,
        zone VARCHAR(100),
        location VARCHAR(255),
        pm25 DECIMAL(6,2),
        pm10 DECIMAL(6,2),
        co_level DECIMAL(6,2),
        no2_level DECIMAL(6,2),
        o3_level DECIMAL(6,2),
        voc_level DECIMAL(6,2),
        aqi_index INTEGER,
        status VARCHAR(50),
        ai_recommendation TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE proximity (
        id SERIAL PRIMARY KEY,
        worker_name VARCHAR(255),
        zone VARCHAR(100),
        equipment_nearby VARCHAR(255),
        distance DECIMAL(6,2),
        alert_type VARCHAR(100),
        speed DECIMAL(5,2),
        status VARCHAR(50),
        severity VARCHAR(50),
        ai_recommendation TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE training (
        id SERIAL PRIMARY KEY,
        worker_name VARCHAR(255),
        role VARCHAR(100),
        certification VARCHAR(255),
        training_type VARCHAR(100),
        completion_date DATE,
        expiry_date DATE,
        score INTEGER,
        status VARCHAR(50),
        ai_recommendation TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE emergency (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100),
        zone VARCHAR(100),
        severity VARCHAR(50),
        trigger VARCHAR(255),
        responders_needed INTEGER,
        evacuation_route VARCHAR(255),
        assembly_point VARCHAR(255),
        status VARCHAR(50),
        response_time DECIMAL(6,2),
        ai_protocol TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE maintenance (
        id SERIAL PRIMARY KEY,
        equipment_name VARCHAR(255),
        type VARCHAR(100),
        location VARCHAR(255),
        health_score INTEGER,
        vibration_level DECIMAL(6,2),
        temperature DECIMAL(6,2),
        usage_hours INTEGER,
        predicted_failure VARCHAR(255),
        status VARCHAR(50),
        ai_recommendation TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tables created. Seeding data...');

    // Demo user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Demo User', 'demo@safety.com', hashedPassword, 'admin']
    );

    // Workers (15)
    await pool.query(`
      INSERT INTO workers (name, role, site, heart_rate, body_temp, oxygen_level, location, status, risk_level) VALUES
      ('Carlos Martinez', 'Ironworker', 'Downtown Tower Project', 82, 98.6, 97.5, 'Floor 12 - Steel Framework', 'active', 'low'),
      ('James Wilson', 'Crane Operator', 'Harbor Bridge Construction', 75, 98.4, 98.0, 'Crane Tower A', 'active', 'medium'),
      ('Ahmed Hassan', 'Electrician', 'Metro Station Build', 88, 99.1, 96.8, 'Basement Level 2', 'alert', 'high'),
      ('Mike Thompson', 'Scaffolder', 'Riverside Apartments', 95, 99.5, 95.2, 'North Face Scaffolding', 'warning', 'critical'),
      ('David Chen', 'Concrete Finisher', 'Highway Overpass Project', 72, 98.3, 98.5, 'Section C Pour Area', 'active', 'low'),
      ('Robert Johnson', 'Site Supervisor', 'Downtown Tower Project', 70, 98.2, 98.8, 'Ground Level Office', 'active', 'low'),
      ('Juan Rodriguez', 'Heavy Equipment Operator', 'Industrial Park Phase 3', 78, 98.7, 97.2, 'Excavation Zone B', 'active', 'medium'),
      ('Patrick OBrien', 'Plumber', 'Riverside Apartments', 85, 98.9, 96.5, 'Floor 5 - Mechanical Room', 'active', 'low'),
      ('Yusuf Ali', 'Welder', 'Harbor Bridge Construction', 92, 99.3, 95.8, 'Pier 4 Welding Station', 'alert', 'high'),
      ('Tommy Lee', 'Carpenter', 'School Renovation Project', 68, 98.1, 99.0, 'Building A - Room 201', 'active', 'low'),
      ('Steve Garcia', 'Roofer', 'Shopping Mall Extension', 110, 100.2, 94.5, 'Roof Section D', 'emergency', 'critical'),
      ('Frank Miller', 'Painter', 'Office Complex Phase 2', 74, 98.5, 97.8, 'Floor 8 - Interior', 'active', 'low'),
      ('Kevin Brown', 'Mason', 'Highway Overpass Project', 80, 98.8, 97.0, 'Retaining Wall Section', 'active', 'medium'),
      ('Daniel Kim', 'HVAC Technician', 'Hospital Wing Addition', 76, 98.4, 98.2, 'Rooftop Unit Area', 'active', 'low'),
      ('Marcus White', 'Demolition Worker', 'Old Factory Teardown', 105, 99.8, 95.0, 'Building C - 3rd Floor', 'warning', 'high')
    `);

    // Hazards (15)
    await pool.query(`
      INSERT INTO hazards (type, severity, location, zone, description, detected_by, status, ai_recommendation) VALUES
      ('Fall Hazard', 'critical', 'Floor 12 Edge - Downtown Tower', 'Zone A', 'Unprotected leading edge detected on floor 12 during steel erection. Guard rails missing on south side.', 'AI Camera System', 'active', 'Immediately install temporary guard rails. Stop work at the edge until fall protection is in place.'),
      ('Electrical Hazard', 'high', 'Basement Level 2 - Metro Station', 'Zone C', 'Exposed live wiring detected near water accumulation area. Risk of electrocution.', 'Wearable Sensor', 'active', 'De-energize circuit immediately. Install GFCI protection and waterproof conduit.'),
      ('Struck-By Hazard', 'high', 'Crane Swing Radius - Harbor Bridge', 'Zone B', 'Workers observed in crane swing radius without spotter. Load overhead.', 'AI Camera System', 'investigating', 'Establish exclusion zone with barricades. Assign dedicated spotter for all lifts.'),
      ('Trench Collapse', 'critical', 'Excavation Zone B - Industrial Park', 'Zone D', 'Trench wall showing signs of instability. No shoring installed at 6ft depth.', 'Site Inspector', 'active', 'Evacuate trench immediately. Install trench box or slope walls to safe angle.'),
      ('Chemical Exposure', 'medium', 'Paint Storage Area - Office Complex', 'Zone E', 'VOC levels elevated near paint mixing station. Inadequate ventilation detected.', 'Air Quality Sensor', 'mitigated', 'Increase ventilation. Ensure workers wear appropriate respirators. Move mixing outdoors.'),
      ('Fire Hazard', 'high', 'Welding Station Pier 4 - Harbor Bridge', 'Zone B', 'Hot work near combustible materials. Fire watch not in place.', 'AI Camera System', 'active', 'Assign fire watch. Remove combustibles within 35ft. Have extinguisher on standby.'),
      ('Noise Hazard', 'medium', 'Pile Driving Area - Highway Overpass', 'Zone F', 'Noise levels exceeding 100dB. Workers without hearing protection observed.', 'Noise Sensor', 'active', 'Enforce hearing protection in 50ft radius. Rotate workers to limit exposure time.'),
      ('Confined Space', 'high', 'Utility Tunnel - Metro Station', 'Zone C', 'Workers entering confined space without gas testing or attendant.', 'Wearable Sensor', 'active', 'Stop entry. Perform atmospheric testing. Assign attendant and establish rescue plan.'),
      ('Scaffolding Defect', 'critical', 'North Face - Riverside Apartments', 'Zone G', 'Missing cross braces and damaged planks on scaffolding level 5. Overloaded platform.', 'Site Inspector', 'active', 'Tag out scaffolding. Remove excess materials. Replace damaged components before reuse.'),
      ('Heat Hazard', 'medium', 'Roof Section D - Shopping Mall', 'Zone H', 'Ambient temperature 105°F on roof. Multiple workers showing signs of heat stress.', 'Environmental Sensor', 'active', 'Implement work-rest cycles. Provide shade and hydration stations. Consider early shift.'),
      ('Silica Dust', 'high', 'Cutting Station - Highway Overpass', 'Zone F', 'Crystalline silica dust levels exceed PEL during concrete cutting without wet methods.', 'Air Quality Sensor', 'active', 'Use wet cutting methods. Provide N95 respirators. Install local exhaust ventilation.'),
      ('Trip Hazard', 'low', 'Ground Floor - School Renovation', 'Zone I', 'Extension cords and hoses crossing walkway without covers. Poor housekeeping.', 'AI Camera System', 'mitigated', 'Install cord covers. Reroute hoses overhead. Improve housekeeping schedule.'),
      ('Overhead Hazard', 'high', 'Building C 3rd Floor - Old Factory', 'Zone J', 'Unstable structural elements during demolition. Risk of collapse onto workers below.', 'Structural Sensor', 'active', 'Establish exclusion zone below. Use remote demolition methods. Shore unstable sections.'),
      ('Excavation Hazard', 'medium', 'Foundation Dig - Hospital Wing', 'Zone K', 'Utility lines not properly marked. Risk of striking gas line during excavation.', 'Ground Radar', 'investigating', 'Stop digging. Call 811 for utility locating. Hand dig within 24 inches of markings.'),
      ('Crane Hazard', 'critical', 'Tower Crane - Downtown Tower', 'Zone A', 'Wind speed approaching crane operational limit. Load swinging detected.', 'Wind Sensor', 'active', 'Cease crane operations. Secure load and boom. Resume when wind drops below 25mph.')
    `);

    // Incidents (15)
    await pool.query(`
      INSERT INTO incidents (title, type, severity, location, worker_name, description, injuries, status, ai_analysis) VALUES
      ('Scaffold Collapse Near Miss', 'near_miss', 'high', 'North Face Level 3 - Riverside Apartments', 'Mike Thompson', 'Scaffold plank broke under load causing partial collapse. Worker was tied off and prevented from falling.', 'None', 'closed', 'Near miss indicates systemic scaffold inspection failure. Recommend daily pre-use inspections and load capacity signage.'),
      ('Electrical Shock Incident', 'injury', 'critical', 'Basement Level 2 - Metro Station', 'Ahmed Hassan', 'Worker received electrical shock from exposed junction box while working in damp conditions.', 'Minor burns to right hand', 'investigating', 'Lockout/tagout procedures not followed. GFCI protection missing. Recommend electrical safety retraining.'),
      ('Heat Exhaustion Case', 'illness', 'high', 'Roof Section D - Shopping Mall', 'Steve Garcia', 'Roofer collapsed due to heat exhaustion after 6 hours of continuous roof work in 105°F heat.', 'Heat exhaustion requiring IV fluids', 'closed', 'Work-rest cycles not implemented despite heat advisory. Mandatory hydration breaks needed.'),
      ('Falling Object Strike', 'injury', 'medium', 'Floor 8 - Downtown Tower', 'Frank Miller', 'Small tool fell from upper floor striking painter on shoulder. Hard hat prevented head injury.', 'Bruised left shoulder', 'closed', 'Tool tethering policy not enforced on upper floors. Install toe boards and tool nets.'),
      ('Trench Wall Slump', 'near_miss', 'critical', 'Excavation Zone B - Industrial Park', 'Juan Rodriguez', 'Trench wall partially collapsed while operator was in excavator nearby. No one in trench at time.', 'None', 'investigating', 'Trench shoring was inadequate for soil type. Geotechnical assessment needed before resuming.'),
      ('Chemical Splash', 'injury', 'medium', 'Paint Storage - Office Complex', 'Frank Miller', 'Paint thinner splashed into worker eyes during mixing. Emergency eyewash used immediately.', 'Chemical irritation both eyes', 'closed', 'Safety goggles not worn during chemical handling. Improve PPE enforcement and chemical handling training.'),
      ('Crane Load Drop', 'near_miss', 'critical', 'Pier 4 - Harbor Bridge', 'James Wilson', 'Crane rigging failed causing 500lb steel beam to drop 15 feet. Area was cleared by spotter.', 'None', 'investigating', 'Rigging inspection found frayed sling. Implement daily rigging inspection protocol.'),
      ('Slip on Wet Surface', 'injury', 'low', 'Ground Floor - School Renovation', 'Tommy Lee', 'Carpenter slipped on wet floor from overnight rain entering through unsealed opening.', 'Sprained right ankle', 'closed', 'Weather protection for openings needed. Non-slip walkway mats recommended for wet areas.'),
      ('Welding Flash Burn', 'injury', 'medium', 'Pier 4 Welding Station - Harbor Bridge', 'Yusuf Ali', 'Nearby worker received flash burn to forearms from welding arc. Welding screens not properly positioned.', 'Flash burns to forearms', 'closed', 'Welding screens must fully enclose arc. Enforce long sleeve requirements in welding zones.'),
      ('Dust Inhalation', 'illness', 'medium', 'Cutting Station - Highway Overpass', 'Kevin Brown', 'Worker reported breathing difficulties after prolonged concrete cutting without proper respiratory protection.', 'Respiratory irritation', 'investigating', 'Silica exposure monitoring needed. Mandatory respirator use for all cutting operations.'),
      ('Vehicle Backing Incident', 'near_miss', 'high', 'Loading Area - Industrial Park', 'Juan Rodriguez', 'Dump truck nearly struck worker while backing. Spotter was not in position.', 'None', 'closed', 'Mandatory spotter policy for all backing operations. Install backup cameras and alarms.'),
      ('Ladder Fall', 'injury', 'high', 'Building A Room 201 - School Renovation', 'Tommy Lee', 'Worker fell 8 feet from extension ladder that was not properly secured at top.', 'Fractured left wrist', 'closed', 'Ladder safety training overdue. Require ladder tie-off at top and three-point contact.'),
      ('Overhead Power Line Contact', 'near_miss', 'critical', 'Highway Overpass Section A', 'David Chen', 'Concrete pump boom came within 5 feet of overhead power line during setup.', 'None', 'investigating', 'Establish minimum clearance zones. Install warning flags on power lines. Use spotter for boom operations.'),
      ('Noise Exposure Complaint', 'illness', 'low', 'Pile Driving Area - Highway Overpass', 'Kevin Brown', 'Multiple workers reporting tinnitus after shift near pile driving operations.', 'Temporary tinnitus in 3 workers', 'active', 'Noise monitoring shows levels above OSHA PEL. Rotate workers and enforce hearing protection.'),
      ('Confined Space Rescue', 'injury', 'critical', 'Utility Tunnel - Metro Station', 'Patrick OBrien', 'Worker became dizzy in confined space due to low oxygen. Rescue team extracted worker within 4 minutes.', 'Mild hypoxia treated with oxygen', 'closed', 'Continuous atmospheric monitoring required. Never enter without confirmed safe atmosphere.')
    `);

    // Equipment (15)
    await pool.query(`
      INSERT INTO equipment (name, type, serial_number, location, last_inspection, next_inspection, condition, inspector, status, ai_assessment) VALUES
      ('Tower Crane TC-200', 'Crane', 'TC-2024-0451', 'Downtown Tower Project', '2026-03-15', '2026-04-15', 'good', 'John Roberts', 'operational', 'Crane within service parameters. Monitor wire rope wear at sheave points.'),
      ('CAT 330 Excavator', 'Excavator', 'EX-2023-1287', 'Industrial Park Phase 3', '2026-03-20', '2026-04-20', 'fair', 'Mike Stevens', 'operational', 'Hydraulic system showing minor leaks. Schedule seal replacement within 2 weeks.'),
      ('Liebherr Mobile Crane', 'Crane', 'MC-2024-0892', 'Harbor Bridge Construction', '2026-03-10', '2026-04-10', 'good', 'John Roberts', 'operational', 'Load moment indicator calibrated. Outrigger pads need replacement.'),
      ('Scaffolding System A', 'Scaffolding', 'SC-2023-0334', 'Riverside Apartments', '2026-03-01', '2026-03-08', 'poor', 'Sarah Mitchell', 'out_of_service', 'Multiple damaged components found. Full scaffold rebuild required before reuse.'),
      ('Concrete Pump CP-50', 'Concrete Pump', 'CP-2023-0567', 'Highway Overpass Project', '2026-03-25', '2026-04-25', 'good', 'Mike Stevens', 'operational', 'Boom sections operating smoothly. Pipeline wear within acceptable limits.'),
      ('Welding Machine WM-300', 'Welder', 'WM-2024-0123', 'Harbor Bridge Construction', '2026-03-18', '2026-04-18', 'good', 'Tom Bradley', 'operational', 'Electrode holders in good condition. Ground clamp cable showing minor wear.'),
      ('Aerial Lift JLG 600S', 'Aerial Lift', 'AL-2023-0789', 'Office Complex Phase 2', '2026-03-12', '2026-04-12', 'fair', 'Sarah Mitchell', 'operational', 'Platform leveling system needs adjustment. Hydraulic fluid due for change.'),
      ('Compactor Plate CP-90', 'Compactor', 'CM-2024-0456', 'Highway Overpass Project', '2026-03-22', '2026-04-22', 'good', 'Tom Bradley', 'operational', 'Vibration dampeners effective. Engine running within normal parameters.'),
      ('Generator Set 100KW', 'Generator', 'GN-2023-0234', 'Metro Station Build', '2026-03-05', '2026-04-05', 'fair', 'Mike Stevens', 'operational', 'Fuel consumption slightly elevated. Air filter replacement recommended.'),
      ('Forklift CAT DP-25', 'Forklift', 'FL-2024-0678', 'Shopping Mall Extension', '2026-03-28', '2026-04-28', 'good', 'John Roberts', 'operational', 'Mast chains properly tensioned. Tire condition good with 60% tread remaining.'),
      ('Bobcat S650 Skid Steer', 'Skid Steer', 'SS-2023-0901', 'School Renovation Project', '2026-03-14', '2026-04-14', 'good', 'Sarah Mitchell', 'operational', 'All attachments secure. Bucket cutting edge showing normal wear.'),
      ('Dump Truck Kenworth', 'Truck', 'DT-2023-0345', 'Industrial Park Phase 3', '2026-03-08', '2026-04-08', 'fair', 'Tom Bradley', 'operational', 'Brake pads at 40% life remaining. Schedule replacement within 30 days.'),
      ('Pile Driver APE D30-42', 'Pile Driver', 'PD-2024-0567', 'Highway Overpass Project', '2026-03-19', '2026-04-19', 'good', 'John Roberts', 'operational', 'Ram assembly in good condition. Helmet and cushion blocks recently replaced.'),
      ('Circular Saw DeWalt', 'Power Tool', 'PT-2024-0890', 'School Renovation Project', '2026-03-30', '2026-04-30', 'good', 'Tom Bradley', 'operational', 'Blade guard functioning properly. Blade recently replaced. Cord in good condition.'),
      ('Backhoe JCB 3CX', 'Backhoe', 'BH-2023-0123', 'Hospital Wing Addition', '2026-03-02', '2026-04-02', 'poor', 'Mike Stevens', 'needs_repair', 'Boom cylinder seal leaking. Stabilizer leg showing excessive wear. Immediate repair needed.')
    `);

    // Environmental (15)
    await pool.query(`
      INSERT INTO environmental (zone, temperature, humidity, wind_speed, visibility, uv_index, weather, status, ai_recommendation) VALUES
      ('Zone A - Downtown Tower', 88.5, 65.0, 22.5, 8.0, 7.5, 'Partly Cloudy', 'warning', 'Wind speed approaching crane limit. Monitor closely. Implement heat stress protocols.'),
      ('Zone B - Harbor Bridge', 82.0, 70.0, 15.0, 10.0, 6.0, 'Sunny', 'normal', 'Conditions favorable for work. Standard UV protection recommended.'),
      ('Zone C - Metro Station', 72.0, 55.0, 5.0, 15.0, 2.0, 'Overcast', 'normal', 'Underground work area conditions stable. Monitor ventilation quality.'),
      ('Zone D - Industrial Park', 95.0, 75.0, 8.0, 6.0, 9.0, 'Hot and Humid', 'alert', 'WBGT index elevated. Mandatory 15-min rest per hour. Increase water availability.'),
      ('Zone E - Office Complex', 78.0, 50.0, 12.0, 12.0, 5.0, 'Clear', 'normal', 'Good working conditions. Standard safety protocols apply.'),
      ('Zone F - Highway Overpass', 91.0, 60.0, 18.0, 7.0, 8.5, 'Sunny and Hot', 'warning', 'High UV and temperature. Implement shade structures and hydration breaks.'),
      ('Zone G - Riverside Apartments', 85.0, 68.0, 20.0, 9.0, 6.5, 'Breezy', 'warning', 'Wind gusts affecting scaffolding stability. Secure loose materials and tools.'),
      ('Zone H - Shopping Mall', 102.0, 45.0, 6.0, 10.0, 10.0, 'Extreme Heat', 'critical', 'Extreme heat warning. Limit roof exposure to 30-min intervals. Mandatory cooling breaks.'),
      ('Zone I - School Renovation', 76.0, 52.0, 10.0, 14.0, 4.0, 'Mild', 'normal', 'Favorable conditions for all operations. No weather restrictions.'),
      ('Zone J - Old Factory', 80.0, 58.0, 14.0, 11.0, 5.5, 'Partly Cloudy', 'normal', 'Monitor dust dispersion with current wind direction. Adjust demolition schedule if needed.'),
      ('Zone K - Hospital Wing', 84.0, 62.0, 9.0, 13.0, 6.0, 'Fair', 'normal', 'Standard conditions. Ensure noise barriers for adjacent hospital operations.'),
      ('Zone A - Downtown Tower', 70.0, 80.0, 28.0, 4.0, 1.0, 'Approaching Storm', 'critical', 'Severe weather approaching. Cease crane operations. Secure materials. Prepare for evacuation.'),
      ('Zone F - Highway Overpass', 45.0, 90.0, 35.0, 2.0, 0.5, 'Thunderstorm', 'critical', 'Active thunderstorm. All outdoor work suspended. Workers to shelter immediately.'),
      ('Zone D - Industrial Park', 68.0, 85.0, 5.0, 3.0, 1.5, 'Foggy', 'warning', 'Low visibility affecting equipment operations. Use spotters. Reduce vehicle speeds.'),
      ('Zone B - Harbor Bridge', 55.0, 72.0, 42.0, 6.0, 2.0, 'High Wind', 'critical', 'Wind exceeds safe limits for work at height. Suspend all elevated operations.')
    `);

    // Fatigue (15)
    await pool.query(`
      INSERT INTO fatigue (worker_name, role, shift_start, hours_worked, fatigue_score, heart_rate_variability, reaction_time, status, ai_recommendation) VALUES
      ('Carlos Martinez', 'Ironworker', '2026-04-10 06:00:00', 8.5, 35, 45.2, 280, 'normal', 'Worker within acceptable fatigue range. Continue monitoring.'),
      ('James Wilson', 'Crane Operator', '2026-04-10 05:30:00', 10.0, 62, 32.1, 350, 'warning', 'Elevated fatigue for crane operator. Schedule mandatory break within 30 minutes.'),
      ('Ahmed Hassan', 'Electrician', '2026-04-10 07:00:00', 7.0, 28, 52.8, 250, 'normal', 'Low fatigue levels. Worker performing well within safety parameters.'),
      ('Mike Thompson', 'Scaffolder', '2026-04-10 06:00:00', 11.5, 78, 25.4, 420, 'critical', 'Critical fatigue level for height work. Remove from elevated tasks immediately. Mandatory 2-hour rest.'),
      ('David Chen', 'Concrete Finisher', '2026-04-10 04:00:00', 12.0, 72, 28.6, 390, 'alert', 'Extended shift with high fatigue. Relieve worker and schedule replacement.'),
      ('Robert Johnson', 'Site Supervisor', '2026-04-10 06:30:00', 9.0, 40, 42.0, 290, 'normal', 'Moderate fatigue acceptable for supervisory role. Stay hydrated.'),
      ('Juan Rodriguez', 'Heavy Equipment Operator', '2026-04-10 05:00:00', 10.5, 58, 34.5, 340, 'warning', 'Approaching fatigue threshold for equipment operation. 15-minute break recommended.'),
      ('Patrick OBrien', 'Plumber', '2026-04-10 07:30:00', 6.5, 22, 55.0, 230, 'normal', 'Low fatigue. Worker alert and responsive. No concerns.'),
      ('Yusuf Ali', 'Welder', '2026-04-10 06:00:00', 9.5, 55, 36.2, 330, 'warning', 'Moderate fatigue affecting precision work. Break recommended before next weld task.'),
      ('Tommy Lee', 'Carpenter', '2026-04-10 07:00:00', 7.5, 30, 48.0, 260, 'normal', 'Normal fatigue levels. Continue standard work schedule.'),
      ('Steve Garcia', 'Roofer', '2026-04-10 05:00:00', 11.0, 85, 22.0, 450, 'critical', 'Dangerous fatigue level combined with heat exposure. Remove from roof immediately.'),
      ('Frank Miller', 'Painter', '2026-04-10 08:00:00', 5.0, 18, 58.5, 220, 'normal', 'Very low fatigue. Worker fresh and performing optimally.'),
      ('Kevin Brown', 'Mason', '2026-04-10 06:00:00', 9.0, 48, 38.5, 310, 'normal', 'Approaching upper range of normal. Schedule break within 1 hour.'),
      ('Daniel Kim', 'HVAC Technician', '2026-04-10 07:00:00', 8.0, 38, 44.0, 275, 'normal', 'Fatigue within acceptable range for technical work. Monitor trend.'),
      ('Marcus White', 'Demolition Worker', '2026-04-10 06:00:00', 10.0, 68, 30.0, 370, 'alert', 'High fatigue for physically demanding demolition work. Rotate to lighter duties.')
    `);

    // PPE (15)
    await pool.query(`
      INSERT INTO ppe (worker_name, role, zone, helmet, vest, gloves, boots, goggles, harness, compliance_score, status, ai_note) VALUES
      ('Carlos Martinez', 'Ironworker', 'Zone A', true, true, true, true, false, true, 100, 'compliant', 'Full PPE compliance including fall harness for elevated work.'),
      ('James Wilson', 'Crane Operator', 'Zone B', true, true, false, true, false, false, 80, 'partial', 'Missing gloves. Recommend cut-resistant gloves for rigging operations.'),
      ('Ahmed Hassan', 'Electrician', 'Zone C', true, true, true, true, true, false, 100, 'compliant', 'Full electrical PPE including insulated gloves and safety goggles.'),
      ('Mike Thompson', 'Scaffolder', 'Zone G', true, true, true, true, false, false, 67, 'non_compliant', 'Missing harness for work above 6 feet. Missing goggles. Critical violation.'),
      ('David Chen', 'Concrete Finisher', 'Zone F', true, true, true, true, true, false, 100, 'compliant', 'Wearing goggles for concrete splash protection. Good compliance.'),
      ('Robert Johnson', 'Site Supervisor', 'Zone A', true, true, false, true, false, false, 80, 'partial', 'Supervisor should set example. Add gloves when in active work zones.'),
      ('Juan Rodriguez', 'Heavy Equipment Operator', 'Zone D', true, true, false, true, false, false, 80, 'partial', 'Gloves recommended for mounting/dismounting equipment.'),
      ('Patrick OBrien', 'Plumber', 'Zone G', true, true, true, true, true, false, 100, 'compliant', 'Full PPE for plumbing work including splash goggles.'),
      ('Yusuf Ali', 'Welder', 'Zone B', true, true, true, true, true, false, 100, 'compliant', 'Full welding PPE including welding goggles and heat-resistant gloves.'),
      ('Tommy Lee', 'Carpenter', 'Zone I', true, true, false, true, true, false, 83, 'partial', 'Missing gloves during saw operation. Cut-resistant gloves required.'),
      ('Steve Garcia', 'Roofer', 'Zone H', false, true, false, true, false, false, 33, 'non_compliant', 'Missing helmet, gloves, and harness on roof. Multiple critical violations.'),
      ('Frank Miller', 'Painter', 'Zone E', true, true, true, true, true, false, 100, 'compliant', 'Wearing respirator and goggles for paint application. Excellent compliance.'),
      ('Kevin Brown', 'Mason', 'Zone F', true, true, true, true, false, false, 83, 'partial', 'Missing goggles during cutting. Silica exposure risk without eye protection.'),
      ('Daniel Kim', 'HVAC Technician', 'Zone K', true, true, true, true, true, false, 100, 'compliant', 'Full PPE compliance for mechanical work. Good example.'),
      ('Marcus White', 'Demolition Worker', 'Zone J', true, true, true, true, true, true, 100, 'compliant', 'Full demolition PPE including harness and impact goggles.')
    `);

    // Falls (15)
    await pool.query(`
      INSERT INTO falls (worker_name, location, zone, fall_height, impact_force, sensor_triggered, response_time, status, severity, ai_assessment) VALUES
      ('Mike Thompson', 'Scaffolding Level 5 - Riverside', 'Zone G', 3.5, 2.8, 'Accelerometer + Gyroscope', 45, 'responded', 'medium', 'Partial fall arrested by scaffold mid-rail. Worker caught self. Check harness anchor points.'),
      ('Steve Garcia', 'Roof Edge Section D - Shopping Mall', 'Zone H', 0, 0, 'Proximity Edge Sensor', 0, 'prevented', 'low', 'Worker approached unprotected edge. Alert triggered before fall. Install guard rails.'),
      ('Carlos Martinez', 'Steel Beam Floor 12 - Downtown Tower', 'Zone A', 1.5, 1.2, 'Accelerometer', 30, 'responded', 'low', 'Worker slipped on beam. Harness arrested fall within 2 feet. No injury reported.'),
      ('Tommy Lee', 'Extension Ladder - School Renovation', 'Zone I', 8.0, 5.5, 'Accelerometer + Impact', 120, 'responded', 'high', 'Full ladder fall. Worker struck ground. Ladder was not secured at top. Emergency medical response needed.'),
      ('Yusuf Ali', 'Pier 4 Access Platform - Harbor Bridge', 'Zone B', 0, 0, 'Tilt Sensor', 0, 'prevented', 'low', 'Platform tilt detected. Workers alerted before instability worsened. Platform stabilized.'),
      ('Frank Miller', 'Aerial Lift - Office Complex', 'Zone E', 2.0, 1.8, 'Accelerometer', 60, 'responded', 'medium', 'Worker leaned out of lift basket. Partial fall caught by lift rail. Retrain on safe practices.'),
      ('Kevin Brown', 'Retaining Wall Forms - Highway', 'Zone F', 4.0, 3.2, 'Accelerometer + Gyroscope', 55, 'responded', 'medium', 'Worker fell from formwork. Landed on soil embankment. Minor injuries. Add fall protection to forms.'),
      ('Marcus White', 'Demolition Floor 3 - Old Factory', 'Zone J', 6.0, 4.5, 'Accelerometer + Impact', 90, 'responded', 'high', 'Floor gave way during demolition. Worker fell through to floor below. Structural assessment needed.'),
      ('Patrick OBrien', 'Mechanical Room Floor 5 - Riverside', 'Zone G', 0, 0, 'Slip Sensor', 0, 'prevented', 'low', 'Wet floor slip detected by motion pattern. Worker recovered balance. Clean and dry area.'),
      ('Daniel Kim', 'Rooftop Unit Area - Hospital Wing', 'Zone K', 1.0, 0.8, 'Accelerometer', 40, 'responded', 'low', 'Worker tripped on conduit run on roof. Minor stumble. Improve cable management on roof.'),
      ('James Wilson', 'Crane Access Ladder - Harbor Bridge', 'Zone B', 0, 0, 'Fatigue + Grip Sensor', 0, 'prevented', 'medium', 'Grip strength decline detected during ladder climb. Worker alerted to rest. Fatigue protocol activated.'),
      ('Juan Rodriguez', 'Excavator Steps - Industrial Park', 'Zone D', 3.0, 2.5, 'Accelerometer', 35, 'responded', 'medium', 'Worker slipped dismounting excavator. Three-point contact not maintained. Add non-slip steps.'),
      ('David Chen', 'Pour Area Formwork - Highway', 'Zone F', 5.0, 3.8, 'Accelerometer + Impact', 75, 'responded', 'high', 'Worker fell from elevated formwork. No harness worn. Fractured ankle. Enforce tie-off policy.'),
      ('Ahmed Hassan', 'Cable Tray Basement - Metro Station', 'Zone C', 2.5, 2.0, 'Accelerometer', 50, 'responded', 'medium', 'Worker fell from step ladder in confined area. Bruised knee. Use proper ladder for height.'),
      ('Robert Johnson', 'Site Office Steps - Downtown Tower', 'Zone A', 1.0, 0.5, 'Accelerometer', 25, 'responded', 'low', 'Supervisor slipped on wet steps entering site office. Handrail prevented full fall. Add non-slip treads.')
    `);

    // Heat Stress (15)
    await pool.query(`
      INSERT INTO heatstress (worker_name, zone, body_temp, ambient_temp, humidity, wbgt_index, hydration_level, work_rest_ratio, status, ai_recommendation) VALUES
      ('Steve Garcia', 'Zone H - Shopping Mall Roof', 101.2, 105.0, 45.0, 92.5, 35.0, '25:35', 'critical', 'Remove from work immediately. Core temperature dangerously elevated. Provide active cooling and fluids.'),
      ('Carlos Martinez', 'Zone A - Downtown Tower', 99.2, 88.5, 65.0, 82.0, 60.0, '45:15', 'warning', 'Body temperature rising. Increase rest frequency. Move to shaded area for breaks.'),
      ('Marcus White', 'Zone J - Old Factory', 99.8, 92.0, 58.0, 85.0, 45.0, '30:30', 'alert', 'Elevated body temp with moderate dehydration. Mandatory 30-min cool-down break.'),
      ('Kevin Brown', 'Zone F - Highway Overpass', 99.5, 91.0, 60.0, 84.0, 50.0, '35:25', 'alert', 'Heat strain indicators present. Reduce physical exertion. Increase fluid intake.'),
      ('David Chen', 'Zone F - Highway Overpass', 98.8, 91.0, 60.0, 84.0, 70.0, '45:15', 'normal', 'Within acceptable range but monitor closely given ambient conditions.'),
      ('Yusuf Ali', 'Zone B - Harbor Bridge', 99.0, 82.0, 70.0, 80.0, 55.0, '40:20', 'warning', 'Humidity increasing heat stress risk despite moderate temperature. Extra hydration needed.'),
      ('Juan Rodriguez', 'Zone D - Industrial Park', 100.5, 95.0, 75.0, 90.0, 40.0, '25:35', 'critical', 'WBGT index at dangerous level. Suspend outdoor operations. Emergency cooling protocol.'),
      ('Mike Thompson', 'Zone G - Riverside Apartments', 99.4, 85.0, 68.0, 81.0, 55.0, '40:20', 'warning', 'Scaffolding work in sun increases heat load. Provide shade canopy for rest breaks.'),
      ('Tommy Lee', 'Zone I - School Renovation', 98.4, 76.0, 52.0, 72.0, 80.0, '50:10', 'normal', 'Indoor work with good conditions. No heat stress concerns. Continue monitoring.'),
      ('Patrick OBrien', 'Zone G - Riverside Apartments', 98.6, 85.0, 68.0, 81.0, 75.0, '50:10', 'normal', 'Indoor plumbing work. Heat stress risk low. Standard hydration schedule.'),
      ('Daniel Kim', 'Zone K - Hospital Wing', 98.8, 84.0, 62.0, 78.0, 65.0, '45:15', 'normal', 'Rooftop work with moderate conditions. Pre-hydration protocol working well.'),
      ('Frank Miller', 'Zone E - Office Complex', 98.5, 78.0, 50.0, 73.0, 72.0, '50:10', 'normal', 'Interior painting with ventilation. No heat concerns. Monitor VOC exposure instead.'),
      ('Ahmed Hassan', 'Zone C - Metro Station', 98.3, 72.0, 55.0, 70.0, 78.0, '50:10', 'normal', 'Underground work keeps ambient temp low. Worker well hydrated.'),
      ('James Wilson', 'Zone B - Harbor Bridge', 99.6, 82.0, 70.0, 80.0, 48.0, '35:25', 'alert', 'Crane cab temperature higher than ambient. Install cab cooling. Increase break frequency.'),
      ('Robert Johnson', 'Zone A - Downtown Tower', 98.9, 88.5, 65.0, 82.0, 62.0, '45:15', 'normal', 'Supervisory role with moderate activity. Maintain hydration during site walks.')
    `);

    // Noise (15)
    await pool.query(`
      INSERT INTO noise (zone, location, decibel_level, peak_level, duration_hours, exposure_limit, hearing_protection, workers_affected, status, ai_recommendation) VALUES
      ('Zone F', 'Pile Driving Area - Highway Overpass', 105.0, 118.0, 6.0, 85.0, 'Required - Earmuffs', 12, 'critical', 'Exceeds OSHA PEL significantly. Double hearing protection recommended. Rotate workers every 2 hours.'),
      ('Zone B', 'Steel Cutting Station - Harbor Bridge', 98.0, 110.0, 4.5, 85.0, 'Required - Earplugs', 6, 'warning', 'Above PEL. Ensure all workers wear hearing protection. Consider noise barriers.'),
      ('Zone A', 'Concrete Pour Floor 8 - Downtown Tower', 88.0, 95.0, 8.0, 85.0, 'Required - Earplugs', 8, 'warning', 'Marginal exceedance over 8-hour TWA. Hearing protection mandatory in this area.'),
      ('Zone J', 'Demolition Zone - Old Factory', 102.0, 125.0, 5.0, 85.0, 'Required - Dual Protection', 10, 'critical', 'Extremely high peak levels. Mandatory dual hearing protection. Limit exposure to 2 hours.'),
      ('Zone D', 'Compaction Area - Industrial Park', 92.0, 100.0, 6.0, 85.0, 'Required - Earplugs', 4, 'warning', 'Continuous noise exposure above PEL. Provide rest areas away from noise source.'),
      ('Zone I', 'Carpentry Shop - School Renovation', 90.0, 102.0, 7.0, 85.0, 'Required - Earplugs', 3, 'warning', 'Table saw and router creating sustained noise. Install sound-absorbing panels.'),
      ('Zone K', 'Mechanical Room - Hospital Wing', 85.0, 92.0, 8.0, 85.0, 'Recommended', 2, 'normal', 'At threshold. Hearing protection recommended as precaution. Monitor closely.'),
      ('Zone G', 'Scaffolding Area - Riverside', 78.0, 88.0, 8.0, 85.0, 'Optional', 5, 'normal', 'Below PEL for 8-hour TWA. No mandatory protection needed but recommended.'),
      ('Zone E', 'Interior Finishing - Office Complex', 72.0, 80.0, 8.0, 85.0, 'Not Required', 4, 'normal', 'Well below exposure limits. Normal construction ambient noise levels.'),
      ('Zone C', 'Tunnel Boring - Metro Station', 96.0, 108.0, 6.0, 85.0, 'Required - Earmuffs', 8, 'warning', 'Confined space amplifies noise. Double protection recommended. Limit continuous exposure.'),
      ('Zone H', 'Roof Ventilation Install - Shopping Mall', 82.0, 90.0, 6.0, 85.0, 'Recommended', 3, 'normal', 'Below 8-hour TWA PEL. Occasional peaks require attention. Hearing protection available.'),
      ('Zone F', 'Concrete Cutting - Highway Overpass', 100.0, 112.0, 3.0, 85.0, 'Required - Earmuffs', 5, 'critical', 'High noise from wet cutting. All workers within 25ft must wear hearing protection.'),
      ('Zone A', 'Generator Area - Downtown Tower', 94.0, 98.0, 10.0, 85.0, 'Required - Earplugs', 3, 'warning', 'Continuous generator noise. Relocate generator or install sound enclosure.'),
      ('Zone B', 'Riveting Station - Harbor Bridge', 108.0, 120.0, 4.0, 85.0, 'Required - Dual Protection', 7, 'critical', 'Impact noise extremely high. Maximum 2-hour exposure with dual protection. Rotate workers.'),
      ('Zone D', 'Backhoe Operation - Industrial Park', 86.0, 94.0, 8.0, 85.0, 'Required - Earplugs', 2, 'warning', 'Slightly above PEL for full shift. Operator cab may reduce exposure. Verify cab noise level.')
    `);

    // Air Quality (15)
    await pool.query(`
      INSERT INTO airquality (zone, location, pm25, pm10, co_level, no2_level, o3_level, voc_level, aqi_index, status, ai_recommendation) VALUES
      ('Zone J', 'Demolition Area - Old Factory', 85.5, 150.2, 2.5, 45.0, 30.0, 120.0, 165, 'unhealthy', 'Dust suppression inadequate. Increase water spraying. N95 respirators mandatory for all workers.'),
      ('Zone F', 'Concrete Cutting - Highway Overpass', 65.0, 120.0, 1.8, 30.0, 25.0, 80.0, 135, 'unhealthy_sensitive', 'Silica dust elevated. Use wet cutting only. HEPA vacuum for cleanup. Respiratory protection required.'),
      ('Zone C', 'Tunnel Section - Metro Station', 35.0, 55.0, 8.5, 60.0, 15.0, 150.0, 110, 'unhealthy_sensitive', 'CO and VOC elevated in confined space. Increase mechanical ventilation. Monitor continuously.'),
      ('Zone E', 'Paint Application - Office Complex', 15.0, 25.0, 1.0, 20.0, 18.0, 280.0, 95, 'moderate', 'VOC levels high from paint application. Increase ventilation. Organic vapor respirators required.'),
      ('Zone A', 'Downtown Tower Upper Floors', 22.0, 35.0, 1.2, 25.0, 22.0, 45.0, 65, 'moderate', 'Moderate AQI from urban pollution. Standard dust masks for extended exposure.'),
      ('Zone B', 'Welding Area - Harbor Bridge', 45.0, 70.0, 3.5, 55.0, 20.0, 95.0, 120, 'unhealthy_sensitive', 'Welding fume concentration elevated. Install local exhaust ventilation at weld stations.'),
      ('Zone D', 'Excavation Site - Industrial Park', 55.0, 95.0, 1.5, 28.0, 28.0, 60.0, 100, 'moderate', 'Earthwork generating dust. Water trucks should make passes every 30 minutes.'),
      ('Zone I', 'Interior - School Renovation', 18.0, 30.0, 0.8, 15.0, 12.0, 65.0, 55, 'good', 'Indoor air quality acceptable. Continue standard ventilation practices.'),
      ('Zone K', 'Hospital Wing - Adjacent Area', 12.0, 20.0, 0.5, 12.0, 10.0, 30.0, 42, 'good', 'Good air quality. Important to maintain for adjacent hospital operations.'),
      ('Zone G', 'Riverside Apartments - Exterior', 28.0, 45.0, 1.0, 22.0, 20.0, 40.0, 72, 'moderate', 'Moderate particulates from nearby traffic and construction dust. Standard precautions.'),
      ('Zone H', 'Shopping Mall Roof', 20.0, 32.0, 0.6, 18.0, 35.0, 35.0, 60, 'moderate', 'Elevated ozone at roof level from UV exposure. Limit prolonged outdoor exposure.'),
      ('Zone F', 'Asphalt Paving - Highway', 40.0, 65.0, 2.0, 35.0, 22.0, 200.0, 125, 'unhealthy_sensitive', 'Asphalt fumes creating VOC hazard. Position workers upwind. Organic vapor respirators required.'),
      ('Zone C', 'Basement Parking - Metro Station', 25.0, 40.0, 12.0, 70.0, 8.0, 90.0, 140, 'unhealthy_sensitive', 'Dangerous CO levels from equipment exhaust. Improve ventilation urgently. CO monitors required.'),
      ('Zone J', 'Asbestos Abatement - Old Factory', 8.0, 15.0, 0.5, 10.0, 8.0, 25.0, 35, 'good', 'Contained area with HEPA filtration working. Maintain negative pressure. Continue monitoring.'),
      ('Zone D', 'Concrete Batch Plant - Industrial Park', 50.0, 85.0, 1.5, 25.0, 20.0, 55.0, 105, 'unhealthy_sensitive', 'Cement dust from batch plant. Install dust collectors. Wet suppression at transfer points.')
    `);

    // Proximity (15)
    await pool.query(`
      INSERT INTO proximity (worker_name, zone, equipment_nearby, distance, alert_type, speed, status, severity, ai_recommendation) VALUES
      ('Carlos Martinez', 'Zone A', 'Tower Crane TC-200', 15.0, 'swing_radius', 0.0, 'active', 'medium', 'Worker within crane swing radius. Spotter should maintain visual contact. Alert crane operator.'),
      ('Kevin Brown', 'Zone F', 'Concrete Pump CP-50', 8.0, 'boom_proximity', 2.5, 'active', 'high', 'Worker approaching concrete pump boom during operation. Maintain 10ft minimum clearance.'),
      ('Juan Rodriguez', 'Zone D', 'CAT 330 Excavator', 5.0, 'equipment_proximity', 3.0, 'active', 'critical', 'Worker dangerously close to operating excavator. Immediate alert sent. Establish exclusion zone.'),
      ('David Chen', 'Zone F', 'Dump Truck Kenworth', 12.0, 'backing_vehicle', 5.0, 'resolved', 'high', 'Worker in blind spot of backing truck. Spotter intervention successful. Review backing procedures.'),
      ('Tommy Lee', 'Zone I', 'Bobcat S650 Skid Steer', 20.0, 'equipment_proximity', 4.0, 'monitoring', 'low', 'Worker at safe distance from skid steer. Continue monitoring. No action needed.'),
      ('Frank Miller', 'Zone E', 'Aerial Lift JLG 600S', 6.0, 'overhead_work', 0.0, 'active', 'high', 'Worker directly below operating aerial lift. Move to safe position outside drop zone.'),
      ('Marcus White', 'Zone J', 'Wrecking Ball', 25.0, 'demolition_zone', 0.0, 'monitoring', 'medium', 'Worker near demolition exclusion zone boundary. Maintain current distance. Spotter assigned.'),
      ('Ahmed Hassan', 'Zone C', 'Tunnel Boring Machine', 10.0, 'equipment_proximity', 1.0, 'active', 'high', 'Close proximity to TBM operations. Ensure lockout before approaching. Communication required.'),
      ('Patrick OBrien', 'Zone G', 'Material Hoist', 7.0, 'overhead_load', 2.0, 'active', 'critical', 'Worker under material hoist path. Immediate evacuation from load path required.'),
      ('Steve Garcia', 'Zone H', 'Roof Crane', 18.0, 'swing_radius', 0.0, 'monitoring', 'medium', 'Worker within roof crane radius. Standard awareness protocol. Monitor crane movements.'),
      ('Yusuf Ali', 'Zone B', 'Liebherr Mobile Crane', 22.0, 'load_path', 1.5, 'active', 'high', 'Worker approaching crane load path during lift. Hold lift until worker clears area.'),
      ('James Wilson', 'Zone B', 'Barge Traffic', 30.0, 'water_proximity', 0.0, 'monitoring', 'low', 'Worker near water edge during bridge work. Life jacket confirmed worn. Spotter in place.'),
      ('Daniel Kim', 'Zone K', 'Backhoe JCB 3CX', 9.0, 'equipment_proximity', 2.0, 'active', 'high', 'Worker within backhoe swing radius during trenching. Eye contact with operator required.'),
      ('Robert Johnson', 'Zone A', 'Forklift CAT DP-25', 15.0, 'vehicle_traffic', 3.5, 'resolved', 'medium', 'Supervisor in forklift travel lane. Pedestrian separation barriers recommended.'),
      ('Mike Thompson', 'Zone G', 'Scaffolding Material Drop', 4.0, 'overhead_hazard', 0.0, 'active', 'critical', 'Worker below active material loading zone on scaffolding. Immediate clearance required.')
    `);

    // Training (15)
    await pool.query(`
      INSERT INTO training (worker_name, role, certification, training_type, completion_date, expiry_date, score, status, ai_recommendation) VALUES
      ('Carlos Martinez', 'Ironworker', 'OSHA 30-Hour Construction', 'Safety', '2025-08-15', '2028-08-15', 92, 'valid', 'Certification current. Consider advanced steel erection safety course.'),
      ('James Wilson', 'Crane Operator', 'NCCCO Crane Operator', 'Equipment', '2025-06-20', '2026-06-20', 88, 'expiring_soon', 'Certification expires in 2 months. Schedule renewal exam. Review load chart calculations.'),
      ('Ahmed Hassan', 'Electrician', 'NFPA 70E Electrical Safety', 'Safety', '2026-01-10', '2027-01-10', 95, 'valid', 'Excellent score. Current certification. Recommend arc flash analysis training.'),
      ('Mike Thompson', 'Scaffolder', 'Scaffold Competent Person', 'Safety', '2024-12-01', '2025-12-01', 78, 'expired', 'CERTIFICATION EXPIRED. Worker must not perform scaffold erection until recertified.'),
      ('David Chen', 'Concrete Finisher', 'Silica Awareness Training', 'Health', '2026-02-15', '2027-02-15', 85, 'valid', 'Current on silica training. Add concrete pump operation certification.'),
      ('Robert Johnson', 'Site Supervisor', 'OSHA 510 - Standards for Construction', 'Safety', '2025-10-05', '2029-10-05', 90, 'valid', 'Advanced safety training current. Consider CHST certification for career development.'),
      ('Juan Rodriguez', 'Heavy Equipment Operator', 'Excavator Operation Certificate', 'Equipment', '2025-09-12', '2026-09-12', 82, 'valid', 'Current certification. Recommend trenching and excavation competent person training.'),
      ('Patrick OBrien', 'Plumber', 'Confined Space Entry', 'Safety', '2025-04-20', '2026-04-20', 86, 'expiring_soon', 'Expiring within 2 weeks. Schedule renewal immediately. Review atmospheric testing procedures.'),
      ('Yusuf Ali', 'Welder', 'AWS Certified Welder', 'Skill', '2025-11-30', '2026-11-30', 91, 'valid', 'Welding certification current. Add structural welding inspection awareness training.'),
      ('Tommy Lee', 'Carpenter', 'Fall Protection Competent Person', 'Safety', '2026-03-01', '2027-03-01', 80, 'valid', 'Recent certification. Score adequate but recommend refresher on rescue procedures.'),
      ('Steve Garcia', 'Roofer', 'Heat Illness Prevention', 'Health', '2025-05-10', '2026-05-10', 72, 'valid', 'Low score concerning given rooftop work. Schedule supplemental heat stress training.'),
      ('Frank Miller', 'Painter', 'Hazard Communication (GHS)', 'Health', '2026-01-25', '2027-01-25', 88, 'valid', 'Good understanding of SDS and chemical hazards. Add respiratory protection training.'),
      ('Kevin Brown', 'Mason', 'Respirable Crystalline Silica', 'Health', '2025-07-15', '2026-07-15', 75, 'valid', 'Score below recommended threshold. Schedule refresher training on dust control methods.'),
      ('Daniel Kim', 'HVAC Technician', 'EPA 608 Refrigerant Handling', 'Environmental', '2025-12-10', '2028-12-10', 94, 'valid', 'Excellent score. Consider adding LEED green building certification.'),
      ('Marcus White', 'Demolition Worker', 'Asbestos Awareness (Class IV)', 'Health', '2024-08-20', '2025-08-20', 83, 'expired', 'CERTIFICATION EXPIRED. Must not work in areas with potential asbestos until recertified.')
    `);

    // Emergency (15)
    await pool.query(`
      INSERT INTO emergency (type, zone, severity, trigger, responders_needed, evacuation_route, assembly_point, status, response_time, ai_protocol) VALUES
      ('Structural Collapse', 'Zone A - Downtown Tower', 'critical', 'Seismic sensor activation or visual report', 15, 'Stairwell B to Ground Floor Exit East', 'Parking Lot A - 200ft from building', 'active', 5.0, 'Activate emergency alarm. Account for all workers by floor. Deploy search and rescue team. Call 911 immediately.'),
      ('Fire - Welding', 'Zone B - Harbor Bridge', 'high', 'Smoke detector or fire watch report', 8, 'Pier walkway to shore access point', 'Shore Assembly Area B', 'active', 3.0, 'Activate fire alarm. Fire watch uses extinguisher for small fires. Evacuate pier if fire grows. Marine fire response on standby.'),
      ('Medical Emergency', 'Zone F - Highway Overpass', 'high', 'Worker down report or wearable alert', 4, 'Nearest ground level access ramp', 'First Aid Station - Section C', 'active', 2.0, 'First responders with AED to location. Stabilize patient. Call EMS. Clear access route for ambulance.'),
      ('Chemical Spill', 'Zone E - Office Complex', 'medium', 'Chemical sensor alert or visual report', 6, 'Interior corridor to north exit', 'North Parking Lot - Upwind', 'active', 4.0, 'Identify chemical from SDS. Evacuate immediate area. Don appropriate PPE. Contain spill if safe. Call hazmat if needed.'),
      ('Severe Weather', 'Zone H - Shopping Mall', 'high', 'Weather service alert or wind sensor', 20, 'Roof access stairs to interior shelter', 'Interior Mall Space - Ground Floor', 'standby', 8.0, 'Monitor weather radar. When warning issued: cease all outdoor work, lower crane booms, secure materials, move to interior shelter.'),
      ('Electrical Emergency', 'Zone C - Metro Station', 'critical', 'Arc flash or electrocution report', 6, 'Tunnel emergency exit to surface', 'Street Level Assembly Point C', 'active', 3.0, 'De-energize affected circuits via LOTO. Do not touch victim if still in contact. Call 911. AED on standby.'),
      ('Trench Rescue', 'Zone D - Industrial Park', 'critical', 'Collapse sensor or visual report', 10, 'Trench access ramp to staging area', 'Equipment Staging Area D', 'active', 4.0, 'Do not enter collapsed trench. Call 911 for trench rescue team. Shore adjacent walls. Locate buried workers via sensors.'),
      ('Fall Rescue', 'Zone G - Riverside Apartments', 'high', 'Fall sensor alert from wearable', 5, 'Scaffolding rescue access route', 'Ground Level First Aid Station G', 'active', 3.0, 'Activate rescue team with stretcher basket. Stabilize spine. Lower worker via scaffold hoist or aerial lift.'),
      ('Heat Emergency', 'Zone H - Shopping Mall', 'high', 'Wearable body temp alert above 103°F', 3, 'Roof to cooling station via service elevator', 'Air Conditioned Break Room', 'active', 2.0, 'Move worker to shade immediately. Remove excess clothing. Apply cold packs to neck, armpits, groin. IV fluids if EMT present.'),
      ('Gas Leak', 'Zone K - Hospital Wing', 'critical', 'Gas detector alarm', 12, 'All exits leading away from hospital', 'Parking Structure C - 300ft from building', 'standby', 5.0, 'Evacuate immediately. No ignition sources. Notify hospital administration. Call fire department. Shut off gas at source if safe.'),
      ('Confined Space Rescue', 'Zone C - Metro Station', 'critical', 'Atmospheric monitor or worker distress', 6, 'Confined space entry point to surface', 'Surface Assembly Point - Tunnel Entry', 'active', 4.0, 'Attendant calls rescue team. Do not enter without SCBA. Use mechanical retrieval system. Monitor atmosphere continuously.'),
      ('Crane Emergency', 'Zone A - Downtown Tower', 'critical', 'Load drop sensor or operator alert', 10, 'Crane exclusion zone perimeter exits', 'Assembly Point Alpha - 500ft radius', 'active', 2.0, 'Sound crane emergency alarm. Clear all workers from exclusion zone. Lower boom if controllable. Secure site perimeter.'),
      ('Flooding', 'Zone D - Industrial Park', 'medium', 'Water level sensor in excavation', 8, 'Excavation ramps to high ground', 'High Ground Assembly Area D', 'standby', 6.0, 'Evacuate all excavations. Pump stations on standby. Monitor water levels. No re-entry until pumped and inspected.'),
      ('Active Shooter', 'All Zones', 'critical', 'Security alert or worker report', 25, 'Run-Hide-Fight protocol / nearest hard cover', 'Off-site rally point - 1000ft from site', 'standby', 1.0, 'Implement Run-Hide-Fight. Call 911 immediately. Account for all workers. Do not return until law enforcement clears site.'),
      ('Earthquake', 'All Zones', 'critical', 'Seismic sensor or felt shaking', 30, 'Drop-Cover-Hold then evacuate via marked routes', 'Open field assembly points per zone', 'standby', 5.0, 'Drop, cover, and hold. After shaking stops: evacuate all structures. Check for structural damage. Account for all personnel.')
    `);

    // Maintenance (15)
    await pool.query(`
      INSERT INTO maintenance (equipment_name, type, location, health_score, vibration_level, temperature, usage_hours, predicted_failure, status, ai_recommendation) VALUES
      ('Tower Crane TC-200', 'Crane', 'Downtown Tower Project', 82, 3.2, 145.0, 4500, '45 days - Wire rope wear', 'operational', 'Wire rope showing wear at sheave contact points. Schedule replacement within 30 days. Monitor daily.'),
      ('CAT 330 Excavator', 'Excavator', 'Industrial Park Phase 3', 65, 5.8, 195.0, 6200, '14 days - Hydraulic seal failure', 'warning', 'Hydraulic system pressure fluctuations detected. Seal replacement urgent. Order parts immediately.'),
      ('Liebherr Mobile Crane', 'Crane', 'Harbor Bridge Construction', 88, 2.5, 135.0, 3800, '60 days - Outrigger pad wear', 'operational', 'Good overall health. Outrigger pads showing wear. Replace during next scheduled maintenance.'),
      ('Scaffolding System A', 'Scaffolding', 'Riverside Apartments', 25, 0.0, 0.0, 0, 'Immediate - Structural failure', 'critical', 'Multiple component failures detected. Do not use. Full rebuild with new components required.'),
      ('Concrete Pump CP-50', 'Concrete Pump', 'Highway Overpass Project', 75, 4.1, 165.0, 5100, '30 days - Pipeline wear', 'operational', 'Pipeline wall thickness decreasing. Monitor wear indicators. Replace pipeline sections in 3 weeks.'),
      ('Welding Machine WM-300', 'Welder', 'Harbor Bridge Construction', 90, 1.2, 110.0, 2800, '90 days - Electrode holder wear', 'operational', 'Excellent condition. Minor electrode holder cable wear. Standard maintenance schedule adequate.'),
      ('Aerial Lift JLG 600S', 'Aerial Lift', 'Office Complex Phase 2', 70, 3.8, 155.0, 4200, '21 days - Hydraulic cylinder leak', 'warning', 'Platform leveling cylinder showing early leak signs. Schedule repair within 2 weeks.'),
      ('Generator Set 100KW', 'Generator', 'Metro Station Build', 60, 4.5, 205.0, 8500, '10 days - Fuel injector failure', 'warning', 'Elevated fuel consumption indicates injector degradation. Replace fuel injectors urgently.'),
      ('Forklift CAT DP-25', 'Forklift', 'Shopping Mall Extension', 85, 2.0, 125.0, 3200, '55 days - Mast chain stretch', 'operational', 'Good condition. Mast chains approaching adjustment interval. Schedule chain tension check.'),
      ('Bobcat S650 Skid Steer', 'Skid Steer', 'School Renovation Project', 78, 3.0, 150.0, 4800, '35 days - Drive motor wear', 'operational', 'Drive motors showing normal wear. Plan replacement during next major service interval.'),
      ('Dump Truck Kenworth', 'Truck', 'Industrial Park Phase 3', 55, 4.8, 180.0, 7500, '7 days - Brake system failure', 'critical', 'Brake pad thickness critical. Brake fluid temperature elevated. IMMEDIATE brake system service required.'),
      ('Pile Driver APE D30-42', 'Pile Driver', 'Highway Overpass Project', 72, 6.5, 175.0, 3500, '25 days - Cushion block degradation', 'operational', 'Vibration levels slightly elevated. Cushion blocks approaching replacement interval. Monitor daily.'),
      ('Circular Saw DeWalt', 'Power Tool', 'School Renovation Project', 92, 1.5, 95.0, 1200, '120 days - Bearing wear', 'operational', 'Excellent condition. Recently serviced. No concerns for immediate future.'),
      ('Backhoe JCB 3CX', 'Backhoe', 'Hospital Wing Addition', 35, 7.2, 210.0, 9000, '3 days - Boom cylinder failure', 'critical', 'Boom cylinder seal actively leaking. Vibration dangerously high. REMOVE FROM SERVICE immediately.'),
      ('Compactor Plate CP-90', 'Compactor', 'Highway Overpass Project', 80, 8.5, 140.0, 2600, '40 days - Vibration dampener wear', 'operational', 'High vibration is by design for compactor. Dampeners showing wear but functional. Monitor handle vibration for operator safety.')
    `);

    console.log('Seed data inserted successfully!');
    console.log('Demo user: demo@safety.com / password123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
