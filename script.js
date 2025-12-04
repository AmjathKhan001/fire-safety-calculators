// =================================================================
// GLOBAL STATE & UTILITIES
// =================================================================

window.currentUnit = 'imperial';

// CONSTANT for the new universal Amazon Affiliate Link
const AMAZON_AFFILIATE_LINK = 'https://amzn.to/48k5Upd'; 

const unitConversions = {
    // Length: 1 ft = 0.3048 m
    length: { imperial: 1, metric: 0.3048, unit: { imperial: 'ft', metric: 'm' } },
    // Flow: 1 GPM = 0.06309 L/s (LPS)
    flow: { imperial: 1, metric: 0.06309, unit: { imperial: 'GPM', metric: 'L/s' } },
    // Pressure: 1 PSI = 0.06895 Bar
    pressure: { imperial: 1, metric: 0.06895, unit: { imperial: 'PSI', metric: 'Bar' } },
    // Area: 1 Sq Ft = 0.0929 Sq M
    area: { imperial: 1, metric: 0.0929, unit: { imperial: 'Sq Ft', metric: 'm²' } },
    // Diameter: 1 Inch = 25.4 mm
    diameter: { imperial: 1, metric: 25.4, unit: { imperial: 'Inches', metric: 'mm' } },
    // Density (GPM/SqFt to LPM/m²): 1 GPM/Sq Ft = 40.743 LPM/m²
    density: { imperial: 1, metric: 40.743, unit: { imperial: 'GPM/Sq Ft', metric: '(L/min)/m²' } },
    // Pump Flow Standard Sizes
    pumpFlowStandard: [25, 50, 100, 200, 250, 300, 400, 450, 500, 750, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000] // GPM standard sizes
};

/**
 * Converts a value from Imperial to Metric, or vice versa.
 * @param {number} value - The value in the original unit.
 * @param {string} type - The type of conversion ('length', 'flow', 'pressure', etc.).
 * @param {string} toUnit - The target unit ('imperial' or 'metric').
 * @returns {number} The converted value.
 */
function convert(value, type, toUnit) {
    if (toUnit === 'imperial') {
        return value / unitConversions[type].metric;
    } else {
        return value * unitConversions[type].metric;
    }
}

/**
 * Formats a number for display.
 */
function formatNumber(number, decimals = 1) {
    if (typeof number !== 'number' || isNaN(number)) return 'N/A';
    return number.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Updates all labels and placeholders based on the current unit selection.
 */
function updateUnitLabels() {
    const labels = document.querySelectorAll('[data-label-imperial]');
    const inputs = document.querySelectorAll('input[placeholder]');
    const unit = window.currentUnit;

    labels.forEach(label => {
        const imperialText = label.getAttribute('data-label-imperial');
        const metricText = label.getAttribute('data-label-metric');
        if (unit === 'imperial') {
            label.textContent = imperialText;
        } else {
            label.textContent = metricText;
        }
    });

    // Update placeholders for numeric inputs (optional, but good UX)
    // NOTE: This does not convert the actual placeholder number, only the text.
    inputs.forEach(input => {
        const parent = input.closest('.input-group');
        const label = parent ? parent.querySelector('label') : null;
        if (label && label.textContent.includes('Bar')) {
            input.placeholder = input.placeholder.replace('PSI', 'Bar').replace('e.g., 40', 'e.g., 2.8'); // Example conversion
        } else if (label && label.textContent.includes('GPM')) {
            input.placeholder = input.placeholder.replace('GPM', 'L/s').replace('e.g., 750', 'e.g., 47.3');
        } else if (label && label.textContent.includes('ft')) {
            input.placeholder = input.placeholder.replace('ft', 'm').replace('e.g., 50', 'e.g., 15');
        } else if (label && label.textContent.includes('Inches')) {
             input.placeholder = input.placeholder.replace('Inches', 'mm').replace('e.g., 3.068', 'e.g., 77.9');
        }
    });

    // Re-run calculator logic to update results if possible
    try {
        if (document.getElementById('battery-result').classList.contains('hidden') === false) calculateBattery();
        if (document.getElementById('occupant-result').classList.contains('hidden') === false) calculateOccupant();
        if (document.getElementById('smoke-result').classList.contains('hidden') === false) calculateSmokeDetectorSpacing();
        if (document.getElementById('friction-loss-result').classList.contains('hidden') === false) calculateFrictionLoss();
        if (document.getElementById('fireflow-result').classList.contains('hidden') === false) calculateFireFlow();
        if (document.getElementById('pump-result').classList.contains('hidden') === false) calculatePumpSizing();
    } catch (e) {
        // Ignore errors if forms haven't been submitted yet
    }
}

/**
 * Handles the unit switch logic.
 */
function switchUnit(unit) {
    if (unit !== 'imperial' && unit !== 'metric') return;
    window.currentUnit = unit;
    updateUnitLabels();
}

// =================================================================
// NAVIGATION
// =================================================================

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const calculators = document.querySelectorAll('.calculator-box');
    
    // Set up click handlers for calculator buttons
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Only handle buttons with a data-calculator attribute
            if (this.tagName === 'BUTTON' && this.dataset.calculator) {
                e.preventDefault();
                const targetCalculator = this.dataset.calculator;
                
                // Update active button
                document.querySelectorAll('.main-nav .nav-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Show target calculator, hide others
                calculators.forEach(calc => calc.classList.add('hidden'));
                const targetElement = document.getElementById(targetCalculator + '-calculator');
                if (targetElement) {
                    targetElement.classList.remove('hidden');
                    
                    // Scroll to calculator smoothly
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // Initialize the unit labels on load
    updateUnitLabels();
}

// =================================================================
// CALCULATOR LOGIC
// =================================================================

// Helper function to find the next highest NFPA standard pump flow size
function getNextStandardPumpFlow(gpm) {
    const standards = unitConversions.pumpFlowStandard;
    for (let i = 0; i < standards.length; i++) {
        if (standards[i] >= gpm) {
            return standards[i];
        }
    }
    // Return the largest standard if the required GPM is higher
    return standards[standards.length - 1]; 
}

// Fire Pump Sizing Calculator
function calculatePumpSizing() {
    const form = document.getElementById('pump-form');
    const resultDiv = document.getElementById('pump-result');
    if (!form.checkValidity()) {
        form.reportValidity();
        resultDiv.classList.add('hidden');
        return;
    }

    const requiredFlow = parseFloat(document.getElementById('required-flow').value);
    const systemPressure = parseFloat(document.getElementById('system-pressure').value);
    const pressureLoss = parseFloat(document.getElementById('pressure-loss').value);
    const staticHead = parseFloat(document.getElementById('static-head').value);
    const availablePressure = parseFloat(document.getElementById('available-pressure').value);
    
    const unit = window.currentUnit;
    const pressureUnit = unitConversions.pressure.unit[unit];
    const flowUnit = unitConversions.flow.unit[unit];

    // Convert inputs to Imperial for calculation (or keep as is if Imperial)
    const requiredFlow_gpm = unit === 'imperial' ? requiredFlow : convert(requiredFlow, 'flow', 'imperial');
    const systemPressure_psi = unit === 'imperial' ? systemPressure : convert(systemPressure, 'pressure', 'imperial');
    const pressureLoss_psi = unit === 'imperial' ? pressureLoss : convert(pressureLoss, 'pressure', 'imperial');
    const staticHead_psi = unit === 'imperial' ? staticHead : convert(staticHead, 'pressure', 'imperial');
    const availablePressure_psi = unit === 'imperial' ? availablePressure : convert(availablePressure, 'pressure', 'imperial');
    
    // 1. Determine Required Pump Flow (NFPA 20)
    // Pump flow must be the system demand flow (NFPA 20, 4.14.1.2)
    let requiredPumpFlow_gpm = requiredFlow_gpm;
    
    // 2. Determine Required Pump Pressure/Head (NFPA 20, 4.15)
    // Required Pump Head (PSI) = Required Pressure + Loss + Static Head - Available Suction Pressure
    const requiredPumpHead_psi = systemPressure_psi + pressureLoss_psi + staticHead_psi - availablePressure_psi;
    
    // 3. Round Flow to Standard Size
    const standardPumpFlow_gpm = getNextStandardPumpFlow(requiredPumpFlow_gpm);

    // Convert results back to display units
    const requiredPumpHeadDisplay = unit === 'imperial' ? requiredPumpHead_psi : convert(requiredPumpHead_psi, 'pressure', 'metric');
    const requiredPumpFlowDisplay = unit === 'imperial' ? requiredPumpFlow_gpm : convert(requiredPumpFlow_gpm, 'flow', 'metric');
    const standardPumpFlowDisplay = unit === 'imperial' ? standardPumpFlow_gpm : convert(standardPumpFlow_gpm, 'flow', 'metric');

    let pumpHeadText = '';
    let pass = true;
    
    if (requiredPumpHead_psi <= 0) {
        pumpHeadText = `Available pressure (${formatNumber(availablePressure, 1)} ${pressureUnit}) is higher than required pressure (${formatNumber(systemPressure + pressureLoss + staticHead, 1)} ${pressureUnit}). **No pump needed** (or a small jockey pump may be used).`;
        pass = false;
    } else {
        pumpHeadText = `Required Pump Pressure (Head): **${formatNumber(requiredPumpHeadDisplay, 1)} ${pressureUnit}**`;
    }
    
    resultDiv.innerHTML = `
        <h3>⚙️ Fire Pump Sizing Results (NFPA 20)</h3>
        <p>Calculates the required flow and pressure boost for the fire pump.</p>
        
        <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Minimum Pump Flow Rating:</div>
            <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${Math.round(requiredPumpFlowDisplay)} ${flowUnit}</div>
            <div style="font-size: 1.2rem; font-weight: bold; color: #1e40af;">Standard Pump Size: ${Math.round(standardPumpFlowDisplay)} ${flowUnit}</div>
        </div>
        
        <div style="margin-top: 1.5rem; background: ${pass ? '#f0f9ff' : '#fef3c7'}; padding: 1rem; border-radius: 5px;">
            <p>${pumpHeadText}</p>
            <p style="margin-top: 0.75rem; font-weight: bold;">⚠️ Always use the next available standard pump size from the manufacturer. ${standardPumpFlowDisplay > requiredPumpFlowDisplay ? `The minimum standard size is ${Math.round(standardPumpFlowDisplay)} ${flowUnit}` : ''}</p>
        </div>
        
        <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 5px;">
            <strong>Calculation Steps:</strong>
            <ul style="margin-top: 0.5rem; list-style-type: none; padding-left: 0;">
                <li>Required Flow = System Demand Flow (${formatNumber(requiredFlow, 1)} ${flowUnit})</li>
                <li>Required Head = Required Pressure + Loss + Head - Available Pressure</li>
                <li>Required Head (PSI) = ${formatNumber(systemPressure_psi, 1)} + ${formatNumber(pressureLoss_psi, 1)} + ${formatNumber(staticHead_psi, 1)} - ${formatNumber(availablePressure_psi, 1)} = ${formatNumber(requiredPumpHead_psi, 1)} PSI</li>
            </ul>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// Hazen-Williams Friction Loss Calculator
function calculateFrictionLoss() {
    const form = document.getElementById('friction-loss-form');
    const resultDiv = document.getElementById('friction-loss-result');
    if (!form.checkValidity()) {
        form.reportValidity();
        resultDiv.classList.add('hidden');
        return;
    }

    const flowRate = parseFloat(document.getElementById('flow-rate').value);
    const pipeLength = parseFloat(document.getElementById('pipe-length').value);
    const pipeDiameter = parseFloat(document.getElementById('pipe-diameter').value);
    const cFactor = parseInt(document.getElementById('c-factor').value);

    const unit = window.currentUnit;
    const pressureUnit = unitConversions.pressure.unit[unit];

    // Convert inputs to Imperial (GPM, Ft, Inches) for Hazen-Williams formula (P = 4.52 * Q^1.85 * C^-1.85 * D^-4.87 * L)
    const Q_gpm = unit === 'imperial' ? flowRate : convert(flowRate, 'flow', 'imperial');
    const L_ft = unit === 'imperial' ? pipeLength : convert(pipeLength, 'length', 'imperial');
    const D_in = unit === 'imperial' ? pipeDiameter : convert(pipeDiameter, 'diameter', 'imperial');

    // Hazen-Williams Formula (Imperial: Loss in PSI)
    // P = 4.52 * (Q^1.85 / (C^1.85 * D^4.87)) * L
    const P_psi = 4.52 * (Math.pow(Q_gpm, 1.85) / 
                  (Math.pow(cFactor, 1.85) * Math.pow(D_in, 4.87))) * L_ft;

    // Convert result back to display units
    const P_display = unit === 'imperial' ? P_psi : convert(P_psi, 'pressure', 'metric');

    // Calculate Loss per 100 ft (Imperial)
    const lossPer100Ft_psi = P_psi / (L_ft / 100);
    const lossPer100Ft_display = unit === 'imperial' ? lossPer100Ft_psi : convert(lossPer100Ft_psi, 'pressure', 'metric');

    resultDiv.innerHTML = `
        <h3>💧 Friction Loss Results (Hazen-Williams)</h3>
        <p>Calculated pressure loss for ${formatNumber(pipeLength, 0)} ${unitConversions.length.unit[unit]} of pipe.</p>
        
        <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #1e40af;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Total Pressure Loss:</div>
            <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${formatNumber(P_display, 2)} ${pressureUnit}</div>
        </div>
        
        <div style="margin-top: 1.5rem; background: #f8fafc; padding: 1rem; border-radius: 5px;">
            <p>Loss Per 100 ${unitConversions.length.unit.imperial}: **${formatNumber(lossPer100Ft_display, 2)} ${pressureUnit}**</p>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #6b7280;">(NFPA 13 requires using the Hazen-Williams formula for pipe sizing and hydraulic calculations.)</p>
        </div>
    `;

    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// Smoke Detector Spacing Calculator
function calculateSmokeDetectorSpacing() {
    const form = document.getElementById('smoke-form');
    const resultDiv = document.getElementById('smoke-result');
    if (!form.checkValidity()) {
        form.reportValidity();
        resultDiv.classList.add('hidden');
        return;
    }

    const roomWidth = parseFloat(document.getElementById('room-width').value);
    const roomLength = parseFloat(document.getElementById('room-length').value);
    const spacingFactor_ft = parseInt(document.getElementById('detector-type').value); // 30ft or 60ft
    
    const unit = window.currentUnit;
    const lengthUnit = unitConversions.length.unit[unit];
    const areaUnit = unitConversions.area.unit[unit];

    // Convert inputs to Imperial (ft) for calculation
    const roomWidth_ft = unit === 'imperial' ? roomWidth : convert(roomWidth, 'length', 'imperial');
    const roomLength_ft = unit === 'imperial' ? roomLength : convert(roomLength, 'length', 'imperial');
    
    const totalArea_sqFt = roomWidth_ft * roomLength_ft;
    
    // Max distance from a wall is half the spacing factor (NFPA 72, 17.7.3.2.3)
    const maxWallDistance_ft = spacingFactor_ft / 2;
    
    // Max coverage area per detector (Spacing * Spacing)
    const maxCoverageArea_sqFt = spacingFactor_ft * spacingFactor_ft;
    
    // Required quantity (always round up)
    const requiredQuantity = Math.ceil(totalArea_sqFt / maxCoverageArea_sqFt);

    // Convert results back to display units
    const totalArea_display = unit === 'imperial' ? totalArea_sqFt : convert(totalArea_sqFt, 'area', 'metric');
    const maxCoverageArea_display = unit === 'imperial' ? maxCoverageArea_sqFt : convert(maxCoverageArea_sqFt, 'area', 'metric');
    const maxWallDistance_display = unit === 'imperial' ? maxWallDistance_ft : convert(maxWallDistance_ft, 'length', 'metric');
    const spacingFactor_display = unit === 'imperial' ? spacingFactor_ft : convert(spacingFactor_ft, 'length', 'metric');
    
    resultDiv.innerHTML = `
        <h3> ⚡ Smoke Detector Results (NFPA 72, 17.7.3)</h3>
        <p>Calculations for a room size of ${formatNumber(roomWidth, 1)} x ${formatNumber(roomLength, 1)} ${lengthUnit} (${formatNumber(totalArea_display, 0)} ${areaUnit}).</p>
        
        <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Minimum Detectors Required:</div>
            <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${requiredQuantity}</div>
        </div>
        
        <div style="margin-top: 1.5rem; background: #f0f9ff; padding: 1rem; border-radius: 5px;">
            <p>Maximum Coverage Per Detector: **${formatNumber(maxCoverageArea_display, 0)} ${areaUnit}**</p>
            <p>Maximum Spacing Between Detectors: **${formatNumber(spacingFactor_display, 1)} ${lengthUnit}**</p>
            <p>Maximum Distance from Wall/Partition: **${formatNumber(maxWallDistance_display, 1)} ${lengthUnit}**</p>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #6b7280;">(Note: This does not account for beams, high ceilings, or airflow. Consult NFPA 72 for complex layouts.)</p>
        </div>
    `;

    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// Occupant Load Calculator
function calculateOccupant() {
    const form = document.getElementById('occupant-form');
    const resultDiv = document.getElementById('occupant-result');
    if (!form.checkValidity()) {
        form.reportValidity();
        resultDiv.classList.add('hidden');
        return;
    }

    const areaInput = parseFloat(document.getElementById('area-input').value);
    const loadFactor = parseFloat(document.getElementById('load-factor').value);
    const selectedOption = document.getElementById('load-factor').options[document.getElementById('load-factor').selectedIndex];
    const occupancyType = selectedOption.text.split(':')[0].trim();
    
    const unit = window.currentUnit;
    const areaUnit = unitConversions.area.unit[unit];
    
    // The load factor is always in Sq Ft/person (Imperial), so convert area to Sq Ft for calculation
    const area_sqFt = unit === 'imperial' ? areaInput : convert(areaInput, 'area', 'imperial');
    
    // Calculation: Occupant Load = Area / Load Factor
    const occupantLoad = Math.floor(area_sqFt / loadFactor);

    // Convert load factor to metric for display only
    const loadFactor_metric = loadFactor * unitConversions.area.metric; // m² per person
    const loadFactor_display = unit === 'imperial' ? loadFactor : loadFactor_metric;
    const loadFactorUnit = unit === 'imperial' ? 'Sq Ft/person' : 'm²/person';

    resultDiv.innerHTML = `
        <h3>👥 Occupant Load Results (NFPA 101/IBC)</h3>
        <p>Calculated for **${occupancyType}** with a total area of ${formatNumber(areaInput, 0)} ${areaUnit}.</p>
        
        <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Maximum Occupant Load:</div>
            <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${occupantLoad}</div>
        </div>
        
        <div style="margin-top: 1.5rem; background: #f8fafc; padding: 1rem; border-radius: 5px;">
            <p>Load Factor Used: **${formatNumber(loadFactor_display, 2)} ${loadFactorUnit}**</p>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #6b7280;">(Result is rounded down to the nearest whole number as per code requirements.)</p>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// Required Fire Flow Calculator
function calculateFireFlow() {
    const form = document.getElementById('fireflow-form');
    const resultDiv = document.getElementById('fireflow-result');
    if (!form.checkValidity()) {
        form.reportValidity();
        resultDiv.classList.add('hidden');
        return;
    }

    const areaFloor = parseFloat(document.getElementById('area-floor').value);
    const constructionFactor = parseFloat(document.getElementById('construction-type').value);
    const occupancyFactor = parseFloat(document.getElementById('occupancy-factor').value);
    const exposureFactor = parseFloat(document.getElementById('exposure-factor').value);
    
    const unit = window.currentUnit;
    const flowUnit = unitConversions.flow.unit[unit];

    // Convert area to Imperial (Sq Ft) for formula
    const area_sqFt = unit === 'imperial' ? areaFloor : convert(areaFloor, 'area', 'imperial');
    
    // Basic Fire Flow Formula (Q = C * O * sqrt(Area) * X) - Simplified approximation
    // Q is in GPM, Area is in Sq Ft
    const requiredFlow_gpm = constructionFactor * occupancyFactor * Math.sqrt(area_sqFt) * exposureFactor * 100; // Multiplier is estimate for GPM based on simplified formula
    
    // Round to the nearest 250 GPM increment, max 12,000 GPM (Simplified NFPA 17.3.3.3)
    let finalFlow_gpm = Math.ceil(requiredFlow_gpm / 250) * 250;
    
    // NFPA 17.3.3.3 sets max at 12,000 GPM
    if (finalFlow_gpm > 12000) {
        finalFlow_gpm = 12000;
    }
    
    // Convert final result to display units
    const finalFlow_display = unit === 'imperial' ? finalFlow_gpm : convert(finalFlow_gpm, 'flow', 'metric');

    resultDiv.innerHTML = `
        <h3>🚒 Required Fire Flow Results (Approximation)</h3>
        <p>Estimates the minimum required fire flow (Q) based on simplified area and hazard factors.</p>
        
        <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #1e40af;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Minimum Required Fire Flow (Q):</div>
            <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${formatNumber(finalFlow_display, 0)} ${flowUnit}</div>
        </div>
        
        <div style="margin-top: 1.5rem; background: #f8fafc; padding: 1rem; border-radius: 5px;">
            <p>Formula Used (Simplified Imperial): Q = 100 * C * O * &radic;Area * X</p>
            <ul style="margin-top: 0.5rem; font-size: 0.9rem; color: #6b7280; padding-left: 20px;">
                <li>Q: ${formatNumber(requiredFlow_gpm, 0)} GPM (Unrounded)</li>
                <li>Rounded to nearest 250 GPM increment, capped at 12,000 GPM.</li>
                <li>Final Calculated Flow: ${formatNumber(finalFlow_display, 0)} ${flowUnit}</li>
            </ul>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// Battery Calculator
function calculateBattery() {
    const form = document.getElementById('battery-form');
    const resultDiv = document.getElementById('battery-result');
    if (!form.checkValidity()) {
        form.reportValidity();
        resultDiv.classList.add('hidden');
        return;
    }

    const standbyCurrent = parseFloat(document.getElementById('standby-current').value);
    const alarmCurrent = parseFloat(document.getElementById('alarm-current').value);
    const standbyHours = parseFloat(document.getElementById('standby-hours').value);
    const alarmMinutes = parseFloat(document.getElementById('alarm-minutes').value);
    
    // Convert alarm minutes to hours
    const alarmHours = alarmMinutes / 60;
    
    // Calculate Amp-Hours (Ah) for standby and alarm
    const standbyAH = standbyCurrent * standbyHours;
    const alarmAH = alarmCurrent * alarmHours;
    
    // Total Ah required before derating
    const totalAH = standbyAH + alarmAH;
    
    // Apply 1.25 derating factor as required by NFPA 72 (or other common standards)
    const deratedAH = totalAH * 1.25;
    
    resultDiv.innerHTML = `
        <h3>🔋 Battery Calculation Results (NFPA 72)</h3>
        <p>Calculated based on a **${standbyHours} hour** standby and **${alarmMinutes} minute** alarm period.</p>
        
        <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #1e40af;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Minimum Required Battery Capacity:</div>
            <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${deratedAH.toFixed(1)} Ah</div>
            <small>Always use a battery size above calculated requirement</small>
        </div>
        
        <div style="margin-top: 1rem;">
            <strong>Calculation Steps:</strong>
            <div style="background: white; padding: 0.75rem; border-radius: 3px; margin-top: 0.5rem;">
                1. Standby: ${standbyCurrent}A × ${standbyHours}h = ${standbyAH.toFixed(1)} Ah<br>
                2. Alarm: ${alarmCurrent}A × ${alarmHours.toFixed(2)}h = ${alarmAH.toFixed(1)} Ah<br>
                3. Total: ${standbyAH.toFixed(1)} + ${alarmAH.toFixed(1)} = ${totalAH.toFixed(1)} Ah<br>
                4. With derating (×1.25): ${totalAH.toFixed(1)} × 1.25 = ${deratedAH.toFixed(1)} Ah
            </div>
        </div>
        
        <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 5px;">
            <strong>⚠️ Important Notes:</strong>
            <ul style="margin-top: 0.5rem;">
                <li>Always verify with battery manufacturer specifications</li>
                <li>Consider temperature derating if applicable</li>
                <li>Account for battery aging (typically add 20% margin)</li>
                <li>Consult NFPA 72 for complete requirements</li>
            </ul>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =================================================================
// EVENT LISTENERS
// =================================================================

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    
    // Attach event listeners to all forms
    document.getElementById('battery-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateBattery();
    });
    
    document.getElementById('occupant-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateOccupant();
    });

    document.getElementById('smoke-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateSmokeDetectorSpacing();
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
    
    // Initialize the current calculator based on URL hash (optional)
    const urlHash = window.location.hash.substring(1); // Remove '#'
    if (urlHash) {
        const targetElement = document.getElementById(urlHash + '-calculator');
        const targetButton = document.querySelector(`button[data-calculator="${urlHash}"]`);
        
        if (targetElement && targetButton) {
            // Hide all first
            document.querySelectorAll('.calculator-box').forEach(calc => calc.classList.add('hidden'));
            document.querySelectorAll('.main-nav .nav-btn').forEach(btn => btn.classList.remove('active'));
            
            // Show target
            targetElement.classList.remove('hidden');
            targetButton.classList.add('active');
            
            // Scroll to the calculator (optional, handled by click event anyway)
        }
    }
});
