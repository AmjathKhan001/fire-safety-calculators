// Sidebar navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar tool buttons
    const sidebarButtons = document.querySelectorAll('.sidebar-tool-btn');
    const calculatorContainer = document.getElementById('calculator-container');
    const currentToolTitle = document.getElementById('current-tool-title');
    const toolIntro = document.querySelector('.tool-intro');
    const printBtn = document.getElementById('print-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Tool descriptions for the title
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

    // Load calculator HTML from templates or fetch from original files
    async function loadCalculator(toolId) {
        try {
            // Hide intro
            toolIntro.classList.remove('active');
            
            // Update active button
            sidebarButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.tool === toolId) {
                    btn.classList.add('active');
                }
            });

            // Update title
            if (toolDescriptions[toolId]) {
                currentToolTitle.textContent = toolDescriptions[toolId];
            }

            // Load the calculator HTML
            const response = await fetch(`/calculators/${toolId}.html`);
            if (!response.ok) {
                throw new Error('Calculator not found');
            }
            const html = await response.text();
            calculatorContainer.innerHTML = html;
            
            // Re-initialize any scripts for this calculator
            initializeCalculator(toolId);
            
            // Scroll to top of calculator
            calculatorContainer.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error loading calculator:', error);
            calculatorContainer.innerHTML = `
                <div class="error-message">
                    <h3>Unable to load calculator</h3>
                    <p>Please try again or select another tool.</p>
                </div>
            `;
        }
    }

    // Initialize calculator-specific scripts
    function initializeCalculator(toolId) {
        // Re-attach event listeners based on toolId
        const formId = `${toolId}-form`;
        const form = document.getElementById(formId);
        
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                // Call the appropriate calculation function from script.js
                if (window.calculateFunctions && window.calculateFunctions[toolId]) {
                    window.calculateFunctions[toolId]();
                }
            });
        }
    }

    // Add click handlers to sidebar buttons
    sidebarButtons.forEach(button => {
        button.addEventListener('click', function() {
            const toolId = this.dataset.tool;
            loadCalculator(toolId);
            // Update URL hash
            window.history.pushState(null, '', `#${toolId}`);
        });
    });

    // Print/PDF functionality
    printBtn.addEventListener('click', function() {
        const calculatorBox = calculatorContainer.querySelector('.calculator-box');
        const resultDiv = calculatorContainer.querySelector('.result');
        
        if (!calculatorBox && !resultDiv) {
            alert('Please load a calculator and generate results first.');
            return;
        }

        const contentToPrint = resultDiv || calculatorBox;
        
        html2canvas(contentToPrint, {
            scale: 2,
            useCORS: true,
            logging: false
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            const imgWidth = 190;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`fire-safety-calculator-${Date.now()}.pdf`);
        });
    });

    // Clear form functionality
    clearBtn.addEventListener('click', function() {
        const form = calculatorContainer.querySelector('form');
        const result = calculatorContainer.querySelector('.result');
        
        if (form) {
            form.reset();
        }
        if (result) {
            result.classList.add('hidden');
            result.innerHTML = '';
        }
    });

    // Check URL hash on load
    const urlHash = window.location.hash.substring(1);
    if (urlHash && toolDescriptions[urlHash]) {
        loadCalculator(urlHash);
    } else {
        // Load first calculator by default
        loadCalculator('clean-agent');
    }

    // Handle browser back/forward
    window.addEventListener('popstate', function() {
        const hash = window.location.hash.substring(1);
        if (hash && toolDescriptions[hash]) {
            loadCalculator(hash);
        }
    });
});
