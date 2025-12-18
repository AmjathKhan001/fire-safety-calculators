// sidebar.js - UPDATED FOR CURRENT WEBSITE STRUCTURE
document.addEventListener('DOMContentLoaded', function() {
    console.log('Fire Safety Tools - Sidebar Initialized');
    
    // Elements
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (!sidebar) {
        console.error('Sidebar element not found! Check your HTML structure.');
        return;
    }
    
    // Tool data with YOUR calculators
    const tools = [
        // Suppression Systems
        {
            id: 'clean-agent',
            title: 'Clean Agent Calculator',
            icon: 'fa-fire-extinguisher',
            category: 'Suppression Systems',
            description: 'FM-200, NOVEC 1230 (NFPA 2001)',
            link: '/calculators/clean-agent.html'
        },
        {
            id: 'foam-system',
            title: 'Foam System Calculator',
            icon: 'fa-soap',
            category: 'Suppression Systems',
            description: 'NFPA 11 foam systems',
            link: '/calculators/foam.html'
        },
        {
            id: 'co2-system',
            title: 'CO₂ System Calculator',
            icon: 'fa-cloud',
            category: 'Suppression Systems',
            description: 'NFPA 12 CO₂ systems',
            link: '/calculators/co2.html'
        },
        {
            id: 'water-mist',
            title: 'Water Mist System',
            icon: 'fa-tint',
            category: 'Suppression Systems',
            description: 'Water mist calculations',
            link: '/calculators/water-mist.html'
        },
        
        // Fire Alarm Systems
        {
            id: 'battery-standby',
            title: 'Battery Standby Calculator',
            icon: 'fa-battery-full',
            category: 'Fire Alarm',
            description: 'Fire alarm battery sizing',
            link: '/calculators/battery.html'
        },
        {
            id: 'voltage-drop',
            title: 'Voltage Drop Calculator',
            icon: 'fa-bolt',
            category: 'Fire Alarm',
            description: '2-Wire DC voltage drop',
            link: '/calculators/voltage-drop.html'
        },
        {
            id: 'nac-load',
            title: 'NAC Circuit Load',
            icon: 'fa-microchip',
            category: 'Fire Alarm',
            description: 'Notification appliance circuits',
            link: '/calculators/nac.html'
        },
        {
            id: 'smoke-detector',
            title: 'Smoke Detector Spacing',
            icon: 'fa-bell',
            category: 'Fire Alarm',
            description: 'Smoke detector placement',
            link: '/calculators/smoke-detector.html'
        },
        
        // Life Safety
        {
            id: 'occupant-load',
            title: 'Occupant Load Calculator',
            icon: 'fa-users',
            category: 'Life Safety',
            description: 'NFPA 101 occupant loads',
            link: '/calculators/occupant.html'
        },
        {
            id: 'egress-width',
            title: 'Egress Width Calculator',
            icon: 'fa-door-open',
            category: 'Life Safety',
            description: 'Exit width requirements',
            link: '/calculators/egress.html'
        },
        {
            id: 'emergency-lighting',
            title: 'Emergency Lighting',
            icon: 'fa-lightbulb',
            category: 'Life Safety',
            description: 'Lighting spacing & levels',
            link: '/calculators/emergency-lighting.html'
        },
        
        // Water Supply
        {
            id: 'hydrant-flow',
            title: 'Hydrant Flow Calculator',
            icon: 'fa-tint',
            category: 'Water Supply',
            description: 'Fire hydrant flow testing',
            link: '/calculators/hydrant.html'
        },
        {
            id: 'friction-loss',
            title: 'Friction Loss Calculator',
            icon: 'fa-water',
            category: 'Water Supply',
            description: 'Hazen-Williams formula',
            link: '/calculators/friction-loss.html'
        },
        {
            id: 'required-fire-flow',
            title: 'Required Fire Flow',
            icon: 'fa-fire',
            category: 'Water Supply',
            description: 'Fire flow demand calculation',
            link: '/calculators/fire-flow.html'
        },
        {
            id: 'fire-pump',
            title: 'Fire Pump Sizing',
            icon: 'fa-industry',
            category: 'Water Supply',
            description: 'Pump head & sizing',
            link: '/calculators/fire-pump.html'
        },
        
        // Passive Fire Protection
        {
            id: 'fire-stopping',
            title: 'Fire Stopping Sealant',
            icon: 'fa-paint-roller',
            category: 'Passive Protection',
            description: 'Sealant volume calculation',
            link: '/calculators/fire-stopping.html'
        },
        {
            id: 'fire-door-checklist',
            title: 'Fire Door Checklist',
            icon: 'fa-clipboard-check',
            category: 'Passive Protection',
            description: 'Inspection checklist tool',
            link: '/calculators/fire-door.html'
        },
        {
            id: 'fire-damper-guide',
            title: 'Fire Damper Guide',
            icon: 'fa-fan',
            category: 'Passive Protection',
            description: 'Damper selection guide',
            link: '/calculators/fire-damper.html'
        }
    ];
    
    // Group tools by category
    const toolsByCategory = tools.reduce((acc, tool) => {
        if (!acc[tool.category]) {
            acc[tool.category] = [];
        }
        acc[tool.category].push(tool);
        return acc;
    }, {});
    
    // Create HTML for sidebar
    let sidebarHTML = `
        <div class="sidebar-header">
            <h3><i class="fas fa-calculator"></i> Calculator Tools</h3>
            <p class="sidebar-subtitle">Select a tool to begin</p>
        </div>
        
        <div class="search-box">
            <input type="text" id="toolSearch" placeholder="Search tools...">
            <i class="fas fa-search"></i>
        </div>
    `;
    
    // Add each category section
    for (const [category, categoryTools] of Object.entries(toolsByCategory)) {
        sidebarHTML += `
            <div class="sidebar-section">
                <h4 class="category-title">
                    <i class="fas fa-folder"></i> ${category}
                    <span class="tool-count">${categoryTools.length}</span>
                </h4>
                <div class="tool-list">
        `;
        
        // Add each tool in this category
        categoryTools.forEach(tool => {
            sidebarHTML += `
                <a href="${tool.link}" class="tool-item" data-tool-id="${tool.id}">
                    <div class="tool-icon">
                        <i class="fas ${tool.icon}"></i>
                    </div>
                    <div class="tool-info">
                        <h5>${tool.title}</h5>
                        <p>${tool.description}</p>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </a>
            `;
        });
        
        sidebarHTML += `
                </div>
            </div>
        `;
    }
    
    // Add "Explore More Tools" section with YOUR links
    sidebarHTML += `
        <div class="sidebar-section explore-section">
            <h4><i class="fas fa-external-link-alt"></i> Explore More Tools</h4>
            <div class="explore-tools">
                <a href="https://hse-toolkit.vercel.app/" target="_blank" class="explore-link">
                    <i class="fas fa-toolbox"></i> HSE Toolkit
                </a>
                <a href="https://www.webtoolsdaily.com/" target="_blank" class="explore-link">
                    <i class="fas fa-globe"></i> Web Tools Daily
                </a>
                <a href="https://www.firesafetytool.com/" target="_blank" class="explore-link">
                    <i class="fas fa-fire-extinguisher"></i> Fire Safety Calculators
                </a>
                <a href="https://www.hsecalculator.com/" target="_blank" class="explore-link">
                    <i class="fas fa-calculator"></i> HSE Calculators
                </a>
                <a href="https://ceiling-fire-extinguisher-cost-esti.vercel.app/" target="_blank" class="explore-link">
                    <i class="fas fa-arrow-up"></i> Ceiling Fire Extinguisher Tool
                </a>
                <a href="https://fire-extinguisher-audit-tool.vercel.app/" target="_blank" class="explore-link">
                    <i class="fas fa-clipboard-check"></i> Fire Extinguisher Audit
                </a>
                <a href="https://firesafetyassessmenttool.vercel.app/" target="_blank" class="explore-link">
                    <i class="fas fa-clipboard-list"></i> Fire Safety Assessment
                </a>
                <a href="https://fire-extinguisher-calculator.vercel.app/" target="_blank" class="explore-link">
                    <i class="fas fa-fire-extinguisher"></i> Fire Extinguisher Calculator
                </a>
                <a href="https://kitchen-fire-suppression-calculator.vercel.app/" target="_blank" class="explore-link">
                    <i class="fas fa-utensils"></i> Kitchen Suppression Tool
                </a>
                <a href="https://fm-200-room-flooding-system-calcula.vercel.app/" target="_blank" class="explore-link">
                    <i class="fas fa-flood"></i> Room Flooding System
                </a>
                <a href="https://hse-toolkit.vercel.app/" target="_blank" class="explore-link">
                    <i class="fas fa-hard-hat"></i> HSE Tools
                </a>
                <a href="https://www.dailysmarttool.com/" target="_blank" class="explore-link">
                    <i class="fas fa-tools"></i> Utility Tools
                </a>
            </div>
        </div>
        
        <div class="sidebar-section">
            <h4><i class="fas fa-info-circle"></i> About These Tools</h4>
            <div class="info-box">
                <p><strong>NFPA Compliant:</strong> All calculations follow latest NFPA standards.</p>
                <p><strong>Professional Use:</strong> Designed for engineers and safety professionals.</p>
                <p><strong>Always Verify:</strong> These are estimation tools only. Always consult local codes and manufacturer data.</p>
            </div>
        </div>
    `;
    
    // Insert HTML into sidebar
    sidebar.innerHTML = sidebarHTML;
    console.log('Sidebar populated with', tools.length, 'tools');
    
    // Add search functionality
    const searchInput = document.getElementById('toolSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const toolItems = document.querySelectorAll('.tool-item');
            
            toolItems.forEach(item => {
                const title = item.querySelector('h5').textContent.toLowerCase();
                const description = item.querySelector('p').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || description.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Show/hide categories based on visible items
            document.querySelectorAll('.sidebar-section').forEach(section => {
                const visibleTools = section.querySelectorAll('.tool-item[style="display: flex;"]').length;
                section.style.display = visibleTools > 0 ? 'block' : 'none';
            });
        });
    }
    
    // Add click animation to tool items
    const toolItems = document.querySelectorAll('.tool-item');
    toolItems.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only animate if it's not an external link
            if (!this.getAttribute('href').includes('http')) {
                e.preventDefault();
                
                // Add click animation
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
                
                // Show loading message in main content
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class="loading">
                            <i class="fas fa-spinner fa-spin fa-3x"></i>
                            <h3>Loading Calculator...</h3>
                            <p>Preparing ${this.querySelector('h5').textContent}</p>
                        </div>
                    `;
                    
                    // Simulate loading (you would replace this with actual calculator loading)
                    setTimeout(() => {
                        mainContent.innerHTML = `
                            <div class="calculator-box">
                                <div class="calculator-header">
                                    <h2><i class="fas ${this.querySelector('.tool-icon i').className.split(' ')[1]}"></i> ${this.querySelector('h5').textContent}</h2>
                                    <p class="description">${this.querySelector('p').textContent}</p>
                                </div>
                                <p>This calculator will be fully implemented soon. Check back for updates!</p>
                            </div>
                        `;
                    }, 1500);
                }
            }
        });
    });
    
    // Initialize first tool
    if (toolItems.length > 0 && mainContent) {
        mainContent.innerHTML = `
            <section class="welcome-section">
                <h2>Fire Safety Tools Suite</h2>
                <p class="subtitle">Professional NFPA & IBC tools for engineers and designers</p>
                
                <div class="features-grid">
                    <div class="feature-card">
                        <i class="fas fa-certificate"></i>
                        <h4>NFPA Compliant</h4>
                        <p>All calculations follow latest NFPA standards</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-exchange-alt"></i>
                        <h4>Dual Units</h4>
                        <p>Switch between Imperial and Metric systems</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-file-pdf"></i>
                        <h4>Export Results</h4>
                        <p>Save/Print calculations as PDF documents</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-mobile-alt"></i>
                        <h4>Responsive Design</h4>
                        <p>Works perfectly on all devices</p>
                    </div>
                </div>
                
                <div class="calculator-preview">
                    <h3><i class="fas fa-fire-extinguisher"></i> Clean Agent / Gas Suppression System Calculator</h3>
                    <p>Select a calculator tool from the sidebar to get started. Each tool provides professional-grade calculations for fire safety engineering.</p>
                    
                    <div class="preview-params">
                        <div>
                            <h4><i class="fas fa-ruler-combined"></i> Available Calculators</h4>
                            <p><em>${tools.length} professional tools covering all aspects of fire safety</em></p>
                        </div>
                        <div>
                            <h4><i class="fas fa-sliders-h"></i> Categories</h4>
                            <p><em>${Object.keys(toolsByCategory).length} specialized categories</em></p>
                        </div>
                    </div>
                    
                    <div class="disclaimer">
                        <p><strong><i class="fas fa-exclamation-triangle"></i> Important Notes:</strong> Based on NFPA standards. These are estimation tools only. Always consult manufacturer's software for final calculations. Consider safety factors and local codes.</p>
                    </div>
                </div>
            </section>
        `;
    }
    
    console.log('Sidebar initialization complete');
});
