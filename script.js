// =================================================================
// GLOBAL STATE & UTILITIES (Refactored for robustness)
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
    density: { ratio: 40.743, imperialUnit: 'GPM/Sq Ft', metricUnit: 'LPM/m²' }, // 1 GPM/Sq Ft = 40.743 LPM/m²
};

const NAV_BUTTONS = [
    // Suppression Systems
    { id: 'clean-agent', label: 'Clean Agent' },
    { id: 'foam', label: 'Foam System' },
    { id: 'co2', label: 'CO₂ System' },
    { id: 'water-mist', label: 'Water Mist' },
    // Detection & Alarm Systems
    { id: 'battery', label: 'Battery Standby' },
    { id: 'voltage-drop', label: 'Voltage Drop' },
    { id: 'nac-load', label: 'NAC Load' },
    { id: 'smoke-detector', label: 'Smoke Spacing' },
    // Passive Fire Protection
    { id: 'fire-stopping', label: 'Fire Stopping' },
    { id: 'fire-door-checklist', label: 'Door Checklist' },
    { id: 'fire-damper-guide', label: 'Damper Guide' },
    // Egress & Emergency Planning
    { id: 'occupant', label: 'Occupant Load' },
    { id: 'egress-width', label: 'Egress Width' },
    { id: 'emergency-lighting', label: 'Emerg. Light' },
    // Hydrants & Water Supply
    { id: 'hydrant-flow', label: 'Hydrant Flow' },
    { id: 'friction-loss', label: 'Friction Loss' },
    { id: 'required-fire-flow', label: 'Required Fire Flow' },
    { id: 'fire-pump', label: 'Fire Pump Sizing' },
];

/**
 * Converts a value between Imperial and Metric based on the current global unit and the conversion type.
 * @param {number} value The value to convert.
 * @param {string} type The type of measurement ('length', 'flow', etc.).
 * @param {string} toUnit The target unit system ('imperial' or 'metric').
 * @returns {number} The converted value.
 */
function convertValue(value, type, toUnit) {
    const { ratio } = UNIT_RATIOS[type];
    if (toUnit === 'metric') {
        if (type === 'diameter') { return value * ratio; } // Inches to mm
        if (type === 'density') { return value * ratio; } // GPM/SqFt to LPM/m^2 (special)
        return value * ratio;
    } else { // toUnit === 'imperial'
        if (type === 'diameter') { return value / ratio; } // mm to Inches
        if (type === 'density') { return value / ratio; } // LPM/m^2 to GPM/SqFt (special)
        return value / ratio;
    }
}

/**
 * Gets the unit label for the current unit system.
 * @param {string} type The type of measurement ('length', 'flow', etc.).
 * @returns {string} The unit label.
 */
function getUnitLabel(type) {
    if (!UNIT_RATIOS[type]) return '';
    return currentUnit === 'imperial' ? UNIT_RATIOS[type].imperialUnit : UNIT_RATIOS[type].metricUnit;
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
    if (isNaN(value) || value <= 0) {
        if (element.hasAttribute('min') && parseFloat(element.getAttribute('min')) > 0) {
            throw new Error(`Please enter a valid, positive value for ${element.labels[0].textContent}.`);
        }
    }

    if (currentUnit === 'metric' && UNIT_RATIOS[type]) {
        // Convert the metric input back to imperial base unit for internal calculation
        const { ratio } = UNIT_RATIOS[type];
        if (type === 'diameter') { return value / ratio; } // mm to Inches
        if (type === 'density') { return value / ratio; } // LPM/m^2 to GPM/SqFt (special)
        return value / ratio;
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
    displayResult(id, `<h3 style="color: #ef4444;">Calculation Error</h3><p><strong>Input Error:</strong> ${message}</p><p>Please check all your inputs and ensure they are positive, valid numbers.</p>`);
}

// =================================================================
// UNIT TOGGLE & UI FUNCTIONS
// =================================================================

function updateUnitLabels(newUnit) {
    const labels = document.querySelectorAll('label[data-label-imperial], input[data-label-imperial]');
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
    navContainer.innerHTML = '';
    
    NAV_BUTTONS.forEach((tool, index) => {
        const button = document.createElement('a');
        button.href = `#${tool.id}`;
        button.className = 'nav-btn';
        button.textContent = tool.label;
        button.setAttribute('data-calculator', tool.id);
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            switchCalculator(tool.id);
            // Update URL hash for sharing/bookmarking
            window.history.pushState(null, '', `#${tool.id}`);
        });
        navContainer.appendChild(button);
    });
}

function switchCalculator(targetId) {
    document.querySelectorAll('.calculator-box').forEach(calc => {
        calc.classList.add('hidden');
    });
    document.querySelectorAll('.result').forEach(res => {
        res.classList.add('hidden');
    });
    document.querySelectorAll('.main-nav .nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const targetElement = document.getElementById(`${targetId}-calculator`);
    const targetButton = document.querySelector(`a[data-calculator="${targetId}"]`);
    
    if (targetElement) {
        targetElement.classList.remove('hidden');
        if (targetButton) {
            targetButton.classList.add('active');
        }
        // Scroll the element into view, ensuring it's below the fixed header
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}


// =================================================================
// 1. SUPPRESSION SYSTEMS CALCULATORS (4 NEW)
// =================================================================

// Clean Agent / Gas Suppression System Calculator
function calculateCleanAgent() {
    try {
        const L_ft = getInputValue('clean-agent-length', 'length');
        const W_ft = getInputValue('clean-agent-width', 'length');
        const H_ft = getInputValue('clean-agent-height', 'length');
        const T_F = currentUnit === 'imperial' ? getInputValue('clean-agent-temp', 'temp') : (getInputValue('clean-agent-temp', 'temp') * 1.8 + 32); // Convert C to F if needed for formula
        const C_percent = getInputValue('clean-agent-conc', 'percent');
        const AgentType = document.getElementById('clean-agent-type').value;
        const Alt_ft = getInputValue('clean-agent-altitude', 'length');
        
        const V_ft3 = L_ft * W_ft * H_ft;
        
        // NFPA 2001 Formula: W = (V/S) * (C / (100 - C))
        // S = Specific Volume at Temp T
        let S_ft3_lb; 
        
        if (AgentType === 'fm200') {
            // HFC-227ea (FM-200) S = 1.885 + 0.0046 * T(F)
            S_ft3_lb = 1.885 + 0.0046 * T_F;
        } else { // novec
            // FK-5-1-12 (Novec 1230) S = 1.83 + 0.0049 * T(F) (Approximate industry formula)
            S_ft3_lb = 1.83 + 0.0049 * T_F;
        }

        if (S_ft3_lb <= 0) {
             throw new Error("Calculated Specific Volume is zero or less. Check room temperature input.");
        }

        const W_lb_no_alt = (V_ft3 / S_ft3_lb) * (C_percent / (100 - C_percent));

        // Altitude Correction Factor (approximate, based on standard atmospheric pressure correction)
        // P_altitude / P_sea_level = (1 - (6.875e-6 * Altitude_ft))^5.256
        const AltitudeFactor = Math.pow(1 - (6.875e-6 * Alt_ft), 5.256);
        
        const W_lb_required = W_lb_no_alt / AltitudeFactor;
        
        // Convert to selected units for output
        const V_out = convertValue(V_ft3, 'volume', currentUnit);
        const W_out = convertValue(W_lb_required, 'weight', currentUnit);
        const agentUnit = getUnitLabel('weight');
        const volumeUnit = getUnitLabel('volume');
        const standardCylinderSize_lb = 100; // 100 lb cylinder is common
        
        const numCylinders = Math.ceil(W_lb_required / standardCylinderSize_lb);

        let html = `
            <h3>Required Agent Quantity</h3>
            <p><strong>Total Hazard Volume:</strong> ${V_out.toFixed(2)} ${volumeUnit}</p>
            <p><strong>Calculated Agent Mass:</strong> ${W_out.toFixed(2)} ${agentUnit}</p>
            <p><strong>Estimated Cylinders (100 ${UNIT_RATIOS.weight.imperialUnit} size):</strong> ${numCylinders} units</p>
            <small>Note: Assumes ideal agent distribution and volume of non-combustible solids is zero. Agent density factors vary by manufacturer and specific agent (NFPA 2001).</small>
        `;
        displayResult('clean-agent-result', html);

    } catch (error) {
        handleError('clean-agent-result', error.message);
    }
}


// Water Mist System Calculator
function calculateWaterMist() {
    try {
        const Area_sqft = getInputValue('mist-area', 'area');
        const Density_gpm_sqft = getInputValue('mist-density', 'density');
        const Duration_min = parseFloat(document.getElementById('mist-duration').value);

        // Required Flow (GPM) = Area (sqft) * Density (GPM/sqft)
        const Flow_GPM = Area_sqft * Density_gpm_sqft;

        // Total Water Volume (Gallons) = Flow (GPM) * Duration (min)
        const TotalWater_Gal = Flow_GPM * Duration_min;

        // Output Conversions
        const Flow_out = convertValue(Flow_GPM, 'flow', currentUnit);
        const FlowUnit = getUnitLabel('flow');
        
        let TotalWater_out;
        let TotalWaterUnit;

        if (currentUnit === 'imperial') {
            TotalWater_out = TotalWater_Gal;
            TotalWaterUnit = 'Gallons';
        } else {
            TotalWater_out = TotalWater_Gal * 3.78541; // US Gallons to Liters
            TotalWaterUnit = 'Liters';
        }

        let html = `
            <h3>Water Mist System Requirements</h3>
            <p><strong>Estimated Water Flow Rate:</strong> ${Flow_out.toFixed(2)} ${FlowUnit}</p>
            <p><strong>Total Required Water Storage:</strong> ${TotalWater_out.toFixed(0)} ${TotalWaterUnit}</p>
            <p><strong>Pump Sizing Estimate:</strong> Pump must deliver ${Flow_out.toFixed(0)} ${FlowUnit} at the system's required pressure.</p>
            <small>This is a simplified density calculation. Actual pump sizing and pressure are highly dependent on the system listing (e.g., NFPA 750), nozzle K-factors, and piping friction loss.</small>
        `;
        displayResult('water-mist-result', html);

    } catch (error) {
        handleError('water-mist-result', error.message);
    }
}

// Foam System Calculator
function calculateFoam() {
    try {
        const Area_sqft = getInputValue('foam-area', 'area');
        const FoamRate_gpm_sqft = getInputValue('foam-rate', 'density');
        const FoamConc_percent = parseFloat(document.getElementById('foam-type').value);
        const Duration_min = parseFloat(document.getElementById('foam-duration').value);

        // Total Solution Flow (GPM) = Area (sqft) * Rate (GPM/sqft)
        const SolutionFlow_GPM = Area_sqft * FoamRate_gpm_sqft;

        // Total Solution Volume (Gallons) = Flow (GPM) * Duration (min)
        const SolutionVolume_Gal = SolutionFlow_GPM * Duration_min;

        // Foam Concentrate Volume (Gallons) = Solution Volume * (Concentrate % / 100)
        const ConcentrateVolume_Gal = SolutionVolume_Gal * (FoamConc_percent / 100);

        // Recommended Reserve: NFPA 11 suggests reserves (often 10-30 min) or double quantity for initial design
        const TotalConcentrate_Gal = ConcentrateVolume_Gal * 2; 

        // Output Conversions
        const SolutionFlow_out = convertValue(SolutionFlow_GPM, 'flow', currentUnit);
        const ConcentrateVolume_out = convertValue(TotalConcentrate_Gal, 'flow', currentUnit); // Using flow ratio for consistency (1 Gal = ~3.785 L)
        
        let SolutionVolume_out;
        let ConcentrateUnit;
        let SolutionUnit;

        if (currentUnit === 'imperial') {
            ConcentrateUnit = 'Gallons (US)';
            SolutionUnit = 'Gallons (US)';
            SolutionVolume_out = SolutionVolume_Gal;
        } else {
            ConcentrateUnit = 'Liters';
            SolutionUnit = 'Liters';
            SolutionVolume_out = SolutionVolume_Gal * 3.78541;
        }

        let html = `
            <h3>Foam System Requirements (NFPA 11 Basis)</h3>
            <p><strong>Required Foam Solution Flow:</strong> ${SolutionFlow_out.toFixed(2)} ${getUnitLabel('flow')}</p>
            <p><strong>Total Foam Solution Volume:</strong> ${SolutionVolume_out.toFixed(0)} ${SolutionUnit}</p>
            <p><strong>Minimum Foam Concentrate Volume:</strong> ${ConcentrateVolume_out.toFixed(0)} ${ConcentrateUnit} (For ${Duration_min} min discharge)</p>
            <p><strong>Recommended Total Concentrate (w/Reserve):</strong> ${(TotalConcentrate_Gal * (currentUnit === 'metric' ? 3.78541 : 1)).toFixed(0)} ${ConcentrateUnit}</p>
            <small>This calculation determines the minimum required amount of concentrate. Final design must account for piping, injection system, and required reserve capacity (usually double the primary supply).</small>
        `;
        displayResult('foam-result', html);

    } catch (error) {
        handleError('foam-result', error.message);
    }
}

// CO2 System Calculator
function calculateCO2() {
    try {
        const L_ft = getInputValue('co2-length', 'length');
        const W_ft = getInputValue('co2-width', 'length');
        const H_ft = getInputValue('co2-height', 'length');
        const HazardConc_percent = parseFloat(document.getElementById('co2-hazard').value);

        const V_ft3 = L_ft * W_ft * H_ft;
        
        // Industry Standard Formula for CO2 (lb per cubic foot)
        // Specific density factor varies slightly, but common for flooding is:
        // 1 lb of CO2 occupies approx 8.5 cu ft at 70F. Density factor = 1/8.5 = 0.1176 lb/ft3
        const StandardDensityFactor = 0.1176; 

        // Required Density Factor (lb/ft3) = Standard Density * (Required Conc / Standard Conc)
        // Standard Conc is usually 34% (for minimum Class A)
        const CalculatedDensityFactor = StandardDensityFactor * (HazardConc_percent / 34);

        const W_lb_required = V_ft3 * CalculatedDensityFactor;
        
        // Output Conversions
        const V_out = convertValue(V_ft3, 'volume', currentUnit);
        const W_out = convertValue(W_lb_required, 'weight', currentUnit);
        const weightUnit = getUnitLabel('weight');
        const volumeUnit = getUnitLabel('volume');
        const standardCylinderSize_lb = 100; // 100 lb cylinder is common

        const numCylinders = Math.ceil(W_lb_required / standardCylinderSize_lb);

        let html = `
            <h3>Required CO₂ Quantity (NFPA 12)</h3>
            <p><strong>Total Hazard Volume:</strong> ${V_out.toFixed(2)} ${volumeUnit}</p>
            <p><strong>Calculated Minimum CO₂ Mass:</strong> ${W_out.toFixed(2)} ${weightUnit}</p>
            <p><strong>Estimated Cylinders (100 ${UNIT_RATIOS.weight.imperialUnit} size):</strong> ${numCylinders} units</p>
            <small>Density factor is based on a volume-per-concentration relationship. For total flooding, NFPA 12 requires a minimum 34% concentration for surface fires, and up to 65% for deep-seated fires (not calculated here).</small>
        `;
        displayResult('co2-result', html);

    } catch (error) {
        handleError('co2-result', error.message);
    }
}


// =================================================================
// 2. DETECTION & ALARM SYSTEMS CALCULATORS (4 NEW/ENHANCED)
// =================================================================

// Smoke Detector Spacing Calculator (Enhanced Existing)
function calculateSmokeDetectorSpacing() {
    try {
        const H_ft = getInputValue('smoke-height', 'length');
        const CeilingType = document.getElementById('smoke-type').value;

        let S_ft; // Spacing
        let R_ft; // Radius of Coverage

        if (CeilingType === 'beamed') {
            // NFPA 72 requires detectors in every pocket of a beamed ceiling if beams are deeper than 10% of height
            S_ft = 'Install within each beam pocket.';
            R_ft = 'N/A';
        } else {
            // Standard rule for smooth ceilings (NFPA 72 Table 17.5.3.2.1)
            if (H_ft <= 10) {
                // H <= 10 ft (3.05 m): Max spacing is 30 ft, Max radius is 21.2 ft (21.2 * sqrt(2) approx 30)
                R_ft = 21.2;
            } else if (H_ft > 10 && H_ft <= 30) {
                // Spacing Reduction Factor (S = 30 * (1 - 0.5 * (H-10)/30))
                R_ft = 21.2 * (1 - 0.5 * (H_ft - 10) / 30);
            } else {
                R_ft = 0; // Above 30ft requires special consideration/engineering
            }

            if (R_ft <= 0) {
                S_ft = 'Special Engineering Required (Height > 30ft)';
                R_ft = 0;
            } else {
                S_ft = R_ft * Math.sqrt(2); // Diagonal Spacing = R * sqrt(2)
            }
        }
        
        // Output Conversions
        const H_out = convertValue(H_ft, 'length', currentUnit);
        const L_unit = getUnitLabel('length');
        
        let S_out;
        let R_out;
        
        if (typeof S_ft === 'number') {
            S_out = convertValue(S_ft, 'length', currentUnit).toFixed(1);
            R_out = convertValue(R_ft, 'length', currentUnit).toFixed(1);
            S_ft = `${S_out} ${L_unit}`;
        } else {
            S_out = S_ft;
            R_out = 'N/A';
        }


        let html = `
            <h3>Detector Spacing Results</h3>
            <p><strong>Maximum Radius of Coverage:</strong> ${R_out} ${L_unit}</p>
            <p><strong>Maximum Linear Spacing:</strong> <strong>${S_out}</strong></p>
            <p><strong>Placement Note:</strong> Detector should be placed no further than <strong>${R_out} ${L_unit}</strong> from any point in the room, including walls (max half spacing to walls).</p>
            <small>Based on NFPA 72, 2022 Edition. Linear spacing is used for calculating grid placement (Spacing = 1.41 * Radius).</small>
        `;
        displayResult('smoke-detector-result', html);

    } catch (error) {
        handleError('smoke-detector-result', error.message);
    }
}

// Battery Standby Calculator (Enhanced Existing)
function calculateBattery() {
    try {
        const I_standby = parseFloat(document.getElementById('standby-current').value);
        const I_alarm = parseFloat(document.getElementById('alarm-current').value);
        const T_standby = parseFloat(document.getElementById('standby-time').value);
        const T_alarm_min = parseFloat(document.getElementById('alarm-time').value);

        // Convert alarm time from minutes to hours
        const T_alarm_hr = T_alarm_min / 60;
        
        // NFPA 72 Calculation: Standby Capacity + Alarm Capacity. Safety margin (1.25) is an industry practice for robust sizing.
        const StandbyCapacity_Ah = I_standby * T_standby;
        const AlarmCapacity_Ah = I_alarm * T_alarm_hr;

        const TotalCapacity_Ah = StandbyCapacity_Ah + AlarmCapacity_Ah;
        
        // Apply 25% safety margin, common in engineering practice
        const RequiredCapacity_Ah = TotalCapacity_Ah * 1.25; 

        let html = `
            <h3>Required Battery Capacity (Ah)</h3>
            <p><strong>Standby Load Capacity:</strong> ${StandbyCapacity_Ah.toFixed(2)} Ah</p>
            <p><strong>Alarm Load Capacity:</strong> ${AlarmCapacity_Ah.toFixed(2)} Ah</p>
            <p><strong>Total Capacity Required (Unadjusted):</strong> ${TotalCapacity_Ah.toFixed(2)} Ah</p>
            <p><strong>Recommended Minimum Battery Size (with 25% Safety Factor):</strong> <strong>${RequiredCapacity_Ah.toFixed(2)} Ah</strong></p>
            <small>Final battery selection must ensure the panel's charger can recharge the batteries within 48 hours per NFPA 72.</small>
        `;
        displayResult('battery-result', html);
    } catch (error) {
        handleError('battery-result', error.message);
    }
}

// Voltage Drop Calculator (New)
function calculateVoltageDrop() {
    try {
        const CM_area = parseFloat(document.getElementById('vd-gauge').value); // Circular Mils (A)
        const L_ft = getInputValue('vd-length', 'length'); // One-way length (L)
        const I_amps = parseFloat(document.getElementById('vd-current').value); // Current (I)
        const V_source = parseFloat(document.getElementById('vd-source').value); // Source Voltage
        
        // K is the resistivity constant for copper (12.9)
        const K_copper = 12.9; 

        // Formula: Vdrop = (2 * K * I * L) / A
        const V_drop = (2 * K_copper * I_amps * L_ft) / CM_area;

        const V_end = V_source - V_drop;
        const Drop_percent = (V_drop / V_source) * 100;
        
        let flag = '';
        if (V_end < V_source * 0.8) {
             flag = '<p style="color: #ef4444; font-weight: bold;">⚠️ Critical Failure: Voltage at the end of the line is less than 80% of source. The circuit is likely overloaded or wire size is too small!</p>';
        } else if (Drop_percent > 5) {
             flag = '<p style="color: #fbbf24; font-weight: bold;">⚠ Warning: Voltage drop is greater than 5%. Consider a larger wire gauge or shorter run.</p>';
        }

        // Output Conversions
        const L_out = convertValue(L_ft, 'length', currentUnit).toFixed(0);
        const L_unit = getUnitLabel('length');

        let html = `
            <h3>Voltage Drop Analysis</h3>
            <p><strong>Wire Resistance Factor (K):</strong> ${K_copper} Ohm-cmil/ft (for copper)</p>
            <p><strong>Total Voltage Drop:</strong> ${V_drop.toFixed(2)} Volts</p>
            <p><strong>Voltage at End of Line:</strong> ${V_end.toFixed(2)} Volts</p>
            <p><strong>Voltage Drop Percentage:</strong> ${Drop_percent.toFixed(2)} %</p>
            ${flag}
            <small>This calculation is for DC power. Always check the minimum operating voltage of your Notification Appliances.</small>
        `;
        displayResult('voltage-drop-result', html);

    } catch (error) {
        handleError('voltage-drop-result', error.message);
    }
}

// NAC Load Calculator (New)
function calculateNACLoad() {
    try {
        const PanelLimit_amps = parseFloat(document.getElementById('nac-panel-limit').value);
        const StrobeCount = parseFloat(document.getElementById('nac-strobe-count').value);
        const StrobeCurrent = parseFloat(document.getElementById('nac-strobe-current').value);
        const SpeakerCount = parseFloat(document.getElementById('nac-speaker-count').value);
        const SpeakerCurrent = parseFloat(document.getElementById('nac-speaker-current').value);

        const TotalLoad_amps = (StrobeCount * StrobeCurrent) + (SpeakerCount * SpeakerCurrent);
        
        let status = '';
        if (TotalLoad_amps > PanelLimit_amps) {
             status = '<p style="color: #ef4444; font-weight: bold;">🚨 OVERLOAD WARNING: Total load exceeds panel limit. You MUST reduce devices or add a booster panel/power supply.</p>';
        } else if (TotalLoad_amps > PanelLimit_amps * 0.9) {
             status = '<p style="color: #fbbf24; font-weight: bold;">⚠ Warning: Load is close to the panel limit. Consider adding a booster or splitting the circuit.</p>';
        } else {
             status = '<p style="color: #10b981; font-weight: bold;">✅ Load is Acceptable.</p>';
        }

        const safetyMargin = PanelLimit_amps - TotalLoad_amps;

        let html = `
            <h3>NAC Circuit Load Results</h3>
            <p><strong>Total Strobe/Horn Load:</strong> ${(StrobeCount * StrobeCurrent).toFixed(2)} Amps</p>
            <p><strong>Total Speaker Load:</strong> ${(SpeakerCount * SpeakerCurrent).toFixed(2)} Amps</p>
            <p><strong>Total Circuit Load:</strong> <strong>${TotalLoad_amps.toFixed(2)} Amps</strong></p>
            <p><strong>Panel Capacity Remaining:</strong> ${safetyMargin.toFixed(2)} Amps</p>
            ${status}
            <small>Total load must be verified against the panel's specifications. Always use the current draw published by the manufacturer for the specific candela setting.</small>
        `;
        displayResult('nac-load-result', html);

    } catch (error) {
        handleError('nac-load-result', error.message);
    }
}

// =================================================================
// 3. PASSIVE FIRE PROTECTION (3 NEW)
// =================================================================

// Fire Stopping Material Calculator
function calculateFireStopping() {
    try {
        const D_opening_in = getInputValue('fs-opening-diam', 'diameter');
        const D_penetration_in = getInputValue('fs-penetration-diam', 'diameter');
        const Depth_in = getInputValue('fs-depth', 'diameter');

        if (D_penetration_in >= D_opening_in) {
            throw new Error("Penetration diameter must be smaller than the opening diameter.");
        }

        // Formula for Annular Space Volume (Cylinder Volume): V = PI * (R_opening^2 - R_penetration^2) * Depth
        const R_opening_in = D_opening_in / 2;
        const R_penetration_in = D_penetration_in / 2;

        const V_cubic_in = Math.PI * (Math.pow(R_opening_in, 2) - Math.pow(R_penetration_in, 2)) * Depth_in;
        
        // Convert cubic inches to cubic feet (1728 in^3 = 1 ft^3)
        const V_cubic_ft = V_cubic_in / 1728;
        
        // Convert V_cubic_ft to cubic meters for metric
        const V_cubic_m = V_cubic_ft * UNIT_RATIOS.volume.ratio; 

        // Output Conversions
        let V_out;
        let V_unit;
        let V_metric_out; // For displaying metric volume equivalent

        if (currentUnit === 'imperial') {
            V_out = V_cubic_ft;
            V_unit = 'Cubic Feet (ft³)';
            V_metric_out = V_cubic_m;
        } else {
            V_out = V_cubic_m;
            V_unit = 'Cubic Meters (m³)';
            V_metric_out = V_cubic_m;
        }
        
        // For packaging reference: 1 gallon of sealant is approx 0.1337 ft³ or 0.00378 m³
        const Gallons_required = V_cubic_ft / 0.1337;
        
        let html = `
            <h3>Material Volume Estimate</h3>
            <p><strong>Calculated Volume Required:</strong> <strong>${V_out.toFixed(4)} ${V_unit}</strong></p>
            <p><strong>Approximate Gallons of Sealant:</strong> ${Gallons_required.toFixed(2)} US Gallons</p>
            <small>This is the required net volume. Always add a 10-20% margin for waste and ensure the material volume is sufficient for the fire rating (e.g., 1-inch depth for a 1-hour wall).</small>
        `;
        displayResult('fire-stopping-result', html);

    } catch (error) {
        handleError('fire-stopping-result', error.message);
    }
}

// Fire Door Inspection Checklist Generator
function generateDoorChecklist() {
    const checks = ['gap-check', 'latch-check', 'closer-check', 'hinge-check'];
    let failCount = 0;
    let failurePoints = [];

    const failureMap = {
        'gap-check': 'Excessive gaps (more than 3/4") were noted. This compromises fire resistance.',
        'latch-check': 'The door did not latch securely. A failure to latch means the door cannot resist fire or smoke.',
        'closer-check': 'The door failed to close and latch automatically. The closer/holder requires repair or adjustment.',
        'hinge-check': 'Hardware (hinges, bolts, screws) was damaged or missing. Replace hardware immediately.',
    };

    checks.forEach(id => {
        const value = document.getElementById(id).value;
        if (value === 'no') {
            failCount++;
            failurePoints.push(failureMap[id]);
        }
    });

    let overallStatus;
    if (failCount > 0) {
        overallStatus = `<h3 style="color: #ef4444;">🚨 FAILED INSPECTION: ${failCount} Major Non-Conformity(s)</h3>`;
    } else {
        overallStatus = `<h3 style="color: #10b981;">✅ PASSED INSPECTION</h3>`;
    }

    let failureDetails = '';
    if (failurePoints.length > 0) {
        failureDetails = '<h4>Required Actions:</h4><ul>';
        failurePoints.forEach(point => {
            failureDetails += `<li>${point}</li>`;
        });
        failureDetails += '</ul>';
    }

    let html = `
        ${overallStatus}
        <p><strong>Door Inspection Date:</strong> ${new Date().toLocaleDateString()}</p>
        ${failureDetails}
        <small>NFPA 80 (Standard for Fire Doors) requires annual inspection. Any 'Fail' item must be corrected immediately to restore fire rating integrity.</small>
    `;
    displayResult('fire-door-result', html);
}

// Fire Damper & Smoke Damper Selection Guide
function generateDamperGuide() {
    const location = document.getElementById('damper-location').value;
    const hvac = document.getElementById('damper-hvac').value;

    let recommendation = '';
    let standards = '';

    if (!location || !hvac) {
        handleError('fire-damper-result', 'Please select both a Location and HVAC System Status.');
        return;
    }

    if (location === 'barrier') {
        recommendation = 'Fire Damper (Curtain or Blade Type)';
        standards = 'NFPA 90A, UL 555. Requires 1.5 or 3-hour fire rating.';
    } else if (location === 'shaft') {
        if (hvac === 'static') {
            recommendation = 'Combination Fire/Smoke Damper (Static Operation)';
            standards = 'NFPA 90A, UL 555 (Fire), UL 555S (Smoke). Must have fire and smoke ratings.';
        } else if (hvac === 'dynamic') {
            recommendation = 'Combination Fire/Smoke Damper (Dynamic Operation)';
            standards = 'NFPA 90A, UL 555 (Fire), UL 555S (Smoke). This is required when the HVAC system remains running during a fire.';
        }
    } else if (location === 'duct') {
        recommendation = 'Smoke Damper (Minimum requirement, typically combined with fire)';
        standards = 'UL 555S. Should be combined with a fire damper (Combination Damper) if penetrating a rated assembly.';
    }
    
    let html = `
        <h3>Damper Selection Recommendation</h3>
        <p><strong>Recommended Damper Type:</strong> <strong>${recommendation}</strong></p>
        <p><strong>Key Standards:</strong> ${standards}</p>
        <small>Always verify the AHJ (Authority Having Jurisdiction) requirements. Combination dampers (Fire/Smoke) are often the safest choice for high-rise or large buildings with smoke control systems.</small>
    `;
    displayResult('fire-damper-result', html);
}

// =================================================================
// 4. EGRESS & EMERGENCY PLANNING CALCULATORS (3 NEW/ENHANCED)
// =================================================================

// Occupant Load Calculator (Enhanced Existing)
function calculateOccupantLoad() {
    try {
        const Area_sqft = getInputValue('floor-area', 'area');
        const Factor = parseFloat(document.getElementById('occupancy-type').value);

        // Occupant Load = Area / Factor
        const OccupantLoad = Area_sqft / Factor;
        
        // Output Conversion
        const Area_out = convertValue(Area_sqft, 'area', currentUnit);
        const Area_unit = getUnitLabel('area');

        let html = `
            <h3>Calculated Occupant Load (NFPA 101 / IBC)</h3>
            <p><strong>Total Area:</strong> ${Area_out.toFixed(1)} ${Area_unit}</p>
            <p><strong>Calculated Occupant Load:</strong> <strong>${Math.floor(OccupantLoad)} persons</strong></p>
            <p><strong>Egress Requirement:</strong> Design exits to accommodate a minimum of ${Math.floor(OccupantLoad)} occupants.</p>
            <small>The Occupant Load Factor must be carefully selected based on the specific use of the space (e.g., Business vs. Assembly). Always use the gross area for gross factor and net area for net factor.</small>
        `;
        displayResult('occupant-result', html);

    } catch (error) {
        handleError('occupant-result', error.message);
    }
}

// Egress Width Calculator (New)
function calculateEgressWidth() {
    try {
        const OccupantLoad = parseFloat(document.getElementById('egress-occupant-load').value);
        const EgressType = document.getElementById('egress-type').value;
        const SystemLevel = document.getElementById('egress-system-level').value;

        let Factor_in_per_occ; // Inches per occupant

        if (EgressType === 'stairs') {
            Factor_in_per_occ = SystemLevel === 'reduced' ? 0.2 : 0.3;
        } else { // other (Doors, Corridors)
            Factor_in_per_occ = SystemLevel === 'reduced' ? 0.15 : 0.2;
        }

        // Required Width (Inches) = Occupant Load * Factor (in/occ)
        const RequiredWidth_in = OccupantLoad * Factor_in_per_occ;

        // Output Conversion
        const RequiredWidth_mm = RequiredWidth_in * UNIT_RATIOS.diameter.ratio;

        let Width_out;
        let Width_unit;

        if (currentUnit === 'imperial') {
            Width_out = RequiredWidth_in;
            Width_unit = 'Inches';
        } else {
            Width_out = RequiredWidth_mm;
            Width_unit = 'mm';
        }
        
        let html = `
            <h3>Required Egress Width (IBC/NFPA 101)</h3>
            <p><strong>Egress Capacity Factor Used:</strong> ${Factor_in_per_occ.toFixed(2)} in/occupant</p>
            <p><strong>Total Required Egress Width:</strong> <strong>${Width_out.toFixed(1)} ${Width_unit}</strong></p>
            <p><strong>Note:</strong> Each door/exit must have a minimum clear width as specified by code (e.g., 32 inches clear).</p>
            <small>This is the MINIMUM aggregate width. The total width of all exit paths combined must meet or exceed this value. For non-sprinklered buildings, the higher factor must be used.</small>
        `;
        displayResult('egress-width-result', html);

    } catch (error) {
        handleError('egress-width-result', error.message);
    }
}

// Emergency Lighting Point Calculator (New)
function calculateEmergencyLighting() {
    try {
        const H_ft = getInputValue('el-mount-height', 'length');
        const LuxFactor_candela = parseFloat(document.getElementById('el-lux-factor').value); // Using Candela as a proxy for max beam power
        const MinLux_ftc = getInputValue('el-min-lux', 'lux');

        // Simple Rule of Thumb (Inverse Square Law approximation for uniform grid spacing)
        // R = sqrt(I / E) where R is distance (ft), I is light intensity (candela), E is illuminance (ft-c)
        const MaxRadius_ft = Math.sqrt(LuxFactor_candela / MinLux_ftc);
        
        // Maximum Spacing = 2 * Max Radius (if lights are center-to-center)
        const MaxSpacing_ft = 2 * MaxRadius_ft;

        // Output Conversions
        const H_out = convertValue(H_ft, 'length', currentUnit);
        const MaxSpacing_out = convertValue(MaxSpacing_ft, 'length', currentUnit);
        const L_unit = getUnitLabel('length');
        
        let html = `
            <h3>Emergency Lighting Spacing Estimate</h3>
            <p><strong>Maximum Radius of Illumination (from a single fixture):</strong> ${MaxRadius_out.toFixed(1)} ${L_unit}</p>
            <p><strong>Maximum Center-to-Center Spacing:</strong> <strong>${MaxSpacing_out.toFixed(1)} ${L_unit}</strong></p>
            <small>This uses a simplified inverse square law method for an initial estimate. Final design requires detailed photometric data and a certified light plan to meet all uniformity ratios and minimum illuminance levels (NFPA 101/IBC).</small>
        `;
        displayResult('emergency-lighting-result', html);

    } catch (error) {
        handleError('emergency-lighting-result', error.message);
    }
}


// =================================================================
// 5. HYDRANTS & WATER SUPPLY CALCULATORS (3 NEW/ENHANCED)
// =================================================================

// Hydrant Flow Calculator (Pitot) (New)
function calculateHydrantFlow() {
    try {
        const P_psi = getInputValue('pitot-pressure', 'pressure');
        const D_in = getInputValue('outlet-diameter', 'diameter');
        const C_coeff = parseFloat(document.getElementById('flow-coefficient').value);

        // Pitot Formula (Imperial): Q = 29.84 * C * D² * sqrt(P)
        const Q_GPM = 29.84 * C_coeff * Math.pow(D_in, 2) * Math.sqrt(P_psi);

        // Output Conversions
        const Q_out = convertValue(Q_GPM, 'flow', currentUnit);
        const Q_unit = getUnitLabel('flow');

        let html = `
            <h3>Hydrant Flow Results (NFPA 291 Basis)</h3>
            <p><strong>Calculated Flow Rate (Q):</strong> <strong>${Q_out.toFixed(0)} ${Q_unit}</strong></p>
            <small>This calculation is crucial for fire flow tests to determine water availability. The discharge coefficient (C) is an estimate and should be carefully selected based on the hydrant outlet condition.</small>
        `;
        displayResult('hydrant-flow-result', html);

    } catch (error) {
        handleError('hydrant-flow-result', error.message);
    }
}

// Friction Loss Calculator (Hazen-Williams) (Enhanced Existing)
function calculateFrictionLoss() {
    try {
        const D_in = getInputValue('pipe-diameter', 'diameter'); // Diameter in inches (D)
        const Q_GPM = getInputValue('flow-rate', 'flow'); // Flow in GPM (Q)
        const L_ft = getInputValue('pipe-length', 'length'); // Length in feet (L)
        const C_factor = parseFloat(document.getElementById('c-factor').value); // C-factor

        // Hazen-Williams Formula (Imperial, NFPA arrangement): 
        // P_loss = 4.52 * L * (Q^1.85 / (C^1.85 * D^4.87))
        const Denom = Math.pow(C_factor, 1.85) * Math.pow(D_in, 4.87);
        const Numer = 4.52 * L_ft * Math.pow(Q_GPM, 1.85);

        const P_loss_PSI = Numer / Denom;
        const P_loss_PSI_per_ft = P_loss_PSI / L_ft;

        // Output Conversions
        const P_loss_out = convertValue(P_loss_PSI, 'pressure', currentUnit);
        const P_loss_unit = getUnitLabel('pressure');

        const P_loss_per_len_out = convertValue(P_loss_PSI_per_ft, 'pressure', currentUnit);
        const P_loss_per_len_unit = currentUnit === 'imperial' ? 'PSI/ft' : 'Bar/m';
        
        let html = `
            <h3>Friction Loss Results</h3>
            <p><strong>Total Pressure Loss Over Pipe Length:</strong> <strong>${P_loss_out.toFixed(2)} ${P_loss_unit}</strong></p>
            <p><strong>Pressure Loss Per Unit Length:</strong> ${P_loss_per_len_out.toFixed(4)} ${P_loss_per_len_unit}</p>
            <small>Formula is Hazen-Williams (NFPA 13). Valid only for water and within flow constraints. Always use the internal diameter (ID) of the pipe, not the nominal diameter.</small>
        `;
        displayResult('friction-loss-result', html);

    } catch (error) {
        handleError('friction-loss-result', error.message);
    }
}

// Required Fire Flow (RFF) Calculator (Enhanced Existing)
function calculateFireFlow() {
    try {
        const Area_sqft = getInputValue('ff-area', 'area'); // Area in Sq Ft (A)
        const C_coeff = parseFloat(document.getElementById('ff-construction').value); // Construction Coefficient (C)

        // Formula: F = 18 * C * sqrt(A) in GPM (Based on ISO/NFPA 1142 approximations)
        const F_GPM = 18 * C_coeff * Math.sqrt(Area_sqft);

        // Output Conversions
        const F_out = convertValue(F_GPM, 'flow', currentUnit);
        const F_unit = getUnitLabel('flow');

        let html = `
            <h3>Required Fire Flow Estimate (RFF)</h3>
            <p><strong>Required Flow Rate (F):</strong> <strong>${F_out.toFixed(0)} ${F_unit}</strong></p>
            <small>This result represents the estimated minimum required fire flow for the building's exterior attack. The actual RFF may be higher based on neighboring exposures, contents, or local amendments. Consult NFPA 1142/ISO 310.</small>
        `;
        displayResult('required-fire-flow-result', html);
    } catch (error) {
        handleError('required-fire-flow-result', error.message);
    }
}

// Fire Pump Sizing & Head Calculator (Enhanced Existing)
function calculatePumpSizing() {
    try {
        const Flow_GPM = getInputValue('demand-flow', 'flow'); // Required Flow (Q)
        const P_demand_PSI = getInputValue('demand-pressure', 'pressure'); // Pressure at Demand (P_d)
        const P_loss_PSI = getInputValue('total-loss', 'pressure'); // Total Friction Loss (P_f)
        const P_elevation_PSI = getInputValue('elevation-head', 'pressure'); // Elevation Head Loss (P_e)
        const P_available_PSI = getInputValue('available-pressure', 'pressure'); // Available Pressure (P_a)

        // Required Pump Head (P_h) = (P_d + P_f + P_e) - P_a
        const P_head_PSI = (P_demand_PSI + P_loss_PSI + P_elevation_PSI) - P_available_PSI;
        
        let P_head_out;
        let P_head_unit;
        let Flow_out;
        let Flow_unit;

        if (P_head_PSI < 0) {
            P_head_PSI = 0; // Negative head means no pump is needed; static pressure is sufficient.
        }

        // Output Conversions
        P_head_out = convertValue(P_head_PSI, 'pressure', currentUnit);
        P_head_unit = getUnitLabel('pressure');
        Flow_out = convertValue(Flow_GPM, 'flow', currentUnit);
        Flow_unit = getUnitLabel('flow');

        let html = `
            <h3>Fire Pump Rating</h3>
            <p><strong>Required Pump Flow Rating:</strong> <strong>${Flow_out.toFixed(0)} ${Flow_unit}</strong></p>
            <p><strong>Minimum Required Pump Head (Pressure):</strong> <strong>${P_head_out.toFixed(2)} ${P_head_unit}</strong></p>
            <small>The selected fire pump must deliver the required flow at or above the minimum required pressure (head). If the calculated head is zero, the existing water supply is sufficient.</small>
        `;
        displayResult('pump-result', html);
    } catch (error) {
        handleError('pump-result', error.message);
    }
}

// =================================================================
// INITIALIZATION AND EVENT LISTENERS
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();

    // Default to the first calculator
    switchCalculator(NAV_BUTTONS[0].id);

    // Unit Switch Listener
    const unitSwitch = document.getElementById('unit-switch');
    unitSwitch.addEventListener('change', function() {
        window.currentUnit = this.value;
        updateUnitLabels(this.value);
    });

    // Form Event Listeners (all 18 forms)
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
        calculateSmokeDetectorSpacing();
    });
    document.getElementById('battery-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateBattery();
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
    // Door checklist uses inline onsubmit, but we'll add here for completeness
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
    const urlHash = window.location.hash.substring(1); // Remove '#'
    if (urlHash) {
        switchCalculator(urlHash);
    }
});
