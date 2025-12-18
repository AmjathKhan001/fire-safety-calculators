// social-sharing.js - Complete Social Sharing System
class SocialSharing {
    constructor() {
        this.siteUrl = 'https://firesafetytool.com';
        this.siteName = 'Fire Safety Tools';
        this.shareCounts = {
            facebook: 0,
            twitter: 0,
            linkedin: 0,
            whatsapp: 0,
            total: 0
        };
        
        this.init();
    }
    
    init() {
        // Load share counts from localStorage
        this.loadShareCounts();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize share buttons
        this.initShareButtons();
        
        // Setup floating share buttons
        this.setupFloatingShare();
        
        // Update share counts display
        this.updateShareCounts();
    }
    
    setupEventListeners() {
        // Mobile navigation toggle
        const mobileToggle = document.getElementById('mobile-nav-toggle');
        const blogNav = document.getElementById('blog-nav-enhanced');
        
        if (mobileToggle && blogNav) {
            mobileToggle.addEventListener('click', () => {
                blogNav.classList.toggle('active');
                mobileToggle.innerHTML = blogNav.classList.contains('active') 
                    ? '<i class="fas fa-times"></i> Close Menu' 
                    : '<i class="fas fa-bars"></i> Blog Menu';
            });
        }
        
        // Close mobile nav when clicking outside
        document.addEventListener('click', (e) => {
            if (blogNav && mobileToggle && 
                !blogNav.contains(e.target) && 
                !mobileToggle.contains(e.target) &&
                blogNav.classList.contains('active')) {
                blogNav.classList.remove('active');
                mobileToggle.innerHTML = '<i class="fas fa-bars"></i> Blog Menu';
            }
        });
    }
    
    initShareButtons() {
        // Initialize all share buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            const platform = btn.classList[1]; // Get platform from class
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.shareContent(platform);
            });
        });
        
        // Copy link button
        document.querySelectorAll('.copy-link-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.copyToClipboard();
            });
        });
        
        // Email share button
        document.querySelectorAll('.email-share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.shareViaEmail();
            });
        });
    }
    
    setupFloatingShare() {
        // Show floating share buttons when scrolled
        window.addEventListener('scroll', () => {
            const floatingShare = document.getElementById('floating-share');
            if (floatingShare && window.scrollY > 500) {
                floatingShare.style.display = 'flex';
            } else if (floatingShare) {
                floatingShare.style.display = 'none';
            }
        });
        
        // Initialize floating buttons
        document.querySelectorAll('.floating-share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = btn.classList[1].split('-')[0]; // Extract platform
                this.shareContent(platform);
            });
        });
    }
    
    shareContent(platform) {
        const currentUrl = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        const description = encodeURIComponent(this.getPageDescription());
        
        let shareUrl = '';
        
        switch(platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}&quote=${title}`;
                break;
                
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${currentUrl}&text=${title}&hashtags=FireSafety,EngineeringTools`;
                break;
                
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}&title=${title}&summary=${description}`;
                break;
                
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${title}%20${currentUrl}`;
                break;
                
            default:
                console.error('Unknown platform:', platform);
                return;
        }
        
        // Open share window
        this.openShareWindow(shareUrl, platform);
        
        // Increment share count
        this.incrementShareCount(platform);
        
        // Show success message
        this.showToast(`Shared on ${this.getPlatformName(platform)}!`);
    }
    
    shareViaEmail() {
        const subject = encodeURIComponent(`Check out this fire safety tool: ${document.title}`);
        const body = encodeURIComponent(`I found this useful fire safety calculator:\n\n${document.title}\n${window.location.href}\n\n${this.getPageDescription()}`);
        
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        
        // Show success message
        this.showToast('Email draft created!');
    }
    
    async copyToClipboard() {
        const url = window.location.href;
        
        try {
            await navigator.clipboard.writeText(url);
            
            // Show copy animation
            const copyBtn = document.querySelector('.copy-link-btn');
            if (copyBtn) {
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyBtn.classList.add('pulse');
                
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-link"></i> Copy Link';
                    copyBtn.classList.remove('pulse');
                }, 2000);
            }
            
            this.showToast('Link copied to clipboard!');
            
        } catch (err) {
            console.error('Failed to copy:', err);
            this.showToast('Failed to copy. Please try again.', true);
        }
    }
    
    openShareWindow(url, platform) {
        const width = 600;
        const height = 400;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
        
        window.open(url, `Share on ${this.getPlatformName(platform)}`, features);
    }
    
    incrementShareCount(platform) {
        // Load current counts
        const counts = JSON.parse(localStorage.getItem('share_counts') || '{}');
        
        // Initialize if not exists
        if (!counts[platform]) counts[platform] = 0;
        if (!counts.total) counts.total = 0;
        
        // Increment counts
        counts[platform]++;
        counts.total++;
        
        // Save back to localStorage
        localStorage.setItem('share_counts', JSON.stringify(counts));
        
        // Update display
        this.updateShareCounts();
    }
    
    loadShareCounts() {
        const counts = JSON.parse(localStorage.getItem('share_counts') || '{}');
        this.shareCounts = {
            facebook: counts.facebook || 0,
            twitter: counts.twitter || 0,
            linkedin: counts.linkedin || 0,
            whatsapp: counts.whatsapp || 0,
            total: counts.total || 0
        };
    }
    
    updateShareCounts() {
        // Update all share count displays
        document.querySelectorAll('.share-count').forEach(element => {
            const platform = element.dataset.platform;
            if (platform && this.shareCounts[platform]) {
                element.textContent = this.shareCounts[platform].toLocaleString();
            }
        });
        
        // Update total shares
        const totalShares = document.getElementById('total-shares');
        if (totalShares) {
            totalShares.textContent = this.shareCounts.total.toLocaleString();
        }
        
        // Update individual platform counts
        ['facebook', 'twitter', 'linkedin', 'whatsapp'].forEach(platform => {
            const element = document.getElementById(`${platform}-shares`);
            if (element) {
                element.textContent = this.shareCounts[platform].toLocaleString();
            }
        });
    }
    
    getPageDescription() {
        const metaDescription = document.querySelector('meta[name="description"]');
        return metaDescription ? metaDescription.content : 
               'Professional fire safety calculators and tools for engineers. NFPA compliant, free to use.';
    }
    
    getPlatformName(platform) {
        const names = {
            facebook: 'Facebook',
            twitter: 'X (Twitter)',
            linkedin: 'LinkedIn',
            whatsapp: 'WhatsApp',
            email: 'Email'
        };
        return names[platform] || platform;
    }
    
    showToast(message, isError = false) {
        // Remove existing toast
        const existingToast = document.querySelector('.share-toast');
        if (existingToast) existingToast.remove();
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `share-toast ${isError ? 'error' : 'success'}`;
        toast.innerHTML = `
            <i class="fas fa-${isError ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Share modal functions
    showShareModal() {
        const modal = document.getElementById('share-modal');
        const urlInput = document.getElementById('share-url-input');
        
        if (modal && urlInput) {
            urlInput.value = window.location.href;
            modal.classList.add('active');
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }
    }
    
    hideShareModal() {
        const modal = document.getElementById('share-modal');
        if (modal) modal.classList.remove('active');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.socialSharing = new SocialSharing();
});
