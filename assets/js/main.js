// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;
    const html = document.documentElement; // Get the html element for scroll locking
    const heroSection = document.getElementById('hero');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // --- SHARED LOGIC: This runs on ALL pages ---

    // --- 1. Custom Zoom Page Loader (2-Second Duration, All Fixes) ---
    const pageLoader = document.getElementById('page-loader');
    const zoomText = document.getElementById('zoom-text');
    let isLoaderRunning = false;

    if (pageLoader && zoomText) {
        
        const forceHideLoader = () => {
            isLoaderRunning = false;
            pageLoader.classList.add('hidden');
            pageLoader.classList.remove('is-visible', 'is-zooming');
        };

        const runLoader = (destinationUrl = null) => {
            if (isLoaderRunning) return; 
            isLoaderRunning = true;
            
            pageLoader.classList.remove('hidden');

            setTimeout(() => {
                zoomText.textContent = '0';
                pageLoader.classList.add('is-visible');
            }, 100);

            setTimeout(() => {
                zoomText.textContent = '100';
                pageLoader.classList.add('is-zooming');
            }, 800);

            setTimeout(() => {
                if (destinationUrl) {
                    window.location.href = destinationUrl;
                } else {
                    forceHideLoader();
                }
            }, 2000); // Total animation duration is 2 seconds.
        };
        
        const handleLinkClick = (e) => {
            const link = e.currentTarget;
            if (link.target === '_blank' || link.protocol.startsWith('mailto') || link.protocol.startsWith('tel') || link.getAttribute('href').startsWith('#')) {
                return;
            }
            if (link.href === window.location.href) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            runLoader(link.href);
        };

        const internalLinks = document.querySelectorAll('a[href]:not([href^="#"]):not([target="_blank"])');
        internalLinks.forEach(link => {
            link.addEventListener('click', handleLinkClick);
        });

        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                forceHideLoader();
            }
        });

        runLoader();
    }

    // --- 2. Sticky Header Logic ---
    const header = document.getElementById('main-header');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        }
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // --- 3. Enhanced Mobile Hamburger Menu Logic with Overlay & Scroll Lock ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    let currentScrollY = 0; // New variable to store scroll position

    if (hamburger && navLinks && mobileMenuOverlay) {
        // Close menu when clicking the overlay
        mobileMenuOverlay.addEventListener('click', () => {
            if (navLinks.classList.contains('nav-active')) {
                toggleNav();
            }
        });
        
        hamburger.addEventListener('click', () => {
            toggleNav();
        });

        const navLinksItems = document.querySelectorAll('.nav-links li');
        navLinksItems.forEach(item => {
            const link = item.querySelector('a');
            // Close menu for hash links or theme toggle when clicked, as they don't trigger page reload.
            if (link && (link.getAttribute('href').startsWith('#') || item.contains(document.getElementById('theme-toggle')))) {
                 item.addEventListener('click', () => {
                    if (navLinks.classList.contains('nav-active')) {
                        toggleNav();
                    }
                 });
            }
            // For full page links, the global handleLinkClick manages loader and navigation.
        });

        function toggleNav() {
            navLinks.classList.toggle('nav-active');
            hamburger.classList.toggle('toggle');
            mobileMenuOverlay.classList.toggle('is-active');

            if (navLinks.classList.contains('nav-active')) {
                // Lock body scroll
                currentScrollY = window.scrollY; // Store current scroll position
                body.style.position = 'fixed';
                body.style.top = `-${currentScrollY}px`;
                body.style.width = '100%';
                body.style.overflowY = 'hidden'; // Hide vertical scrollbar on body
                html.style.overflow = 'hidden'; // Hide scrollbar on html for full lock
            } else {
                // Unlock body scroll
                body.style.position = '';
                body.style.top = '';
                body.style.width = '';
                body.style.overflowY = '';
                html.style.overflow = ''; // Restore html overflow
                window.scrollTo(0, currentScrollY); // Restore scroll position
            }
        }
    }

    // --- 4. Scroll-to-Top Button Visibility Logic ---
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.style.display = 'block';
                setTimeout(() => {
                    scrollToTopBtn.style.opacity = '1';
                }, 10);
            } else {
                scrollToTopBtn.style.opacity = '0';
                scrollToTopBtn.addEventListener('transitionend', () => {
                    if (scrollToTopBtn.style.opacity === '0') {
                        scrollToTopBtn.style.display = 'none';
                    }
                }, { once: true });
            }
        });
    }

    // --- 5. Scroll Animation (AOS.js) Initialization ---
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800, 
            once: true,
        });
    }

    // --- 6. Dark/Light Mode Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    const applyInitialTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            htmlEl.setAttribute('data-theme', savedTheme);
        } else {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            htmlEl.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    };
    const toggleTheme = () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    applyInitialTheme();
    
    // --- 7. Contact Form Dynamic Budget Logic ---
    const currencySelect = document.getElementById('currency-select');
    const budgetSelect = document.getElementById('budget-select');
    const customBudgetGroup = document.getElementById('custom-budget-group');
    if (currencySelect && budgetSelect && customBudgetGroup) {
        const budgetRanges = {
            usd: [
                { value: '<5k', text: '< $5,000' },
                { value: '5k-10k', text: '$5,000 - $10,000' },
                { value: '10k-20k', text: '$10,000 - $20,000' },
                { value: '>20k', text: '> $20,000' }
            ],
            php: [
                { value: '<250k', text: '< ₱250,000' },
                { value: '250k-500k', text: '₱250,000 - ₱500,000' },
                { value: '500k-1m', text: '₱500,000 - ₱1,000,000' },
                { value: '>1m', text: '> ₱1,000,000' }
            ]
        };
        const populateBudgetOptions = (currency) => {
            budgetSelect.innerHTML = '';
            const placeholder = new Option('SELECT A RANGE', '', true, true);
            placeholder.disabled = true;
            budgetSelect.appendChild(placeholder);
            budgetRanges[currency].forEach(range => {
                const option = new Option(range.text, range.value);
                budgetSelect.appendChild(option);
            });
            const customOption = new Option('CUSTOM RANGE', 'custom');
            budgetSelect.appendChild(customOption);
        };
        currencySelect.addEventListener('change', (e) => {
            populateBudgetOptions(e.target.value);
            customBudgetGroup.style.display = 'none'; 
        });
        budgetSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customBudgetGroup.style.display = 'block';
            } else {
                customBudgetGroup.style.display = 'none';
            }
        });
        populateBudgetOptions(currencySelect.value);
    }
    
    // --- 8. Services Section Filtering Logic ---
    const filtersContainer = document.getElementById('service-filters');
    if (filtersContainer) {
        const filterBtns = filtersContainer.querySelectorAll('.filter-btn');
        const serviceCards = document.querySelectorAll('.services-grid .service-card');

        filtersContainer.addEventListener('click', (e) => {
            const target = e.target;
            if (!target.classList.contains('filter-btn')) {
                return;
            }
            filterBtns.forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');

            const filterValue = target.getAttribute('data-filter');

            serviceCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');

                if (filterValue === 'all' || filterValue === cardCategory) {
                    card.classList.remove('hide');
                } else {
                    card.classList.add('hide');
                }
            });
        });
    }

    // --- Page-Specific Logic: Run animations ONLY on the homepage ---
    if (heroSection && !prefersReducedMotion.matches) {
        
        const lenis = new Lenis();
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);

        gsap.registerPlugin(ScrollTrigger);

        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            const chars = heroContent.querySelectorAll('.char');
            gsap.fromTo(chars, {
                y: 0, x: 0, rotation: 0, opacity: 1, filter: 'blur(0px)',
            }, {
                y: gsap.utils.random(-250, 250, true), 
                x: gsap.utils.random(-250, 250, true), 
                rotation: gsap.utils.random(-90, 90, true), 
                opacity: 0.1,
                filter: 'blur(10px)', 
                ease: 'none',
                stagger: 0.02,
                scrollTrigger: {
                    trigger: '#hero',
                    start: 'top top',      
                    end: '+=500', 
                    scrub: 0.5,
                    pin: true,             
                }
            });

            gsap.to('.animated-background', {
                backgroundPosition: '100% 50%', 
                ease: 'none',
                scrollTrigger: {
                    trigger: '#hero',
                    start: 'top top',
                    end: '+=500', 
                    scrub: 0.5,
                }
            });
        }

        const scrollToTopBtn = document.getElementById('scroll-to-top');
        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener('click', () => {
                lenis.scrollTo(0, { duration: 1.5 });
            });
        }

    } else {
        const scrollToTopBtn = document.getElementById('scroll-to-top');
        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    const empoweringSection = document.getElementById('empowering-business');
    if (empoweringSection && !prefersReducedMotion.matches) {
        const headline = empoweringSection.querySelector('.section-headline');
        if (headline) {
            const text = headline.textContent;
            headline.innerHTML = '';
            text.split('').forEach(char => {
                const span = document.createElement('span');
                span.style.display = 'inline-block';
                span.style.willChange = 'transform, opacity';
                span.textContent = char === ' ' ? '\u00A0' : char;
                headline.appendChild(span);
            });

            gsap.from(headline.querySelectorAll('span'), {
                y: 50,
                opacity: 0,
                rotationX: -90,
                stagger: 0.02,
                ease: 'back.out(1.7)',
                scrollTrigger: {
                    trigger: headline,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                }
            });
        }

        const image = empoweringSection.querySelector('.visual-content img');
        if (image) {
            gsap.to(image, {
                yPercent: -15,
                ease: 'none',
                scrollTrigger: {
                    trigger: empoweringSection,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                }
            });
        }
    }
});