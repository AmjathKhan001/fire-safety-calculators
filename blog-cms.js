// blog-cms.js - Complete Blog Management System
class BlogCMS {
    constructor() {
        this.apiUrl = '/blog-data.json';
        this.posts = [];
        this.categories = [];
        this.settings = {};
        this.currentUser = null;
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.checkAuth();
    }
    
    async loadData() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Failed to load blog data');
            
            const data = await response.json();
            this.posts = data.posts || [];
            this.categories = data.categories || [];
            this.settings = data.settings || {};
            
            console.log(`Loaded ${this.posts.length} blog posts`);
            
            // If on blog page, render posts
            if (window.location.pathname.includes('blog.html')) {
                this.renderBlogPosts();
            }
            
            // If on admin page, render admin interface
            if (window.location.pathname.includes('admin-blog.html')) {
                this.renderAdminInterface();
            }
            
        } catch (error) {
            console.error('Error loading blog data:', error);
            this.showError('Failed to load blog data. Please refresh the page.');
        }
    }
    
    renderBlogPosts() {
        const container = document.getElementById('blog-posts-container');
        const featuredContainer = document.getElementById('featured-post-container');
        
        if (!container && !featuredContainer) return;
        
        // Filter published posts
        const publishedPosts = this.posts.filter(post => post.status === 'published');
        
        // Render featured post
        if (featuredContainer) {
            const featuredPost = publishedPosts.find(post => post.featured) || publishedPosts[0];
            if (featuredPost) {
                featuredContainer.innerHTML = this.createFeaturedPostHTML(featuredPost);
            }
        }
        
        // Render regular posts
        if (container) {
            const postsToShow = publishedPosts.filter(post => !post.featured).slice(0, this.settings.posts_per_page || 6);
            
            if (postsToShow.length === 0) {
                container.innerHTML = '<div class="no-posts"><p>No blog posts yet. Check back soon!</p></div>';
                return;
            }
            
            container.innerHTML = postsToShow.map(post => this.createPostHTML(post)).join('');
        }
        
        // Update sidebar
        this.updateSidebar();
    }
    
    createFeaturedPostHTML(post) {
        return `
            <div class="featured-post">
                <div class="featured-badge">FEATURED</div>
                <img src="${post.image || 'https://images.unsplash.com/photo-1544098281-073ae35f5ac5'}" alt="${post.title}">
                <div class="featured-content">
                    <h2>${post.title}</h2>
                    <div class="post-meta">
                        <span><i class="far fa-calendar"></i> ${this.formatDate(post.date)}</span>
                        <span><i class="far fa-user"></i> ${post.author}</span>
                        <span><i class="far fa-clock"></i> 8 min read</span>
                    </div>
                    <p>${post.excerpt}</p>
                    <a href="blog-post.html?slug=${post.slug}" class="read-more">Read Full Article →</a>
                </div>
            </div>
        `;
    }
    
    createPostHTML(post) {
        const categoryClass = post.category.toLowerCase().replace(/\s+/g, '-');
        
        return `
            <article class="blog-post">
                <div class="post-category ${categoryClass}">${post.category}</div>
                <img src="${post.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'}" alt="${post.title}">
                <div class="post-content">
                    <h3>${post.title}</h3>
                    <div class="post-meta">
                        <span><i class="far fa-calendar"></i> ${this.formatDate(post.date)}</span>
                        <span><i class="far fa-comment"></i> ${post.comments || 0} comments</span>
                    </div>
                    <p>${post.excerpt}</p>
                    <a href="blog-post.html?slug=${post.slug}" class="read-more">Read More →</a>
                </div>
            </article>
        `;
    }
    
    updateSidebar() {
        // Update categories
        const categoryList = document.querySelector('.category-list');
        if (categoryList) {
            categoryList.innerHTML = this.categories.map(category => 
                `<li><a href="#" data-category="${category}"><i class="fas fa-folder"></i> ${category}</a></li>`
            ).join('');
        }
        
        // Update popular posts
        const popularContainer = document.querySelector('.popular-posts');
        if (popularContainer) {
            const popularPosts = [...this.posts]
                .filter(p => p.status === 'published')
                .sort((a, b) => b.views - a.views)
                .slice(0, 3);
            
            popularContainer.innerHTML = popularPosts.map((post, index) => {
                const badges = ['🔥 Hot', '🆕 New', '⭐ Top'];
                return `
                    <div class="popular-post">
                        <span class="popular-badge">${badges[index] || '📝'}</span>
                        <h4>${post.title}</h4>
                        <p>${post.excerpt.substring(0, 80)}...</p>
                        <a href="blog-post.html?slug=${post.slug}">Read More →</a>
                    </div>
                `;
            }).join('');
        }
    }
    
    renderAdminInterface() {
        if (!this.checkAdminAccess()) return;
        
        // Render posts table
        this.renderPostsTable();
        
        // Render statistics
        this.renderStatistics();
        
        // Setup admin controls
        this.setupAdminControls();
    }
    
    renderPostsTable() {
        const tableBody = document.getElementById('posts-table-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = this.posts.map(post => `
            <tr data-post-id="${post.id}">
                <td>${post.id}</td>
                <td>
                    <strong>${post.title}</strong>
                    <div class="post-meta-small">
                        <span>${post.category} • ${this.formatDate(post.date)}</span>
                    </div>
                </td>
                <td>${post.author}</td>
                <td>
                    <span class="status-badge status-${post.status}">${post.status}</span>
                    ${post.featured ? '<span class="featured-badge-small">Featured</span>' : ''}
                </td>
                <td>${post.views}</td>
                <td>${post.comments}</td>
                <td>
                    <button class="btn-edit" onclick="blogCMS.editPost(${post.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="blogCMS.deletePost(${post.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    renderStatistics() {
        const stats = {
            totalPosts: this.posts.length,
            publishedPosts: this.posts.filter(p => p.status === 'published').length,
            draftPosts: this.posts.filter(p => p.status === 'draft').length,
            totalViews: this.posts.reduce((sum, post) => sum + (post.views || 0), 0),
            totalComments: this.posts.reduce((sum, post) => sum + (post.comments || 0), 0),
            featuredPosts: this.posts.filter(p => p.featured).length
        };
        
        document.getElementById('stats-total-posts').textContent = stats.totalPosts;
        document.getElementById('stats-published').textContent = stats.publishedPosts;
        document.getElementById('stats-draft').textContent = stats.draftPosts;
        document.getElementById('stats-total-views').textContent = stats.totalViews.toLocaleString();
        document.getElementById('stats-total-comments').textContent = stats.totalComments;
    }
    
    setupAdminControls() {
        // New post button
        document.getElementById('new-post-btn')?.addEventListener('click', () => {
            this.showPostEditor();
        });
        
        // Save post button
        document.getElementById('save-post-btn')?.addEventListener('click', () => {
            this.savePost();
        });
        
        // Import/export
        document.getElementById('export-btn')?.addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('import-btn')?.addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        
        document.getElementById('import-file')?.addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
    }
    
    showPostEditor(postId = null) {
        const editor = document.getElementById('post-editor');
        const editorTitle = document.getElementById('editor-title');
        
        if (postId) {
            // Edit existing post
            const post = this.posts.find(p => p.id === postId);
            if (!post) return;
            
            editorTitle.textContent = 'Edit Post';
            this.populateEditor(post);
        } else {
            // Create new post
            editorTitle.textContent = 'Create New Post';
            this.populateEditor({
                id: this.getNextId(),
                title: '',
                slug: '',
                excerpt: '',
                content: '',
                author: this.currentUser?.name || 'Admin',
                date: new Date().toISOString().split('T')[0],
                category: this.categories[0] || 'General',
                tags: [],
                image: '',
                featured: false,
                status: 'draft'
            });
        }
        
        editor.classList.add('active');
    }
    
    populateEditor(post) {
        document.getElementById('post-id').value = post.id;
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-slug').value = post.slug;
        document.getElementById('post-excerpt').value = post.excerpt;
        document.getElementById('post-content').value = post.content;
        document.getElementById('post-author').value = post.author;
        document.getElementById('post-date').value = post.date;
        document.getElementById('post-category').value = post.category;
        document.getElementById('post-tags').value = post.tags.join(', ');
        document.getElementById('post-image').value = post.image;
        document.getElementById('post-featured').checked = post.featured;
        document.getElementById('post-status').value = post.status;
        
        // Auto-generate slug from title if empty
        if (!post.slug && post.title) {
            document.getElementById('post-slug').value = this.generateSlug(post.title);
        }
    }
    
    async savePost() {
        const postData = {
            id: parseInt(document.getElementById('post-id').value),
            title: document.getElementById('post-title').value.trim(),
            slug: document.getElementById('post-slug').value.trim() || this.generateSlug(document.getElementById('post-title').value),
            excerpt: document.getElementById('post-excerpt').value.trim(),
            content: document.getElementById('post-content').value.trim(),
            author: document.getElementById('post-author').value.trim(),
            date: document.getElementById('post-date').value,
            category: document.getElementById('post-category').value,
            tags: document.getElementById('post-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            image: document.getElementById('post-image').value.trim(),
            featured: document.getElementById('post-featured').checked,
            status: document.getElementById('post-status').value,
            views: 0,
            comments: 0
        };
        
        // Validate
        if (!postData.title || !postData.excerpt) {
            this.showError('Title and excerpt are required');
            return;
        }
        
        // Check if slug already exists (for new posts)
        const existingPost = this.posts.find(p => p.slug === postData.slug && p.id !== postData.id);
        if (existingPost) {
            this.showError('Slug already exists. Please choose a different one.');
            return;
        }
        
        // Save to posts array
        const existingIndex = this.posts.findIndex(p => p.id === postData.id);
        if (existingIndex >= 0) {
            // Update existing post
            this.posts[existingIndex] = { ...this.posts[existingIndex], ...postData };
        } else {
            // Add new post
            this.posts.push(postData);
        }
        
        // Save to JSON (in a real app, this would be a server API call)
        await this.saveData();
        
        // Update UI
        this.renderPostsTable();
        this.renderStatistics();
        
        // Close editor
        document.getElementById('post-editor').classList.remove('active');
        
        // Show success message
        this.showSuccess(`Post "${postData.title}" saved successfully!`);
    }
    
    deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }
        
        const postIndex = this.posts.findIndex(p => p.id === postId);
        if (postIndex >= 0) {
            const postTitle = this.posts[postIndex].title;
            this.posts.splice(postIndex, 1);
            
            // Re-index IDs if needed
            this.posts.forEach((post, index) => {
                post.id = index + 1;
            });
            
            this.saveData();
            this.renderPostsTable();
            this.renderStatistics();
            
            this.showSuccess(`Post "${postTitle}" deleted successfully`);
        }
    }
    
    async saveData() {
        // In a real application, this would send data to a server
        // For GitHub Pages static hosting, we'll simulate it
        const data = {
            posts: this.posts,
            categories: this.categories,
            settings: this.settings
        };
        
        // Show success message (simulated save)
        console.log('Data saved (simulated):', data);
        
        // For actual GitHub Pages, you would need to:
        // 1. Use GitHub API to update the JSON file
        // 2. Or use a serverless function (Vercel Function, AWS Lambda, etc.)
        // 3. Or use a third-party service like Firebase
        
        return Promise.resolve(true);
    }
    
    exportData() {
        const data = {
            posts: this.posts,
            categories: this.categories,
            settings: this.settings
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blog-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Blog data exported successfully!');
    }
    
    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.posts || !Array.isArray(data.posts)) {
                    throw new Error('Invalid blog data format');
                }
                
                // Merge with existing data
                this.posts = data.posts;
                this.categories = data.categories || this.categories;
                this.settings = data.settings || this.settings;
                
                // Re-index IDs
                this.posts.forEach((post, index) => {
                    post.id = index + 1;
                });
                
                this.saveData();
                this.renderPostsTable();
                this.renderStatistics();
                
                this.showSuccess('Blog data imported successfully!');
            } catch (error) {
                this.showError('Failed to import data: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
    
    // Utility functions
    generateSlug(title) {
        return title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    getNextId() {
        const maxId = this.posts.reduce((max, post) => Math.max(max, post.id), 0);
        return maxId + 1;
    }
    
    checkAdminAccess() {
        // Simple authentication (for demo purposes)
        // In production, implement proper authentication
        const password = localStorage.getItem('blog_admin_password');
        
        if (!password || password !== 'admin123') {
            window.location.href = 'blog-login.html';
            return false;
        }
        
        this.currentUser = {
            name: 'Admin',
            email: this.settings.admin_email,
            role: 'administrator'
        };
        
        return true;
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
    
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }
    
    setupEventListeners() {
        // Search functionality
        document.getElementById('blog-search')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchPosts(e.target.value);
            }
        });
        
        // Category filtering
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-category]')) {
                e.preventDefault();
                const category = e.target.closest('[data-category]').dataset.category;
                this.filterByCategory(category);
            }
        });
    }
    
    searchPosts(query) {
        if (!query.trim()) return;
        
        const results = this.posts.filter(post =>
            post.status === 'published' &&
            (post.title.toLowerCase().includes(query.toLowerCase()) ||
             post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
             post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
        );
        
        // Show search results
        console.log('Search results:', results);
        // In a real implementation, you would render these results
    }
    
    filterByCategory(category) {
        const filteredPosts = this.posts.filter(post =>
            post.status === 'published' && post.category === category
        );
        
        // Show filtered posts
        console.log(`Posts in category "${category}":`, filteredPosts);
        // In a real implementation, you would render these posts
    }
}

// Initialize CMS
const blogCMS = new BlogCMS();
