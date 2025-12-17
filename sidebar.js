// Sidebar navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar tool buttons
    const sidebarButtons = document.querySelectorAll('.sidebar-tool-btn');
    const calculatorContainer = document.getElementById('calculator-container');
    const currentToolTitle = document.getElementById('current-tool-title');
    const toolIntro = document.querySelector('.tool-intro');
    const printBtn = document.getElementById('print-btn');
    const clearBtn = document.getElementById('clear-btn');
    const unitSwitch = document.getElementById('unit-switch');

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

            // Load the calculator HTML
            const response = await fetch(`calculators/${toolId}.html`);
            if (!response.ok) {
                throw new Error('Calculator not found');
            }
            const html = await response.text();
            
            if (calculatorContainer) {
                calculatorContainer.innerHTML = html;
                
                // Re-initialize unit labels for the loaded calculator
                if (window.currentUnit && window.updateUnitLabels) {
                    window.updateUnitLabels(window.currentUnit);
                }
                
                // Re-attach form submit event
                const formId = `${toolId}-form`;
                const form = document.getElementById(formId);
                
                if (form && window.calculateFunctions && window.calculateFunctions[toolId]) {
                    // Remove existing listeners
                    const newForm = form.cloneNode(true);
                    form.parentNode.replaceChild(newForm, form);
                    
                    // Add new listener
                    document.getElementById(formId).addEventListener('submit', function(e) {
                        e.preventDefault();
                        if (window.calculateFunctions[toolId]) {
                            window.calculateFunctions[toolId]();
                        }
                    });
                }
                
                // Scroll to top of calculator
                calculatorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
        } catch (error) {
            console.error('Error loading calculator:', error);
            if (calculatorContainer) {
                calculatorContainer.innerHTML = `
                    <div class="error-message">
                        <h3><i class="fas fa-exclamation-triangle"></i> Unable to load calculator</h3>
                        <p>Please try again or select another tool.</p>
                        <p><small>Error: ${error.message}</small></p>
                    </div>
                `;
            }
        }
    }

    // Add click handlers to sidebar buttons
    sidebarButtons.forEach(button => {
        button.addEventListener('click', function() {
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
            
            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Fire Safety Tool - Calculation Results</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            padding: 20px;
                        }
                        h1, h2, h3 {
                            color: #0099e5;
                        }
                        .result-box {
                            border: 2px solid #0099e5;
                            padding: 20px;
                            margin: 20px 0;
                            border-radius: 10px;
                        }
                        .calculation-info {
                            background: #f8f9fa;
                            padding: 15px;
                            border-left: 4px solid #34bf49;
                            margin: 15px 0;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 15px 0;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #0099e5;
                            color: white;
                        }
                        .footer {
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                            font-size: 0.9em;
                            color: #666;
                        }
                        @media print {
                            body { font-size: 12pt; }
                            .no-print { display: none; }
                            .page-break { page-break-before: always; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Fire Safety Tool Calculation</h1>
                        <p><strong>Tool:</strong> ${currentToolTitle?.textContent || 'Fire Safety Calculator'}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
                    </div>
                    
                    <div class="result-box">
                        ${contentToPrint.innerHTML}
                    </div>
                    
                    <div class="calculation-info">
                        <h3>Calculation Notes</h3>
                        <p>This calculation was performed using FireSafetyTool.com professional calculators.</p>
                        <p><strong>Disclaimer:</strong> Results are estimates only. Always consult licensed professionals and local codes for final designs.</p>
                    </div>
                    
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} FireSafetyTool.com | Part of Safetyguide360 Network</p>
                        <p>Website: https://www.firesafetytool.com</p>
                    </div>
                    
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() {
                                window.close();
                            }, 1000);
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
            const result = document.querySelector('#calculator-container .result');
            
            if (form) {
                form.reset();
            }
            if (result) {
                result.classList.add('hidden');
                result.innerHTML = '';
            }
        });
    }

    // Unit switch handler
    if (unitSwitch) {
        unitSwitch.addEventListener('change', function() {
            window.currentUnit = this.value;
            if (window.updateUnitLabels) {
                window.updateUnitLabels(window.currentUnit);
            }
        });
    }

    // Check URL hash on load
    const urlHash = window.location.hash.substring(1);
    if (urlHash && toolDescriptions[urlHash]) {
        // Wait a bit for scripts to load
        setTimeout(() => {
            loadCalculator(urlHash);
        }, 100);
    } else {
        // Load first calculator by default
        setTimeout(() => {
            loadCalculator('clean-agent');
        }, 100);
    }

    // Handle browser back/forward
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.tool) {
            loadCalculator(event.state.tool);
        } else {
            const hash = window.location.hash.substring(1);
            if (hash && toolDescriptions[hash]) {
                loadCalculator(hash);
            }
        }
    });
});
