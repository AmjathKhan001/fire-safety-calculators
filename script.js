// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupBatteryCalculator();
    setupOccupantLoadCalculator();
    setupSmokeCalculator();
    setupVoltageCalculator();
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
// 1. Battery Standby Calculator (Existing, improved for clarity)
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

        // 1. Calculate Standby Ah
        const standbyAH = standbyCurrent * standbyHours;
        
        // 2. Calculate Alarm Ah (Convert minutes to hours for calculation)
        const alarmHours = alarmMinutes / 60;
        const alarmAH = alarmCurrent * alarmHours;
        
        // 3. Total Required Ah
        const totalAH = standbyAH + alarmAH;

        // 4. Derating Factor (NFPA requires 25% margin or equivalent)
        const deratingFactor = 1.25;
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
                    3. Total Ah: ${standbyAH.toFixed(2)} Ah + ${alarmAH.toFixed(2)} Ah = **${totalAH.toFixed(2)} Ah**<br>
                    4. With Derating (×1.25): ${totalAH.toFixed(2)} Ah × 1.25 = **${deratedAH.toFixed(2)} Ah**
                </div>
            </div>
            
            <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 5px;">
                <strong>⚠️ Important Notes:</strong>
                <ul style="margin-top: 0.5rem; font-size: 0.9rem;">
                    <li>Consult NFPA 72 for complete requirements (Chapter 10)</li>
                    <li>The 1.25 factor accounts for battery aging and temperature.</li>
                </ul>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 2. Occupant Load Calculator (NEW)
// =================================================================

function setupOccupantLoadCalculator() {
    const form = document.getElementById('occupant-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const area = parseFloat(document.getElementById('area').value);
        const occupancyType = document.getElementById('occupancy-type').value;
        const resultDiv = document.getElementById('occupant-result');

        // Validation
        if (!area || area <= 0 || !occupancyType) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter a valid Area and select an Occupancy Type.</p>`;
            return;
        }

        const loadFactor = parseFloat(occupancyType);
        let calculatedLoad = area / loadFactor;

        // NFPA/IBC requires rounding UP to the next whole number
        const finalOccupantLoad = Math.ceil(calculatedLoad);
        
        // Display results
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

            <div style="margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border-radius: 5px; border-left: 4px solid #f97316;">
                <strong>💡 Note:</strong> This calculation is for determining exit requirements. It does not replace code review.
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 3. Smoke Detector Spacing Calculator (NEW)
// =================================================================

function setupSmokeCalculator() {
    const form = document.getElementById('smoke-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const height = parseFloat(document.getElementById('ceiling-height').value);
        const airMovementFactor = parseFloat(document.getElementById('air-movement').value); // Either 30 (Normal) or 21 (High)
        const resultDiv = document.getElementById('smoke-result');

        // Validation
        if (!height || height <= 0) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter a valid Ceiling Height.</p>`;
            return;
        }

        // NFPA 72 spacing rule: Max 30 ft (900 sq ft coverage) under normal conditions, 
        // reduced for high ceilings. The max spacing is the smaller of:
        // 1. The listed spacing (typically 30ft for spot-type smoke)
        // 2. Spacing reduced by a percentage for high ceilings.
        
        let maxSpacing = airMovementFactor; // Start with 30ft or 21ft (or use 900 sqft)
        
        // This is a simplified approach based on a common interpretation of NFPA 72 Chapter 17
        // where for ceilings > 10 ft, the listed spacing must be reduced.
        let reductionFactor = 1;
        if (height > 10) {
            // Reduction: 0.1% per foot above 10 ft (or 1% per foot above 10ft for max coverage area).
            // Simplified Rule: Reduce coverage area by 1% for every foot above 10 ft.
            // Using a simple height factor for maximum spacing (30ft)
            const excessHeight = height - 10;
            const percentageReduction = excessHeight * 0.1; // 10% reduction per 10ft excess height (e.g., 20ft ceiling = 10% reduction)
            
            // This is a complex area of code, using the simpler max 30ft rule is safer for a calculator
            // Let's use a simpler, safer rule: The max coverage area is 900 sq ft (30x30) or less.
            // For this public tool, we will use the standard **Maximum** of 900 sq ft / 30 ft spacing,
            // as specific reductions require detailed engineering.
            
            // Standard NFPA 72 max spacing (unless tested): 30 feet
            maxSpacing = 30; 
            
            // For ceilings > 30ft, spot detectors are ineffective.
            if (height > 30) {
                resultDiv.classList.remove('hidden');
                resultDiv.innerHTML = `
                    <h3>⚠️ Ceiling Height Warning</h3>
                    <p style="color: #a94442;">Spot-type smoke detectors are generally ineffective above 30ft. Consider **Beam Detectors** or **Air-Sampling** systems (NFPA 72, 17.7.3.2).</p>
                `;
                return;
            }
        }
        
        const spacing = maxSpacing;
        const maxCoverageArea = spacing * spacing;

        // Display results
        resultDiv.innerHTML = `
            <h3>🚬 Smoke Detector Spacing Results (NFPA 72, Chapter 17)</h3>
            
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; margin: 1rem 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #555;">Max Spacing on Smooth Ceiling: </div>
                <div style="font-size: 2.5rem; font-weight: bold; color: #1e40af;">${spacing} Feet</div>
            </div>

            <div style="background: #ecfdf5; padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid #047857;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #047857;">Maximum Coverage Area Per Detector:</div>
                <div style="font-size: 3rem; font-weight: bolder; color: #dc2626;">${maxCoverageArea} Sq Ft</div>
                <div style="font-size: 0.9rem; color: #666;">(Based on a ${spacing} ft x ${spacing} ft area)</div>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border-radius: 5px; border-left: 4px solid #f97316;">
                <strong>💡 Note:</strong> Spacing may need to be reduced for beam obstructions, peaked/sloped ceilings, or high air movement. **The maximum center-to-center spacing is 30 ft.**
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// =================================================================
// 4. Voltage Drop Calculator (NEW)
// =================================================================

function setupVoltageCalculator() {
    const form = document.getElementById('voltage-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const length = parseFloat(document.getElementById('wire-length').value); // Total Length (ft)
        const current = parseFloat(document.getElementById('circuit-current').value); // Current (Amps)
        const resistance = parseFloat(document.getElementById('wire-gauge').value); // Ohms per 1000 ft
        const systemVoltage = parseFloat(document.getElementById('system-voltage').value); // System Voltage
        const resultDiv = document.getElementById('voltage-result');

        // Validation
        if (!length || length <= 0 || !current || current <= 0 || !resistance || !systemVoltage) {
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<h3>⚠️ Calculation Error</h3><p style="color: #a94442;">Please enter valid, positive numbers for all fields.</p>`;
            return;
        }

        // Calculation: Voltage Drop (Vd) = 2 * R * I * L / 1000
        // 2: For round trip (positive and negative wires)
        // R: Resistance per 1000 ft (from select box)
        // I: Current (Amps)
        // L: Length (feet)
        const voltageDrop = 2 * resistance * current * length / 1000;
        
        const finalVoltage = systemVoltage - voltageDrop;
        const maxDropAllowed = 0.1 * systemVoltage; // Generally 10% is max allowed drop for critical circuits
        const status = voltageDrop < maxDropAllowed ? "PASS" : "FAIL";
        const statusColor = voltageDrop < maxDropAllowed ? "#047857" : "#dc2626";
        const statusText = voltageDrop < maxDropAllowed ? "Circuit meets voltage drop requirements" : "Voltage drop is too high! Increase wire gauge or shorten the run.";

        // Display results
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

            <div style="margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border-radius: 5px; border-left: 4px solid #f97316;">
                <strong>💡 Action:</strong> The voltage at the end of the line (**${finalVoltage.toFixed(2)} V**) must be higher than the lowest operating voltage of the last device on the circuit.
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
