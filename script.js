// =================================================================
// GLOBAL STATE & UTILITIES
// =================================================================

// Use 'let' instead of a global window variable for better scoping and initialization
let currentUnit;

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
    // Use the local 'currentUnit' variable
    const unit = currentUnit; 

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
        if (document.getElementById('battery-result') && !document.getElementById('battery-result').classList.contains('hidden')) calculateBattery();
        if (document.getElementById('occupant-result') && !document.getElementById('occupant-result').classList.contains('hidden')) calculateOccupant();
        if (document.getElementById('smoke-result') && !document.getElementById('smoke-result').classList.contains('hidden')) calculateSmokeDetectorSpacing();
        if (document.getElementById('friction-loss-result') && !document.getElementById('friction-loss-result').classList.contains('hidden')) calculateFrictionLoss();
        if (document.getElementById('fireflow-result') && !document.getElementById('fireflow-result').classList.contains('hidden')) calculateFireFlow();
        if (document.getElementById('pump-result') && !document.getElementById('pump-result').classList.contains('hidden')) calculatePumpSizing();
    } catch (e) {
        // Ignore errors if forms haven't been submitted yet
    }
}

/**
 * Handles the unit switch logic and saves preference to localStorage.
 */
function switchUnit(unit) {
    if (unit !== 'imperial' && unit !== 'metric') return;
    currentUnit = unit; // Set the scoped variable
    localStorage.setItem('firesafetytool_unit', unit); // Save to localStorage
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

    // Initialization is now handled by the DOMContentLoaded listener
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
    
    const unit = currentUnit; // Use the scoped variable
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
            <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Required Pump Flow:</div>
            <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${Math.round(requiredPumpFlowDisplay)} ${flowUnit}</div>
            <p>${pumpHeadText}</p>
            <p style="margin-top: 1rem; font-size: 0.9rem; font-weight: bold;">⚠️ Always use the next available standard pump size from the manufacturer. ${standardPumpFlowDisplay > requiredPumpFlowDisplay ? `The minimum standard size is ${Math.round(standardPumpFlowDisplay)} ${flowUnit}` : ''}</p>
        </div>

        <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 5px;">
            <strong>Calculation Steps:</strong>
            <ul style="margin-top: 0.5rem; list-style-type: none; padding-left: 0;">
                <li>Required Flow = System Demand Flow (${formatNumber(requiredFlow, 1)} ${flowUnit})</li>
                <li>Required Head = Required Pressure + Loss + Head - Available Pressure</li>
                <li>Required Head (PSI) = ${formatNumber(systemPressure_psi, 1)} + ${formatNumber(pressureLoss_psi, 1)} + ${formatNumber(staticHead_psi, 1)} - ${formatNumber(availablePressure_psi, 1)} = ${formatNumber(requiredPumpHead_psi, 1)} PSI</li>
            </ul>
        </div>
        
        <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-radius: 5px; color: #92400e;">
            <strong>Disclaimer:</strong> This calculation is for estimation purposes only. Consult NFPA 20 and a licensed engineer for final pump sizing and hydraulic calculations.
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

    const unit = currentUnit; // Use the scoped variable
    const lengthUnit = unitConversions.length.unit[unit];
    const areaUnit = unitConversions.area.unit[unit];

    // Convert inputs to Imperial (ft) for calculation
    const roomWidth_ft = unit === 'imperial' ? roomWidth : convert(roomWidth, 'length', 'imperial');
    const roomLength_ft = unit === 'imperial' ? roomLength : convert(roomLength, 'length', 'imperial');

    // Max protected area per detector (NFPA 72, 17.5.3.2.3.1)
    // For 30ft spacing factor: Area = 900 Sq Ft
    // For 60ft spacing factor: Area = 3600 Sq Ft (only allowed for specific conditions)
    const maxAreaPerDetector_sqFt = spacingFactor_ft * spacingFactor_ft;
    
    // The maximum linear spacing distance
    const maxLinearSpacing_ft = spacingFactor_ft; // 30ft or 60ft

    // Calculate required number of detectors
    const totalArea_sqFt = roomWidth_ft * roomLength_ft;
    const minDetectors = Math.ceil(totalArea_sqFt / maxAreaPerDetector_sqFt);

    // Initial Detector Placement: The distance from a wall must be half the listed spacing.
    const maxWallDistance_ft = maxLinearSpacing_ft / 2;

    // Convert results back to display units
    const maxAreaPerDetector_display = unit === 'imperial' ? maxAreaPerDetector_sqFt : convert(maxAreaPerDetector_sqFt, 'area', 'metric');
    const maxWallDistance_display = unit === 'imperial' ? maxWallDistance_ft : convert(maxWallDistance_ft, 'length', 'metric');
    const maxLinearSpacing_display = unit === 'imperial' ? maxLinearSpacing_ft : convert(maxLinearSpacing_ft, 'length', 'metric');
    const roomArea_display = unit === 'imperial' ? totalArea_sqFt : convert(totalArea_sqFt, 'area', 'metric');

    // Generate detector type text
    const detectorTypeText = spacingFactor_ft === 30 ? 'Standard Spacing (30 ft x 30 ft)' : 'Extended Spacing (60 ft x 60 ft - limited applications)';

    resultDiv.innerHTML = `
        <h3>💨 Smoke Detector Spacing Results (NFPA 72)</h3>
        <p>Calculation based on: **${detectorTypeText}**</p>
        
        <div style="background: #eef2ff; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #374151;">
            <div style="font-size: 1.5rem; font-weight: bold; color: #1e40af;">Minimum Required Detectors:</div>
            <div style="font-size: 3.5rem; font-weight: bolder; color: #dc2626;">${minDetectors}</div>
        </div>

        <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 5px;">
            <strong>Design Parameters:</strong>
            <ul style="margin-top: 0.5rem; list-style-type: none; padding-left: 0;">
                <li>Max Area Per Detector: **${formatNumber(maxAreaPerDetector_display, 1)} ${areaUnit}**</li>
                <li>Max Linear Spacing: **${formatNumber(maxLinearSpacing_display, 1)} ${lengthUnit}**</li>
                <li>Max Distance from Wall: **${formatNumber(maxWallDistance_display, 1)} ${lengthUnit}** (Half the Max Linear Spacing)</li>
                <li>Total Room Area: **${formatNumber(roomArea_display, 1)} ${areaUnit}**</li>
            </ul>
        </div>
        
        <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-radius: 5px; color: #92400e;">
            <strong>Note:</strong> Detectors must be located within a distance of one-half the required spacing from all walls, and distances between detectors must not exceed the required spacing. Always consult NFPA 72 for final placement, beam sensitivity, and area limitations.
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

    const unit = currentUnit; // Use the scoped variable
    const areaUnit = unitConversions.area.unit[unit];

    // The load factor is always in Sq Ft/person (Imperial), so convert area to Sq Ft for calculation
    const area_sqFt = unit === 'imperial' ? areaInput : convert(areaInput, 'area', 'imperial');

    // Calculation: Occupant Load = Area / Load Factor
    const occupantLoad = Math.floor(area_sqFt / loadFactor);

    // Convert load factor to metric for display only
    const loadFactor_metric = loadFactor * unitConversions.area.metric; // m² per person
    const loadFactor_display = unit === 'imperial' ? formatNumber(loadFactor, 1) : formatNumber(loadFactor_metric, 2);
    const loadFactorUnit = unit === 'imperial' ? 'Sq Ft/person' : 'm²/person';

    resultDiv.innerHTML = `
        <h3>👥 Occupant Load Results (NFPA 101/IBC)</h3>
        <p>Calculated for **${occupancyType}** with a total area of ${formatNumber(areaInput, 1)} ${areaUnit}.</p>
        
        <div style="background: #eef2ff; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #1e40af;">
            <div style="font-size: 1.5rem; font-weight: bold; color: #1e40af;">Calculated Occupant Load:</div>
            <div style="font-size: 4rem; font-weight: bolder; color: #dc2626;">${occupantLoad}</div>
            <p style="font-size: 1.1rem;">(Minimum number of persons allowed in the area)</p>
        </div>

        <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 5px;">
            <strong>Factors Used:</strong>
            <ul style="margin-top: 0.5rem; list-style-type: none; padding-left: 0;">
                <li>Occupancy Type: **${occupancyType}**</li>
                <li>Load Factor: **${loadFactor_display} ${loadFactorUnit}**</li>
                <li>Calculation: ${formatNumber(area_sqFt, 1)} Sq Ft / ${formatNumber(loadFactor, 1)} Sq Ft/person = **${occupantLoad} persons**</li>
            </ul>
        </div>
        
        <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-radius: 5px; color: #92400e;">
            <strong>Disclaimer:</strong> This is a code-based estimation. Always use the specific load factors defined by your local code (e.g., IBC, NFPA 101) and consult with a life safety professional.
        </div>
        `;
    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Battery Standby Calculator
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

    // Calculation (NFPA 72, 10.6.2.1.2)
    // Required Ah = (Standby Current * Standby Hours) + (Alarm Current * Alarm Hours)
    const requiredAh = (standbyCurrent * standbyHours) + (alarmCurrent * alarmHours);
    
    // Add 20% margin for battery aging (common practice, not strictly NFPA)
    const ratedAh = requiredAh * 1.20;

    resultDiv.innerHTML = `
        <h3>🔋 Battery Standby Results (NFPA 72)</h3>
        <p>Calculated for ${standbyHours} hours of standby and ${alarmMinutes} minutes of alarm.</p>
        
        <div style="background: #e5f5ff; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #0056b3;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #0056b3;">Minimum Calculated Amp-Hours (Ah):</div>
            <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${formatNumber(requiredAh, 1)} Ah</div>
            <p style="margin-top: 1rem;">Recommended Rating (with 20% margin): **${formatNumber(ratedAh, 1)} Ah**</p>
        </div>

        <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 5px;">
            <strong>Calculation Steps:</strong>
            <ul style="margin-top: 0.5rem; list-style-type: none; padding-left: 0;">
                <li>Standby Ah: ${formatNumber(standbyCurrent, 2)} A x ${standbyHours} hrs = ${formatNumber(standbyCurrent * standbyHours, 1)} Ah</li>
                <li>Alarm Ah: ${formatNumber(alarmCurrent, 2)} A x ${formatNumber(alarmHours, 2)} hrs = ${formatNumber(alarmCurrent * alarmHours, 1)} Ah</li>
                <li>Total Required Ah: ${formatNumber(requiredAh, 1)} Ah</li>
                <li>Recommended Rating: ${formatNumber(requiredAh, 1)} Ah x 1.20 (20% margin) = **${formatNumber(ratedAh, 1)} Ah**</li>
            </ul>
        </div>
        
        <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-radius: 5px; color: #92400e;">
            <strong>Important:</strong> Always select the next highest commercially available battery size. Remember to include factors like temperature derating if applicable.
        </div>
        `;
    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Hazen-Williams Friction Loss Calculator (Example)
function calculateFrictionLoss() {
    const form = document.getElementById('friction-loss-form');
    const resultDiv = document.getElementById('friction-loss-result');
    if (!form.checkValidity()) {
        form.reportValidity();
        resultDiv.classList.add('hidden');
        return;
    }

    const flowInput = parseFloat(document.getElementById('pipe-flow').value);
    const diameterInput = parseFloat(document.getElementById('pipe-diameter').value);
    const lengthInput = parseFloat(document.getElementById('pipe-length').value);
    const cFactor = parseFloat(document.getElementById('c-factor').value);

    const unit = currentUnit; // Use the scoped variable
    const flowUnit = unitConversions.flow.unit[unit];
    const lengthUnit = unitConversions.length.unit[unit];
    const pressureUnit = unitConversions.pressure.unit[unit];

    // Convert inputs to Imperial for calculation (GPM, Inches, Feet)
    const Q_gpm = unit === 'imperial' ? flowInput : convert(flowInput, 'flow', 'imperial');
    const d_inches = unit === 'imperial' ? diameterInput : convert(diameterInput, 'diameter', 'imperial');
    const L_ft = unit === 'imperial' ? lengthInput : convert(lengthInput, 'length', 'imperial');
    
    // Hazen-Williams Formula for Pressure Loss (P_loss_per_ft = 4.52 * Q^1.85 / (C^1.85 * d^4.87))
    // Total Pressure Loss (P_loss_psi) = (4.52 * (Q_gpm**1.85) / ((cFactor**1.85) * (d_inches**4.87))) * L_ft
    const Q_185 = Math.pow(Q_gpm, 1.85);
    const C_185 = Math.pow(cFactor, 1.85);
    const d_487 = Math.pow(d_inches, 4.87);

    const P_loss_psi = (4.52 * Q_185 / (C_185 * d_487)) * L_ft;
    const P_loss_per_ft_psi = P_loss_psi / L_ft;
    
    // Convert results back to display units
    const P_loss_display = unit === 'imperial' ? P_loss_psi : convert(P_loss_psi, 'pressure', 'metric');
    const P_loss_per_unit_display = unit === 'imperial' ? P_loss_per_ft_psi : convert(P_loss_per_ft_psi, 'pressure', 'metric') / unitConversions.length.metric; // Convert PSI/ft to BAR/m

    // Convert inputs back for display in calculation steps
    const d_display = unit === 'imperial' ? diameterInput : diameterInput; // diameter is in Inches/mm for display
    const L_display = unit === 'imperial' ? lengthInput : lengthInput;

    resultDiv.innerHTML = `
        <h3>💧 Friction Loss Results (Hazen-Williams)</h3>
        <p>Calculated for ${formatNumber(flowInput, 1)} ${flowUnit} in a pipe with C-Factor of ${cFactor}.</p>
        
        <div style="background: #eef2ff; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #1e40af;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #1e40af;">Total Pressure Loss:</div>
            <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${formatNumber(P_loss_display, 2)} ${pressureUnit}</div>
        </div>

        <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 5px;">
            <strong>Pipe Loss Rate:</strong>
            <p>Loss Per Unit Length: **${formatNumber(P_loss_per_unit_display, 4)} ${pressureUnit}/${lengthUnit}**</p>
            
            <strong>Factors Used:</strong>
            <ul style="margin-top: 0.5rem; list-style-type: none; padding-left: 0;">
                <li>Flow (Q): ${formatNumber(flowInput, 1)} ${flowUnit}</li>
                <li>Length (L): ${formatNumber(L_display, 1)} ${lengthUnit}</li>
                <li>Nominal Diameter (d): ${formatNumber(d_display, 3)} ${unitConversions.diameter.unit[unit]} (Used in calc as ${formatNumber(d_inches, 3)} Inches)</li>
                <li>C-Factor: ${cFactor}</li>
            </ul>
        </div>
        
        <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-radius: 5px; color: #92400e;">
            <strong>Note:</strong> Hazen-Williams is an approximation. For critical systems, a more precise Darcy-Weisbach calculation is recommended.
        </div>
        `;
    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Required Fire Flow Calculator (Approximation)
function calculateFireFlow() {
    const form = document.getElementById('fireflow-form');
    const resultDiv = document.getElementById('fireflow-result');
    if (!form.checkValidity()) {
        form.reportValidity();
        resultDiv.classList.add('hidden');
        return;
    }

    const areaInput = parseFloat(document.getElementById('area-floor').value);
    const constructionFactor = parseFloat(document.getElementById('construction-type').value);
    const exposureFactor = parseFloat(document.getElementById('exposure-factor').value);

    const unit = currentUnit; // Use the scoped variable
    const flowUnit = unitConversions.flow.unit[unit];
    const areaUnit = unitConversions.area.unit[unit];

    // The calculation is based on Imperial units (Sq Ft)
    const A_sqFt = unit === 'imperial' ? areaInput : convert(areaInput, 'area', 'imperial');

    // Formula: Q = 102 * C * sqrt(A) * E (Simplified formula for approximation)
    let requiredFlow_gpm = 102 * constructionFactor * Math.sqrt(A_sqFt) * exposureFactor;
    
    // Set minimum flow (NFPA 13/other standards often have a minimum, e.g., 250 GPM)
    requiredFlow_gpm = Math.max(requiredFlow_gpm, 250); 
    
    // Max flow is often capped, e.g., 12000 GPM (used here for illustration)
    const finalFlow_gpm = Math.min(requiredFlow_gpm, 12000); 

    // Convert results back to display units
    const finalFlow_display = unit === 'imperial' ? finalFlow_gpm : convert(finalFlow_gpm, 'flow', 'metric');

    resultDiv.innerHTML = `
        <h3>🚒 Required Fire Flow Results (Approximation)</h3>
        <p>Estimates the minimum required fire flow (Q) based on simplified area and hazard factors.</p>
        
        <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #1e40af;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Minimum Required Fire Flow (Q):</div>
            <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${formatNumber(finalFlow_display, 0)} ${flowUnit}</div>
        </div>

        <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 5px;">
            <strong>Factors Used:</strong>
            <ul style="margin-top: 0.5rem; list-style-type: none; padding-left: 0;">
                <li>Total Area: ${formatNumber(areaInput, 0)} ${areaUnit}</li>
                <li>Construction Factor (C): ${constructionFactor}</li>
                <li>Exposure Factor (E): ${exposureFactor}</li>
                <li>Calculation: Q = 102 x ${constructionFactor} x sqrt(${formatNumber(A_sqFt, 0)}) x ${exposureFactor} = ${formatNumber(finalFlow_gpm, 0)} GPM</li>
            </ul>
        </div>
        
        <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-radius: 5px; color: #92400e;">
            <strong>Disclaimer:</strong> This is a highly simplified approximation (often used in older standards like ISO 1978). Required Fire Flow must be determined by a certified engineer following modern codes (NFPA, IBC, etc.) based on occupancy, sprinkler demand, and hydraulic calculations.
        </div>
        `;
    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// =================================================================
// INITIALIZATION
// =================================================================

// Event listeners and setup are moved here to ensure the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Load Unit Preference from localStorage (default to 'imperial')
    const savedUnit = localStorage.getItem('firesafetytool_unit') || 'imperial';
    
    // Set the scoped unit variable
    currentUnit = savedUnit; 

    // 2. Set the dropdown to the saved preference
    const unitSwitch = document.getElementById('unit-switch');
    if (unitSwitch) {
        unitSwitch.value = savedUnit;
    }

    // 3. Initialize navigation and labels
    setupNavigation(); 
    updateUnitLabels(); 

    // Form submit listeners
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
    const urlHash = window.location.hash.substring(1); // Remove '#'\n    if (urlHash) {
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
