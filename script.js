// =================================================================
// GLOBAL STATE & UTILITIES
// =================================================================

window.currentUnit = 'imperial';
window.calculateFunctions = {};

// Your existing constants and utility functions remain the same...
// Keep all the UNIT_RATIOS, NAV_BUTTONS, getInputValue, displayResult, etc.

// =================================================================
// CALCULATION FUNCTIONS (Register them)
// =================================================================

// Register each calculation function
window.calculateFunctions['clean-agent'] = calculateCleanAgent;
window.calculateFunctions['water-mist'] = calculateWaterMist;
window.calculateFunctions['foam'] = calculateFoam;
window.calculateFunctions['co2'] = calculateCO2;
window.calculateFunctions['smoke-detector'] = calculateSmokeSpacing;
window.calculateFunctions['battery'] = calculateBatteryAh;
window.calculateFunctions['voltage-drop'] = calculateVoltageDrop;
window.calculateFunctions['nac-load'] = calculateNACLoad;
window.calculateFunctions['fire-stopping'] = calculateFireStopping;
window.calculateFunctions['fire-door-checklist'] = generateDoorChecklist;
window.calculateFunctions['fire-damper-guide'] = generateDamperGuide;
window.calculateFunctions['occupant'] = calculateOccupantLoad;
window.calculateFunctions['egress-width'] = calculateEgressWidth;
window.calculateFunctions['emergency-lighting'] = calculateEmergencyLighting;
window.calculateFunctions['hydrant-flow'] = calculateHydrantFlow;
window.calculateFunctions['friction-loss'] = calculateFrictionLoss;
window.calculateFunctions['required-fire-flow'] = calculateFireFlow;
window.calculateFunctions['fire-pump'] = calculatePumpSizing;

// Your existing calculation functions remain exactly the same...
// Keep all the calculateCleanAgent, calculateWaterMist, etc. functions

// =================================================================
// EVENT LISTENERS & INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Unit switch handler
    const unitSwitch = document.getElementById('unit-switch');
    if (unitSwitch) {
        unitSwitch.addEventListener('change', function() {
            window.currentUnit = this.value;
            updateUnitLabels(window.currentUnit);
        });
    }

    // Initial unit label update
    updateUnitLabels(window.currentUnit);

    // Global form submission handler (for dynamically loaded forms)
    document.addEventListener('submit', function(e) {
        if (e.target.matches('form')) {
            e.preventDefault();
            const formId = e.target.id;
            const toolId = formId.replace('-form', '');
            
            if (window.calculateFunctions[toolId]) {
                window.calculateFunctions[toolId]();
            }
        }
    });
});

// Function to update labels (should already exist in your script)
function updateUnitLabels(newUnit) {
    const labels = document.querySelectorAll('[data-label-imperial], [data-label-metric]');
    labels.forEach(el => {
        const imperialLabel = el.getAttribute('data-label-imperial');
        const metricLabel = el.getAttribute('data-label-metric');
        
        if (newUnit === 'metric' && metricLabel) {
            el.textContent = metricLabel;
        } else if (newUnit === 'imperial' && imperialLabel) {
            el.textContent = imperialLabel;
        }
    });
}

/** Converts a value from Metric to Imperial based on the type. */
function toImperial(value, type) {
    if (!UNIT_RATIOS[type]) return value;
    return value / UNIT_RATIOS[type].ratio;
}

/**
 * Retrieves an input value, converting it to the target (imperial) unit if metric is selected.
 * @param {string} id The element ID.
 * @param {string} type The type of measurement.
 * @returns {number} The converted numerical value.
 */
function getInputValue(id, type) {
    const element = document.getElementById(id);
    let value = parseFloat(element.value);
    
    // Check if the element exists and the value is a number
    if (isNaN(value)) {
        throw new Error(`Please enter a valid number for ${element.labels[0].textContent || element.placeholder}.`);
    }
    if (value <= 0 && element.hasAttribute('min') && parseFloat(element.getAttribute('min')) > 0) {
        throw new Error(`Please enter a positive value for ${element.labels[0].textContent || element.placeholder}.`);
    }

    if (window.currentUnit === 'metric' && UNIT_RATIOS[type]) {
        // Convert the metric input back to imperial base unit for internal calculation
        return toImperial(value, type);
    }
    return value; // If imperial or no conversion type, return as is.
}

/**
 * Displays the result in the correct unit system.
 * @param {string} id The result element ID.
 * @param {string} htmlContent The HTML content to display.
 */
function displayResult(id, htmlContent) {
    const resultDiv = document.getElementById(id);
    resultDiv.innerHTML = htmlContent;
    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleError(id, message) {
    displayResult(id, `<h3 style="color: #ef4444;">Calculation Error</h3><p><strong>Input Error:</strong> ${message}</p><p>Please check all your inputs and ensure they are valid numbers.</p>`);
}


// =================================================================
// UNIT TOGGLE & UI FUNCTIONS
// =================================================================

function updateUnitLabels(newUnit) {
    const labels = document.querySelectorAll('[data-label-imperial], [data-label-metric]');
    labels.forEach(el => {
        const imperialLabel = el.getAttribute('data-label-imperial');
        const metricLabel = el.getAttribute('data-label-metric');
        
        if (newUnit === 'metric' && metricLabel) {
            el.textContent = metricLabel;
        } else if (newUnit === 'imperial' && imperialLabel) {
            el.textContent = imperialLabel;
        }
    });
}

function initializeNavigation() {
    const navContainer = document.querySelector('.main-nav');
    if (!navContainer) return;
    
    navContainer.innerHTML = '';
    
    NAV_BUTTONS.forEach((tool) => {
        const button = document.createElement('a');
        button.href = `#${tool.id}-calculator`;
        button.className = 'nav-btn';
        button.textContent = tool.label;
        button.setAttribute('data-calculator', tool.id);
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            switchCalculator(tool.id);
            window.history.pushState(null, '', `#${tool.id}-calculator`);
        });
        navContainer.appendChild(button);
    });
}

function switchCalculator(targetId) {
    const fullTargetId = `${targetId}-calculator`;
    
    document.querySelectorAll('.calculator-box').forEach(calc => {
        calc.classList.add('hidden');
    });
    document.querySelectorAll('.result').forEach(res => {
        res.classList.add('hidden');
    });
    document.querySelectorAll('.main-nav .nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const targetElement = document.getElementById(fullTargetId);
    const targetButton = document.querySelector(`a[data-calculator="${targetId}"]`);

    if (targetElement) {
        targetElement.classList.remove('hidden');
        if (targetButton) {
            targetButton.classList.add('active');
        }
        document.querySelector('.tool-intro').classList.add('hidden');
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}


// =================================================================
// CORE CALCULATION FUNCTIONS
// =================================================================

// --- 1. Clean Agent Calculator (NFPA 2001) ---
function calculateCleanAgent() {
    const resultId = 'clean-agent-result';
    try {
        const L_imp = getInputValue('clean-agent-length', 'length');
        const W_imp = getInputValue('clean-agent-width', 'length');
        const H_imp = getInputValue('clean-agent-height', 'length');
        const T_imp = getInputValue('clean-agent-temp', 'temp');
        const ALT_imp = getInputValue('clean-agent-altitude', 'length');
        
        const agentType = document.getElementById('clean-agent-type').value;
        const C = getInputValue('clean-agent-conc', 'percent') / 100;

        let V_imp = L_imp * W_imp * H_imp; // Room Volume in Cu Ft

        // 1. Determine Agent Constants (NFPA 2001)
        let K1, K2_F; // K1 = volume factor (ft³/lb), K2_F = temp factor (°F + X)

        if (agentType === 'fm200') {
            K1 = 0.0743; 
            K2_F = 460;
        } else if (agentType === 'novec') {
            K1 = 0.0544; 
            K2_F = 459.7; 
        }

        // 2. Specific Volume (S) in ft³/lb
        // S = K1 + (K2_F / (T_imp + K2_F)); <-- This is complex. Let's use the NFPA simplified W formula instead.
        
        // Simplified approach using a typical specific volume S (ft³/lb) for the calculation
        // W (lbs) = V_imp * (C / (1 - C)) / S
        
        // Simplified Specific Volume (S) approximation:
        const S_approx = K1 * (1 + (T_imp - 70) * 0.002); // Simplified temp correction factor

        // W (lbs) = V_imp * (C / (1 - C)) / S_approx
        let W_lbs = (V_imp * (C / (1 - C))) / S_approx;

        // Apply altitude correction (approximate: 3.45% per 1000 ft or 0.00000345 per ft)
        // W_lbs = W_lbs * (1 + (ALT_imp * 0.00000345)); // Reversing the density loss
        // W_lbs = W_lbs * (1 + ALT_imp / 1000 * 0.0345); // More standard alt correction

        // Altitude correction factor for density at elevation (P_alt / P_sea_level)
        const Alt_Factor = 1 + (ALT_imp / 1000) * 0.0345;
        W_lbs *= Alt_Factor;


        let requiredMass, massUnit, requiredVolume, volumeUnit, resultHTML;
        
        // Format Output
        if (window.currentUnit === 'metric') {
            requiredMass = toMetric(W_lbs, 'weight').toFixed(2);
            massUnit = UNIT_RATIOS.weight.metricUnit;
            
            // Approximate Liquid Volume (m³/kg): Novac ≈ 0.686 L/kg, FM200 ≈ 0.638 L/kg
            let vol_ratio = (agentType === 'fm200') ? 0.638 : 0.686;
            requiredVolume = (parseFloat(requiredMass) * vol_ratio).toFixed(2);
            volumeUnit = UNIT_RATIOS.capacity.metricUnit;
        } else {
            requiredMass = W_lbs.toFixed(2);
            massUnit = UNIT_RATIOS.weight.imperialUnit;

            // Approximate Liquid Volume (Gallons/lb): Novac ≈ 0.073 Gal/lb, FM200 ≈ 0.076 Gal/lb
            let vol_ratio = (agentType === 'fm200') ? 0.076 : 0.073;
            requiredVolume = (parseFloat(requiredMass) * vol_ratio).toFixed(2);
            volumeUnit = UNIT_RATIOS.capacity.imperialUnit;
        }

        resultHTML = `
            <h3>Agent Calculation Results</h3>
            <p><strong>Room Volume:</strong> ${V_imp.toFixed(1)} ${UNIT_RATIOS.volume.imperialUnit}</p>
            <p><strong>Required Agent Mass (W):</strong> <strong>${requiredMass} ${massUnit}</strong></p>
            <p><strong>Approximate Liquid Volume:</strong> ${requiredVolume} ${volumeUnit}</p>
            <small>Note: This is an estimation based on simplified NFPA formulas and ambient temperature assumptions. Final calculations must use the agent manufacturer's software and specific constants.</small>
        `;

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}


// --- 2. Water Mist Calculator (Example only, NFPA 750 is complex) ---
function calculateWaterMist() {
    const resultId = 'water-mist-result';
    try {
        const A_imp = getInputValue('mist-area', 'area');
        const D_imp = getInputValue('mist-density', 'density'); // GPM/Sq Ft
        const T = getInputValue('mist-duration', 'time'); // Minutes

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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}

// --- 3. Foam System Calculator (NFPA 11) ---
function calculateFoam() {
    const resultId = 'foam-result';
    try {
        const A_imp = getInputValue('foam-area', 'area');
        const Rate_imp = getInputValue('foam-rate', 'density'); // GPM/Sq Ft
        const T = getInputValue('foam-duration', 'time'); // Minutes
        const C = getInputValue('foam-type', 'percent') / 100; // Concentrate % (e.g., 0.03)

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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}

// --- 4. CO2 System Calculator (NFPA 12) ---
function calculateCO2() {
    const resultId = 'co2-result';
    try {
        const L_imp = getInputValue('co2-length', 'length');
        const W_imp = getInputValue('co2-width', 'length');
        const H_imp = getInputValue('co2-height', 'length');
        const C_percent = getInputValue('co2-hazard', 'percent');

        const V_imp = L_imp * W_imp * H_imp; // Volume in Cu Ft
        
        // Wd (lbs/ft³) for various concentrations (simplified standard values):
        let Wd_lbs_ft3;
        if (C_percent === 34) Wd_lbs_ft3 = 0.057; // Class A Surface Fire
        else if (C_percent === 50) Wd_lbs_ft3 = 0.088; // Class B Flammable Liquid
        else if (C_percent === 65) Wd_lbs_ft3 = 0.125; // Deep-Seated Fire
        else Wd_lbs_ft3 = 0.01 + (C_percent / 100) * 0.176; // Liner approximation for others
        
        // W (lbs) = V_imp * Wd_lbs_ft3 (Simplified for estimation)
        const W_lbs = V_imp * Wd_lbs_ft3; 

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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}


// --- 5. Smoke Detector Spacing (NFPA 72) ---
function calculateSmokeSpacing() {
    const resultId = 'smoke-detector-result';
    try {
        const H_imp = getInputValue('smoke-height', 'length');
        const type = document.getElementById('smoke-type').value;

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
            // Approximation for beamed ceiling (reduced spacing)
            if (H_imp <= 10) S_imp = 20; // Reduced from 30ft
            else if (H_imp <= 30) {
                S_imp = 20 - 0.75 * (H_imp - 10);
            } else {
                S_imp = 10; 
            }
        }

        // Ensure S_imp is not negative or zero
        if (S_imp <= 0) S_imp = 10;
        
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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}


// --- 6. Battery Standby Calculator (NFPA 72) ---
function calculateBatteryAh() {
    const resultId = 'battery-result';
    try {
        const I_standby = getInputValue('standby-current', 'current'); // Amps
        const I_alarm = getInputValue('alarm-current', 'current'); // Amps
        const T_standby = getInputValue('standby-time', 'time'); // Hours
        const T_alarm = getInputValue('alarm-time', 'time'); // Minutes

        // Required Ah = (Standby Current * Standby Hours) + (Alarm Current * Alarm Minutes / 60)
        const Ah_required = (I_standby * T_standby) + (I_alarm * (T_alarm / 60));

        // Apply a safety factor (e.g., 25% margin)
        const Ah_min_rating = Ah_required * 1.25; 

        let resultHTML = `
            <h3>Battery Capacity Results (Ah)</h3>
            <p><strong>Minimum Required Capacity (Calculated):</strong> ${Ah_required.toFixed(2)} Ah</p>
            <p><strong>Minimum Recommended Battery Rating (with 25% Margin):</strong> <strong>${Ah_min_rating.toFixed(1)} Ah</strong></p>
            <small>This calculation meets the minimum NFPA 72 requirements (24 hours standby, 5/15 minutes alarm). Always use the Ah rating at the 20-hour rate from the battery manufacturer.</small>
        `;

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}

// --- 7. Voltage Drop Calculator (NEC/Fire Alarm) ---
function calculateVoltageDrop() {
    const resultId = 'voltage-drop-result';
    try {
        const CM = getInputValue('vd-gauge', 'c_mils'); // Circular Mils (already Imperial)
        const L_imp = getInputValue('vd-length', 'length'); // Length (ft)
        const I = getInputValue('vd-current', 'current'); // Current (Amps)
        const V_source = getInputValue('vd-source', 'voltage'); // Voltage (V)

        // 2-Wire DC Voltage Drop Formula: Vd = (2 * K * I * L) / CM
        // K = Resistivity of Copper (10.4 CM-Ohms/ft)
        const K = 10.4; 
        
        // Voltage Drop (Vd)
        const Vd = (2 * K * I * L_imp) / CM;

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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}

// --- 8. NAC Load Calculator ---
function calculateNACLoad() {
    const resultId = 'nac-load-result';
    try {
        const Limit = getInputValue('nac-panel-limit', 'current');
        const Strobe_Count = getInputValue('nac-strobe-count', 'count');
        const Strobe_Current = getInputValue('nac-strobe-current', 'current');
        const Speaker_Count = getInputValue('nac-speaker-count', 'count');
        const Speaker_Current = getInputValue('nac-speaker-current', 'current');

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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}

// --- 9. Fire Stopping Material Calculator ---
function calculateFireStopping() {
    const resultId = 'fire-stopping-result';
    try {
        const D_opening_imp = getInputValue('fs-opening-diam', 'diameter'); // Inches
        const D_penetration_imp = getInputValue('fs-penetration-diam', 'diameter'); // Inches
        const H_imp = getInputValue('fs-depth', 'diameter'); // Depth (Inches)

        // Annular area calculation: A_annular = (Pi/4) * (D_opening² - D_penetration²)
        const A_annular = (Math.PI / 4) * (Math.pow(D_opening_imp, 2) - Math.pow(D_penetration_imp, 2)); // Area in Sq Inches

        // Volume (Cu Inches) = Area * Depth
        const V_cu_inches = A_annular * H_imp;

        // Approximate coverage of a standard 10.3 oz sealant tube (approx 18-20 Cu In)
        const Tube_Volume_CuIn = 18; 
        const Tubes_required = V_cu_inches / Tube_Volume_CuIn;

        let resultHTML;
        
        // Format Output
        if (window.currentUnit === 'metric') {
            // Convert Cu In to Cu Ft (1728) then to m³ (0.0283)
            const V_cu_meters = V_cu_inches / 1728 * UNIT_RATIOS.volume.ratio; 
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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}

// --- 10. Fire Door Inspection Checklist (Non-Calculator) ---
function generateDoorChecklist() {
    const resultId = 'door-checklist-result';
    try {
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
        
        displayResult(resultId, summaryHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}


// --- 11. Fire Damper Guide (Non-Calculator) ---
function generateDamperGuide() {
    const resultId = 'fire-damper-result';
    try {
        const location = document.getElementById('damper-location').value;
        const hvac = document.getElementById('damper-hvac').value;

        let recommendation = '';
        let rating = '';

        if (!location || !hvac) {
            recommendation = 'Please select both a location and HVAC status.';
            rating = 'N/A';
        } else if (location === 'barrier') {
            rating = 'Minimum 1.5 Hour Fire Rating (NFPA 90A)';
            if (hvac === 'static') {
                recommendation = 'Fire Damper (FD) - For systems that shut down in a fire.';
            } else if (hvac === 'dynamic') {
                recommendation = 'Combination Fire/Smoke Damper (CSD) - For systems that remain operational for smoke control.';
                rating = 'Minimum 1.5 Hour Fire Rating + Smoke Leakage Class I or II.';
            }
        } else if (location === 'shaft') {
            rating = 'Minimum 3 Hour Fire Rating (IBC/NFPA 90A)';
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
        }

        let resultHTML = `
            <h3>Damper Recommendation Summary</h3>
            <p><strong>Location:</strong> ${location ? location.charAt(0).toUpperCase() + location.slice(1) : 'N/A'}</p>
            <p><strong>HVAC Status:</strong> ${hvac === 'static' ? 'Static (System Shutdown)' : hvac === 'dynamic' ? 'Dynamic (System Operational)' : 'N/A'}</p>
            <h4>Recommended Damper Type: <strong>${recommendation}</strong></h4>
            <p><strong>Required Rating:</strong> ${rating}</p>
            <small>This is a guide. Consult NFPA 90A, IBC, and local codes for definitive requirements based on barrier type and system design.</small>
        `;
        
        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}


// --- 12. Occupant Load Calculator (NFPA 101 / IBC) ---
function calculateOccupantLoad() {
    const resultId = 'occupant-result';
    try {
        const A_imp = getInputValue('floor-area', 'area'); // Area (Sq Ft)
        const factor = getInputValue('occupancy-type', 'area'); // Load Factor (Sq Ft/Occ)

        // Occupant Load = Area / Load Factor
        const OL = A_imp / factor;
        const OL_rounded = Math.ceil(OL); // Always round up per code

        let resultHTML;
        
        // Format Output
        if (window.currentUnit === 'metric') {
            const A_metric = toMetric(A_imp, 'area').toFixed(1);
            // Load factor is ratio of Area/Occ, so convert the area unit
            const factor_metric = factor / UNIT_RATIOS.area.ratio; 
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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}

// --- 13. Egress Width Calculator (NFPA 101 / IBC) ---
function calculateEgressWidth() {
    const resultId = 'egress-width-result';
    try {
        const OL = getInputValue('egress-occupant-load', 'count'); // Occupant Load
        const type = document.getElementById('egress-type').value; 
        const level = document.getElementById('egress-system-level').value; 

        // Load Factors (Inches per Occupant)
        let factor;
        if (type === 'stairs' && level === 'standard') factor = 0.3; // Standard (Unsprinkled) Stairs
        else if (type === 'stairs' && level === 'reduced') factor = 0.2; // Sprinkled/Reduced Stairs
        else if (type === 'other' && level === 'standard') factor = 0.2; // Standard (Unsprinkled) Other
        else if (type === 'other' && level === 'reduced') factor = 0.15; // Sprinkled/Reduced Other

        // Required Width (Inches) = Occupant Load * Factor
        const W_inches = OL * factor;
        
        // Required Width (Inches) rounded up to the nearest quarter inch
        const W_rounded_up = Math.ceil(W_inches * 4) / 4; 

        let resultHTML;
        
        // Format Output
        if (window.currentUnit === 'metric') {
            // Factor: Inches/Occ * 25.4 mm/Inch / 10 = cm/Occ
            const factor_metric_cm = (factor * UNIT_RATIOS.diameter.ratio) / 10;
            // Width: Inches * 25.4 mm/Inch / 10 = cm
            const W_cm = (W_rounded_up * UNIT_RATIOS.diameter.ratio) / 10;
            resultHTML = `
                <h3>Egress Width Results</h3>
                <p><strong>Occupant Load (OL):</strong> ${OL}</p>
                <p><strong>Egress Factor:</strong> ${factor_metric_cm.toFixed(2)} cm/Occ</p>
                <p><strong>Minimum Required Egress Width:</strong> <strong>${W_cm.toFixed(1)} cm</strong></p>
                <small>This width must be provided in total by all exit components for this area. Result rounded up to the next 0.5 cm.</small>
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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}


// --- 14. Emergency Lighting Point Calculator (Based on simplified inverse square law) ---
function calculateEmergencyLighting() {
    const resultId = 'emergency-lighting-result';
    try {
        const H_imp = getInputValue('el-mount-height', 'length'); // Height (ft)
        const C = getInputValue('el-lux-factor', 'candlepower'); // Candlepower (cd)
        const I_imp = getInputValue('el-min-lux', 'lux'); // Illuminance (ft-c)

        // Simplified Inverse Square Law: I = C / D²
        // D_max = sqrt(C / I) (Max distance from light to the ground point (ft))
        const D_max = Math.sqrt(C / I_imp); 

        // Maximum Spacing (S) between two fixtures: S = 2 * D_max 
        const S_imp = 2 * D_max; 

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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}


// --- 15. Hydrant Flow Calculator (NFPA 291) ---
function calculateHydrantFlow() {
    const resultId = 'hydrant-flow-result';
    try {
        const P_imp = getInputValue('pitot-pressure', 'pressure'); // Pitot Pressure (PSI)
        const D_imp = getInputValue('outlet-diameter', 'diameter'); // Diameter (Inches)
        const C = getInputValue('flow-coefficient', 'coefficient'); // Coefficient

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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}

// --- 16. Friction Loss Calculator (Hazen-Williams) ---
function calculateFrictionLoss() {
    const resultId = 'friction-loss-result';
    try {
        const D_imp = getInputValue('pipe-diameter', 'diameter'); // Diameter (Inches)
        const Q_imp = getInputValue('flow-rate', 'flow'); // Flow (GPM)
        const L_imp = getInputValue('pipe-length', 'length'); // Length (ft)
        const C = getInputValue('c-factor', 'coefficient'); // C-Factor

        // Hazen-Williams Formula (Imperial): P = 4.52 * Q^1.85 / (C^1.85 * D^4.87)
        // P = friction loss in PSI/ft
        
        // PSI/ft calculation
        const P_per_foot = 4.52 * Math.pow(Q_imp, 1.85) / (Math.pow(C, 1.85) * Math.pow(D_imp, 4.87));
        
        // Total Friction Loss (PSI)
        const Total_P_imp = P_per_foot * L_imp;

        let resultHTML;
        
        // Format Output
        if (window.currentUnit === 'metric') {
            // Total pressure loss in Bar
            const Total_P_bar = toMetric(Total_P_imp, 'pressure').toFixed(2); 
            // PSI/ft converted to PSI/m and then to Bar/m
            const P_per_meter = P_per_foot / UNIT_RATIOS.length.ratio; 
            const P_per_meter_bar = toMetric(P_per_meter, 'pressure').toFixed(3);

            resultHTML = `
                <h3>Friction Loss Results (Hazen-Williams)</h3>
                <p><strong>Friction Loss Per Meter:</strong> ${P_per_meter_bar} Bar/m</p>
                <p><strong>Total Friction Loss:</strong> <strong>${Total_P_bar} Bar</strong></p>
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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}

// --- 17. Required Fire Flow (NFPA 1142) ---
function calculateFireFlow() {
    const resultId = 'required-fire-flow-result';
    try {
        const A_imp = getInputValue('ff-area', 'area'); // Area (Sq Ft)
        const C = getInputValue('ff-construction', 'coefficient'); // C-Factor

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
                <small>This calculation is based on the NFPA 1142 formula (F = 18 * C * sqrt(A)). Flow is capped at 757 L/s (12,000 GPM).</small>
            `;
        } else {
            resultHTML = `
                <h3>Required Fire Flow Results</h3>
                <p><strong>Required Flow:</strong> <strong>${F_GPM.toFixed(0)} GPM</strong></p>
                <p><strong>Required Flow:</strong> ${F_GPM.toFixed(1)} Gallons/Minute</p>
                <small>This calculation is based on the NFPA 1142 formula (F = 18 * C * sqrt(A)). Flow is capped at 12,000 GPM.</small>
            `;
        }

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}

// --- 18. Fire Pump Sizing & Head Calculator ---
function calculatePumpSizing() {
    const resultId = 'fire-pump-result';
    try {
        const P_demand_imp = getInputValue('demand-pressure', 'pressure'); // Demand Pressure (PSI)
        const P_loss_imp = getInputValue('total-loss', 'pressure'); // Total Losses (PSI)
        const P_elev_imp = getInputValue('elevation-head', 'pressure'); // Elevation Head (PSI)
        const P_avail_imp = getInputValue('available-pressure', 'pressure'); // Available Pressure (PSI)
        const Q_imp = getInputValue('demand-flow', 'flow'); // Flow (GPM)

        // Required Pump Head (P_head) = Demand Pressure + Losses + Elevation Head - Available Pressure
        const P_head_imp = P_demand_imp + P_loss_imp + P_elev_imp - P_avail_imp;

        let resultHTML;
        
        // Format Output
        if (window.currentUnit === 'metric') {
            const P_head_bar = toMetric(P_head_imp, 'pressure').toFixed(2);
            const Q_Lps = toMetric(Q_imp, 'flow').toFixed(1);
            resultHTML = `
                <h3>Fire Pump Sizing Results</h3>
                <p><strong>Required Pump Capacity:</strong> <strong>${Q_Lps} L/s</strong></p>
                <p><strong>Minimum Required Pump Head:</strong> <strong>${P_head_bar} Bar</strong></p>
                <p><strong>Calculation:</strong> (P_demand + P_loss + P_elev) - P_avail = ${P_head_bar} Bar</p>
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

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}


// =================================================================
// EVENT LISTENERS & INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();

    // 1. UNIT SWITCH HANDLER
    const unitSwitch = document.getElementById('unit-switch');
    if (unitSwitch) {
        unitSwitch.addEventListener('change', function() {
            window.currentUnit = this.value;
            updateUnitLabels(window.currentUnit);
            // Could re-run calculation on current visible calculator here if desired
        });
    }

    // 2. CALCULATOR FORM SUBMISSION LISTENERS
    document.getElementById('clean-agent-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateCleanAgent();
    });
    document.getElementById('water-mist-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateWaterMist();
    });
    document.getElementById('foam-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateFoam();
    });
    document.getElementById('co2-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateCO2();
    });
    document.getElementById('smoke-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateSmokeSpacing();
    });
    document.getElementById('battery-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateBatteryAh();
    });
    document.getElementById('voltage-drop-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateVoltageDrop();
    });
    document.getElementById('nac-load-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateNACLoad();
    });
    document.getElementById('fire-stopping-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateFireStopping();
    });
    document.getElementById('door-checklist-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        generateDoorChecklist();
    });
    document.getElementById('damper-guide-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        generateDamperGuide();
    });
    document.getElementById('occupant-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateOccupantLoad();
    });
    document.getElementById('egress-width-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateEgressWidth();
    });
    document.getElementById('emergency-lighting-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateEmergencyLighting();
    });
    document.getElementById('hydrant-flow-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateHydrantFlow();
    });
    document.getElementById('friction-loss-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateFrictionLoss();
    });
    document.getElementById('fireflow-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateFireFlow();
    });
    document.getElementById('fire-pump-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        calculatePumpSizing();
    });
    
    // Initial unit label update
    updateUnitLabels(window.currentUnit);

    // Handle URL hash for deep linking to a specific calculator
    const urlHash = window.location.hash.substring(1); // Remove '#'
    if (urlHash) {
        switchCalculator(urlHash.replace('-calculator', ''));
    } else {
         // Default: show the first calculator or the introductory text
         const firstCalculator = document.querySelector('.calculator-box');
         if (firstCalculator) {
            // Note: Use a more robust check in the main application logic
         }
    }
});

// Expose the function to window for click handlers in index.html (like main-nav)
window.showCalculator = switchCalculator;
