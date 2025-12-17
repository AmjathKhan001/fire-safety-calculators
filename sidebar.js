// sidebar.js - COMPLETE WORKING VERSION
document.addEventListener('DOMContentLoaded', function() {
    console.log('Fire Safety Tools - Sidebar Initialized');
    
    // Elements
    const calculatorContainer = document.getElementById('calculator-container');
    const currentToolTitle = document.getElementById('current-tool-title');
    const toolIntro = document.querySelector('.tool-intro');
    const printBtn = document.getElementById('print-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    // Tool descriptions
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

    // Load calculator function
    async function loadCalculator(toolId) {
        console.log('Loading calculator:', toolId);
        
        try {
            // Hide intro
            if (toolIntro) {
                toolIntro.classList.remove('active');
                toolIntro.style.display = 'none';
            }
            
            // Update active button
            document.querySelectorAll('.sidebar-tool-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.tool === toolId) {
                    btn.classList.add('active');
                }
            });

            // Update title
            if (toolDescriptions[toolId] && currentToolTitle) {
                currentToolTitle.textContent = toolDescriptions[toolId];
            }

            // Show loading
            if (calculatorContainer) {
                calculatorContainer.innerHTML = `
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p>Loading ${toolDescriptions[toolId]}...</p>
                    </div>
                `;
            }

            // Load calculator HTML
            const response = await fetch(`/calculators/${toolId}.html`);
            if (!response.ok) {
                throw new Error(`Calculator "${toolId}" not found (Status: ${response.status})`);
            }
            
            const html = await response.text();
            
            if (calculatorContainer) {
                calculatorContainer.innerHTML = html;
                
                // Initialize the calculator
                initializeCalculator(toolId);
                
                // Scroll to calculator
                setTimeout(() => {
                    calculatorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
            
        } catch (error) {
            console.error('Error loading calculator:', error);
            if (calculatorContainer) {
                calculatorContainer.innerHTML = `
                    <div class="error-message">
                        <h3><i class="fas fa-exclamation-triangle"></i> Unable to Load Calculator</h3>
                        <p><strong>Error:</strong> ${error.message}</p>
                        <p>Please try selecting another tool or refresh the page.</p>
                        <button onclick="window.location.reload()" class="retry-btn">
                            <i class="fas fa-redo"></i> Refresh Page
                        </button>
                    </div>
                `;
            }
        }
    }

    // Initialize calculator after loading
    function initializeCalculator(toolId) {
        console.log('Initializing calculator:', toolId);
        
        // Find the form
        const formId = `${toolId}-form`;
        const form = document.getElementById(formId);
        
        if (form) {
            console.log('Found form:', formId);
            
            // Remove any existing event listeners
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // Add submit event to new form
            document.getElementById(formId).addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Form submitted for:', toolId);
                
                // Get the calculation function
                if (window.calculateFunctions && window.calculateFunctions[toolId]) {
                    try {
                        window.calculateFunctions[toolId]();
                    } catch (error) {
                        console.error('Calculation error:', error);
                        const resultId = `${toolId}-result`;
                        const resultDiv = document.getElementById(resultId);
                        if (resultDiv) {
                            resultDiv.innerHTML = `
                                <div class="error-message">
                                    <h3>Calculation Error</h3>
                                    <p>${error.message}</p>
                                </div>
                            `;
                            resultDiv.classList.remove('hidden');
                        }
                    }
                } else {
                    console.error('No calculation function found for:', toolId);
                    alert(`Calculation function not available for ${toolId}. Please check the console.`);
                }
            });
            
            // Update unit labels if needed
            if (window.currentUnit && window.updateUnitLabels) {
                setTimeout(() => {
                    window.updateUnitLabels(window.currentUnit);
                }, 50);
            }
        } else {
            console.warn('Form not found:', formId);
        }
    }

    // Add click handlers to sidebar buttons
    document.querySelectorAll('.sidebar-tool-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const toolId = this.dataset.tool;
            if (toolId && toolDescriptions[toolId]) {
                loadCalculator(toolId);
                // Update URL
                window.history.pushState({ tool: toolId }, '', `#${toolId}`);
            }
        });
    });

    // Print functionality
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            const calculatorBox = document.querySelector('.calculator-box');
            const resultDiv = document.querySelector('.result:not(.hidden)');
            
            if (!calculatorBox) {
                alert('Please load a calculator first.');
                return;
            }

            const contentToPrint = resultDiv || calculatorBox;
            const printContent = contentToPrint.innerHTML;
            const toolTitle = currentToolTitle ? currentToolTitle.textContent : 'Fire Safety Calculator';
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${toolTitle} - FireSafetyTool.com</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                        .print-header { border-bottom: 2px solid #0099e5; padding-bottom: 15px; margin-bottom: 20px; }
                        .print-content { padding: 20px; }
                        .print-footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                        @media print { body { margin: 0; padding: 10px; } }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1>FireSafetyTool.com</h1>
                        <h2>${toolTitle}</h2>
                        <p><strong>Calculated on:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    <div class="print-content">${printContent}</div>
                    <div class="print-footer">
                        <p><strong>Disclaimer:</strong> For estimation purposes only. Verify with local codes.</p>
                        <p>© ${new Date().getFullYear()} FireSafetyTool.com</p>
                    </div>
                    <script>window.onload = function() { window.print(); }</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        });
    }

    // Clear functionality
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            const form = document.querySelector('#calculator-container form');
            const results = document.querySelectorAll('#calculator-container .result');
            
            if (form) form.reset();
            results.forEach(result => {
                result.classList.add('hidden');
                result.innerHTML = '';
            });
        });
    }

    // Initialize on page load
    function init() {
        const urlHash = window.location.hash.substring(1);
        const defaultTool = 'clean-agent';
        const toolToLoad = (urlHash && toolDescriptions[urlHash]) ? urlHash : defaultTool;
        
        console.log('Initial load:', toolToLoad);
        setTimeout(() => loadCalculator(toolToLoad), 300);
    }

    // Handle browser back/forward
    window.addEventListener('popstate', function() {
        const hash = window.location.hash.substring(1);
        if (hash && toolDescriptions[hash]) {
            loadCalculator(hash);
        }
    });

    // Start
    init();
});
