// script.js - COMPATIBLE VERSION FOR UPDATED WEBSITE
// =================================================================
// GLOBAL STATE & UTILITIES
// =================================================================

window.currentUnit = 'imperial';

// Unit conversion constants
const UNIT_RATIOS = {
    length: { ratio: 0.3048, imperialUnit: 'ft', metricUnit: 'm' },
    area: { ratio: 0.0929, imperialUnit: 'Sq Ft', metricUnit: 'm²' },
    volume: { ratio: 0.0283, imperialUnit: 'Cu Ft', metricUnit: 'm³' },
    flow: { ratio: 0.06309, imperialUnit: 'GPM', metricUnit: 'L/s' },
    pressure: { ratio: 0.06895, imperialUnit: 'PSI', metricUnit: 'Bar' },
    diameter: { ratio: 25.4, imperialUnit: 'Inches', metricUnit: 'mm' },
    weight: { ratio: 0.4536, imperialUnit: 'lb', metricUnit: 'kg' },
    temp: { ratio: 0.5556, offset: -32, imperialUnit: '°F', metricUnit: '°C' },
    percent: { ratio: 1, imperialUnit: '%', metricUnit: '%' }
};

// Get input value with unit conversion
function getInputValue(id, type = 'number') {
    const element = document.getElementById(id);
    if (!element) {
        console.warn('Element not found:', id);
        return 0;
    }
    
    const value = parseFloat(element.value);
    if (isNaN(value)) {
        console.warn('Invalid number for:', id, element.value);
        return 0;
    }
    
    // Handle temperature specially
    if (type === 'temp' && window.currentUnit === 'metric') {
        return (value * UNIT_RATIOS.temp.ratio) + UNIT_RATIOS.temp.offset;
    }
    
    // Handle other unit conversions
    if (window.currentUnit === 'metric' && UNIT_RATIOS[type]) {
        return value * UNIT_RATIOS[type].ratio;
    }
    
    return value;
}

// Display result
function displayResult(id, htmlContent) {
    const resultDiv = document.getElementById(id);
    if (resultDiv) {
        resultDiv.innerHTML = htmlContent;
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        console.warn('Result div not found:', id);
    }
}

// Update unit labels
function updateUnitLabels(newUnit) {
    document.querySelectorAll('[data-label-imperial]').forEach(el => {
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
// ADVANCED CALCULATION FUNCTIONS
// For use on individual calculator pages
// =================================================================

// 1. CLEAN AGENT CALCULATOR (Advanced version)
function calculateCleanAgentAdvanced() {
    console.log('Calculating Clean Agent (Advanced)...');
    const resultId = 'clean-agent-result';
    
    try {
        // Get input values
        const length = getInputValue('clean-agent-length', 'length') || 0;
        const width = getInputValue('clean-agent-width', 'length') || 0;
        const height = getInputValue('clean-agent-height', 'length') || 0;
        const temp = getInputValue('clean-agent-temp', 'temp') || 70;
        const altitude = getInputValue('clean-agent-altitude', 'length') || 0;
        const agentType = document.getElementById('clean-agent-type')?.value || 'fm200';
        const concentration = getInputValue('clean-agent-conc', 'percent') / 100 || 0.075;
        
        console.log('Advanced Inputs:', { length, width, height, temp, altitude, agentType, concentration });
        
        // Calculate volume
        const volume = length * width * height;
        
        // Advanced agent calculation
        let agentWeight;
        if (agentType === 'fm200') {
            agentWeight = (volume * concentration) / (1 - concentration) * 0.065;
        } else {
            agentWeight = (volume * concentration) / (1 - concentration) * 0.055;
        }
        
        // Apply corrections
        const altitudeCorrection = 1 + (altitude / 1000) * 0.0345;
        const tempCorrection = 1 + ((temp - 70) / 100) * 0.05;
        agentWeight *= altitudeCorrection * tempCorrection;
        
        // Format result
        const resultHTML = `
            <div class="result">
                <h3><i class="fas fa-check-circle"></i> Clean Agent Results</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Room Volume:</span>
                        <span class="result-value">${volume.toFixed(1)} ft³</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Agent Type:</span>
                        <span class="result-value">${agentType === 'fm200' ? 'FM-200' : 'NOVEC 1230'}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Required Agent Mass:</span>
                        <span class="result-value highlight">${agentWeight.toFixed(2)} lb</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Approx. Liquid Volume:</span>
                        <span class="result-value">${(agentWeight * 0.076).toFixed(2)} Gallons</span>
                    </div>
                </div>
                <div class="result-note">
                    <p><i class="fas fa-info-circle"></i> <strong>Note:</strong> Advanced calculation based on NFPA 2001. Use manufacturer's software for final design.</p>
                </div>
            </div>
        `;
        
        displayResult(resultId, resultHTML);
        
    } catch (error) {
        console.error('Clean Agent calculation error:', error);
        displayResult(resultId, `
            <div class="error-message">
                <h3>Calculation Error</h3>
                <p>${error.message}</p>
                <p>Please check all input values are valid numbers.</p>
            </div>
        `);
    }
}

// 2. SMOKE DETECTOR SPACING (Advanced version)
function calculateSmokeSpacingAdvanced() {
    console.log('Calculating Smoke Detector Spacing (Advanced)...');
    const resultId = 'smoke-detector-result';
    
    try {
        const height = getInputValue('smoke-height', 'length') || 10;
        const ceilingType = document.getElementById('smoke-type')?.value || 'smooth';
        const roomLength = parseFloat(document.getElementById('room-length')?.value) || 0;
        const roomWidth = parseFloat(document.getElementById('room-width')?.value) || 0;
        
        console.log('Advanced Inputs:', { height, ceilingType, roomLength, roomWidth });
        
        // Calculate spacing based on NFPA 72
        let maxSpacing;
        if (ceilingType === 'smooth') {
            if (height <= 10) maxSpacing = 30;
            else if (height <= 30) maxSpacing = 30 - 0.75 * (height - 10);
            else maxSpacing = 15;
        } else {
            if (height <= 10) maxSpacing = 20;
            else if (height <= 30) maxSpacing = 20 - 0.75 * (height - 10);
            else maxSpacing = 10;
        }
        
        if (maxSpacing < 10) maxSpacing = 10;
        
        const maxArea = maxSpacing * maxSpacing;
        let detectorCount = '';
        
        if (roomLength > 0 && roomWidth > 0) {
            const roomArea = roomLength * roomWidth;
            const count = Math.ceil(roomArea / maxArea);
            detectorCount = ` | <strong>Estimated Detectors:</strong> ${count}`;
        }
        
        const resultHTML = `
            <div class="result">
                <h3><i class="fas fa-check-circle"></i> Smoke Detector Spacing Results</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Ceiling Type:</span>
                        <span class="result-value">${ceilingType === 'smooth' ? 'Smooth Ceiling' : 'Beamed Ceiling'}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Max Center-to-Center:</span>
                        <span class="result-value highlight">${maxSpacing.toFixed(1)} ft</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Max Wall-to-Center:</span>
                        <span class="result-value">${(maxSpacing / 2).toFixed(1)} ft</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Max Area per Detector:</span>
                        <span class="result-value">${maxArea.toFixed(0)} Sq Ft</span>
                    </div>
                </div>
                <div class="result-note">
                    <p><i class="fas fa-info-circle"></i> <strong>Note:</strong> Based on NFPA 72 Table 17.5.3.2.1 for spot-type smoke detectors.</p>
                </div>
            </div>
        `;
        
        displayResult(resultId, resultHTML);
        
    } catch (error) {
        console.error('Smoke spacing calculation error:', error);
        displayResult(resultId, `
            <div class="error-message">
                <h3>Calculation Error</h3>
                <p>${error.message}</p>
            </div>
        `);
    }
}

// 3. FIRE DOOR CHECKLIST
function generateDoorChecklist() {
    console.log('Generating Door Checklist...');
    const resultId = 'door-checklist-result';
    
    try {
        const checks = [
            { id: 'gap-check', label: 'Door Gaps', note: 'Max 1/8" top/sides, 3/4" bottom' },
            { id: 'latch-check', label: 'Latching', note: 'Door fully latches and remains secured' },
            { id: 'closer-check', label: 'Self-Closing', note: 'Door self-closes and latches when opened' },
            { id: 'hinge-check', label: 'Hardware', note: 'All parts securely attached and undamaged' },
            { id: 'glass-check', label: 'Fire-Rated Glass', note: 'Glass properly rated and intact' },
            { id: 'label-check', label: 'Fire Door Label', note: 'Label legible and intact' }
        ];
        
        let passCount = 0;
        let failCount = 0;
        let naCount = 0;
        
        let resultsHTML = '<h3><i class="fas fa-clipboard-check"></i> Fire Door Inspection Summary (NFPA 80)</h3>';
        resultsHTML += '<table class="checklist-table"><thead><tr><th>Item</th><th>Status</th><th>Note</th></tr></thead><tbody>';
        
        checks.forEach(check => {
            const select = document.getElementById(check.id);
            if (!select) return;
            
            const value = select.value;
            let status, statusClass, icon;
            
            if (value === 'yes') {
                status = 'PASS';
                statusClass = 'pass';
                icon = '✅';
                passCount++;
            } else if (value === 'no') {
                status = 'FAIL';
                statusClass = 'fail';
                icon = '❌';
                failCount++;
            } else if (value === 'na') {
                status = 'N/A';
                statusClass = 'na';
                icon = '➖';
                naCount++;
            } else {
                return;
            }
            
            resultsHTML += `
                <tr>
                    <td><strong>${check.label}</strong></td>
                    <td><span class="status-badge ${statusClass}">${icon} ${status}</span></td>
                    <td><small>${check.note}</small></td>
                </tr>
            `;
        });
        
        resultsHTML += '</tbody></table>';
        
        // Overall status
        let overallStatus, overallClass;
        if (failCount === 0) {
            overallStatus = 'PASS - All items compliant';
            overallClass = 'pass';
        } else if (failCount <= 2) {
            overallStatus = 'REVIEW NEEDED - Some items require attention';
            overallClass = 'warning';
        } else {
            overallStatus = 'FAIL - Multiple items non-compliant';
            overallClass = 'fail';
        }
        
        resultsHTML += `
            <div class="overall-status ${overallClass}">
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
                    <p><small>Based on NFPA 80, 5.2.4 requirements. Annual inspection required.</small></p>
                </div>
            </div>
        `;
        
        displayResult(resultId, resultsHTML);
        
    } catch (error) {
        console.error('Door checklist error:', error);
        displayResult(resultId, `
            <div class="error-message">
                <h3>Error Generating Checklist</h3>
                <p>${error.message}</p>
            </div>
        `);
    }
}

// 4. DAMPER GUIDE
function generateDamperGuide() {
    console.log('Generating Damper Guide...');
    const resultId = 'fire-damper-result';
    
    try {
        const location = document.getElementById('damper-location')?.value || '';
        const hvac = document.getElementById('damper-hvac')?.value || '';
        const rating = document.getElementById('damper-rating')?.value || '';
        
        console.log('Inputs:', { location, hvac, rating });
        
        if (!location || !hvac) {
            throw new Error('Please select both Location and HVAC Status');
        }
        
        let recommendation = '';
        let requiredRating = '';
        let damperType = '';
        let notes = '';
        
        if (location === 'barrier') {
            requiredRating = rating ? `${rating} Hour Minimum` : '1.5 Hour Minimum (NFPA 90A)';
            if (hvac === 'static') {
                damperType = 'Fire Damper (FD)';
                recommendation = 'Required where ducts penetrate fire barriers. Closes upon heat detection.';
                notes = 'For systems that shut down during fire events.';
            } else {
                damperType = 'Combination Fire/Smoke Damper (CSD)';
                recommendation = 'Required for smoke control systems that remain operational.';
                requiredRating += ' + Smoke Leakage Class I or II';
                notes = 'For systems that remain operational for smoke control.';
            }
        } else if (location === 'shaft') {
            damperType = 'Combination Fire/Smoke Damper (CSD)';
            requiredRating = '3 Hour Minimum + Smoke Leakage Class I or II';
            recommendation = 'Required for all shaft/smokeproof enclosure penetrations.';
            notes = 'Always required regardless of HVAC system status.';
        } else if (location === 'duct') {
            requiredRating = rating ? `${rating} Hour (Based on Barrier)` : 'Match Barrier Rating';
            if (hvac === 'static') {
                damperType = 'Smoke Damper (SD) or Combination Damper';
                recommendation = 'Required where ducts penetrate rated barriers for smoke control.';
                notes = 'Type depends on barrier fire rating.';
            } else {
                damperType = 'Combination Fire/Smoke Damper (CSD)';
                recommendation = 'Required for active smoke control systems penetrating rated barriers.';
                notes = 'Typically required for dynamic smoke control systems.';
            }
        }
        
        const resultHTML = `
            <div class="result">
                <h3><i class="fas fa-search"></i> Damper Selection Recommendation</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Location:</span>
                        <span class="result-value">${location.charAt(0).toUpperCase() + location.slice(1)}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">HVAC Status:</span>
                        <span class="result-value">${hvac === 'static' ? 'Static (System Shutdown)' : 'Dynamic (Operational)'}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Required Type:</span>
                        <span class="result-value highlight">${damperType}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Required Rating:</span>
                        <span class="result-value">${requiredRating}</span>
                    </div>
                </div>
                <div class="recommendation-box">
                    <h4><i class="fas fa-lightbulb"></i> Recommendation</h4>
                    <p>${recommendation}</p>
                    ${notes ? `<p><small>${notes}</small></p>` : ''}
                </div>
                <div class="result-note">
                    <p><i class="fas fa-info-circle"></i> <strong>Note:</strong> Consult NFPA 90A, IBC, and local codes. Dampers must be UL listed.</p>
                </div>
            </div>
        `;
        
        displayResult(resultId, resultHTML);
        
    } catch (error) {
        console.error('Damper guide error:', error);
        displayResult(resultId, `
            <div class="error-message">
                <h3>Error Generating Recommendation</h3>
                <p>${error.message}</p>
            </div>
        `);
    }
}

// 5. REQUIRED FIRE FLOW
function calculateFireFlowAdvanced() {
    console.log('Calculating Required Fire Flow (Advanced)...');
    const resultId = 'required-fire-flow-result';
    
    try {
        const area = getInputValue('ff-area', 'area') || 10000;
        const cFactor = parseFloat(document.getElementById('ff-construction')?.value) || 1.0;
        
        console.log('Advanced Inputs:', { area, cFactor });
        
        // NFPA 1142 formula: F = 18 * C * sqrt(A)
        const fireFlow = 18 * cFactor * Math.sqrt(area);
        const finalFlow = Math.min(Math.max(fireFlow, 250), 12000);
        
        // Classification
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
        
        const resultHTML = `
            <div class="result">
                <h3><i class="fas fa-check-circle"></i> Required Fire Flow Results (NFPA 1142)</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Building Area:</span>
                        <span class="result-value">${area.toFixed(0)} Sq Ft</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Construction Factor:</span>
                        <span class="result-value">${cFactor}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Required Fire Flow:</span>
                        <span class="result-value highlight">${finalFlow.toFixed(0)} GPM</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Hydrant Classification:</span>
                        <span class="result-value ${colorClass}">${classification}</span>
                    </div>
                </div>
                <div class="result-note">
                    <p><i class="fas fa-info-circle"></i> <strong>Formula:</strong> F = 18 × C × √A (NFPA 1142)</p>
                    <p><i class="fas fa-exclamation-triangle"></i> <strong>Limits:</strong> Min 250 GPM, Max 12,000 GPM</p>
                </div>
            </div>
        `;
        
        displayResult(resultId, resultHTML);
        
    } catch (error) {
        console.error('Fire flow calculation error:', error);
        displayResult(resultId, `
            <div class="error-message">
                <h3>Calculation Error</h3>
                <p>${error.message}</p>
            </div>
        `);
    }
}

// Register all functions for calculator pages
window.calculateFunctions = {
    'clean-agent': calculateCleanAgentAdvanced,
    'smoke-detector': calculateSmokeSpacingAdvanced,
    'fire-door-checklist': generateDoorChecklist,
    'fire-damper-guide': generateDamperGuide,
    'required-fire-flow': calculateFireFlowAdvanced
};

// =================================================================
// SIMPLE CALCULATION FUNCTIONS
// For use on homepage (compatible with sidebar.js)
// =================================================================

// Simple calculation for homepage demo
window.calculateSimple = function(toolId) {
    console.log('Simple calculation for:', toolId);
    
    // This function is called by sidebar.js
    // It will be overridden by more specific functions if needed
    return true;
};

// =================================================================
// INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Fire Safety Tools - Advanced Scripts Initialized');
    
    // Unit switcher
    const unitSwitch = document.getElementById('unit-switch');
    if (unitSwitch) {
        unitSwitch.addEventListener('change', function() {
            window.currentUnit = this.value;
            updateUnitLabels(window.currentUnit);
            console.log('Unit switched to:', window.currentUnit);
        });
    }
    
    // Initialize unit labels
    updateUnitLabels(window.currentUnit);
    
    // Check if we need to run a calculation from URL
    const urlHash = window.location.hash.substring(1);
    if (urlHash && window.calculateFunctions[urlHash]) {
        console.log('Running calculation from URL hash:', urlHash);
        // Wait for calculator to load
        setTimeout(() => {
            if (window.calculateFunctions[urlHash]) {
                window.calculateFunctions[urlHash]();
            }
        }, 500);
    }
    
    // Add event listeners to all calculate buttons
    document.querySelectorAll('[data-calculate]').forEach(button => {
        button.addEventListener('click', function() {
            const toolId = this.dataset.calculate;
            if (toolId && window.calculateFunctions[toolId]) {
                window.calculateFunctions[toolId]();
            }
        });
    });
    
    // Add event listeners to all reset buttons
    document.querySelectorAll('[data-reset]').forEach(button => {
        button.addEventListener('click', function() {
            const formId = this.dataset.reset;
            const form = document.getElementById(formId);
            if (form) {
                form.reset();
                const resultDiv = document.getElementById(`${formId}-result`);
                if (resultDiv) {
                    resultDiv.style.display = 'none';
                }
            }
        });
    });
    
    console.log('All script functions loaded successfully');
});
