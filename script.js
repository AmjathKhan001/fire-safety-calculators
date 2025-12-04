// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupBatteryCalculator();
});

// Navigation between calculators
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const calculators = document.querySelectorAll('.calculator-box');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // If it's a button (not a link), handle calculator switching
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

// Battery Calculator
function setupBatteryCalculator() {
    const form = document.getElementById('battery-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get values
        const alarmCurrent = parseFloat(document.getElementById('alarm-current').value);
        const standbyCurrent = parseFloat(document.getElementById('standby-current').value);
        const standbyHours = parseFloat(document.getElementById('standby-hours').value);
        const alarmMinutes = parseFloat(document.getElementById('alarm-minutes').value);
        
        // Validate
        if (!alarmCurrent || !standbyCurrent) {
            alert('Please enter both alarm and standby currents');
            return;
        }
        
        // Calculate battery capacity (Ah)
        const standbyAH = standbyCurrent * standbyHours;
        const alarmAH = alarmCurrent * (alarmMinutes / 60);
        const totalAH = standbyAH + alarmAH;
        
        // Apply derating factor (typical 1.25 for lead-acid batteries)
        const deratedAH = totalAH * 1.25;
        
        // Find common battery sizes
        const commonSizes = [7, 12, 18, 26, 40, 65, 100];
        const recommendedSize = commonSizes.find(size => size >= deratedAH) || 100;
        
        // Display results
        const resultDiv = document.getElementById('battery-result');
        resultDiv.innerHTML = `
            <h3>🔋 Battery Calculation Results</h3>
            <div style="background: #f1f5f9; padding: 1rem; border-radius: 5px; margin: 1rem 0;">
                <strong>NFPA 72 Requirements:</strong><br>
                • 24 hours standby + 5 minutes alarm (minimum)
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0;">
                <div style="background: #f0f9ff; padding: 1rem; border-radius: 5px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #1e40af;">${totalAH.toFixed(1)} Ah</div>
                    <div style="font-size: 0.9rem; color: #666;">Base Capacity</div>
                </div>
                <div style="background: #ecfdf5; padding: 1rem; border-radius: 5px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #047857;">${deratedAH.toFixed(1)} Ah</div>
                    <div style="font-size: 0.9rem; color: #666;">With Derating</div>
                </div>
            </div>
            
            <div style="background: #fef3c7; padding: 1rem; border-radius: 5px; margin: 1rem 0;">
                <strong>Recommended Battery:</strong> ${recommendedSize} Ah<br>
                <small>Next standard size above calculated requirement</small>
            </div>
            
            <div style="margin-top: 1rem;">
                <strong>Calculation Steps:</strong>
                <div style="background: white; padding: 0.75rem; border-radius: 3px; margin-top: 0.5rem;">
                    1. Standby: ${standbyCurrent}A × ${standbyHours}h = ${standbyAH.toFixed(1)} Ah<br>
                    2. Alarm: ${alarmCurrent}A × ${(alarmMinutes/60).toFixed(2)}h = ${alarmAH.toFixed(1)} Ah<br>
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
        
        // Scroll to results
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
