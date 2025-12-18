// sidebar.js - Fixes sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sidebar initialized');
    
    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (mobileToggle && mobileNav) {
        mobileToggle.addEventListener('click', function() {
            mobileNav.classList.toggle('active');
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }
    
    // Tool data for calculators
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
        }
    };
    
    // Handle sidebar tool clicks
    const toolItems = document.querySelectorAll('.tool-item[data-tool]');
    const welcomeSection = document.querySelector('.welcome-section');
    const calculatorContainer = document.getElementById('calculator-container');
    
    if (toolItems.length > 0) {
        toolItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                const toolId = this.dataset.tool;
                const tool = tools[toolId];
                
                if (!tool) return;
                
                // Update active states
                toolItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                // Hide welcome section
                if (welcomeSection) {
                    welcomeSection.classList.remove('active');
                }
                
                // Show calculator
                if (calculatorContainer) {
                    calculatorContainer.innerHTML = `
                        <div class="calculator-box active">
                            <div class="calculator-header">
                                <h2><i class="fas ${tool.icon}"></i> ${tool.name}</h2>
                                <p>${tool.description}</p>
                            </div>
                            
                            <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                                <h3 style="margin-bottom: 15px;">Calculator Inputs</h3>
                                
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
                                    </select>
                                </div>
                                
                                <button class="calculate-btn" onclick="calculate()">
                                    <i class="fas fa-calculator"></i> Calculate
                                </button>
                            </div>
                            
                            <div id="result" class="result" style="display: none;">
                                <h3>Calculation Results</h3>
                                <div id="result-content"></div>
                            </div>
                        </div>
                    `;
                }
            });
        });
    }
    
    // Simple calculation function
    window.calculate = function() {
        const length = parseFloat(document.getElementById('length').value) || 0;
        const width = parseFloat(document.getElementById('width').value) || 0;
        const height = parseFloat(document.getElementById('height').value) || 0;
        const concentration = parseFloat(document.getElementById('concentration').value) || 7.5;
        
        if (!length || !width || !height) {
            alert('Please enter all room dimensions');
            return;
        }
        
        // Simple calculation
        const volume = length * width * height;
        const agentRequired = (volume * concentration * 0.01).toFixed(2);
        
        const resultDiv = document.getElementById('result');
        const resultContent = document.getElementById('result-content');
        
        resultContent.innerHTML = `
            <div style="margin-bottom: 15px;">
                <strong>Room Volume:</strong> ${volume.toFixed(2)} ft³
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Design Concentration:</strong> ${concentration}%
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Agent Required:</strong> ${agentRequired} lbs
            </div>
            <div style="padding: 15px; background: #e9ecef; border-radius: 6px; margin-top: 15px;">
                <small><i class="fas fa-info-circle"></i> This is a sample calculation. Always verify with manufacturer data.</small>
            </div>
        `;
        
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    };
});
