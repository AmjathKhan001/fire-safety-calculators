// =================================================================
// GLOBAL STATE & UTILITIES
// =================================================================

window.currentUnit = 'imperial';

// CONSTANTS for unit conversion ratios (Metric/Imperial) and factors
const UNIT_RATIOS = {
    length: { ratio: 0.3048, imperialUnit: 'ft', metricUnit: 'm' },        // 1 ft = 0.3048 m
    area: { ratio: 0.0929, imperialUnit: 'Sq Ft', metricUnit: 'm²' },      // 1 Sq Ft = 0.0929 m²
    volume: { ratio: 0.0283, imperialUnit: 'Cu Ft', metricUnit: 'm³' },    // 1 Cu Ft = 0.0283 m³
    flow: { ratio: 0.06309, imperialUnit: 'GPM', metricUnit: 'L/s' },     // 1 GPM = 0.06309 L/s
    pressure: { ratio: 0.06895, imperialUnit: 'PSI', metricUnit: 'Bar' }, // 1 PSI = 0.06895 Bar
    diameter: { ratio: 25.4, imperialUnit: 'Inches', metricUnit: 'mm' },    // 1 Inch = 25.4 mm
    weight: { ratio: 0.4536, imperialUnit: 'lb', metricUnit: 'kg' },       // 1 lb = 0.4536 kg
    lux: { ratio: 10.764, imperialUnit: 'ft-c', metricUnit: 'Lux' },        // 1 ft-c = 10.764 Lux
    capacity: { ratio: 3.785, imperialUnit: 'Gallons', metricUnit: 'Liters' } // 1 Gal = 3.785 L
};

// =================================================================
// UNIT CONVERSION FUNCTIONS
// =================================================================

/** Converts a value from Imperial to Metric based on the type. */
function toMetric(value, type) {
    if (!UNIT_RATIOS[type]) return value;
    return value * UNIT_RATIOS[type].ratio;
}

/** Converts a value from Metric to Imperial based on the type. */
function toImperial(value, type) {
    if (!UNIT_RATIOS[type]) return value;
    return value / UNIT_RATIOS[type].ratio;
}

/** Updates all input labels based on the current unit selection. */
function updateUnitLabels(unit) {
    const labels = document.querySelectorAll('[data-label-imperial], [data-label-metric]');
    labels.forEach(label => {
        const key = unit === 'imperial' ? 'data-label-imperial' : 'data-label-metric';
        if (label.hasAttribute(key)) {
            label.textContent = label.getAttribute(key);
        }
    });
}

// =================================================================
// VIEW CONTROL FUNCTIONS
// =================================================================

/** Switches the visible calculator and updates the navigation bar. */
function switchCalculator(id) {
    // Hide all calculators
    document.querySelectorAll('.calculator-box').forEach(box => {
        box.classList.add('hidden');
    });

    // Show the requested calculator
    const activeCalc = document.getElementById(id);
    if (activeCalc) {
        activeCalc.classList.remove('hidden');
        // Scroll to the calculator
        activeCalc.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Update navigation button active state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.nav-btn[href="#${id}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Hide the general intro text
    document.querySelector('.tool-intro').classList.add('hidden');
}

// =================================================================
// CORE CALCULATION FUNCTIONS
// =================================================================

// --- 1. Clean Agent Calculator (NFPA 2001) ---
function calculateCleanAgent() {
    const form = document.getElementById('clean-agent-form');
    const resultDiv = document.getElementById('clean-agent-result');
    
    // Imperial Inputs
    let L_imp = parseFloat(document.getElementById('clean-agent-length').value);
    let W_imp = parseFloat(document.getElementById('clean-agent-width').value);
    let H_imp = parseFloat(document.getElementById('clean-agent-height').value);
    let T_imp = parseFloat(document.getElementById('clean-agent-temp').value);
    let ALT_imp = parseFloat(document.getElementById('clean-agent-altitude').value);
    
    // Common Inputs
    const agentType = document.getElementById('clean-agent-type').value;
    const C = parseFloat(document.getElementById('clean-agent-conc').value) / 100; // Concentration (e.g., 0.075)

    if (!L_imp || !W_imp || !H_imp || !T_imp || !C) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Convert to Metric if required (Calculations are typically unit-agnostic or based on standard constants)
    let V_imp = L_imp * W_imp * H_imp; // Room Volume in Cu Ft

    // NFPA 2001 formula uses Imperial (Lb/Cu Ft) or Metric (Kg/m³) constants
    // The core calculation here is based on Imperial constants for simplicity and then converted to user units.

    // 1. Determine Agent Constants (NFPA 2001)
    let K1, K2_F, K2_C; // K1 = volume factor, K2_F/K2_C = temp factor (Fahrenheit/Celsius)

    if (agentType === 'fm200') {
        K1 = 0.0743; // Volume Factor (ft³/lb)
        K2_F = 460;   // Temp Factor (°F + 460)
        K2_C = 273.15; // Temp Factor (°C + 273.15)
    } else if (agentType === 'novec') {
        K1 = 0.0544; // Volume Factor (ft³/lb)
        K2_F = 459.7; // Temp Factor (°F + 459.7)
        K2_C = 273.15; // Temp Factor (°C + 273.15)
    }

    // 2. Convert Temperature to Kelvin for density calculation (Metric equivalent needed for calculation)
    const T_celsius = (T_imp - 32) * (5/9);
    const T_kelvin = T_celsius + K2_C; // T_kelvin = T_celsius + 273.15

    // 3. Convert Altitude to Sea Level atmospheric pressure ratio
    // P_ratio = 1 - (2.26 * 10^-5 * ALT_imp) for feet, approx (P_alt / P_sea_level)
    // A simplified formula for density reduction factor (NFPA 2001 Annex A)
    const Alt_Factor = 1 - (ALT_imp * 0.00000345); // Alt factor for ft

    // 4. Calculate Agent Density (S) - Formula: S = K1 * (K2 + T) / (K2 + T) * C / (1-C) ... This is complex.
    // Simpler NFPA 2001 formula (mass required W):
    // W = (V / S) * (C / (100 - C)) * Alt_Correction
    // Where S is specific volume (ft³/lb). S = K1 + K2*T/T_ambient
    
    // We use the common formula for mass W (lbs)
    // W (lbs) = (V * C) / (S * (1 - C))
    // S is the specific volume (ft³/lb or m³/kg)
    const S_imp = K1 + (K2_F / (T_imp + K2_F)); // This is an approximation of the correct formula for density factor.
    
    // Let's use the core density formula to be more accurate (NFPA 2001, 5.5.2.2.1)
    // W = V/S * C/(1-C)
    // S (Specific Volume, ft³/lb) = k1 + k2 * (T_f + 459.7)
    // The density is calculated from: d = P / (R_specific * T_kelvin)
    // Simplified: Use the tabular data factor or the K1 formula:
    
    // Density calculation (d in lbs/ft³) at the room temperature T_imp
    // We'll use the specific volume S (ft³/lb)
    const S = K1 + (K1 * (T_imp - 70) * 0.0035); // Very simple temp correction
    
    // W (lbs) = V_imp * (C / (1 - C)) / S
    let W_lbs = (V_imp * (C / (1 - C))) / S;

    // Apply altitude correction
    W_lbs = W_lbs * (1 + (ALT_imp * 0.00000345));

    let resultHTML;
    let requiredMass;
    let massUnit;
    let requiredVolume;
    let volumeUnit;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        requiredMass = toMetric(W_lbs, 'weight').toFixed(2);
        massUnit = UNIT_RATIOS.weight.metricUnit;
        
        // For Novac: 1kg = 0.686 L (approx)
        // For FM200: 1kg = 0.638 L (approx)
        let vol_ratio = (agentType === 'fm200') ? 0.638 : 0.686;
        requiredVolume = (requiredMass * vol_ratio).toFixed(2);
        volumeUnit = UNIT_RATIOS.capacity.metricUnit;
    } else {
        requiredMass = W_lbs.toFixed(2);
        massUnit = UNIT_RATIOS.weight.imperialUnit;

        // For Novac: 1lb = 0.073 Gal (approx)
        // For FM200: 1lb = 0.076 Gal (approx)
        let vol_ratio = (agentType === 'fm200') ? 0.076 : 0.073;
        requiredVolume = (requiredMass * vol_ratio).toFixed(2);
        volumeUnit = UNIT_RATIOS.capacity.imperialUnit;
    }

    resultHTML = `
        <h3>Agent Calculation Results</h3>
        <p><strong>Room Volume:</strong> ${V_imp.toFixed(1)} ${UNIT_RATIOS.volume.imperialUnit}</p>
        <p><strong>Required Agent Mass (W):</strong> <strong>${requiredMass} ${massUnit}</strong></p>
        <p><strong>Approximate Liquid Volume:</strong> ${requiredVolume} ${volumeUnit}</p>
        <small>Note: This is an estimation based on simplified NFPA formulas. Final calculations must use the agent manufacturer's software and specific constants.</small>
    `;

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}


// --- 2. Water Mist Calculator (Example only, NFPA 750 is complex) ---
function calculateWaterMist() {
    const form = document.getElementById('water-mist-form');
    const resultDiv = document.getElementById('water-mist-result');

    const A_imp = parseFloat(document.getElementById('mist-area').value);
    const D_imp = parseFloat(document.getElementById('mist-density').value);
    const T = parseFloat(document.getElementById('mist-duration').value);

    if (!A_imp || !D_imp || !T) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Required Flow Rate (GPM) = Area (Sq Ft) * Density (GPM/Sq Ft)
    const Flow_GPM = A_imp * D_imp;

    // Required Water Volume (Gallons) = Flow Rate (GPM) * Duration (Min)
    const Volume_Gal = Flow_GPM * T;

    let resultHTML;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        const Flow_Lps = toMetric(Flow_GPM, 'flow').toFixed(2);
        const Volume_L = toMetric(Volume_Gal, 'capacity').toFixed(1);
        resultHTML = `
            <h3>Water Mist Results</h3>
            <p><strong>Required Flow Rate (Peak):</strong> <strong>${Flow_Lps} L/s</strong></p>
            <p><strong>Minimum Water Reservoir Volume:</strong> <strong>${Volume_L} Liters</strong></p>
            <small>Note: Water mist systems are highly specific. This provides a preliminary estimate only. Consult the system's UL/FM listing for definitive design flow.</small>
        `;
    } else {
        resultHTML = `
            <h3>Water Mist Results</h3>
            <p><strong>Required Flow Rate (Peak):</strong> <strong>${Flow_GPM.toFixed(1)} GPM</strong></p>
            <p><strong>Minimum Water Reservoir Volume:</strong> <strong>${Volume_Gal.toFixed(0)} Gallons</strong></p>
            <small>Note: Water mist systems are highly specific. This provides a preliminary estimate only. Consult the system's UL/FM listing for definitive design flow.</small>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}

// --- 3. Foam System Calculator (NFPA 11) ---
function calculateFoam() {
    const form = document.getElementById('foam-form');
    const resultDiv = document.getElementById('foam-result');

    const A_imp = parseFloat(document.getElementById('foam-area').value);
    const Rate_imp = parseFloat(document.getElementById('foam-rate').value);
    const T = parseFloat(document.getElementById('foam-duration').value);
    const C = parseFloat(document.getElementById('foam-type').value) / 100; // Concentrate % (e.g., 0.03)

    if (!A_imp || !Rate_imp || !T || !C) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Solution Flow (GPM) = Area * Application Rate
    const Solution_Flow_GPM = A_imp * Rate_imp;

    // Concentrate Flow (GPM) = Solution Flow * Concentrate %
    const Concentrate_Flow_GPM = Solution_Flow_GPM * C;

    // Concentrate Volume (Gallons) = Concentrate Flow * Duration (Min)
    const Concentrate_Volume_Gal = Concentrate_Flow_GPM * T;

    let resultHTML;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        const Concentrate_Volume_L = toMetric(Concentrate_Volume_Gal, 'capacity').toFixed(1);
        const Solution_Flow_Lps = toMetric(Solution_Flow_GPM, 'flow').toFixed(2);
        resultHTML = `
            <h3>Foam System Results</h3>
            <p><strong>Required Solution Flow Rate:</strong> ${Solution_Flow_Lps} L/s</p>
            <p><strong>Required Concentrate Volume:</strong> <strong>${Concentrate_Volume_L} Liters</strong></p>
            <small>This volume is for a ${C * 100}% concentrate system for the specified duration.</small>
        `;
    } else {
        resultHTML = `
            <h3>Foam System Results</h3>
            <p><strong>Required Solution Flow Rate:</strong> ${Solution_Flow_GPM.toFixed(1)} GPM</p>
            <p><strong>Required Concentrate Volume:</strong> <strong>${Concentrate_Volume_Gal.toFixed(0)} Gallons</strong></p>
            <small>This volume is for a ${C * 100}% concentrate system for the specified duration.</small>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}

// --- 4. CO2 System Calculator (NFPA 12) ---
function calculateCO2() {
    const form = document.getElementById('co2-form');
    const resultDiv = document.getElementById('co2-result');

    const L_imp = parseFloat(document.getElementById('co2-length').value);
    const W_imp = parseFloat(document.getElementById('co2-width').value);
    const H_imp = parseFloat(document.getElementById('co2-height').value);
    const C_percent = parseFloat(document.getElementById('co2-hazard').value);

    if (!L_imp || !W_imp || !H_imp || !C_percent) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    const V_imp = L_imp * W_imp * H_imp; // Volume in Cu Ft
    const C = C_percent / 100; // Concentration (e.g., 0.50)

    // CO2 density required in lbs/ft³ (approx 0.088 lbs/ft³ for 50% concentration)
    // The formula is: W = V * Wd / (1 - C)
    // Where Wd = Weight of CO2 required per unit volume (NFPA 12, Table A.4.1.3)
    
    // Wd (lbs/ft³) for various concentrations (simplified standard values):
    let Wd_lbs_ft3;
    if (C_percent === 50) Wd_lbs_ft3 = 0.088;
    else if (C_percent === 34) Wd_lbs_ft3 = 0.057; // Class A Surface Fire
    else Wd_lbs_ft3 = 0.01 + (C_percent / 100) * 0.176; // Liner approximation for others
    
    // Formula from NFPA 12, based on Cu Ft/lb: W = V / (S * (1 - C))
    // Where S = Specific Volume (approx 8 ft³/lb at 70F)
    const W_lbs = V_imp * Wd_lbs_ft3; // Simplified for estimation

    let resultHTML;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        const W_kg = toMetric(W_lbs, 'weight').toFixed(1);
        resultHTML = `
            <h3>CO₂ System Results</h3>
            <p><strong>Room Volume:</strong> ${toMetric(V_imp, 'volume').toFixed(1)} m³</p>
            <p><strong>Required CO₂ Weight:</strong> <strong>${W_kg} kg</strong></p>
            <small>This calculation is based on a ${C_percent}% concentration for total flooding. Always consult NFPA 12 tables for specific hazard types.</small>
        `;
    } else {
        resultHTML = `
            <h3>CO₂ System Results</h3>
            <p><strong>Room Volume:</strong> ${V_imp.toFixed(1)} Cu Ft</p>
            <p><strong>Required CO₂ Weight:</strong> <strong>${W_lbs.toFixed(1)} lb</strong></p>
            <small>This calculation is based on a ${C_percent}% concentration for total flooding. Always consult NFPA 12 tables for specific hazard types.</small>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}


// --- 5. Smoke Detector Spacing (NFPA 72) ---
function calculateSmokeSpacing() {
    const form = document.getElementById('smoke-form');
    const resultDiv = document.getElementById('smoke-detector-result');

    const H_imp = parseFloat(document.getElementById('smoke-height').value);
    const type = document.getElementById('smoke-type').value;

    if (!H_imp) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    let S_imp; // Max Spacing (ft)
    
    // Standard spacing is 30 ft (900 Sq Ft coverage) for smooth ceiling up to 10 ft high.
    if (type === 'smooth') {
        if (H_imp <= 10) S_imp = 30; // Max 30 ft (NFPA 72, Table 17.5.3.2.1)
        else if (H_imp <= 30) {
            // Formula for heights over 10 ft: S = 30 - 0.75 * (H - 10)
            S_imp = 30 - 0.75 * (H_imp - 10);
        } else {
            S_imp = 15; // Max 15 ft for heights > 30 ft
        }
    } else if (type === 'beamed') {
        // Simple approximation for beamed ceiling (reduced to 50% for deep beams)
        S_imp = 0.5 * 30; // Max 15 ft initial approximation
        if (H_imp > 10) {
            S_imp = 0.5 * (30 - 0.75 * (H_imp - 10));
        }
        if (S_imp < 15) S_imp = 15; // Minimum 15 ft for standard beamed
    }

    // Ensure S_imp is not negative or zero
    if (S_imp <= 0) S_imp = 15;
    
    const A_imp = S_imp * S_imp; // Approx area

    let resultHTML;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        const S_metric = toMetric(S_imp, 'length').toFixed(1);
        const A_metric = toMetric(A_imp, 'area').toFixed(1);
        resultHTML = `
            <h3>Smoke Detector Spacing Results</h3>
            <p><strong>Max Spacing (Center to Center):</strong> <strong>${S_metric} m</strong></p>
            <p><strong>Max Spacing (Wall to Center):</strong> ${ (S_metric / 2).toFixed(1) } m</p>
            <p><strong>Approximate Coverage Area:</strong> ${A_metric} m²</p>
            <small>Note: This is based on NFPA 72 requirements for spot-type smoke detectors. Refer to NFPA 72, Table 17.5.3.2.1 for precise values.</small>
        `;
    } else {
        resultHTML = `
            <h3>Smoke Detector Spacing Results</h3>
            <p><strong>Max Spacing (Center to Center):</strong> <strong>${S_imp.toFixed(0)} ft</strong></p>
            <p><strong>Max Spacing (Wall to Center):</strong> ${ (S_imp / 2).toFixed(0) } ft</p>
            <p><strong>Approximate Coverage Area:</strong> ${A_imp.toFixed(0)} Sq Ft</p>
            <small>Note: This is based on NFPA 72 requirements for spot-type smoke detectors. Refer to NFPA 72, Table 17.5.3.2.1 for precise values.</small>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}


// --- 6. Battery Standby Calculator (NFPA 72) ---
function calculateBatteryAh() {
    const form = document.getElementById('battery-form');
    const resultDiv = document.getElementById('battery-result');

    const I_standby = parseFloat(document.getElementById('standby-current').value); // Amps
    const I_alarm = parseFloat(document.getElementById('alarm-current').value); // Amps
    const T_standby = parseFloat(document.getElementById('standby-time').value); // Hours
    const T_alarm = parseFloat(document.getElementById('alarm-time').value); // Minutes

    if (!I_standby || !I_alarm || !T_standby || !T_alarm) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Required Ah = (Standby Current * Standby Hours) + (Alarm Current * Alarm Minutes / 60)
    const Ah_required = (I_standby * T_standby) + (I_alarm * (T_alarm / 60));

    // Apply a safety factor (e.g., 20% margin, or to account for battery degradation/temp)
    const Ah_min_rating = Ah_required * 1.25; // 25% safety margin is common

    let resultHTML = `
        <h3>Battery Capacity Results (Ah)</h3>
        <p><strong>Minimum Required Capacity (Calculated):</strong> ${Ah_required.toFixed(2)} Ah</p>
        <p><strong>Minimum Recommended Battery Rating (with 25% Margin):</strong> <strong>${Ah_min_rating.toFixed(1)} Ah</strong></p>
        <small>This calculation meets the minimum NFPA 72 requirements (24 hours standby, 5/15 minutes alarm). Always use the Ah rating at the 20-hour rate from the battery manufacturer.</small>
    `;

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}

// --- 7. Voltage Drop Calculator (NEC/Fire Alarm) ---
function calculateVoltageDrop() {
    const form = document.getElementById('voltage-drop-form');
    const resultDiv = document.getElementById('voltage-drop-result');

    const CM = parseFloat(document.getElementById('vd-gauge').value); // Circular Mils
    const L_imp = parseFloat(document.getElementById('vd-length').value); // Length (ft)
    const I = parseFloat(document.getElementById('vd-current').value); // Current (Amps)
    const V_source = parseFloat(document.getElementById('vd-source').value); // Voltage (V)

    if (!CM || !L_imp || !I || !V_source) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Convert length to feet if metric unit is selected
    let L_feet = L_imp;
    if (window.currentUnit === 'metric') {
        L_feet = toImperial(L_imp, 'length');
    }

    // 2-Wire DC Voltage Drop Formula: Vd = (2 * K * I * L) / CM
    // K = Resistivity of Copper (10.4 CM-Ohms/ft)
    const K = 10.4; 
    
    // Voltage Drop (Vd)
    const Vd = (2 * K * I * L_feet) / CM;

    // Voltage at End-of-Line (V_EOL)
    const V_EOL = V_source - Vd;

    // Typically, EOL voltage must be > 80% of source voltage
    const V_min = V_source * 0.8; 

    let resultHTML = `
        <h3>Voltage Drop Results</h3>
        <p><strong>Voltage Drop (Vd):</strong> <strong>${Vd.toFixed(2)} Volts</strong></p>
        <p><strong>Voltage at End-of-Line (V_EOL):</strong> <strong>${V_EOL.toFixed(2)} Volts</strong></p>
        <p><strong>Minimum Required Voltage (80%):</strong> ${V_min.toFixed(2)} Volts</p>
        <p><strong>Result:</strong> <span class="badge ${V_EOL >= V_min ? 'pass' : 'fail'}"><strong>${V_EOL >= V_min ? 'PASS' : 'FAIL'}</strong></span></p>
        <small>The EOL voltage must be greater than or equal to the minimum required voltage for the last device.</small>
    `;

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}

// --- 8. NAC Load Calculator ---
function calculateNACLoad() {
    const form = document.getElementById('nac-load-form');
    const resultDiv = document.getElementById('nac-load-result');

    const Limit = parseFloat(document.getElementById('nac-panel-limit').value);
    const Strobe_Count = parseFloat(document.getElementById('nac-strobe-count').value);
    const Strobe_Current = parseFloat(document.getElementById('nac-strobe-current').value);
    const Speaker_Count = parseFloat(document.getElementById('nac-speaker-count').value);
    const Speaker_Current = parseFloat(document.getElementById('nac-speaker-current').value);

    if (!Limit || !Strobe_Count || !Strobe_Current) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in the limit, strobe count, and current draw.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }
    
    // Note: NAC calculations usually sum the peak draw of all devices. 
    // Speakers are generally calculated by multiplying the largest speaker's draw by the total number of speakers.
    
    const Total_Strobe_Load = Strobe_Count * Strobe_Current;
    const Total_Speaker_Load = Speaker_Count * Speaker_Current;

    // Total Peak Load (Amps)
    const Total_Load = Total_Strobe_Load + Total_Speaker_Load;

    let resultHTML = `
        <h3>NAC Load Results</h3>
        <p><strong>Strobe/Horn Load:</strong> ${Total_Strobe_Load.toFixed(2)} Amps</p>
        <p><strong>Speaker Load:</strong> ${Total_Speaker_Load.toFixed(2)} Amps</p>
        <p><strong>Total Peak Circuit Load:</strong> <strong>${Total_Load.toFixed(2)} Amps</strong></p>
        <p><strong>Panel Circuit Limit:</strong> ${Limit.toFixed(2)} Amps</p>
        <p><strong>Result:</strong> <span class="badge ${Total_Load <= Limit ? 'pass' : 'fail'}"><strong>${Total_Load <= Limit ? 'PASS' : 'FAIL'}</strong></span></p>
        <small>The total load must be less than the maximum panel circuit limit.</small>
    `;

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}

// --- 9. Fire Stopping Material Calculator ---
function calculateFireStopping() {
    const form = document.getElementById('fire-stopping-form');
    const resultDiv = document.getElementById('fire-stopping-result');

    const D_opening_imp = parseFloat(document.getElementById('fs-opening-diam').value);
    const D_penetration_imp = parseFloat(document.getElementById('fs-penetration-diam').value);
    const H_imp = parseFloat(document.getElementById('fs-depth').value);

    if (!D_opening_imp || !D_penetration_imp || !H_imp) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Annular area calculation: A_annular = (Pi/4) * (D_opening² - D_penetration²)
    const A_opening = Math.PI * Math.pow(D_opening_imp / 2, 2);
    const A_penetration = Math.PI * Math.pow(D_penetration_imp / 2, 2);
    const A_annular = A_opening - A_penetration; // Area in Sq Inches

    // Volume (Cu Inches) = Area * Depth
    const V_cu_inches = A_annular * H_imp;

    // Approximate coverage of a standard 10.3 oz sealant tube (approx 18-20 Cu In)
    const Tube_Volume_CuIn = 18; 
    const Tubes_required = V_cu_inches / Tube_Volume_CuIn;

    let resultHTML;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        const V_cu_meters = toMetric(V_cu_inches / 1728, 'volume').toFixed(4); // Convert Cu In to Cu Ft then to m³
        const V_liters = (V_cu_meters * 1000).toFixed(2);
        resultHTML = `
            <h3>Fire Stopping Material Estimate</h3>
            <p><strong>Volume Required:</strong> <strong>${V_liters} Liters</strong></p>
            <p><strong>Approximate Tubes (10.3 oz size):</strong> <strong>${Math.ceil(Tubes_required)} Tubes</strong></p>
            <small>Requires ${V_cu_inches.toFixed(1)} Cubic Inches of sealant. Actual material usage may vary based on product density and waste.</small>
        `;
    } else {
        resultHTML = `
            <h3>Fire Stopping Material Estimate</h3>
            <p><strong>Volume Required:</strong> <strong>${V_cu_inches.toFixed(1)} Cu Inches</strong></p>
            <p><strong>Approximate Tubes (10.3 oz size):</strong> <strong>${Math.ceil(Tubes_required)} Tubes</strong></p>
            <small>Actual material usage may vary based on product density, depth, and waste.</small>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}

// --- 10. Fire Door Inspection Checklist (Non-Calculator) ---
function generateDoorChecklist() {
    const resultDiv = document.getElementById('door-checklist-result');
    const gap = document.getElementById('gap-check').value;
    const latch = document.getElementById('latch-check').value;
    const closer = document.getElementById('closer-check').value;
    const hinge = document.getElementById('hinge-check').value;

    const items = [
        { label: 'Door Gaps', result: gap, required: 'yes' },
        { label: 'Latching', result: latch, required: 'yes' },
        { label: 'Self-Closing/Closer', result: closer, required: 'yes' },
        { label: 'Hardware (Hinges/Parts)', result: hinge, required: 'yes' },
    ];

    let failCount = 0;
    let summaryHTML = '<h3>Inspection Summary (NFPA 80)</h3>';
    summaryHTML += '<ul>';

    items.forEach(item => {
        const status = item.result === item.required ? '✅ PASS' : '❌ FAIL';
        if (item.result !== item.required) {
            failCount++;
        }
        summaryHTML += `<li>${item.label}: <strong>${status}</strong></li>`;
    });

    summaryHTML += '</ul>';
    
    const overallStatus = failCount === 0 ? 'PASS: Door is compliant based on checked items.' : `FAIL: ${failCount} item(s) require immediate attention.`;
    const overallClass = failCount === 0 ? 'pass' : 'fail';
    
    summaryHTML += `<h4 class="${overallClass}">Overall Status: ${overallStatus}</h4>`;
    
    resultDiv.innerHTML = summaryHTML;
    resultDiv.classList.remove('hidden');
}


// --- 11. Fire Damper Guide (Non-Calculator) ---
function generateDamperGuide() {
    const resultDiv = document.getElementById('fire-damper-result');
    const location = document.getElementById('damper-location').value;
    const hvac = document.getElementById('damper-hvac').value;

    let recommendation = '';
    let rating = '';

    if (location === 'barrier') {
        rating = 'Minimum 1.5 Hour Rating (NFPA 90A)';
        if (hvac === 'static') {
            recommendation = 'Fire Damper (FD) - System shuts down.';
        } else if (hvac === 'dynamic') {
            recommendation = 'Combination Fire/Smoke Damper (CSD) - System remains operational.';
            rating = 'Minimum 1.5 Hour Fire Rating + Smoke Leakage Class I or II.';
        }
    } else if (location === 'shaft') {
        rating = 'Minimum 3 Hour Rating (IBC/NFPA 90A)';
        if (hvac === 'static' || hvac === 'dynamic') {
             recommendation = 'Combination Fire/Smoke Damper (CSD) - Required due to corridor/shaft location and smoke control needs.';
            rating = 'Minimum 3 Hour Fire Rating + Smoke Leakage Class I or II.';
        }
    } else if (location === 'duct') {
        rating = 'Rating depends on the barrier pierced.';
        if (hvac === 'static') {
            recommendation = 'Smoke Damper (SD) or Combination Fire/Smoke Damper (CSD) depending on the barrier fire rating.';
        } else if (hvac === 'dynamic') {
             recommendation = 'Combination Fire/Smoke Damper (CSD) is typically required for active smoke control systems.';
        }
    } else {
        recommendation = 'Please select a location and HVAC status.';
    }

    let resultHTML = `
        <h3>Damper Recommendation Summary</h3>
        <p><strong>Location:</strong> ${location ? location.charAt(0).toUpperCase() + location.slice(1) : 'N/A'}</p>
        <p><strong>HVAC Status:</strong> ${hvac === 'static' ? 'Static (System Shutdown)' : hvac === 'dynamic' ? 'Dynamic (System Operational)' : 'N/A'}</p>
        <h4>Recommended Damper Type: <strong>${recommendation}</strong></h4>
        <p><strong>Required Rating:</strong> ${rating}</p>
        <small>This is a guide. Consult NFPA 90A, IBC, and local codes for definitive requirements based on barrier type and system design.</small>
    `;
    
    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}


// --- 12. Occupant Load Calculator (NFPA 101 / IBC) ---
function calculateOccupantLoad() {
    const form = document.getElementById('occupant-form');
    const resultDiv = document.getElementById('occupant-result');

    const A_imp = parseFloat(document.getElementById('floor-area').value); // Area (Sq Ft)
    const factor = parseFloat(document.getElementById('occupancy-type').value); // Load Factor (Sq Ft/Occ)

    if (!A_imp || factor === 0) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please enter the area and select a valid occupancy type.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Occupant Load = Area / Load Factor
    const OL = A_imp / factor;
    const OL_rounded = Math.ceil(OL); // Always round up per code

    let resultHTML;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        const A_metric = toMetric(A_imp, 'area').toFixed(1);
        const factor_metric = factor / UNIT_RATIOS.area.ratio; // Convert Sq Ft/Occ to m²/Occ
        resultHTML = `
            <h3>Occupant Load Results</h3>
            <p><strong>Area:</strong> ${A_metric} m²</p>
            <p><strong>Load Factor:</strong> ${factor_metric.toFixed(2)} m²/Occ</p>
            <p><strong>Calculated Occupant Load:</strong> ${OL.toFixed(2)}</p>
            <p><strong>Maximum Allowed Occupants:</strong> <strong>${OL_rounded} People</strong></p>
            <small>The final load is always rounded up to the next whole number. Fixed seating requires specific count.</small>
        `;
    } else {
        resultHTML = `
            <h3>Occupant Load Results</h3>
            <p><strong>Area:</strong> ${A_imp.toFixed(1)} Sq Ft</p>
            <p><strong>Load Factor:</strong> ${factor} Sq Ft/Occ</p>
            <p><strong>Calculated Occupant Load:</strong> ${OL.toFixed(2)}</p>
            <p><strong>Maximum Allowed Occupants:</strong> <strong>${OL_rounded} People</strong></p>
            <small>The final load is always rounded up to the next whole number. Fixed seating requires specific count.</small>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}

// --- 13. Egress Width Calculator (NFPA 101 / IBC) ---
function calculateEgressWidth() {
    const form = document.getElementById('egress-width-form');
    const resultDiv = document.getElementById('egress-width-result');

    const OL = parseFloat(document.getElementById('egress-occupant-load').value); // Occupant Load
    const type = document.getElementById('egress-type').value; // stairs or other
    const level = document.getElementById('egress-system-level').value; // standard or reduced

    if (!OL) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please enter the calculated occupant load.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Load Factors (Inches per Occupant)
    let factor;
    if (type === 'stairs' && level === 'standard') factor = 0.3;
    else if (type === 'stairs' && level === 'reduced') factor = 0.2;
    else if (type === 'other' && level === 'standard') factor = 0.2;
    else if (type === 'other' && level === 'reduced') factor = 0.15;
    else factor = 0.3; // Default fallback

    // Required Width (Inches) = Occupant Load * Factor
    const W_inches = OL * factor;
    
    // Required Width (Inches) rounded up to the nearest increment (usually 1/2 or 1/4 inch)
    const W_rounded_up = Math.ceil(W_inches * 4) / 4; // Round up to nearest 0.25 inch

    let resultHTML;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        const W_cm = toMetric(W_rounded_up, 'diameter') / 10; // mm to cm
        resultHTML = `
            <h3>Egress Width Results</h3>
            <p><strong>Occupant Load (OL):</strong> ${OL}</p>
            <p><strong>Egress Factor:</strong> ${toMetric(factor, 'diameter').toFixed(2)} cm/Occ</p>
            <p><strong>Minimum Required Egress Width:</strong> <strong>${W_cm.toFixed(1)} cm</strong></p>
            <small>This width must be provided in total by all exit components for this area. Result rounded up to the nearest 0.5 cm.</small>
        `;
    } else {
        resultHTML = `
            <h3>Egress Width Results</h3>
            <p><strong>Occupant Load (OL):</strong> ${OL}</p>
            <p><strong>Egress Factor:</strong> ${factor} Inches/Occ</p>
            <p><strong>Minimum Required Egress Width:</strong> <strong>${W_rounded_up.toFixed(2)} Inches</strong></p>
            <small>This width must be provided in total by all exit components for this area. Result rounded up to the next quarter inch.</small>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}


// --- 14. Emergency Lighting Point Calculator (Based on simplified inverse square law) ---
function calculateEmergencyLighting() {
    const form = document.getElementById('emergency-lighting-form');
    const resultDiv = document.getElementById('emergency-lighting-result');

    const H_imp = parseFloat(document.getElementById('el-mount-height').value); // Height (ft)
    const C = parseFloat(document.getElementById('el-lux-factor').value); // Candlepower
    const I_imp = parseFloat(document.getElementById('el-min-lux').value); // Illuminance (ft-c)

    if (!H_imp || !C || !I_imp) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Simplified Inverse Square Law: I = C / D²
    // Where D is the distance from the source to the point on the ground.
    // D² = C / I
    // D = sqrt(C / I)
    const D_max = Math.sqrt(C / I_imp); // Max distance from light to the ground point (ft)

    // Maximum Spacing (S) between two fixtures: S = 2 * (D_max * cos(theta)) 
    // Simplified assumption: S = 2 * D_max * 0.75 (approximates the diagonal distance in a square grid, very simplified)
    const S_imp = 2 * D_max; // Simple, worst-case straight line distance approximation

    let resultHTML;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        // Convert input units to metric for display
        const H_metric = toMetric(H_imp, 'length').toFixed(1);
        const I_metric = toMetric(I_imp, 'lux').toFixed(1);
        
        // Convert result to metric
        const S_metric = toMetric(S_imp, 'length').toFixed(1);
        
        resultHTML = `
            <h3>Emergency Lighting Spacing Results</h3>
            <p><strong>Max Distance (Fixture to Wall/Center):</strong> ${toMetric(D_max, 'length').toFixed(1)} m</p>
            <p><strong>Max Fixture Spacing (Center to Center):</strong> <strong>${S_metric} m</strong></p>
            <p><em>(For ${H_metric} m height and ${I_metric} Lux minimum)</em></p>
            <small>This is a simplified estimation based on a point source model. Always use a photometric calculation (light loss factor and specific fixture data) for final design.</small>
        `;
    } else {
        resultHTML = `
            <h3>Emergency Lighting Spacing Results</h3>
            <p><strong>Max Distance (Fixture to Wall/Center):</strong> ${D_max.toFixed(1)} ft</p>
            <p><strong>Max Fixture Spacing (Center to Center):</strong> <strong>${S_imp.toFixed(1)} ft</strong></p>
            <p><em>(For ${H_imp} ft height and ${I_imp} ft-c minimum)</em></p>
            <small>This is a simplified estimation based on a point source model. Always use a photometric calculation (light loss factor and specific fixture data) for final design.</small>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}


// --- 15. Hydrant Flow Calculator (NFPA 291) ---
function calculateHydrantFlow() {
    const form = document.getElementById('hydrant-flow-form');
    const resultDiv = document.getElementById('hydrant-flow-result');

    const P_imp = parseFloat(document.getElementById('pitot-pressure').value); // Pitot Pressure (PSI)
    const D_imp = parseFloat(document.getElementById('outlet-diameter').value); // Diameter (Inches)
    const C = parseFloat(document.getElementById('flow-coefficient').value); // Coefficient

    if (!P_imp || !D_imp || !C) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Flow Formula (GPM): Q = 29.83 * C * D² * sqrt(P)
    const Q_GPM = 29.83 * C * Math.pow(D_imp, 2) * Math.sqrt(P_imp);

    let resultHTML;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        const Q_Lps = toMetric(Q_GPM, 'flow').toFixed(1);
        resultHTML = `
            <h3>Hydrant Flow Results</h3>
            <p><strong>Calculated Flow Rate:</strong> <strong>${Q_Lps} L/s</strong></p>
            <p><strong>Calculated Flow Rate:</strong> ${(Q_Lps * 60).toFixed(0)} Liters/Minute</p>
            <small>This formula converts the velocity pressure measured by the pitot gauge into a flow rate (NFPA 291).</small>
        `;
    } else {
        resultHTML = `
            <h3>Hydrant Flow Results</h3>
            <p><strong>Calculated Flow Rate:</strong> <strong>${Q_GPM.toFixed(0)} GPM</strong></p>
            <p><strong>Calculated Flow Rate:</strong> ${Q_GPM.toFixed(1)} Gallons/Minute</p>
            <small>This formula converts the velocity pressure measured by the pitot gauge into a flow rate (NFPA 291).</small>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}

// --- 16. Friction Loss Calculator (Hazen-Williams) ---
function calculateFrictionLoss() {
    const form = document.getElementById('friction-loss-form');
    const resultDiv = document.getElementById('friction-loss-result');

    const D_imp = parseFloat(document.getElementById('pipe-diameter').value); // Diameter (Inches)
    const Q_imp = parseFloat(document.getElementById('flow-rate').value); // Flow (GPM)
    const L_imp = parseFloat(document.getElementById('pipe-length').value); // Length (ft)
    const C = parseFloat(document.getElementById('c-factor').value); // C-Factor

    if (!D_imp || !Q_imp || !L_imp || !C) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Hazen-Williams Formula (Imperial): P = 4.52 * Q^1.85 / (C^1.85 * D^4.87) * L
    // P = friction loss in PSI/ft
    // Total Friction Loss (PSI) = P * L
    
    // PSI/ft calculation
    const P_per_foot = 4.52 * Math.pow(Q_imp, 1.85) / (Math.pow(C, 1.85) * Math.pow(D_imp, 4.87));
    
    // Total Friction Loss (PSI)
    const Total_P_imp = P_per_foot * L_imp;

    let resultHTML;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        // Convert to Metric Units (Hazen-Williams Metric Formula is different: J = 1.05 * 10^7 * Q^1.85 / (C^1.85 * D^4.87))
        // We will convert the Imperial result for simplicity.
        const P_per_meter = Total_P_imp / L_imp * toImperial(1, 'length'); // PSI/m
        const Total_P_bar = toMetric(Total_P_imp, 'pressure'); // Total Bar
        resultHTML = `
            <h3>Friction Loss Results (Hazen-Williams)</h3>
            <p><strong>Friction Loss Per Meter:</strong> ${P_per_meter.toFixed(3)} PSI/m</p>
            <p><strong>Total Friction Loss:</strong> <strong>${Total_P_bar.toFixed(2)} Bar</strong></p>
            <small>Total pressure loss over ${toMetric(L_imp, 'length').toFixed(1)} m of pipe.</small>
        `;
    } else {
        resultHTML = `
            <h3>Friction Loss Results (Hazen-Williams)</h3>
            <p><strong>Friction Loss Per Foot:</strong> ${P_per_foot.toFixed(3)} PSI/ft</p>
            <p><strong>Total Friction Loss:</strong> <strong>${Total_P_imp.toFixed(2)} PSI</strong></p>
            <small>Total pressure loss over ${L_imp} ft of pipe.</small>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}

// --- 17. Required Fire Flow (NFPA 1142) ---
function calculateFireFlow() {
    const form = document.getElementById('fireflow-form');
    const resultDiv = document.getElementById('fireflow-result');

    const A_imp = parseFloat(document.getElementById('ff-area').value); // Area (Sq Ft)
    const C = parseFloat(document.getElementById('ff-construction').value); // C-Factor

    if (!A_imp || !C) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Required Fire Flow (GPM) Formula: F = 18 * C * sqrt(A) (NFPA 1142)
    const F_GPM_initial = 18 * C * Math.sqrt(A_imp);
    
    // Apply Maximums (NFPA 1142 cap is 12,000 GPM)
    let F_GPM = Math.min(F_GPM_initial, 12000);
    
    // Minimum flow is 250 GPM
    F_GPM = Math.max(F_GPM, 250);

    let resultHTML;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        const F_Lps = toMetric(F_GPM, 'flow').toFixed(1);
        resultHTML = `
            <h3>Required Fire Flow Results</h3>
            <p><strong>Required Flow:</strong> <strong>${F_Lps} L/s</strong></p>
            <p><strong>Required Flow:</strong> ${(F_Lps * 60).toFixed(0)} Liters/Minute</p>
            <small>This calculation is based on the NFPA 1142 formula (F = 18 * C * sqrt(A)). Flow is capped at 12,000 GPM.</small>
        `;
    } else {
        resultHTML = `
            <h3>Required Fire Flow Results</h3>
            <p><strong>Required Flow:</strong> <strong>${F_GPM.toFixed(0)} GPM</strong></p>
            <p><strong>Required Flow:</strong> ${F_GPM.toFixed(1)} Gallons/Minute</p>
            <small>This calculation is based on the NFPA 1142 formula (F = 18 * C * sqrt(A)). Flow is capped at 12,000 GPM.</small>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}

// --- 18. Fire Pump Sizing & Head Calculator ---
function calculatePumpSizing() {
    const form = document.getElementById('pump-form');
    const resultDiv = document.getElementById('pump-result');

    const P_demand_imp = parseFloat(document.getElementById('demand-pressure').value); // Demand Pressure (PSI)
    const P_loss_imp = parseFloat(document.getElementById('total-loss').value); // Total Losses (PSI)
    const P_elev_imp = parseFloat(document.getElementById('elevation-head').value); // Elevation Head (PSI)
    const P_avail_imp = parseFloat(document.getElementById('available-pressure').value); // Available Pressure (PSI)
    const Q_imp = parseFloat(document.getElementById('demand-flow').value); // Flow (GPM)

    if (!P_demand_imp || !P_loss_imp || !P_elev_imp || !P_avail_imp || !Q_imp) {
        resultDiv.innerHTML = `<h3>Error</h3><p>Please fill in all required fields.</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    // Required Pump Head (P_head) = Demand Pressure + Losses + Elevation Head - Available Pressure
    const P_head_imp = P_demand_imp + P_loss_imp + P_elev_imp - P_avail_imp;

    let resultHTML;
    
    // Format Output
    if (window.currentUnit === 'metric') {
        const P_head_bar = toMetric(P_head_imp, 'pressure');
        const Q_Lps = toMetric(Q_imp, 'flow');
        resultHTML = `
            <h3>Fire Pump Sizing Results</h3>
            <p><strong>Required Pump Capacity:</strong> <strong>${Q_Lps.toFixed(1)} L/s</strong></p>
            <p><strong>Minimum Required Pump Head:</strong> <strong>${P_head_bar.toFixed(2)} Bar</strong></p>
            <p><strong>Calculation:</strong> (P_demand + P_loss + P_elev) - P_avail = ${P_head_bar.toFixed(2)} Bar</p>
            <small>Pump must provide this head at the required flow. If the result is negative, a pump may not be required or a smaller jockey pump may be sufficient.</small>
        `;
    } else {
        resultHTML = `
            <h3>Fire Pump Sizing Results</h3>
            <p><strong>Required Pump Capacity:</strong> <strong>${Q_imp} GPM</strong></p>
            <p><strong>Minimum Required Pump Head:</strong> <strong>${P_head_imp.toFixed(1)} PSI</strong></p>
            <p><strong>Calculation:</strong> (P_demand + P_loss + P_elev) - P_avail = ${P_head_imp.toFixed(1)} PSI</p>
            <small>Pump must provide this head at the required flow. If the result is negative, a pump may not be required or a smaller jockey pump may be sufficient.</small>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}


// =================================================================
// EVENT LISTENERS & INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. UNIT SWITCH HANDLER
    const unitSwitch = document.getElementById('unit-switch');
    if (unitSwitch) {
        unitSwitch.addEventListener('change', function() {
            window.currentUnit = this.value;
            updateUnitLabels(window.currentUnit);
            // Optionally, re-run calculation of the currently visible calculator to update results
        });
    }

    // 2. CALCULATOR FORM SUBMISSION LISTENERS
    // All listeners call the relevant calculation function on form submit
    document.getElementById('clean-agent-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateCleanAgent();
    });
    document.getElementById('water-mist-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateWaterMist();
    });
    document.getElementById('foam-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateFoam();
    });
    document.getElementById('co2-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateCO2();
    });
    document.getElementById('smoke-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateSmokeSpacing();
    });
    document.getElementById('battery-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateBatteryAh();
    });
    document.getElementById('voltage-drop-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateVoltageDrop();
    });
    document.getElementById('nac-load-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateNACLoad();
    });
    document.getElementById('fire-stopping-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateFireStopping();
    });
    // Passive tools call their respective functions (Checklist/Guide)
    document.getElementById('door-checklist-form').addEventListener('submit', function(e) {
        e.preventDefault();
        generateDoorChecklist();
    });
    document.getElementById('damper-guide-form').addEventListener('submit', function(e) {
        e.preventDefault();
        generateDamperGuide();
    });

    document.getElementById('occupant-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateOccupantLoad();
    });
    document.getElementById('egress-width-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateEgressWidth();
    });
    document.getElementById('emergency-lighting-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateEmergencyLighting();
    });
    document.getElementById('hydrant-flow-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateHydrantFlow();
    });
    document.getElementById('friction-loss-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateFrictionLoss();
    });
    document.getElementById('fireflow-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateFireFlow();
    });
    document.getElementById('pump-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculatePumpSizing();
    });
    
    // Initial unit label update
    updateUnitLabels(window.currentUnit);

    // Handle URL hash for deep linking to a specific calculator
    const urlHash = window.location.hash.substring(1); // Remove '#', e.g., 'occupant-calculator'
    if (urlHash) {
        switchCalculator(urlHash);
    } else {
         // Default: show the first calculator or the introductory text
         const firstCalculator = document.querySelector('.calculator-box');
         if (firstCalculator) {
             switchCalculator(firstCalculator.id);
         }
    }
});

// Expose the function to window for click handlers in index.html (like main-nav)
window.showCalculator = switchCalculator;
