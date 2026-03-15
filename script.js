document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
            const icon = mobileMenuBtn.querySelector('i');
            if (mobileNav.classList.contains('open')) {
                icon.classList.remove('bx-menu');
                icon.classList.add('bx-x');
            } else {
                icon.classList.remove('bx-x');
                icon.classList.add('bx-menu');
            }
        });

        // Close mobile nav when clicking a link
        const mobileLinks = mobileNav.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('open');
                mobileMenuBtn.querySelector('i').classList.remove('bx-x');
                mobileMenuBtn.querySelector('i').classList.add('bx-menu');
            });
        });
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Active link switching based on scroll position
        let current = '';
        const sections = document.querySelectorAll('.section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Add a little offset for better UX
            if (scrollY >= (sectionTop - 250)) {
                current = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href').substring(1) === current) {
                a.classList.add('active');
            }
        });
    });

    // Intersection Observers for Animations
    
    // Timeline items visibility
    const timelineOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in', 'visible');
                timelineObserver.unobserve(entry.target);
            }
        });
    }, timelineOptions);

    document.querySelectorAll('.timeline-item').forEach((item, index) => {
        // Add staggered animation delay based on index implicitly via CSS
        item.style.transitionDelay = `${index * 0.2}s`;
        timelineObserver.observe(item);
    });

    // General fade-in elements
    const fadeOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, fadeOptions);

    document.querySelectorAll('.fade-in').forEach(item => {
        fadeObserver.observe(item);
    });
    
    // Smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#' || !targetId) return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                // Account for fixed navbar height
                const navHeight = navbar.offsetHeight || 80;
                window.scrollTo({
                    // Only substract nav height if we are not scrolling to Top/Home exactly 
                    // or handle it nicely via offset
                    top: targetId === '#home' ? 0 : targetElement.offsetTop - navHeight + 20,
                    behavior: 'smooth'
                });
            }
        });
    });

});
