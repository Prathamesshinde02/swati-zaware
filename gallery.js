/**
 * gallery.js
 * Handles dynamic image loading from specific directories.
 * Tries GitHub API first (if hosted on github), falls back to sequential local loading.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Parse URL parameters to figure out which folder to load
    const urlParams = new URLSearchParams(window.location.search);
    const folderName = urlParams.get('folder');
    const pageTitle = urlParams.get('title');

    // References to DOM elements in gallery.html
    const titleEl = document.getElementById('gallery-title');
    const descEl = document.getElementById('gallery-desc');
    const galleryContainer = document.getElementById('dynamic-gallery');
    const loadingIndicator = document.getElementById('loading-indicator');
    const emptyState = document.getElementById('empty-state');
    const folderNameDisplay = document.getElementById('folder-name-display');

    // References for Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if(e.target === lightbox) lightbox.classList.remove('active');
        });
    }

    // Function to handle image click for lightbox
    window.openLightbox = function(src) {
        if(lightbox && lightboxImg) {
            lightboxImg.src = src;
            lightbox.classList.add('active');
        }
    };

    // If we are on the generic gallery.html page, set up titles based on URL params
    if (titleEl && pageTitle) {
        titleEl.textContent = pageTitle;
        document.title = `${pageTitle} | Swati Madhukar Zaware`;
    }
    if (folderNameDisplay && folderName) {
        folderNameDisplay.textContent = `images/${folderName}`;
    }

    /**
     * Creates an HTML string for a single photo card
     */
    function createPhotoCard(imgUrl, delayIndex) {
        // Limit delay to max 5 steps so it doesn't take forever to fade in
        const delayClass = (delayIndex > 0 && delayIndex <= 5) ? `delay-${delayIndex}` : '';
        
        return `
        <div class="photo-card glass-panel hover-tilt fade-in ${delayClass} visible" style="opacity:1; transform:translateY(0)">
            <div class="img-container" style="cursor:pointer;" onclick="openLightbox('${imgUrl}')">
                <img src="${imgUrl}" alt="Gallery Image" loading="lazy">
            </div>
        </div>
        `;
    }

    /**
     * Renders an array of image URLs to the specified container
     */
    function renderImages(imageUrls, container) {
        if (!container) return;
        
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        if (imageUrls.length === 0) {
            if (galleryContainer) galleryContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        container.style.display = 'grid'; // Grid display from CSS
        
        let html = '';
        imageUrls.forEach((url, index) => {
            html += createPhotoCard(url, index);
        });
        
        container.innerHTML = html;
    }

    /**
     * Loads images sequentially (1.jpg, 2.jpg, etc...) until it hits a 404.
     * This is the fallback for local testing when GitHub API isn't available.
     */
    async function loadImagesSequentially(folderPath, container) {
        let imageUrls = [];
        let index = 1;
        let consecutiveErrors = 0;
        const maxErrors = 2; // Stop after 2 missing files in sequence (e.g. 1.jpg, no 2.jpg, no 3.jpg -> stop)
        const commonExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

        while (consecutiveErrors < maxErrors) {
            let found = false;
            
            // Try different extensions
            for (const ext of commonExtensions) {
                const imgPath = `${folderPath}/${index}${ext}`;
                try {
                    // Try to fetch headers to see if file exists
                    const response = await fetch(imgPath, { method: 'HEAD' });
                    if (response.ok) {
                        imageUrls.push(imgPath);
                        found = true;
                        consecutiveErrors = 0; // Reset error counter
                        break; // Stop checking extensions for this index
                    }
                } catch (e) {
                    // CORS or network error, assume not found
                }
            }

            if (!found) {
                consecutiveErrors++;
            }
            index++;
            
            // Hard limit to prevent infinite loops in weird environments
            if(index > 50) break;
        }

        renderImages(imageUrls, container);
    }

    /**
     * Uses GitHub API to fetch directory contents.
     * Requires the URL structure: username.github.io/repo/
     */
    async function fetchFromGitHubAPI(folderPath, container) {
        try {
            const hostname = window.location.hostname;
            const pathname = window.location.pathname;
            
            // Extract username and repo from github.io URL
            // e.g., prathamesh.github.io/MemoryWebsite/
            const username = hostname.split('.')[0];
            const parts = pathname.split('/').filter(p => p);
            const repo = parts.length > 0 ? parts[0] : '';
            
            if (!username || !repo) {
                throw new Error("Could not parse GitHub repo details from URL");
            }

            // Construct API URL
            // Adjust folderPath if website is not at root of repo
            // e.g. path in repo: "New folder/images/..."
            // For now, assuming images folder is at the root of the repo being served.
            const apiPath = `https://api.github.com/repos/${username}/${repo}/contents/${folderPath}`;
            
            const response = await fetch(apiPath);
            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}`);
            }
            
            const data = await response.json();
            
            // Filter out non-images
            const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const imageUrls = data
                .filter(file => file.type === 'file' && imageExts.some(ext => file.name.toLowerCase().endsWith(ext)))
                .map(file => file.download_url); // Use raw download URL
                
            renderImages(imageUrls, container);
            
        } catch (error) {
            console.warn("GitHub API fetch failed, falling back to sequential load:", error);
            // Fall back to sequential local load
            await loadImagesSequentially(folderPath, container);
        }
    }

    /**
     * Main entry point to load images for a given folder and inject into a container.
     */
    window.loadGalleryImages = async function(folderName, targetContainerId) {
        const container = document.getElementById(targetContainerId);
        if (!container || !folderName) return;
        
        const folderPath = `images/${folderName}`;
        
        // Detect if we are on GitHub Pages
        if (window.location.hostname.includes('github.io')) {
            await fetchFromGitHubAPI(folderPath, container);
        } else {
            // Local fallback
            await loadImagesSequentially(folderPath, container);
        }
    };

    // If we are on gallery.html, trigger load immediately
    if (folderName && galleryContainer) {
        window.loadGalleryImages(folderName, 'dynamic-gallery');
    }

});
