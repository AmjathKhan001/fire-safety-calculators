// script.js - Simple utility functions
document.addEventListener('DOMContentLoaded', function() {
    console.log('Main scripts loaded');
    
    // Unit conversion function
    window.convertUnits = function(value, fromUnit, toUnit) {
        const conversions = {
            'ft_to_m': 0.3048,
            'm_to_ft': 3.28084,
            'gpm_to_lps': 0.06309,
            'lps_to_gpm': 15.8503,
            'psi_to_bar': 0.06895,
            'bar_to_psi': 14.5038,
            'lb_to_kg': 0.453592,
            'kg_to_lb': 2.20462
        };
        
        const key = `${fromUnit}_to_${toUnit}`;
        if (conversions[key]) {
            return value * conversions[key];
        }
        return value;
    };
    
    // Format number with commas
    window.formatNumber = function(num, decimals = 2) {
        return parseFloat(num).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    
    // Initialize any page-specific functionality
    initializePage();
});

function initializePage() {
    // Page-specific initialization
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'index.html':
        case '':
            // Homepage specific code
            console.log('Homepage initialized');
            break;
        case 'calculators.html':
            // Calculators page specific code
            console.log('Calculators page initialized');
            break;
        case 'blog.html':
            // Blog page specific code
            console.log('Blog page initialized');
            break;
        default:
            console.log('Page initialized:', currentPage);
    }
}
