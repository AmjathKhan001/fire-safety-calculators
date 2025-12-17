// Sidebar navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sidebar JS loaded');
    
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
        console.log('Loading calculator:', toolId);
        
        try {
            // Hide intro
            if (toolIntro) {
                toolIntro.classList.remove('active');
            }
            
            // Update active button
            sidebarButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.tool === toolId) {
                    btn.classList.add('active');
                }
            });

            // Update title
            if (toolDescriptions[toolId] && currentToolTitle) {
                currentToolTitle.textContent = toolDescriptions[toolId];
            }

            // Show loading indicator
            if (calculatorContainer) {
                calculatorContainer.innerHTML = `
                    <div class="loading">
                        <div class="loading-spinner">
                            <i class="fas fa-cog fa-spin"></i>
                            <p>Loading ${toolDescriptions[toolId]}...</p>
                        </div>
                    </div>
                `;
            }

            // Load the calculator HTML
            const response = await fetch(`calculators/${toolId}.html`);
            if (!response.ok) {
                throw new Error(`Calculator "${toolId}" not found`);
            }
            const html = await response.text();
            
            if (calculatorContainer) {
                calculatorContainer.innerHTML = html;
                
                // Re-initialize unit labels for the loaded calculator
                if (window.currentUnit && window.updateUnitLabels) {
                    setTimeout(() => {
                        window.updateUnitLabels(window.currentUnit);
                    }, 100);
                }
                
                // Attach form submit event
                const formId = `${toolId}-form`;
                const form = document.getElementById(formId);
                
                if (form) {
                    console.log('Form found:', formId);
                    form.addEventListener('submit', function(e) {
                        e.preventDefault();
                        console.log('Form submitted for:', toolId);
                        
                        // Call the calculation function
                        if (window.calculateFunctions && window.calculateFunctions[toolId]) {
                            console.log('Calling calculation function for:', toolId);
                            window.calculateFunctions[toolId]();
                        } else {
                            console.error('Calculation function not found for:', toolId);
                            const resultId = `${toolId}-result`;
                            handleError(resultId, 'Calculation function not available. Please refresh the page.');
                        }
                    });
                } else {
                    console.warn('Form not found:', formId);
                }
                
                // Scroll to top of calculator
                setTimeout(() => {
                    calculatorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
            
        } catch (error) {
            console.error('Error loading calculator:', error);
            if (calculatorContainer) {
                calculatorContainer.innerHTML = `
                    <div class="error-message">
                        <h3><i class="fas fa-exclamation-triangle"></i> Unable to load calculator</h3>
                        <p>Error: ${error.message}</p>
                        <p>Please try again or select another tool.</p>
                    </div>
                `;
            }
        }
    }

    function handleError(resultId, message) {
        const resultDiv = document.getElementById(resultId);
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="error-message">
                    <h3 style="color: #ef4444;"><i class="fas fa-exclamation-triangle"></i> Calculation Error</h3>
                    <p><strong>Error:</strong> ${message}</p>
                </div>
            `;
            resultDiv.classList.remove('hidden');
        }
    }

    // Add click handlers to sidebar buttons
    sidebarButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const toolId = this.dataset.tool;
            if (toolId) {
                loadCalculator(toolId);
                // Update URL hash
                window.history.pushState({ tool: toolId }, '', `#${toolId}`);
            }
        });
    });

    // Print/PDF functionality
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
            
            // Create print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${toolTitle} - FireSafetyTool.com</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .print-header { 
                            border-bottom: 3px solid #0099e5; 
                            padding-bottom: 15px; 
                            margin-bottom: 20px;
                        }
                        .print-content { padding: 20px; }
                        .print-footer { 
                            margin-top: 30px; 
                            padding-top: 15px; 
                            border-top: 1px solid #ddd;
                            font-size: 12px;
                            color: #666;
                        }
                        @media print {
                            body { margin: 0; padding: 10px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1>FireSafetyTool.com</h1>
                        <h2>${toolTitle}</h2>
                        <p><strong>Calculated on:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    <div class="print-content">
                        ${printContent}
                    </div>
                    <div class="print-footer">
                        <p><strong>Disclaimer:</strong> This calculation is for estimation purposes only. Always consult with licensed professionals and verify with local codes and standards.</p>
                        <p>© ${new Date().getFullYear()} FireSafetyTool.com | https://www.firesafetytool.com</p>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                        }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        });
    }

    // Clear form functionality
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            const form = document.querySelector('#calculator-container form');
            const results = document.querySelectorAll('#calculator-container .result');
            
            if (form) {
                form.reset();
            }
            
            results.forEach(result => {
                result.classList.add('hidden');
                result.innerHTML = '';
            });
        });
    }

    // Check URL hash on load
    function initCalculator() {
        const urlHash = window.location.hash.substring(1);
        console.log('URL hash:', urlHash);
        
        if (urlHash && toolDescriptions[urlHash]) {
            // Load the calculator from URL hash
            setTimeout(() => {
                loadCalculator(urlHash);
            }, 500);
        } else {
            // Load default calculator
            setTimeout(() => {
                loadCalculator('clean-agent');
            }, 500);
        }
    }

    // Initialize when DOM is ready
    setTimeout(initCalculator, 100);

    // Handle browser back/forward
    window.addEventListener('popstate', function(event) {
        const hash = window.location.hash.substring(1);
        if (hash && toolDescriptions[hash]) {
            loadCalculator(hash);
        }
    });
});
