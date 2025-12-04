// =================================================================
// GLOBAL STATE & UTILITIES
// =================================================================

window.currentUnit = 'imperial';

// CONSTANT for the new universal Amazon Affiliate Link (REQUEST 1)
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
    // Density (GPM/SqFt to LPM/m²): 1 GPM/Sq Ft = 40.746 LPM/m²
    density: { imperial: 1, metric: 40.746, unit: { imperial: 'GPM/Sq Ft', metric: 'LPM/m²' } },
    // Non-convertible items (Amps, Hours, Minutes, Ah) are 1:1
    nonconvertible: { imperial: 1, metric: 1 }
};

/** Converts a value from the current display unit to the calculation unit (Imperial). */
function convertToCalcUnit(value, type) {
    if (window.currentUnit === 'imperial' || !unitConversions[type]) {
        return value;
    }
    const factor = unitConversions[type].metric / unitConversions[type].imperial;
    return value / factor;
}

/** Converts a value from the calculation unit (Imperial) to the current display unit. */
function convertToDisplayUnit(value, type) {
    if (window.currentUnit === 'imperial' || !unitConversions[type]) {
        return value;
    }
    const factor = unitConversions[type].metric / unitConversions[type].imperial;
    return value * factor;
}

/** Gets the unit string for the current display unit. */
function getUnit(type) {
    if (!unitConversions[type] || !unitConversions[type].unit) {
        return '';
    }
    return unitConversions[type].unit[window.currentUnit];
}

function formatNumber(value, decimals = 2) {
    // Ensure value is a number before calling toFixed
    if (isNaN(value)) return 'N/A';
    return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateTitle(calculatorId) {
    const map = {
        'battery': 'Battery Standby Calculator (NFPA 72)',
        'smoke': 'Smoke Detector Spacing (NFPA 72)',
        'voltage': 'Voltage Drop Calculator (NFPA 72)',
        'nac': 'NAC Load Calculator (NFPA 72)',
        'waterdemand': 'Sprinkler Water Demand (NFPA 13)',
        'fireflow': 'Required Fire Flow (NFPA 1 / IBC)',
        'hydrant': 'Hydrant Flow Calculator (NFPA 291)',
        'friction': 'Friction Loss Calculator (Hazen-Williams)',
        'occupant': 'Occupant Load Calculator (NFPA 101 / IBC)',
        'headspacing': 'Sprinkler Head Spacing (NFPA 13)',
        'pump': 'Fire Pump Sizing (NFPA 20)',
    };
    const title = map[calculatorId] || 'Fire Safety Calculators';
    document.title = `${title} | FireSafetyTool.com`;
}

/** Validates inputs for non-negative, numeric values and shows error feedback. */
function validateInput(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[type="number"][required]');

    // Clear previous errors
    form.querySelectorAll('.input-error-message').forEach(el => el.remove());
    form.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));

    inputs.forEach(input => {
        const value = parseFloat(input.value);
        
        // Custom validation for inputs that can be 0 (like qty or available pressure)
        if (input.id === 'horn-qty' || input.id === 'strobe-qty' || input.id === 'horn-current' || input.id === 'strobe-current' || input.id === 'available-pressure') {
            if (value < 0 || isNaN(value)) {
                isValid = false;
                input.classList.add('error');
                const msg = document.createElement('p');
                msg.className = 'input-error-message';
                msg.textContent = 'Please enter a valid, non-negative number.';
                input.parentNode.appendChild(msg);
            }
            return;
        }
        
        // Default: Must be positive
        if (isNaN(value) || value <= 0) {
            isValid = false;
            input.classList.add('error');
            const msg = document.createElement('p');
            msg.className = 'input-error-message';
            msg.textContent = 'Please enter a valid, positive number.';
            input.parentNode.appendChild(msg);
        }
    });

    // Check required selects
    form.querySelectorAll('select[required]').forEach(select => {
        if (!select.value) {
            isValid = false;
            select.classList.add('error');
            const msg = document.createElement('p');
            msg.className = 'input-error-message';
            msg.textContent = 'Please select an option.';
            select.parentNode.appendChild(msg);
        }
    });
    
    return isValid;
}

function updateLabels() {
    const labels = document.querySelectorAll('[data-label-imperial], [data-label-metric]');
    const unitButton = document.getElementById('unit-switch');
    const unitText = window.currentUnit === 'imperial' ? 'Imperial (Ft, PSI, GPM)' : 'Metric (m, Bar, L/s)';
    unitButton.setAttribute('data-unit', window.currentUnit);
    unitButton.textContent = unitText;

    labels.forEach(label => {
        const key = `data-label-${window.currentUnit}`;
        if (label.hasAttribute(key)) {
            label.textContent = label.getAttribute(key);
        }
    });
}

function setupUnitToggle() {
    const unitSwitch = document.getElementById('unit-switch');
    if (!unitSwitch) return;

    unitSwitch.addEventListener('click', function() {
        window.currentUnit = window.currentUnit === 'imperial' ? 'metric' : 'imperial';
        updateLabels();
    });
}

// =================================================================
// INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    setupUnitToggle();
    setupNavigation();
    
    // Setup all 11 calculators (FIXES THE "TABS NOT WORKING" ISSUE)
    setupBatteryCalculator();
    setupSmokeCalculator();
    setupVoltageCalculator();
    setupNACCalculator();
    setupWaterDemandCalculator();
    setupFireFlowCalculator();
    setupHydrantCalculator();
    setupFrictionLossCalculator();
    setupOccupantLoadCalculator();
    setupHeadSpacingCalculator();
    setupPumpSizingCalculator();
    
    // Initially show the first calculator
    const initialCalculator = document.getElementById('battery-calculator');
    if (initialCalculator) initialCalculator.classList.remove('hidden');
    updateTitle('battery');
    updateLabels(); 
});

// Navigation logic (FIXES NAVIGATION ISSUES)
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const calculators = document.querySelectorAll('.calculator-box');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Only handle calculator buttons, not the link buttons (Resources/Contact)
            if (this.tagName === 'BUTTON' && this.dataset.calculator) {
                e.preventDefault();
                const targetCalculator = this.dataset.calculator;
                
                navButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                calculators.forEach(calc => calc.classList.add('hidden'));
                const targetElement = document.getElementById(targetCalculator + '-calculator');
                
                if (targetElement) {
                    targetElement.classList.remove('hidden');
                    updateTitle(targetCalculator); 
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}


// =================================================================
// 1. Battery Standby Calculator (FIXED & COMPLETE)
// =================================================================

function setupBatteryCalculator() {
    const form = document.getElementById('battery-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateInput(form)) return;

        const standbyCurrent = parseFloat(document.getElementById('standby-current').value);
        const alarmCurrent = parseFloat(document.getElementById('alarm-current').value);
        const standbyHours = parseFloat(document.getElementById('standby-hours').value);
        const alarmMinutes = parseFloat(document.getElementById('alarm-minutes').value);
        const resultDiv = document.getElementById('battery-result');
        
        const standbyAH = standbyCurrent * standbyHours;
        const alarmHours = alarmMinutes / 60;
        const alarmAH = alarmCurrent * alarmHours;
        const totalAH = standbyAH + alarmAH;

        const deratingFactor = 1.25; 
        const deratedAH = totalAH * deratingFactor;
        
        resultDiv.innerHTML = `
            <h3>🔋 Battery Calculation Results (NFPA 72)</h3>
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Minimum Required Battery Capacity:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${formatNumber(deratedAH, 2)} Ah</div>
                <small style="color: #666; display: block; margin-top: 5px;">Always select a battery size above calculated requirement</small>
            </div>
            
            <div style="margin-top: 2rem;">
                <strong>Calculation Breakdown:</strong>
                <div style="background: white; padding: 0.75rem; border-radius: 3px; margin-top: 0.5rem; font-size: 0.9rem;">
                    1. Standby Ah: ${formatNumber(standbyCurrent, 2)}A × ${standbyHours}h = **${formatNumber(standbyAH, 2)} Ah**<br>
                    2. Alarm Ah: ${formatNumber(alarmCurrent, 2)}A × ${formatNumber(alarmHours, 2)}h = **${formatNumber(alarmAH, 2)} Ah**<br>
                    3. Total Ah: **${formatNumber(totalAH, 2)} Ah**<br>
                    4. With Derating (×1.25): **${formatNumber(deratedAH, 2)} Ah**
                </div>
            </div>

            <div style="margin-top: 2rem; padding: 1rem; background: #fffbe6; border: 1px solid #f97316; border-radius: 5px; text-align: center;">
                <p style="margin-bottom: 0.5rem; font-weight: bold; color: #f97316;">Need a new battery or fire alarm supplies?</p>
                <a href="${AMAZON_AFFILIATE_LINK}" target="_blank" style="color: #dc2626; font-weight: 600;">Shop Fire Safety Products on Amazon (Affiliate Link)</a>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 2. Smoke Detector Spacing Calculator (COMPLETE)
// =================================================================

function setupSmokeCalculator() {
    const form = document.getElementById('smoke-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateInput(form)) return;
        
        const heightInput = parseFloat(document.getElementById('ceiling-height').value);
        const maxSpacing = parseFloat(document.getElementById('air-movement').value);
        const resultDiv = document.getElementById('smoke-result');

        const H_ft = convertToCalcUnit(heightInput, 'length');
        
        let S_max = maxSpacing;
        
        if (H_ft > 10) {
            S_max = maxSpacing - (H_ft - 10) * 3;
            if (S_max < 0) S_max = 0;
        }

        const coverageArea_sqft = S_max * S_max;
        const wallDistance_ft = S_max / 2;
        
        const coverageArea_display = convertToDisplayUnit(coverageArea_sqft, 'area');
        const wallDistance_display = convertToDisplayUnit(wallDistance_ft, 'length');

        const lengthUnit = getUnit('length');
        const areaUnit = getUnit('area');
        
        resultDiv.innerHTML = `
            <h3>⚡️ Smoke Detector Spacing Results (NFPA 72)</h3>
            <p>Based on a ceiling height of ${formatNumber(heightInput, 1)} ${lengthUnit}.</p>
            
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Maximum Detector Spacing:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${formatNumber(convertToDisplayUnit(S_max, 'length'), 1)} ${lengthUnit}</div>
            </div>
            
            <div style="margin-top: 1.5rem; background: #f0f9ff; padding: 1rem; border-radius: 5px;">
                <p>Maximum Coverage Area: **${formatNumber(coverageArea_display, 1)} ${areaUnit}**</p>
                <p>Maximum Wall Distance: **${formatNumber(wallDistance_display, 1)} ${lengthUnit}**</p>
                ${H_ft > 10 ? '<p style="color: #f97316; font-weight: bold;">Note: Spacing was reduced due to ceiling height exceeding 10 ft.</p>' : ''}
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 3. Voltage Drop Calculator (COMPLETE)
// =================================================================

function setupVoltageCalculator() {
    const form = document.getElementById('voltage-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateInput(form)) return;
        
        const lengthInput = parseFloat(document.getElementById('wire-length').value);
        const current = parseFloat(document.getElementById('circuit-current').value);
        const resistanceFactor = parseFloat(document.getElementById('wire-gauge').value);
        const voltage = parseFloat(document.getElementById('system-voltage').value);
        const resultDiv = document.getElementById('voltage-result');

        const L_ft = convertToCalcUnit(lengthInput, 'length');

        // Calculation: V_drop = 2 * L * R * I / 1000
        const voltageDrop = (2 * L_ft * resistanceFactor * current) / 1000;
        const voltageRemaining = voltage - voltageDrop;
        const percentageDrop = (voltageDrop / voltage) * 100;

        const maxRecommendedDrop = 10; // 10% is a common design limit
        const dropPass = percentageDrop < maxRecommendedDrop;

        const lengthUnit = getUnit('length');
        
        resultDiv.innerHTML = `
            <h3>⚡️ Voltage Drop Results (NFPA 72)</h3>
            <p>Calculated for a ${voltage}VDC circuit over ${formatNumber(lengthInput, 0)} ${lengthUnit} of wire.</p>
            
            <div style="background: ${dropPass ? '#ecfdf5' : '#fef3c7'}; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid ${dropPass ? '#047857' : '#f97316'};">
                <div style="font-size: 1.8rem; font-weight: bold; color: ${dropPass ? '#047857' : '#dc2626'};">Calculated Voltage Drop:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${formatNumber(voltageDrop, 2)} V</div>
                <small style="color: #666; display: block; margin-top: 5px;">Percentage Drop: **${formatNumber(percentageDrop, 1)}%**</small>
            </div>
            
            <div style="margin-top: 1.5rem; background: #f0f9ff; padding: 1rem; border-radius: 5px;">
                <p>Voltage Remaining at End of Line: **${formatNumber(voltageRemaining, 2)} V**</p>
                <p style="font-weight: bold; color: ${dropPass ? '#047857' : '#dc2626'};">${dropPass ? '✅ Result is within the 10% voltage drop limit.' : `❌ Result exceeds the ${maxRecommendedDrop}% voltage drop limit.`}</p>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 4. NAC Load Calculator (COMPLETE)
// =================================================================

function setupNACCalculator() {
    const form = document.getElementById('nac-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateInput(form)) return;
        
        const hornQty = parseFloat(document.getElementById('horn-qty').value);
        const hornCurrent = parseFloat(document.getElementById('horn-current').value);
        const strobeQty = parseFloat(document.getElementById('strobe-qty').value);
        const strobeCurrent = parseFloat(document.getElementById('strobe-current').value);
        const resultDiv = document.getElementById('nac-result');

        const hornTotalCurrent = hornQty * hornCurrent;
        const strobeTotalCurrent = strobeQty * strobeCurrent;
        const totalNACCurrent = hornTotalCurrent + strobeTotalCurrent;
        
        resultDiv.innerHTML = `
            <h3>📣 NAC Load Results</h3>
            <p>Calculated total alarm current draw for the Notification Appliance Circuit.</p>
            
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Total NAC Alarm Current:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${formatNumber(totalNACCurrent, 2)} Amps</div>
            </div>
            
            <div style="margin-top: 1.5rem; background: #f0f9ff; padding: 1rem; border-radius: 5px;">
                <p>Horns/Speakers Total: **${formatNumber(hornTotalCurrent, 2)} Amps** (${hornQty} units @ ${formatNumber(hornCurrent, 3)}A each)</p>
                <p>Strobes Total: **${formatNumber(strobeTotalCurrent, 2)} Amps** (${strobeQty} units @ ${formatNumber(strobeCurrent, 3)}A each)</p>
                <p style="margin-top: 0.75rem; font-weight: bold;">⚠️ Ensure your FACP NAC output capacity exceeds this value.</p>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 5. Water Demand Calculator (COMPLETE)
// =================================================================

function setupWaterDemandCalculator() {
    const form = document.getElementById('waterdemand-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateInput(form)) return;
        
        const densityInput = parseFloat(document.getElementById('density').value);
        const areaInput = parseFloat(document.getElementById('design-area').value);
        const hoseStreamInput = parseFloat(document.getElementById('hose-stream').value);
        const resultDiv = document.getElementById('waterdemand-result');

        const D_gpm_sqft = convertToCalcUnit(densityInput, 'density');
        const A_sqft = convertToCalcUnit(areaInput, 'area');
        const H_gpm = convertToCalcUnit(hoseStreamInput, 'flow');

        const sprinklerFlowGPM = D_gpm_sqft * A_sqft;
        const totalWaterDemandGPM = sprinklerFlowGPM + H_gpm;
        
        const sprinklerFlowDisplay = convertToDisplayUnit(sprinklerFlowGPM, 'flow');
        const totalWaterDemandDisplay = convertToDisplayUnit(totalWaterDemandGPM, 'flow');

        const densityUnit = getUnit('density');
        const areaUnit = getUnit('area');
        const flowUnit = getUnit('flow');
        
        resultDiv.innerHTML = `
            <h3>💦 Sprinkler Water Demand Results (NFPA 13)</h3>
            <p>Based on Area/Density Method.</p>
            
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Total Required Water Demand:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${Math.round(totalWaterDemandDisplay)} ${flowUnit}</div>
            </div>
            
            <div style="margin-top: 1.5rem; background: #f0f9ff; padding: 1rem; border-radius: 5px;">
                <p>Sprinkler Flow (D×A): **${Math.round(sprinklerFlowDisplay)} ${flowUnit}** (${formatNumber(densityInput, 3)} ${densityUnit} × ${formatNumber(areaInput, 0)} ${areaUnit})</p>
                <p>Hose Stream Allowance: **${Math.round(convertToDisplayUnit(H_gpm, 'flow'))} ${flowUnit}**</p>
                <p style="margin-top: 0.75rem; font-weight: bold;">Note: This is the flow rate at the calculated demand pressure.</p>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 6. Required Fire Flow Calculator (COMPLETE)
// =================================================================

function setupFireFlowCalculator() {
    const form = document.getElementById('fireflow-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateInput(form)) return;
        
        const areaInput = parseFloat(document.getElementById('building-area').value);
        const factor = parseFloat(document.getElementById('construction-type').value);
        const resultDiv = document.getElementById('fireflow-result');

        const A_sqft = convertToCalcUnit(areaInput, 'area');
        
        // Calculation: F (GPM) = 102 * sqrt(A) * factor
        const rawFlowGPM = 102 * Math.sqrt(A_sqft);
        const adjustedFlowGPM = rawFlowGPM * factor;
        
        const finalFlowGPM = Math.min(adjustedFlowGPM, 3000); 
        
        const finalFlowDisplay = convertToDisplayUnit(finalFlowGPM, 'flow');

        const areaUnit = getUnit('area');
        const flowUnit = getUnit('flow');

        const constructionText = document.getElementById('construction-type').options[document.getElementById('construction-type').selectedIndex].text;
        
        resultDiv.innerHTML = `
            <h3>🔥 Required Fire Flow Results (NFPA 1/IBC)</h3>
            <p>Minimum fire flow based on the largest contiguous building area and construction type.</p>
            
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Minimum Required Fire Flow:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${Math.round(finalFlowDisplay)} ${flowUnit}</div>
            </div>
            
            <div style="margin-top: 1.5rem; background: #f0f9ff; padding: 1rem; border-radius: 5px;">
                <p>Building Area: **${formatNumber(areaInput, 0)} ${areaUnit}**</p>
                <p>Construction Type: **${constructionText}** (Multiplier: ${factor})</p>
                <p style="margin-top: 0.75rem; font-weight: bold;">⚠️ This result may be capped. Always check local fire code limits.</p>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 7. Hydrant Flow Calculator (COMPLETE)
// =================================================================

function setupHydrantCalculator() {
    const form = document.getElementById('hydrant-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateInput(form)) return;
        
        const pressureInput = parseFloat(document.getElementById('pitot-pressure').value);
        const diameterInput = parseFloat(document.getElementById('nozzle-diameter').value);
        const coefficient = parseFloat(document.getElementById('discharge-coefficient').value);
        const resultDiv = document.getElementById('hydrant-result');

        const P_psi = convertToCalcUnit(pressureInput, 'pressure');
        const d_in = convertToCalcUnit(diameterInput, 'diameter');
        
        // NFPA 291 Formula: Q (GPM) = 29.83 * C * d² * sqrt(P)
        const flowRateGPM = 29.83 * coefficient * Math.pow(d_in, 2) * Math.sqrt(P_psi);
        
        const flowDisplay = convertToDisplayUnit(flowRateGPM, 'flow');
        
        const pressureUnit = getUnit('pressure');
        const diameterUnit = getUnit('diameter');
        const flowUnit = getUnit('flow');
        
        resultDiv.innerHTML = `
            <h3>💧 Hydrant Flow Results (NFPA 291)</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Pitot Pressure: ${formatNumber(pressureInput, 1)} ${pressureUnit} | Nozzle Diameter: ${formatNumber(diameterInput, 2)} ${diameterUnit}</div>
            </div>
            
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Estimated Flow Rate:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${Math.round(flowDisplay)} ${flowUnit}</div>
            </div>
            <p style="margin-top: 1rem; color: #6b7280; text-align: center;">Coefficient used: ${coefficient}</p>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 8. Friction Loss Calculator (COMPLETE with Affiliate Update)
// =================================================================

function setupFrictionLossCalculator() {
    const form = document.getElementById('friction-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateInput(form)) return;
        
        const flowRateInput = parseFloat(document.getElementById('flow-rate').value);
        const lengthInput = parseFloat(document.getElementById('pipe-length').value);
        const diameterInput = parseFloat(document.getElementById('pipe-diameter').value);
        const cFactor = parseFloat(document.getElementById('c-factor').value);
        const resultDiv = document.getElementById('friction-result');

        const Q_gpm = convertToCalcUnit(flowRateInput, 'flow');
        const L_ft = convertToCalcUnit(lengthInput, 'length');
        const d_in = convertToCalcUnit(diameterInput, 'diameter');

        // Hazen-Williams Formula for Pressure Loss (psi/ft)
        const flowTerm = Math.pow(Q_gpm, 1.85);
        const cTerm = Math.pow(cFactor, 1.85);
        const dTerm = Math.pow(d_in, 4.87);
        
        const lossPerFoot = 4.52 * (flowTerm / (cTerm * dTerm));
        
        const totalFrictionLoss_psi = lossPerFoot * L_ft;
        
        const totalFrictionLoss_display = convertToDisplayUnit(totalFrictionLoss_psi, 'pressure');
        const lossPerFoot_display = convertToDisplayUnit(lossPerFoot, 'pressure');

        const flowUnit = getUnit('flow');
        const lengthUnit = getUnit('length');
        const diameterUnit = getUnit('diameter');
        const pressureUnit = getUnit('pressure');
        
        resultDiv.innerHTML = `
            <h3>📐 Friction Loss Results (Hazen-Williams)</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Hazen-Williams C-Factor: ${cFactor}</div>
                <div style="font-size: 1.8rem; font-weight: bold; color: #1e40af;">Loss Per Unit Length: ${formatNumber(lossPerFoot_display, 4)} ${pressureUnit}/${lengthUnit}</div>
            </div>
            
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Total Friction Pressure Loss:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${formatNumber(totalFrictionLoss_display, 2)} ${pressureUnit}</div>
                <div style="font-size: 0.9rem; color: #666;">(Calculated over ${formatNumber(lengthInput, 0)} ${lengthUnit} of pipe)</div>
            </div>

            <div style="margin-top: 2rem; padding: 1rem; background: #fffbe6; border: 1px solid #f97316; border-radius: 5px; text-align: center;">
                <p style="margin-bottom: 0.5rem; font-weight: bold; color: #f97316;">Need a reliable reference book or supplies for hydraulics?</p>
                <a href="${AMAZON_AFFILIATE_LINK}" target="_blank" style="color: #dc2626; font-weight: 600;">Shop Fire Safety Products on Amazon (Affiliate Link)</a>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 9. Occupant Load Calculator (COMPLETE)
// =================================================================

function setupOccupantLoadCalculator() {
    const form = document.getElementById('occupant-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateInput(form)) return;
        
        const areaInput = parseFloat(document.getElementById('area').value);
        const factor_sqft_per_person = parseFloat(document.getElementById('occupancy-type').value);
        const resultDiv = document.getElementById('occupant-result');

        if (isNaN(factor_sqft_per_person)) {
             alert("Please select a valid Occupancy Group.");
             return;
        }

        const A_sqft = convertToCalcUnit(areaInput, 'area');
        
        const occupantLoad = Math.floor(A_sqft / factor_sqft_per_person);
        
        const areaUnit = getUnit('area');
        const occupancyText = document.getElementById('occupancy-type').options[document.getElementById('occupancy-type').selectedIndex].text;

        resultDiv.innerHTML = `
            <h3>👥 Occupant Load Results (NFPA 101/IBC)</h3>
            <p>Calculated for **${occupancyText}** at ${formatNumber(factor_sqft_per_person, 0)} Sq Ft/Person.</p>
            
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Maximum Allowed Occupant Load:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${occupantLoad} People</div>
            </div>
            
            <div style="margin-top: 1.5rem; background: #f0f9ff; padding: 1rem; border-radius: 5px;">
                <p>Total Area Used: **${formatNumber(areaInput, 1)} ${areaUnit}**</p>
                <p style="margin-top: 0.75rem; font-weight: bold;">Note: This result determines exit width requirements.</p>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 10. Sprinkler Head Spacing Calculator (COMPLETE)
// =================================================================

function setupHeadSpacingCalculator() {
    const form = document.getElementById('headspacing-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateInput(form)) return;
        
        const maxCoverageSqFt = parseFloat(document.getElementById('hazard-class').value);
        const maxSpacingFt = parseFloat(document.getElementById('max-spacing').value);
        const resultDiv = document.getElementById('headspacing-result');

        const S_max = Math.sqrt(maxCoverageSqFt);
        
        const maxSideLength = Math.min(S_max, maxSpacingFt);
        
        const sideS = maxSideLength;
        const sideL = Math.min(maxSideLength * 1.5, maxCoverageSqFt / maxSideLength); 

        const wallDistance_ft = sideL / 2;
        
        const actualCoverageSqFt = sideS * sideL;

        const sideS_display = convertToDisplayUnit(sideS, 'length');
        const sideL_display = convertToDisplayUnit(sideL, 'length');
        const wallDistance_display = convertToDisplayUnit(wallDistance_ft, 'length');
        const coverageArea_display = convertToDisplayUnit(actualCoverageSqFt, 'area');

        const lengthUnit = getUnit('length');
        const areaUnit = getUnit('area');
        const hazardText = document.getElementById('hazard-class').options[document.getElementById('hazard-class').selectedIndex].text;
        
        resultDiv.innerHTML = `
            <h3>🌐 Sprinkler Head Spacing Results (NFPA 13)</h3>
            <p>Calculated for **${hazardText}** (Max ${maxCoverageSqFt} Sq Ft per head).</p>
            
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Max Spacing Configuration (L × S):</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${formatNumber(sideL_display, 1)} ${lengthUnit} × ${formatNumber(sideS_display, 1)} ${lengthUnit}</div>
                <small style="color: #666; display: block; margin-top: 5px;">Actual Max Coverage: **${formatNumber(coverageArea_display, 1)} ${areaUnit}**</small>
            </div>
            
            <div style="margin-top: 1.5rem; background: #f0f9ff; padding: 1rem; border-radius: 5px;">
                <p>Max Distance to Wall: **${formatNumber(wallDistance_display, 1)} ${lengthUnit}** (Half of the longest side)</p>
                <p style="margin-top: 0.75rem; font-weight: bold;">Rule Check: Ratio L/S is ${formatNumber(sideL / sideS, 2)} (Must be ≤ 1.5)</p>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 11. Fire Pump Sizing Calculator (COMPLETE)
// =================================================================

function setupPumpSizingCalculator() {
    const form = document.getElementById('pump-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateInput(form)) return;
        
        const flowInput = parseFloat(document.getElementById('system-flow').value);
        const pressureInput = parseFloat(document.getElementById('system-pressure').value);
        const availablePressureInput = parseFloat(document.getElementById('available-pressure').value);
        const resultDiv = document.getElementById('pump-result');

        const Q_gpm = convertToCalcUnit(flowInput, 'flow');
        const P_req_psi = convertToCalcUnit(pressureInput, 'pressure');
        const P_avail_psi = convertToCalcUnit(availablePressureInput, 'pressure');
        
        const pumpHead_psi = P_req_psi - P_avail_psi;

        const standardPumpFlows = [250, 500, 750, 1000, 1250, 1500, 2000, 2500, 3000];
        let requiredPumpGPM = 0;
        for (let flow of standardPumpFlows) {
            if (flow >= Q_gpm) {
                requiredPumpGPM = flow;
                break;
            }
            if (flow === standardPumpFlows[standardPumpFlows.length - 1] && Q_gpm > flow) {
                 requiredPumpGPM = Math.ceil(Q_gpm / 100) * 100;
            }
        }
        
        if (requiredPumpGPM === 0) {
            requiredPumpGPM = Math.ceil(Q_gpm / 100) * 100;
        }

        const requiredPumpFlowDisplay = convertToDisplayUnit(requiredPumpGPM, 'flow');
        const requiredPumpHeadDisplay = convertToDisplayUnit(pumpHead_psi, 'pressure');

        const flowUnit = getUnit('flow');
        const pressureUnit = getUnit('pressure');

        let pumpHeadText = '';
        let pass = true;
        if (pumpHead_psi < 0) {
            pumpHeadText = `Available pressure (${formatNumber(availablePressureInput, 0)} ${pressureUnit}) is higher than required pressure! No pump needed.`;
            pass = false;
        } else {
            pumpHeadText = `Required Pump Pressure (Head): **${formatNumber(requiredPumpHeadDisplay, 0)} ${pressureUnit}**`;
        }
        
        resultDiv.innerHTML = `
            <h3>⚙️ Fire Pump Sizing Results (NFPA 20)</h3>
            <p>Calculates the required flow and pressure boost for the fire pump.</p>
            
            <div style="background: ${pass ? '#ecfdf5' : '#fef3c7'}; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid ${pass ? '#047857' : '#f97316'};">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Minimum Pump Flow Rating:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${Math.round(requiredPumpFlowDisplay)} ${flowUnit}</div>
            </div>
            
            <div style="margin-top: 1.5rem; background: #f0f9ff; padding: 1rem; border-radius: 5px;">
                <p>${pumpHeadText}</p>
                <p style="margin-top: 0.75rem; font-weight: bold;">⚠️ Always use the next available standard pump size and pressure rating greater than this result.</p>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
