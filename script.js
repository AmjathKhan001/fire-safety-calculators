// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupBatteryCalculator();
    setupSmokeCalculator();
    setupVoltageCalculator();
    setupNACCalculator();
    setupWaterDemandCalculator();
    setupFireFlowCalculator(); // NEW
    setupHydrantCalculator();
    setupFrictionLossCalculator();
    setupOccupantLoadCalculator();
    setupHeadSpacingCalculator(); // NEW
    setupPumpSizingCalculator();
    
    // Initially show the first calculator
    document.getElementById('battery-calculator').classList.remove('hidden');
});

// Navigation between calculators
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const calculators = document.querySelectorAll('.calculator-box');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Check if it's a button meant for calculator switching
            if (this.tagName === 'BUTTON' && this.dataset.calculator) {
                e.preventDefault();
                const targetCalculator = this.dataset.calculator;
                
                // Update active button
                navButtons.forEach(btn => btn.classList.remove('active'));
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
}

// =================================================================
// 1. Battery Standby Calculator (NFPA 72)
// =================================================================

function setupBatteryCalculator() {
    const form = document.getElementById('battery-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const standbyCurrent = parseFloat(document.getElementById('standby-current').value);
        const alarmCurrent = parseFloat(document.getElementById('alarm-current').value);
        const standbyHours = parseFloat(document.getElementById('standby-hours').value);
        const alarmMinutes = parseFloat(document.getElementById('alarm-minutes').value);
        const resultDiv = document.getElementById('battery-result');
        
        if (isNaN(standbyCurrent) || isNaN(alarmCurrent) || isNaN(standbyHours) || isNaN(alarmMinutes) || standbyCurrent < 0 || alarmCurrent < 0 || standbyHours <= 0 || alarmMinutes <= 0) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter valid positive numbers for all fields.</p>`;
            return;
        }

        const standbyAH = standbyCurrent * standbyHours;
        const alarmHours = alarmMinutes / 60;
        const alarmAH = alarmCurrent * alarmHours;
        const totalAH = standbyAH + alarmAH;

        const deratingFactor = 1.25; // 25% margin as required by NFPA
        const deratedAH = totalAH * deratingFactor;
        
        resultDiv.innerHTML = `
            <h3>🔋 Battery Calculation Results (NFPA 72)</h3>
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Minimum Required Battery Capacity:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${deratedAH.toFixed(2)} Ah</div>
                <small style="color: #666; display: block; margin-top: 5px;">Always select a battery size above calculated requirement</small>
            </div>
            
            <div style="margin-top: 1rem;">
                <strong>Calculation Breakdown:</strong>
                <div style="background: white; padding: 0.75rem; border-radius: 3px; margin-top: 0.5rem; font-size: 0.9rem;">
                    1. Standby Ah: ${standbyCurrent}A × ${standbyHours}h = **${standbyAH.toFixed(2)} Ah**<br>
                    2. Alarm Ah: ${alarmCurrent}A × ${alarmHours.toFixed(2)}h = **${alarmAH.toFixed(2)} Ah**<br>
                    3. Total Ah: **${totalAH.toFixed(2)} Ah**<br>
                    4. With Derating (×1.25): **${deratedAH.toFixed(2)} Ah**
                </div>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 2. Smoke Detector Spacing Calculator (NFPA 72)
// =================================================================

function setupSmokeCalculator() {
    const form = document.getElementById('smoke-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const height = parseFloat(document.getElementById('ceiling-height').value);
        const airMovementFactor = parseFloat(document.getElementById('air-movement').value); 
        const resultDiv = document.getElementById('smoke-result');

        if (!height || height <= 0) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter a valid Ceiling Height.</p>`;
            return;
        }
        
        if (height > 30) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `
                <h3>⚠️ Ceiling Height Warning</h3>
                <p style="color: #a94442;">Spot-type smoke detectors are generally ineffective above 30ft. Consider **Beam Detectors** or **Air-Sampling** systems (NFPA 72).</p>
            `;
            return;
        }

        let spacing = airMovementFactor; 
        const maxCoverageArea = spacing * spacing;

        resultDiv.innerHTML = `
            <h3>🚬 Smoke Detector Spacing Results (NFPA 72, Chapter 17)</h3>
            
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Maximum Center-to-Center Spacing: </div>
                <div style="font-size: 2.5rem; font-weight: bold; color: #1e40af;">${spacing} Feet</div>
            </div>

            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Maximum Coverage Area Per Detector:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${maxCoverageArea} Sq Ft</div>
                <div style="font-size: 0.9rem; color: #666;">(Based on a ${spacing} ft x ${spacing} ft area)</div>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border-radius: 5px; border-left: 4px solid #f97316;">
                <strong>💡 Note:</strong> First detector must be placed half the spacing distance from the wall (e.g., ${spacing / 2}ft for ${spacing}ft spacing).
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 3. Voltage Drop Calculator (NFPA 72)
// =================================================================

function setupVoltageCalculator() {
    const form = document.getElementById('voltage-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const length = parseFloat(document.getElementById('wire-length').value);
        const current = parseFloat(document.getElementById('circuit-current').value);
        const resistance = parseFloat(document.getElementById('wire-gauge').value);
        const systemVoltage = parseFloat(document.getElementById('system-voltage').value);
        const resultDiv = document.getElementById('voltage-result');

        if (!length || length <= 0 || !current || current <= 0 || !resistance || !systemVoltage) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter valid, positive numbers for all fields.</p>`;
            return;
        }

        // Vd = 2 * R * I * L / 1000 (2 is for round trip)
        const voltageDrop = 2 * resistance * current * length / 1000;
        
        const finalVoltage = systemVoltage - voltageDrop;
        const maxDropAllowed = 0.1 * systemVoltage; // Generally 10% is max allowed drop 
        const status = voltageDrop < maxDropAllowed ? "PASS ✅" : "FAIL ❌";
        const statusColor = voltageDrop < maxDropAllowed ? "#047857" : "#dc2626";
        const statusText = voltageDrop < maxDropAllowed ? "Voltage drop is acceptable (less than 10% of system voltage)." : "Voltage drop is too high! Increase wire gauge or shorten the run.";

        resultDiv.innerHTML = `
            <h3>⚡️ Voltage Drop Results (Ohm's Law)</h3>
            
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Calculated Voltage Drop: </div>
                <div style="font-size: 2.5rem; font-weight: bold; color: #1e40af;">${voltageDrop.toFixed(2)} Volts</div>
            </div>

            <div style="background: ${statusColor === '#047857' ? '#ecfdf5' : '#fef2f2'}; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid ${statusColor};">
                <div style="font-size: 1.8rem; font-weight: bold; color: ${statusColor};">${status}</div>
                <div style="font-size: 1.1rem; color: #666;">${statusText}</div>
            </div>
            
            <div style="margin-top: 1rem;">
                <strong>Key Voltages:</strong>
                <div style="background: white; padding: 0.75rem; border-radius: 3px; margin-top: 0.5rem; font-size: 0.9rem;">
                    Original Voltage: **${systemVoltage.toFixed(2)} V**<br>
                    Voltage at End of Line: **${finalVoltage.toFixed(2)} V**<br>
                    Max Allowed Drop (10%): **${maxDropAllowed.toFixed(2)} V**
                </div>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 4. NAC Load Calculator (NFPA 72)
// =================================================================

function setupNACCalculator() {
    const form = document.getElementById('nac-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const hornQty = parseInt(document.getElementById('horn-qty').value) || 0;
        const hornCurrent = parseFloat(document.getElementById('horn-current').value) || 0;
        const strobeQty = parseInt(document.getElementById('strobe-qty').value) || 0;
        const strobeCurrent = parseFloat(document.getElementById('strobe-current').value) || 0;
        const resultDiv = document.getElementById('nac-result');

        if (hornQty < 0 || hornCurrent < 0 || strobeQty < 0 || strobeCurrent < 0) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Quantities and currents must be non-negative.</p>`;
            return;
        }

        const totalHornCurrent = hornQty * hornCurrent;
        const totalStrobeCurrent = strobeQty * strobeCurrent;
        
        // Use sum for worst-case, maximum possible load (conservative calculation)
        const totalNACCurrent = totalHornCurrent + totalStrobeCurrent;
        
        resultDiv.innerHTML = `
            <h3>📣 NAC Load Results</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Total Device Current: </div>
                <div style="font-size: 2.5rem; font-weight: bold; color: #1e40af;">${totalNACCurrent.toFixed(3)} Amps</div>
            </div>

            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Load per Device Type:</div>
                <div style="font-size: 1.2rem; color: #666; margin-top: 10px;">
                    Horns/Speakers: **${totalHornCurrent.toFixed(3)} Amps**<br>
                    Strobes: **${totalStrobeCurrent.toFixed(3)} Amps**
                </div>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border-radius: 5px; border-left: 4px solid #f97316;">
                <strong>💡 Important:</strong> The total current must be less than the NAC panel's capacity. Always use the manufacturer's specified worst-case current draw for each device.
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 5. Water Demand Calculator (NFPA 13)
// =================================================================

function setupWaterDemandCalculator() {
    const form = document.getElementById('waterdemand-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const density = parseFloat(document.getElementById('density').value);
        const designArea = parseFloat(document.getElementById('design-area').value);
        const hoseStream = parseFloat(document.getElementById('hose-stream').value);
        const resultDiv = document.getElementById('waterdemand-result');

        if (!density || density <= 0 || !designArea || designArea <= 0 || isNaN(hoseStream)) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter valid, positive numbers for all fields.</p>`;
            return;
        }

        // Calculation: Sprinkler Flow = Density * Design Area
        const sprinklerFlow = density * designArea;
        
        // Total Demand = Sprinkler Flow + Hose Stream
        const totalWaterDemand = sprinklerFlow + hoseStream;
        
        resultDiv.innerHTML = `
            <h3>💦 Sprinkler Water Demand Results (NFPA 13)</h3>
            
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Required Sprinkler Flow (System): </div>
                <div style="font-size: 2.5rem; font-weight: bold; color: #1e40af;">${sprinklerFlow.toFixed(1)} GPM</div>
                <div style="font-size: 0.9rem; color: #666;">(${density} GPM/ft² × ${designArea} ft²)</div>
            </div>

            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Total Required Water Demand:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${totalWaterDemand.toFixed(1)} GPM</div>
                <div style="font-size: 0.9rem; color: #666;">(System Flow + ${hoseStream} GPM Hose Stream)</div>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border-radius: 5px; border-left: 4px solid #f97316;">
                <strong>💡 Note:</strong> This is the flow requirement. Pressure requirement must be determined via hydraulic calculations (Hazen-Williams).
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 6. Required Fire Flow Calculator (NFPA 1 / IBC) (NEW)
// =================================================================

function setupFireFlowCalculator() {
    const form = document.getElementById('fireflow-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const area = parseFloat(document.getElementById('building-area').value);
        const multiplier = parseFloat(document.getElementById('construction-type').value);
        const resultDiv = document.getElementById('fireflow-result');

        if (!area || area <= 0 || !multiplier || multiplier <= 0) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter a valid Building Area and select a Construction Type.</p>`;
            return;
        }

        // Simplified Formula: Q = (102 * sqrt(Area)) * Multiplier
        let calculatedFlow = 102 * Math.sqrt(area);
        
        // Max Flow Check (usually 3000 GPM max for most cases)
        if (calculatedFlow > 3000) {
            calculatedFlow = 3000;
        }

        const finalRequiredFlow = calculatedFlow * multiplier;
        const requiredDuration = finalRequiredFlow <= 1500 ? 120 : 180; // Simple NFPA 1/IBC duration rule

        resultDiv.innerHTML = `
            <h3>🔥 Required Fire Flow Results (NFPA 1 / IBC)</h3>
            
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Base Flow Calculation (102 × √Area): </div>
                <div style="font-size: 1.8rem; font-weight: bold; color: #1e40af;">${calculatedFlow.toFixed(0)} GPM</div>
            </div>

            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Total Required Fire Flow:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${finalRequiredFlow.toFixed(0)} GPM</div>
                <div style="font-size: 1.1rem; color: #666; margin-top: 10px;">Required Duration: **${requiredDuration} Minutes**</div>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border-radius: 5px; border-left: 4px solid #f97316;">
                <strong>💡 Note:</strong> This is a non-sprinklered, single-building estimate. For fully sprinklered buildings, a reduction (0.5 multiplier) is applied. Consult local codes.
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}


// =================================================================
// 7. Hydrant Flow Calculator (NFPA 291)
// =================================================================

function setupHydrantCalculator() {
    const form = document.getElementById('hydrant-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const pressure = parseFloat(document.getElementById('pitot-pressure').value);
        const diameter = parseFloat(document.getElementById('nozzle-diameter').value);
        const coefficient = parseFloat(document.getElementById('discharge-coefficient').value);
        const resultDiv = document.getElementById('hydrant-result');

        if (!pressure || pressure <= 0 || !diameter || diameter <= 0 || !coefficient || coefficient <= 0) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter valid, positive numbers for all fields.</p>`;
            return;
        }

        // NFPA 291 Formula: Q = 29.83 * C * d² * sqrt(P)
        const flowRate = 29.83 * coefficient * Math.pow(diameter, 2) * Math.sqrt(pressure);
        
        resultDiv.innerHTML = `
            <h3>💧 Hydrant Flow Results (NFPA 291)</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Formula Used: Q = 29.83 * C * d² * √P</div>
                <div style="font-size: 1.8rem; font-weight: bold; color: #1e40af;">Pitot Pressure: ${pressure.toFixed(1)} PSI</div>
            </div>
            
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Estimated Flow Rate:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${Math.round(flowRate)} GPM</div>
                <div style="font-size: 0.9rem; color: #666;">(Gallons Per Minute)</div>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border-radius: 5px; border-left: 4px solid #f97316;">
                <strong>💡 Note:</strong> This is a spot measurement. Full flow testing requires measuring both static and residual pressures.
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 8. Friction Loss Calculator (Hazen-Williams)
// =================================================================

function setupFrictionLossCalculator() {
    const form = document.getElementById('friction-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const flowRate = parseFloat(document.getElementById('flow-rate').value);
        const length = parseFloat(document.getElementById('pipe-length').value);
        const diameter = parseFloat(document.getElementById('pipe-diameter').value);
        const cFactor = parseFloat(document.getElementById('c-factor').value);
        const resultDiv = document.getElementById('friction-result');

        if (!flowRate || flowRate <= 0 || !length || length <= 0 || !diameter || diameter <= 0 || !cFactor || cFactor <= 0) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter valid, positive numbers for all fields.</p>`;
            return;
        }

        // Hazen-Williams Formula for Pressure Loss (psi)
        // P_L = 4.52 * (Q^1.85 / (C^1.85 * d^4.87)) * L
        const flowTerm = Math.pow(flowRate, 1.85);
        const cTerm = Math.pow(cFactor, 1.85);
        const dTerm = Math.pow(diameter, 4.87);
        
        const lossPerFoot = 4.52 * (flowTerm / (cTerm * dTerm));
        
        const totalFrictionLoss = lossPerFoot * length;
        
        resultDiv.innerHTML = `
            <h3>📐 Friction Loss Results (Hazen-Williams)</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Hazen-Williams C-Factor: ${cFactor}</div>
                <div style="font-size: 1.8rem; font-weight: bold; color: #1e40af;">Loss Per Foot: ${lossPerFoot.toFixed(4)} PSI/ft</div>
            </div>
            
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Total Friction Pressure Loss:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${totalFrictionLoss.toFixed(2)} PSI</div>
                <div style="font-size: 0.9rem; color: #666;">(Calculated over ${length} feet of pipe)</div>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border-radius: 5px; border-left: 4px solid #f97316;">
                <strong>💡 Note:</strong> This does not include pressure loss from fittings (equivalent lengths). Add those separately for total system loss.
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 9. Occupant Load Calculator (NFPA 101/IBC)
// =================================================================

function setupOccupantLoadCalculator() {
    const form = document.getElementById('occupant-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const area = parseFloat(document.getElementById('area').value);
        const occupancyType = document.getElementById('occupancy-type').value;
        const resultDiv = document.getElementById('occupant-result');

        if (!area || area <= 0 || !occupancyType) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter a valid Area and select an Occupancy Type.</p>`;
            return;
        }

        const loadFactor = parseFloat(occupancyType);
        let calculatedLoad = area / loadFactor;

        // NFPA/IBC requires rounding UP to the next whole number
        const finalOccupantLoad = Math.ceil(calculatedLoad);
        
        resultDiv.innerHTML = `
            <h3>👥 Occupant Load Results (NFPA 101/IBC)</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Required Occupancy Factor: </div>
                <div style="font-size: 1.8rem; font-weight: bold; color: #1e40af;">${loadFactor} sq ft / person</div>
            </div>
            
            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Maximum Allowed Occupants:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${finalOccupantLoad} People</div>
                <div style="font-size: 0.9rem; color: #666;">(Area ${area.toFixed(1)} / Factor ${loadFactor} = ${calculatedLoad.toFixed(2)}, rounded up)</div>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 10. Sprinkler Head Spacing Calculator (NFPA 13) (NEW)
// =================================================================

function setupHeadSpacingCalculator() {
    const form = document.getElementById('headspacing-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const maxCoverageArea = parseFloat(document.getElementById('hazard-class').value);
        const maxSpacing = parseFloat(document.getElementById('max-spacing').value);
        const resultDiv = document.getElementById('headspacing-result');

        if (!maxCoverageArea || maxCoverageArea <= 0 || !maxSpacing || maxSpacing <= 0) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter valid, positive numbers for all fields.</p>`;
            return;
        }

        // NFPA 13 rules (simplified): Max Area determines Max Spacing in one direction.
        // For a square coverage: Max Area = S * W. Max Wall Distance = Max Spacing / 2.
        
        // Find the side length of a square with MaxCoverageArea (Theoretical Max Spacing)
        const sideLength = Math.sqrt(maxCoverageArea);
        
        // Max distance from wall or obstruction is half the maximum allowed spacing
        const maxWallDistance = maxSpacing / 2; 

        // Determine hazard class for display
        let hazardClassText = "";
        if (maxCoverageArea === 225) hazardClassText = "Light Hazard";
        else if (maxCoverageArea === 130) hazardClassText = "Ordinary Hazard";
        else if (maxCoverageArea === 100) hazardClassText = "Extra Hazard";
        else hazardClassText = "Custom Hazard";


        resultDiv.innerHTML = `
            <h3>🌐 Sprinkler Head Spacing Results (NFPA 13)</h3>
            
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Selected Hazard Class: </div>
                <div style="font-size: 1.8rem; font-weight: bold; color: #1e40af;">${hazardClassText}</div>
                <div style="font-size: 0.9rem; color: #666;">(Max Area: ${maxCoverageArea} Sq Ft)</div>
            </div>

            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Key Spacing Limits:</div>
                <div style="font-size: 1.2rem; color: #666; margin-top: 10px;">
                    Maximum Center-to-Center Spacing (S or W): **${maxSpacing.toFixed(1)} Feet**<br>
                    Maximum Wall Distance: **${maxWallDistance.toFixed(1)} Feet**
                </div>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border-radius: 5px; border-left: 4px solid #f97316;">
                <strong>💡 Rule of Thumb:</strong> You must meet both the maximum area and maximum linear spacing requirements. Wall distance is always S/2.
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 11. Fire Pump Sizing Calculator (NFPA 20)
// =================================================================

function setupPumpSizingCalculator() {
    const form = document.getElementById('pump-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const systemFlow = parseFloat(document.getElementById('system-flow').value);
        const systemPressure = parseFloat(document.getElementById('system-pressure').value);
        const availablePressure = parseFloat(document.getElementById('available-pressure').value);
        const resultDiv = document.getElementById('pump-result');

        if (!systemFlow || systemFlow <= 0 || !systemPressure || systemPressure <= 0 || availablePressure < 0) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter valid, positive numbers for required flow and pressure.</p>`;
            return;
        }

        // Calculation: Required Pump Pressure = Required System Pressure - Available Pressure
        const requiredPumpPressure = systemPressure - availablePressure;

        let statusText = "Pump is required to boost pressure.";
        let statusColor = "#047857";
        
        if (requiredPumpPressure <= 0) {
            statusText = "A pump is likely not needed. The available water supply pressure is greater than or equal to the required system pressure.";
            statusColor = "#1e40af"; // Blue for informational
        }
        
        // Find the next standard NFPA 20 flow size (GPM)
        const pumpFlowOptions = [25, 50, 100, 250, 500, 750, 1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000];
        let requiredPumpFlow = pumpFlowOptions.find(flow => flow >= systemFlow) || 5000;
        
        // Round pressure up to the nearest 5 PSI for a conservative rating selection, minimum of 40 PSI
        const pressureMargin = 5; 
        const minPressureRating = 40;
        let requiredPumpPressureRating = Math.ceil(requiredPumpPressure / pressureMargin) * pressureMargin;

        if (requiredPumpPressureRating < minPressureRating) {
            requiredPumpPressureRating = minPressureRating;
        }

        resultDiv.innerHTML = `
            <h3>⚙️ Fire Pump Selection Guide (NFPA 20)</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Required Pump Head (Pressure): </div>
                <div style="font-size: 2.5rem; font-weight: bold; color: #1e40af;">${requiredPumpPressure.toFixed(1)} PSI</div>
                <div style="font-size: 0.9rem; color: #666;">(${systemPressure} PSI Required - ${availablePressure} PSI Available)</div>
            </div>

            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid ${statusColor};">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Minimum Pump Rating:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${requiredPumpFlow} GPM @ ${requiredPumpPressureRating} PSI</div>
                <div style="font-size: 0.9rem; color: #666; margin-top: 10px;">(Flow selected is the next standard NFPA 20 size above ${systemFlow} GPM)</div>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border-radius: 5px; border-left: 4px solid #f97316;">
                <strong>💡 Note:</strong> ${statusText} Always refer to NFPA 20 and manufacturer's pump curves for final selection.
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
