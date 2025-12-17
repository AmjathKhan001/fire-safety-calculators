// =================================================================
// GLOBAL STATE & UTILITIES
// =================================================================

window.currentUnit = 'imperial';
window.calculateFunctions = {};

// CONSTANTS for unit conversion ratios (Metric/Imperial) and factors
const UNIT_RATIOS = {
    length: { ratio: 0.3048, imperialUnit: 'ft', metricUnit: 'm' },
    area: { ratio: 0.0929, imperialUnit: 'Sq Ft', metricUnit: 'm²' },
    volume: { ratio: 0.0283, imperialUnit: 'Cu Ft', metricUnit: 'm³' },
    flow: { ratio: 0.06309, imperialUnit: 'GPM', metricUnit: 'L/s' },
    pressure: { ratio: 0.06895, imperialUnit: 'PSI', metricUnit: 'Bar' },
    diameter: { ratio: 25.4, imperialUnit: 'Inches', metricUnit: 'mm' },
    weight: { ratio: 0.4536, imperialUnit: 'lb', metricUnit: 'kg' },
    lux: { ratio: 10.764, imperialUnit: 'ft-c', metricUnit: 'Lux' },
    capacity: { ratio: 3.785, imperialUnit: 'Gallons', metricUnit: 'Liters' },
    density: { ratio: 40.743, imperialUnit: 'GPM/Sq Ft', metricUnit: 'LPM/m²' },
    percent: { ratio: 1, imperialUnit: '%', metricUnit: '%' },
    time: { ratio: 1, imperialUnit: 'Minutes', metricUnit: 'Minutes' },
    current: { ratio: 1, imperialUnit: 'Amps', metricUnit: 'Amps' },
    voltage: { ratio: 1, imperialUnit: 'Volts', metricUnit: 'Volts' },
    count: { ratio: 1, imperialUnit: 'Count', metricUnit: 'Count' },
    c_mils: { ratio: 1, imperialUnit: 'CM', metricUnit: 'CM' },
    coefficient: { ratio: 1, imperialUnit: 'C', metricUnit: 'C' },
    candlepower: { ratio: 1, imperialUnit: 'Candela', metricUnit: 'Candela' }
};

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

/**
 * Retrieves an input value, converting it to the target (imperial) unit if metric is selected.
 */
function getInputValue(id, type) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Input element with id "${id}" not found.`);
    }
    
    let value = parseFloat(element.value);
    
    if (isNaN(value)) {
        throw new Error(`Please enter a valid number for ${element.labels?.[0]?.textContent || id}.`);
    }
    
    if (window.currentUnit === 'metric' && UNIT_RATIOS[type]) {
        return toImperial(value, type);
    }
    return value;
}

/**
 * Gets select value as number
 */
function getSelectValue(id) {
    const element = document.getElementById(id);
    if (!element) return 0;
    return parseFloat(element.value) || 0;
}

/**
 * Displays the result in the correct unit system.
 */
function displayResult(id, htmlContent) {
    const resultDiv = document.getElementById(id);
    if (!resultDiv) return;
    
    resultDiv.innerHTML = htmlContent;
    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleError(id, message) {
    displayResult(id, `
        <div class="error-message">
            <h3 style="color: #ef4444;"><i class="fas fa-exclamation-triangle"></i> Calculation Error</h3>
            <p><strong>Input Error:</strong> ${message}</p>
            <p>Please check all your inputs and ensure they are valid numbers.</p>
        </div>
    `);
}

/**
 * Updates unit labels based on current unit selection
 */
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

// =================================================================
// CALCULATION FUNCTIONS
// =================================================================

// --- 1. Clean Agent Calculator (NFPA 2001) ---
function calculateCleanAgent() {
    const resultId = 'clean-agent-result';
    try {
        const length = getInputValue('clean-agent-length', 'length');
        const width = getInputValue('clean-agent-width', 'length');
        const height = getInputValue('clean-agent-height', 'length');
        const temp = getInputValue('clean-agent-temp', 'temp');
        const altitude = getInputValue('clean-agent-altitude', 'length');
        const agentType = document.getElementById('clean-agent-type').value;
        const concentration = getInputValue('clean-agent-conc', 'percent') / 100;

        // Calculate room volume in cubic feet
        const volumeFt3 = length * width * height;

        // Simplified agent calculation (for demonstration)
        let agentWeight;
        if (agentType === 'fm200') {
            // FM-200 simplified formula
            agentWeight = (volumeFt3 * concentration) / (1 - concentration) * 0.01;
        } else {
            // NOVEC simplified formula
            agentWeight = (volumeFt3 * concentration) / (1 - concentration) * 0.008;
        }

        // Altitude correction (simplified)
        const altitudeCorrection = 1 + (altitude / 1000) * 0.0345;
        agentWeight *= altitudeCorrection;

        // Temperature correction (simplified)
        const tempCorrection = 1 + ((temp - 70) / 100) * 0.05;
        agentWeight *= tempCorrection;

        let resultHTML;
        if (window.currentUnit === 'metric') {
            const volumeM3 = toMetric(volumeFt3, 'volume').toFixed(1);
            const weightKg = toMetric(agentWeight, 'weight').toFixed(1);
            const liquidLiters = (agentWeight * 0.638).toFixed(1); // Approximate conversion
            resultHTML = `
                <h3><i class="fas fa-check-circle"></i> Clean Agent Calculation Results</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Room Volume:</span>
                        <span class="result-value">${volumeM3} m³</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Required Agent Mass:</span>
                        <span class="result-value highlight">${weightKg} kg</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Approx. Liquid Volume:</span>
                        <span class="result-value">${liquidLiters} Liters</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Agent Type:</span>
                        <span class="result-value">${agentType === 'fm200' ? 'FM-200' : 'NOVEC 1230'}</span>
                    </div>
                </div>
                <div class="result-note">
                    <p><i class="fas fa-info-circle"></i> <strong>Note:</strong> This is an estimation based on simplified NFPA formulas. Final calculations must use manufacturer's software.</p>
                </div>
            `;
        } else {
            const liquidGallons = (agentWeight * 0.076).toFixed(1); // Approximate conversion
            resultHTML = `
                <h3><i class="fas fa-check-circle"></i> Clean Agent Calculation Results</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Room Volume:</span>
                        <span class="result-value">${volumeFt3.toFixed(1)} Cu Ft</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Required Agent Mass:</span>
                        <span class="result-value highlight">${agentWeight.toFixed(1)} lb</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Approx. Liquid Volume:</span>
                        <span class="result-value">${liquidGallons} Gallons</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Agent Type:</span>
                        <span class="result-value">${agentType === 'fm200' ? 'FM-200' : 'NOVEC 1230'}</span>
                    </div>
                </div>
                <div class="result-note">
                    <p><i class="fas fa-info-circle"></i> <strong>Note:</strong> This is an estimation based on simplified NFPA formulas. Final calculations must use manufacturer's software.</p>
                </div>
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
        const height = getInputValue('smoke-height', 'length');
        const type = document.getElementById('smoke-type').value;
        const roomLength = getInputValue('room-length', 'length') || 0;
        const roomWidth = getInputValue('room-width', 'length') || 0;

        let maxSpacing;
        
        if (type === 'smooth') {
            if (height <= 10) {
                maxSpacing = 30; // 30 ft for smooth ceilings up to 10 ft
            } else if (height <= 30) {
                maxSpacing = 30 - 0.75 * (height - 10);
            } else {
                maxSpacing = 15; // Minimum 15 ft for heights > 30 ft
            }
        } else { // beamed ceiling
            if (height <= 10) {
                maxSpacing = 20; // Reduced spacing for beamed ceilings
            } else if (height <= 30) {
                maxSpacing = 20 - 0.75 * (height - 10);
            } else {
                maxSpacing = 10;
            }
        }

        // Ensure minimum spacing
        if (maxSpacing < 10) maxSpacing = 10;

        const maxArea = maxSpacing * maxSpacing; // Maximum area per detector
        let detectorCount = 0;
        
        if (roomLength > 0 && roomWidth > 0) {
            const roomArea = roomLength * roomWidth;
            detectorCount = Math.ceil(roomArea / maxArea);
        }

        let resultHTML;
        if (window.currentUnit === 'metric') {
            const spacingM = toMetric(maxSpacing, 'length').toFixed(1);
            const areaM2 = toMetric(maxArea, 'area').toFixed(1);
            resultHTML = `
                <h3><i class="fas fa-check-circle"></i> Smoke Detector Spacing Results</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Maximum Center-to-Center Spacing:</span>
                        <span class="result-value highlight">${spacingM} m</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Maximum Wall-to-Center Spacing:</span>
                        <span class="result-value">${(toMetric(maxSpacing / 2, 'length')).toFixed(1)} m</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Maximum Coverage Area per Detector:</span>
                        <span class="result-value">${areaM2} m²</span>
                    </div>
            `;
            
            if (detectorCount > 0) {
                resultHTML += `
                    <div class="result-item">
                        <span class="result-label">Estimated Number of Detectors:</span>
                        <span class="result-value highlight">${detectorCount}</span>
                    </div>
                `;
            }
            
            resultHTML += `
                </div>
                <div class="result-note">
                    <p><i class="fas fa-info-circle"></i> <strong>Note:</strong> Based on NFPA 72 requirements for spot-type smoke detectors. Refer to NFPA 72, Table 17.5.3.2.1 for precise values.</p>
                </div>
            `;
        } else {
            resultHTML = `
                <h3><i class="fas fa-check-circle"></i> Smoke Detector Spacing Results</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Maximum Center-to-Center Spacing:</span>
                        <span class="result-value highlight">${maxSpacing.toFixed(0)} ft</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Maximum Wall-to-Center Spacing:</span>
                        <span class="result-value">${(maxSpacing / 2).toFixed(0)} ft</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Maximum Coverage Area per Detector:</span>
                        <span class="result-value">${maxArea.toFixed(0)} Sq Ft</span>
                    </div>
            `;
            
            if (detectorCount > 0) {
                resultHTML += `
                    <div class="result-item">
                        <span class="result-label">Estimated Number of Detectors:</span>
                        <span class="result-value highlight">${detectorCount}</span>
                    </div>
                `;
            }
            
            resultHTML += `
                </div>
                <div class="result-note">
                    <p><i class="fas fa-info-circle"></i> <strong>Note:</strong> Based on NFPA 72 requirements for spot-type smoke detectors. Refer to NFPA 72, Table 17.5.3.2.1 for precise values.</p>
                </div>
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
        const glass = document.getElementById('glass-check').value;
        const label = document.getElementById('label-check').value;

        const items = [
            { label: 'Door Gaps', result: gap, required: 'yes', note: 'Max 1/8" top/sides, 3/4" bottom' },
            { label: 'Latching', result: latch, required: 'yes', note: 'Door must fully latch and remain secured' },
            { label: 'Self-Closing/Closer', result: closer, required: 'yes', note: 'Door must self-close and latch when opened' },
            { label: 'Hardware', result: hinge, required: 'yes', note: 'Hinges, closers, and parts securely attached and undamaged' },
            { label: 'Fire-Rated Glass', result: glass, required: glass === 'na' ? 'na' : 'yes', note: 'Glass properly rated and intact' },
            { label: 'Fire Door Label', result: label, required: 'yes', note: 'Label legible and intact' }
        ];

        let passCount = 0;
        let failCount = 0;
        let naCount = 0;
        
        let summaryHTML = '<h3><i class="fas fa-clipboard-check"></i> Fire Door Inspection Summary (NFPA 80)</h3>';
        summaryHTML += '<div class="checklist-results">';
        summaryHTML += '<table class="checklist-table">';
        summaryHTML += '<thead><tr><th>Item</th><th>Status</th><th>Notes</th></tr></thead>';
        summaryHTML += '<tbody>';

        items.forEach(item => {
            let status, statusClass, icon;
            
            if (item.result === item.required || item.required === 'na') {
                if (item.result === 'na') {
                    status = 'N/A';
                    statusClass = 'na';
                    icon = '➖';
                    naCount++;
                } else {
                    status = 'PASS';
                    statusClass = 'pass';
                    icon = '✅';
                    passCount++;
                }
            } else {
                status = 'FAIL';
                statusClass = 'fail';
                icon = '❌';
                failCount++;
            }
            
            summaryHTML += `
                <tr>
                    <td><strong>${item.label}</strong></td>
                    <td><span class="status-badge ${statusClass}">${icon} ${status}</span></td>
                    <td><small>${item.note}</small></td>
                </tr>
            `;
        });

        summaryHTML += '</tbody></table></div>';
        
        // Overall Status
        let overallStatus, overallClass;
        if (failCount === 0) {
            overallStatus = 'COMPLIANT: All critical items meet NFPA 80 requirements';
            overallClass = 'pass';
        } else if (failCount === 1) {
            overallStatus = 'MINOR DEFICIENCY: 1 item requires attention';
            overallClass = 'warning';
        } else {
            overallStatus = `NON-COMPLIANT: ${failCount} items require immediate attention`;
            overallClass = 'fail';
        }
        
        summaryHTML += `
            <div class="overall-status ${overallClass}">
                <h4><i class="fas fa-chart-pie"></i> Inspection Statistics</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Passed:</span>
                        <span class="stat-value pass">${passCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Failed:</span>
                        <span class="stat-value fail">${failCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">N/A:</span>
                        <span class="stat-value na">${naCount}</span>
                    </div>
                </div>
                <div class="final-verdict">
                    <h4><i class="fas fa-gavel"></i> Overall Status: ${overallStatus}</h4>
                    <p><small>Based on NFPA 80, 5.2.4 requirements. Annual inspection required for all fire doors.</small></p>
                </div>
            </div>
        `;
        
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
        const rating = document.getElementById('damper-rating').value;

        if (!location || !hvac) {
            throw new Error('Please select both a location and HVAC status.');
        }

        let recommendation = '';
        let requiredRating = '';
        let damperType = '';
        let codeReference = '';
        let notes = '';

        if (location === 'barrier') {
            requiredRating = rating ? `${rating} Hour Minimum` : '1.5 Hour Minimum (NFPA 90A)';
            
            if (hvac === 'static') {
                damperType = 'Fire Damper (FD)';
                recommendation = 'Required where ducts penetrate fire barriers. Closes automatically upon detection of heat.';
                codeReference = 'NFPA 90A: 5.3.1.1, IBC: 716.5.1';
                notes = 'For systems that shut down during fire events.';
            } else { // dynamic
                damperType = 'Combination Fire/Smoke Damper (CSD)';
                recommendation = 'Required for smoke control systems that remain operational during fire events.';
                codeReference = 'NFPA 90A: 5.3.1.2, IBC: 716.5.2';
                requiredRating += ' + Smoke Leakage Class I or II';
                notes = 'For systems that remain operational for smoke control.';
            }
        } else if (location === 'shaft') {
            requiredRating = '3 Hour Minimum (IBC/NFPA 90A)';
            damperType = 'Combination Fire/Smoke Damper (CSD)';
            recommendation = 'Required for all shaft/smokeproof enclosure penetrations.';
            codeReference = 'IBC: 713.11, NFPA 90A: 5.3.2';
            requiredRating += ' + Smoke Leakage Class I or II';
            notes = 'Always required regardless of HVAC system status.';
        } else if (location === 'duct') {
            requiredRating = rating ? `${rating} Hour (Based on Barrier)` : 'Match Barrier Rating';
            
            if (hvac === 'static') {
                damperType = 'Smoke Damper (SD) or Combination Damper';
                recommendation = 'Required where ducts penetrate rated barriers for smoke control.';
                codeReference = 'NFPA 90A: 5.4, IBC: 716.5.3';
                notes = 'Type depends on barrier fire rating and system design.';
            } else { // dynamic
                damperType = 'Combination Fire/Smoke Damper (CSD)';
                recommendation = 'Required for active smoke control systems penetrating rated barriers.';
                codeReference = 'NFPA 90A: 5.4.1, IBC: 716.5.4';
                notes = 'Typically required for dynamic smoke control systems.';
            }
        }

        const resultHTML = `
            <h3><i class="fas fa-search"></i> Damper Selection Recommendation</h3>
            <div class="result-grid">
                <div class="result-item">
                    <span class="result-label">Location:</span>
                    <span class="result-value">${location.charAt(0).toUpperCase() + location.slice(1)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">HVAC Status:</span>
                    <span class="result-value">${hvac === 'static' ? 'Static (System Shutdown)' : 'Dynamic (System Operational)'}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Required Damper Type:</span>
                    <span class="result-value highlight">${damperType}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Required Fire Rating:</span>
                    <span class="result-value">${requiredRating}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Code Reference:</span>
                    <span class="result-value">${codeReference}</span>
                </div>
            </div>
            
            <div class="recommendation-box">
                <h4><i class="fas fa-lightbulb"></i> Recommendation</h4>
                <p>${recommendation}</p>
                <p><small>${notes}</small></p>
            </div>
            
            <div class="result-note">
                <p><i class="fas fa-info-circle"></i> <strong>Important:</strong> This is a guide only. Consult NFPA 90A, IBC, and local codes for definitive requirements. All dampers must be UL listed (UL 555 for fire dampers, UL 555S for smoke dampers).</p>
            </div>
        `;
        
        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}

// --- 17. Required Fire Flow (NFPA 1142) ---
function calculateFireFlow() {
    const resultId = 'required-fire-flow-result';
    try {
        const area = getInputValue('ff-area', 'area');
        const constructionFactor = getSelectValue('ff-construction');

        // NFPA 1142 formula: F = 18 * C * sqrt(A)
        const fireFlowGPM = 18 * constructionFactor * Math.sqrt(area);
        
        // Apply limits per NFPA 1142
        let finalFlow = fireFlowGPM;
        if (finalFlow < 250) finalFlow = 250; // Minimum
        if (finalFlow > 12000) finalFlow = 12000; // Maximum

        // Determine flow classification
        let classification, colorClass;
        if (finalFlow < 500) {
            classification = 'Class 1 (Red)';
            colorClass = 'class-red';
        } else if (finalFlow < 1000) {
            classification = 'Class 2 (Orange)';
            colorClass = 'class-orange';
        } else if (finalFlow < 1500) {
            classification = 'Class 3 (Green)';
            colorClass = 'class-green';
        } else {
            classification = 'Class 4 (Blue)';
            colorClass = 'class-blue';
        }

        let resultHTML;
        if (window.currentUnit === 'metric') {
            const flowLPS = toMetric(finalFlow, 'flow').toFixed(1);
            const areaM2 = toMetric(area, 'area').toFixed(0);
            resultHTML = `
                <h3><i class="fas fa-check-circle"></i> Required Fire Flow Results (NFPA 1142)</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Building Area:</span>
                        <span class="result-value">${areaM2} m²</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Construction Factor (C):</span>
                        <span class="result-value">${constructionFactor}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Required Fire Flow:</span>
                        <span class="result-value highlight">${flowLPS} L/s</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Required Fire Flow:</span>
                        <span class="result-value">${(flowLPS * 60).toFixed(0)} L/min</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Hydrant Classification:</span>
                        <span class="result-value ${colorClass}">${classification}</span>
                    </div>
                </div>
                <div class="result-note">
                    <p><i class="fas fa-info-circle"></i> <strong>Formula:</strong> F = 18 × C × √A (NFPA 1142)</p>
                    <p><i class="fas fa-exclamation-triangle"></i> <strong>Limits:</strong> Minimum 250 GPM (16 L/s), Maximum 12,000 GPM (757 L/s)</p>
                </div>
            `;
        } else {
            resultHTML = `
                <h3><i class="fas fa-check-circle"></i> Required Fire Flow Results (NFPA 1142)</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Building Area:</span>
                        <span class="result-value">${area.toFixed(0)} Sq Ft</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Construction Factor (C):</span>
                        <span class="result-value">${constructionFactor}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Required Fire Flow:</span>
                        <span class="result-value highlight">${finalFlow.toFixed(0)} GPM</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Required Fire Flow:</span>
                        <span class="result-value">${(finalFlow).toFixed(1)} Gallons/Minute</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Hydrant Classification:</span>
                        <span class="result-value ${colorClass}">${classification}</span>
                    </div>
                </div>
                <div class="result-note">
                    <p><i class="fas fa-info-circle"></i> <strong>Formula:</strong> F = 18 × C × √A (NFPA 1142)</p>
                    <p><i class="fas fa-exclamation-triangle"></i> <strong>Limits:</strong> Minimum 250 GPM, Maximum 12,000 GPM</p>
                    <p><i class="fas fa-info-circle"></i> <strong>Hydrant Colors:</strong> Red (<500), Orange (500-999), Green (1000-1499), Blue (≥1500)</p>
                </div>
            `;
        }

        displayResult(resultId, resultHTML);
    } catch (e) {
        handleError(resultId, e.message);
    }
}

// Register all calculation functions
window.calculateFunctions = {
    'clean-agent': calculateCleanAgent,
    'water-mist': calculateWaterMist,
    'foam': calculateFoam,
    'co2': calculateCO2,
    'smoke-detector': calculateSmokeSpacing,
    'battery': calculateBatteryAh,
    'voltage-drop': calculateVoltageDrop,
    'nac-load': calculateNACLoad,
    'fire-stopping': calculateFireStopping,
    'fire-door-checklist': generateDoorChecklist,
    'fire-damper-guide': generateDamperGuide,
    'occupant': calculateOccupantLoad,
    'egress-width': calculateEgressWidth,
    'emergency-lighting': calculateEmergencyLighting,
    'hydrant-flow': calculateHydrantFlow,
    'friction-loss': calculateFrictionLoss,
    'required-fire-flow': calculateFireFlow,
    'fire-pump': calculatePumpSizing
};

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
});
