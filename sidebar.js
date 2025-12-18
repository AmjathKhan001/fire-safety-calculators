// sidebar.js - Loads calculator tools into the sidebar
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    
    if (!sidebar) {
        console.error('Sidebar element not found!');
        return;
    }
    
    // Tool data - Add all your calculators here
    const tools = [
        {
            id: 'clean-agent',
            title: 'Clean Agent Calculator',
            icon: 'fa-fire-extinguisher',
            category: 'Suppression Systems',
            description: 'FM-200, NOVEC 1230 systems (NFPA 2001)',
            link: 'calculators/clean-agent.html'
        },
        {
            id: 'sprinkler-hydraulic',
            title: 'Sprinkler Hydraulics',
            icon: 'fa-shower',
            category: 'Sprinkler Systems',
            description: 'Hydraulic calculations (NFPA 13)',
            link: 'calculators/sprinkler.html'
        },
        {
            id: 'fire-flow',
            title: 'Fire Flow Demand',
            icon: 'fa-tint',
            category: 'Water Supply',
            description: 'Required fire flow calculations',
            link: 'calculators/fire-flow.html'
        },
        {
            id: 'egress',
            title: 'Egress Analysis',
            icon: 'fa-door-open',
            category: 'Life Safety',
            description: 'Occupant load & exit capacity (NFPA 101)',
            link: 'calculators/egress.html'
        },
        {
            id: 'hazard-class',
            title: 'Hazard Classification',
            icon: 'fa-flask',
            category: 'Risk Assessment',
            description: 'Determine occupancy hazard class',
            link: 'calculators/hazard.html'
        },
        {
            id: 'smoke-control',
            title: 'Smoke Control',
            icon: 'fa-wind',
            category: 'Smoke Management',
            description: 'Smoke control system calculations',
            link: 'calculators/smoke.html'
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
    
    // Add featured tool section
    sidebarHTML += `
        <div class="sidebar-featured">
            <h4><i class="fas fa-star"></i> Featured Tool</h4>
            <div class="featured-tool">
                <div class="featured-icon">
                    <i class="fas fa-fire-extinguisher"></i>
                </div>
                <div class="featured-info">
                    <h5>Clean Agent Calculator</h5>
                    <p>Most popular tool</p>
                    <a href="calculators/clean-agent.html" class="featured-btn">
                        Try Now <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // Insert HTML into sidebar
    sidebar.innerHTML = sidebarHTML;
    
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
                    // Highlight matching text
                    if (searchTerm.length > 0) {
                        highlightText(item, searchTerm);
                    }
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
    
    // Helper function for highlighting search results
    function highlightText(element, searchTerm) {
        const h5 = element.querySelector('h5');
        const p = element.querySelector('p');
        
        // Remove previous highlights
        h5.innerHTML = h5.textContent;
        p.innerHTML = p.textContent;
        
        // Add highlight to title
        const titleText = h5.textContent;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        h5.innerHTML = titleText.replace(regex, '<span class="search-highlight">$1</span>');
        
        // Add highlight to description
        const descText = p.textContent;
        p.innerHTML = descText.replace(regex, '<span class="search-highlight">$1</span>');
    }
    
    // Add active state to current page
    const currentPage = window.location.pathname.split('/').pop();
    const toolLinks = document.querySelectorAll('.tool-item');
    
    toolLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref && currentPage.includes(linkHref.split('/').pop())) {
            link.classList.add('active-tool');
        }
        
        // Add click animation
        link.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    console.log('Sidebar loaded successfully with', tools.length, 'tools');
});
