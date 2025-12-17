// sidebar.js - UPDATED VERSION (December 18, 2025)
// Fix: Changed fetch path from 'calculators/${toolId}.html' to '/calculators/${toolId}.html'

document.addEventListener('DOMContentLoaded', function() {
    const sidebarButtons = document.querySelectorAll('.sidebar-tool-btn');
    const calculatorContainer = document.getElementById('calculator-container');
    const currentToolTitle = document.getElementById('current-tool-title');
    const toolIntro = document.querySelector('.tool-intro');

    const toolDescriptions = {
        'clean-agent': 'Clean Agent / Gas Suppression System Calculator',
        'foam': 'Foam System Calculator (NFPA 11)',
        'co2': 'CO₂ System Calculator (NFPA 12)',
        'water-mist': 'Water Mist System Calculator',
        'battery': 'Fire Alarm Battery Standby Calculator',
        'voltage-drop': 'Voltage Drop Calculator (2-Wire DC)',
        'nac-load': 'NAC Circuit Load Calculator',
        'smoke-detector': 'Smoke Detector Spacing Calculator',
        'fire-stopping': 'Fire Stopping Sealant Volume Calculator',
        'fire-door-checklist': 'Fire Door Inspection Checklist',
        'fire-damper-guide': 'Fire Damper / Smoke Damper Selection Guide',
        'occupant': 'Occupant Load Calculator',
        'egress-width': 'Egress Width Calculator',
        'emergency-lighting': 'Emergency Lighting Spacing Calculator',
        'hydrant-flow': 'Hydrant Flow Calculator',
        'friction-loss': 'Friction Loss Calculator (Hazen-Williams)',
        'required-fire-flow': 'Required Fire Flow Calculator',
        'fire-pump': 'Fire Pump Sizing & Head Calculator'
    };

    async function loadCalculator(toolId) {
        try {
            if (toolIntro) toolIntro.classList.remove('active');
            
            sidebarButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.tool === toolId) btn.classList.add('active');
            });

            if (toolDescriptions[toolId] && currentToolTitle) {
                currentToolTitle.textContent = toolDescriptions[toolId];
            }

            if (calculatorContainer) {
                calculatorContainer.innerHTML = `<div class="loading"><p>Loading ${toolDescriptions[toolId]}...</p></div>`;
            }

            // FIXED PATH: Added leading slash for correct absolute path
            const response = await fetch(`/calculators/${toolId}.html`);
            if (!response.ok) throw new Error(`Calculator "${toolId}" not found`);
            
            const html = await response.text();
            
            if (calculatorContainer) {
                calculatorContainer.innerHTML = html;
                
                // Re-attach form submit event
                const formId = `${toolId}-form`;
                const form = document.getElementById(formId);
                
                if (form) {
                    form.addEventListener('submit', function(e) {
                        e.preventDefault();
                        if (window.calculateFunctions && window.calculateFunctions[toolId]) {
                            window.calculateFunctions[toolId]();
                        }
                    });
                }
                
                calculatorContainer.scrollIntoView({ behavior: 'smooth' });
            }
            
        } catch (error) {
            console.error('Error loading calculator:', error);
            if (calculatorContainer) {
                calculatorContainer.innerHTML = `
                    <div class="error-message">
                        <h3>Unable to load calculator</h3>
                        <p>Error: ${error.message}</p>
                        <button onclick="location.reload()">Reload Page</button>
                    </div>
                `;
            }
        }
    }

    // Add click handlers
    sidebarButtons.forEach(button => {
        button.addEventListener('click', function() {
            const toolId = this.dataset.tool;
            if (toolId) {
                loadCalculator(toolId);
                window.history.pushState({}, '', `#${toolId}`);
            }
        });
    });

    // Load calculator from URL hash or default
    const urlHash = window.location.hash.substring(1);
    const defaultTool = 'clean-agent';
    const toolToLoad = (urlHash && toolDescriptions[urlHash]) ? urlHash : defaultTool;
    
    setTimeout(() => loadCalculator(toolToLoad), 100);
});
