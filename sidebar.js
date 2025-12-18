// sidebar.js - Simple working version
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sidebar script loaded');
    
    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (mobileToggle && mobileNav) {
        mobileToggle.addEventListener('click', function() {
            mobileNav.classList.toggle('active');
            const icon = this.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
    
    // Tool selection
    const toolButtons = document.querySelectorAll('.sidebar-tool-btn');
    const welcomeSection = document.querySelector('.welcome-section');
    const calculatorContainer = document.getElementById('calculator-container');
    
    toolButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all buttons
            toolButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            const toolId = this.getAttribute('data-tool');
            loadCalculator(toolId);
        });
    });
    
    // Load calculator function
    function loadCalculator(toolId) {
        // Hide welcome section
        if (welcomeSection) {
            welcomeSection.style.display = 'none';
        }
        
        // Show calculator container
        if (calculatorContainer) {
            calculatorContainer.innerHTML = generateCalculatorHTML(toolId);
            calculatorContainer.style.display = 'block';
            
            // Scroll to calculator
            calculatorContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Generate calculator HTML
    function generateCalculatorHTML(toolId) {
        const tools = {
            'clean-agent': {
                name: 'Clean Agent Calculator',
                icon: 'fa-fire-extinguisher',
                description: 'FM-200, NOVEC 1230 systems (NFPA 2001)'
            },
            'sprinkler': {
                name: 'Sprinkler Hydraulics',
                icon: 'fa-shower',
                description: 'NFPA 13 hydraulic calculations'
            },
            'egress': {
                name: 'Egress Analysis',
                icon: 'fa-door-open',
                description: 'Occupant load and exit requirements'
            },
            'fire-flow': {
                name: 'Fire Flow Demand',
                icon: 'fa-tint',
                description: 'Required fire flow calculations'
            },
            'hazard': {
                name: 'Hazard Classification',
                icon: 'fa-flask',
                description: 'Determine occupancy hazard class'
            },
            'fire-pump': {
                name: 'Fire Pump Sizing',
                icon: 'fa-industry',
                description: 'Fire pump head and sizing'
            },
            'smoke-detector': {
                name: 'Smoke Detector Spacing',
                icon: 'fa-bell',
                description: 'Smoke detector placement'
            },
            'battery': {
                name: 'Battery Standby Calculator',
                icon: 'fa-battery-full',
                description: 'Fire alarm battery sizing'
            },
            'co2-system': {
                name: 'CO2 System Calculator',
                icon: 'fa-gas-pump',
                description: 'CO2 flooding system calculations'
            },
            'inert-gas': {
                name: 'Inert Gas Calculator',
                icon: 'fa-wind',
                description: 'IG-541, IG-55 systems'
            },
            'room-flooding': {
                name: 'Room Flooding System',
                icon: 'fa-fill-drip',
                description: 'Total flooding calculations'
            },
            'kitchen-suppression': {
                name: 'Kitchen Suppression',
                icon: 'fa-utensils',
                description: 'Kitchen fire system calculations'
            }
        };
        
        const tool = tools[toolId] || {
            name: 'Calculator Tool',
            icon: 'fa-calculator',
            description: 'Professional fire safety calculator'
        };
        
        return `
            <div class="calculator-box">
                <div class="calculator-header">
                    <h2><i class="fas ${tool.icon}"></i> ${tool.name}</h2>
                    <p class="description">${tool.description}</p>
                </div>
                
                <div style="margin: 30px 0;">
                    <h3><i class="fas fa-sliders-h"></i> Input Parameters</h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                        <div class="input-group">
                            <label>Room Length (ft)</label>
                            <input type="number" id="length" placeholder="Enter length" value="20">
                        </div>
                        
                        <div class="input-group">
                            <label>Room Width (ft)</label>
                            <input type="number" id="width" placeholder="Enter width" value="15">
                        </div>
                        
                        <div class="input-group">
                            <label>Room Height (ft)</label>
                            <input type="number" id="height" placeholder="Enter height" value="10">
                        </div>
                        
                        <div class="input-group">
                            <label>Design Concentration (%)</label>
                            <select id="concentration">
                                <option value="7.5">7.5% (Class A/C with FM-200)</option>
                                <option value="8.0">8.0% (Class B with FM-200)</option>
                                <option value="5.3">5.3% (NOVEC 1230)</option>
                                <option value="34">34% (CO2 Local Application)</option>
                            </select>
                        </div>
                    </div>
                    
                    <button class="calculate-btn" onclick="calculateTool('${toolId}')">
                        <i class="fas fa-calculator"></i> Calculate ${tool.name}
                    </button>
                </div>
                
                <div id="tool-result" class="result" style="display: none;">
                    <h3>Calculation Results</h3>
                    <div id="tool-result-content"></div>
                </div>
            </div>
        `;
    }
    
    // Search functionality
    const searchInput = document.getElementById('tool-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const allToolButtons = document.querySelectorAll('.sidebar-tool-btn');
            
            allToolButtons.forEach(button => {
                const buttonText = button.textContent.toLowerCase();
                if (buttonText.includes(searchTerm)) {
                    button.style.display = 'flex';
                } else {
                    button.style.display = 'none';
                }
            });
        });
    }
    
    // Footer tool links
    const footerLinks = document.querySelectorAll('.footer-column a[data-tool]');
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const toolId = this.getAttribute('data-tool');
            const toolButton = document.querySelector(`.sidebar-tool-btn[data-tool="${toolId}"]`);
            if (toolButton) {
                toolButton.click();
            }
        });
    });
    
    // Action buttons
    const printBtn = document.getElementById('print-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            // Show welcome section, hide calculator
            if (welcomeSection) {
                welcomeSection.style.display = 'block';
            }
            if (calculatorContainer) {
                calculatorContainer.style.display = 'none';
            }
            
            // Remove active class from all tool buttons
            toolButtons.forEach(btn => btn.classList.remove('active'));
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});

// Global calculation function
window.calculateTool = function(toolId) {
    const length = parseFloat(document.getElementById('length')?.value) || 0;
    const width = parseFloat(document.getElementById('width')?.value) || 0;
    const height = parseFloat(document.getElementById('height')?.value) || 0;
    const concentration = parseFloat(document.getElementById('concentration')?.value) || 7.5;
    
    if (!length || !width || !height) {
        alert('Please enter all room dimensions');
        return;
    }
    
    const volume = length * width * height;
    const agentRequired = (volume * concentration * 0.01).toFixed(2);
    
    const resultDiv = document.getElementById('tool-result');
    const resultContent = document.getElementById('tool-result-content');
    
    if (resultDiv && resultContent) {
        resultContent.innerHTML = `
            <div style="margin-bottom: 15px;">
                <strong>Room Dimensions:</strong> ${length} ft × ${width} ft × ${height} ft
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Room Volume:</strong> ${volume.toFixed(2)} ft³
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Design Concentration:</strong> ${concentration}%
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Agent Required:</strong> <span style="color: #0099e5; font-weight: bold;">${agentRequired} lbs</span>
            </div>
            <div style="padding: 15px; background: #e9ecef; border-radius: 6px; margin-top: 15px;">
                <small><i class="fas fa-info-circle"></i> This is a sample calculation. Actual requirements may vary based on specific conditions and standards.</small>
            </div>
        `;
        
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    }
};
