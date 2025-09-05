// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;
    const html = document.documentElement; // Get the html element for scroll locking
    const heroSection = document.getElementById('hero');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let lenis; // Declare lenis in a scope accessible by expandCard/collapseCards

    // --- SHARED LOGIC: This runs on ALL pages ---

    // --- 1. Advanced Page Loader ---
    const pageLoader = document.getElementById('page-loader');
    const zoomText = document.getElementById('zoom-text');
    const contentWrapper = document.getElementById('content-wrapper'); // Main content wrapper

    if (pageLoader && zoomText && contentWrapper) {
        let loadedAssetsCount = 0;
        let totalAssetsToLoad = 0;
        let loaderAnimationStarted = false; // Flag to prevent re-initialization on bfcache

        const updateProgress = () => {
            if (totalAssetsToLoad === 0) { // Handle case with no assets to load
                zoomText.textContent = '100%';
                return;
            }
            const progress = Math.min(100, Math.floor((loadedAssetsCount / totalAssetsToLoad) * 100));
            zoomText.textContent = `${progress}%`;
        };

        const forceHideLoader = () => {
            pageLoader.classList.add('hidden');
            pageLoader.classList.remove('is-visible', 'is-zooming');
            // Show main content wrapper
            contentWrapper.style.opacity = '1';
            contentWrapper.style.visibility = 'visible';
            contentWrapper.style.transition = 'opacity 0.8s ease'; // Smooth reveal

            // Remove scroll lock
            html.classList.remove('body-no-scroll');
            body.classList.remove('body-no-scroll');
        };

        const preloadAllAssets = () => {
            return new Promise(resolve => {
                const assetPromises = [];
                const imgElements = document.querySelectorAll('img:not([data-preload-ignore])');
                const videoElements = document.querySelectorAll('video:not([data-preload-ignore])');

                // Collect all images (excluding those explicitly ignored)
                imgElements.forEach(img => {
                    // Only preload if src exists and image isn't already loaded
                    if (img.src && !img.complete) {
                        assetPromises.push(new Promise(imgResolve => {
                            const tempImg = new Image();
                            tempImg.onload = tempImg.onerror = () => {
                                loadedAssetsCount++;
                                updateProgress();
                                imgResolve();
                            };
                            tempImg.src = img.src; // This triggers download
                        }));
                    } else if (img.complete && img.src) { // Count already loaded images
                        loadedAssetsCount++;
                    }
                });

                // Collect all videos (excluding those explicitly ignored)
                videoElements.forEach(video => {
                    const videoSrc = video.src || (video.querySelector('source') && video.querySelector('source').src);
                    if (videoSrc) {
                        assetPromises.push(new Promise(videoResolve => {
                            // If video already has enough data, count it
                            if (video.readyState >= 3) { // HAVE_FUTURE_DATA
                                loadedAssetsCount++;
                                updateProgress();
                                videoResolve();
                                return;
                            }
                            
                            const handleVideoLoad = () => {
                                video.removeEventListener('loadeddata', handleVideoLoad);
                                video.removeEventListener('error', handleVideoLoad);
                                video.removeEventListener('canplaythrough', handleVideoLoad);
                                loadedAssetsCount++;
                                updateProgress();
                                videoResolve();
                            };

                            video.addEventListener('loadeddata', handleVideoLoad, { once: true });
                            video.addEventListener('error', handleVideoLoad, { once: true });
                            video.addEventListener('canplaythrough', handleVideoLoad, { once: true });
                            
                            // Ensure the video attempts to load
                            video.load();
                        }));
                    }
                });

                totalAssetsToLoad = assetPromises.length;

                // If no assets to load, resolve immediately
                if (totalAssetsToLoad === 0) {
                    resolve();
                    return;
                }
                
                updateProgress(); // Initial progress (e.g., 0% or more if some were already complete)

                Promise.all(assetPromises)
                    .then(() => {
                        // Ensure progress is 100% even if some assets failed or were skipped initially
                        loadedAssetsCount = totalAssetsToLoad;
                        updateProgress();
                        resolve();
                    })
                    .catch(error => {
                        console.error("Error preloading some assets:", error);
                        // Even if some fail, we should still proceed to show the page
                        resolve();
                    });
            });
        };

        const runPreloaderAnimation = async () => {
            if (loaderAnimationStarted) return; // Prevent double initialization
            loaderAnimationStarted = true;

            // Lock scrolling
            html.classList.add('body-no-scroll');
            body.classList.add('body-no-scroll');

            // Set loader to initial visible state
            pageLoader.classList.remove('hidden', 'is-zooming');
            zoomText.textContent = '0%';
            pageLoader.classList.add('is-visible');

            // Give a tiny moment for CSS to apply initial state before starting preload
            await new Promise(r => setTimeout(r, 50));

            // Start preloading and wait for it to complete
            await preloadAllAssets();

            // All assets loaded, now trigger the final animation
            // Ensure 100% is displayed
            zoomText.textContent = '100%';

            // Short delay to show 100% before zoom-out
            setTimeout(() => {
                pageLoader.classList.add('is-zooming');
            }, 300);

            // Hide loader completely after zoom-out animation
            // The is-zooming transition is 1.2s, so wait a bit more
            setTimeout(() => {
                forceHideLoader();
            }, 1500); // 300ms delay + 1.2s CSS transition = ~1.5s
        };

        // --- Link Interception Logic ---
        document.querySelectorAll('a[href]').forEach(link => {
            link.addEventListener('click', e => {
                const href = link.getAttribute('href');
                const isExternal = link.hostname !== '' && link.hostname !== window.location.hostname;

                // Let the browser handle internal links, special links, and links opening in a new tab
                // unless it's a solution card that is about to expand (handled by specific logic below)
                if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') {
                    return;
                }

                // If it's an internal link and not handled by the solution card logic,
                // allow default behavior (the page loader should still cover navigation).
                // The solution card logic itself will call e.preventDefault() if it needs to expand.
                if (!isExternal && !link.classList.contains('solution-card')) {
                    // For internal navigation, the runPreloaderAnimation will be triggered by pageshow on the new page.
                    return; 
                }
                
                // For external links, prevent default and show a quick loader
                if (isExternal) {
                    e.preventDefault();

                    // Show the loader immediately (quick version for external links)
                    pageLoader.classList.remove('hidden', 'is-visible', 'is-zooming');
                    zoomText.textContent = '0%'; // Updated to match percentage format
                    pageLoader.classList.add('is-visible');

                    // Navigate after a short delay
                    setTimeout(() => {
                        window.location.href = href;
                    }, 500);
                }
            });
        });

        // --- Page Load Logic ---

        // Handle browser Back/Forward Cache (bfcache) restores
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                // If the page is restored from cache, the loader might be stuck. Hide it instantly.
                forceHideLoader();
            } else {
                // For initial load or fresh navigation, run the preloader animation
                runPreloaderAnimation();
            }
        });

        // Fallback for initial load if 'pageshow' event is not reliable or missed (e.g., in some dev environments)
        // Check if the preloader hasn't been started yet by pageshow.
        // This is a safety measure, 'pageshow' is generally preferred.
        if (!loaderAnimationStarted && (window.performance.getEntriesByType("navigation")[0]?.type === 'navigate' || window.performance.getEntriesByType("navigation")[0]?.type === 'reload')) {
            runPreloaderAnimation();
        }
    }


    // --- 2. Sticky Header Logic ---
    const header = document.getElementById('main-header');
    if (header) {
        // Initial check for scroll position on load
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
            header.classList.remove('alt-header-initial'); // Ensure alt-header is removed if scrolled
        } else {
            // If not scrolled and on a page that needs initial alt styles (contact/about)
            if (window.location.pathname === '/contact' || window.location.pathname === '/about') {
                 header.classList.add('alt-header-initial');
            } else {
                 header.classList.remove('alt-header-initial');
            }
        }

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
                header.classList.remove('alt-header-initial'); // Remove alt-header if scrolled
            } else {
                header.classList.remove('scrolled');
                // Re-apply alt-header-initial only if not scrolled and on specific pages
                if (window.location.pathname === '/contact' || window.location.pathname === '/about') {
                    header.classList.add('alt-header-initial');
                }
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
                html.classList.add('body-no-scroll'); // Use a class for HTML overflow
            } else {
                // Unlock body scroll
                body.style.position = '';
                body.style.top = '';
                body.style.width = '';
                html.classList.remove('body-no-scroll'); // Remove class for HTML overflow
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
            once: true, // Only animate once when elements come into view
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

    // --- 9. Solutions Card Expansion Logic ---
    const solutionsGrid = document.querySelector('.solutions-grid');
    const solutionCards = document.querySelectorAll('.solution-card');
    const backButtonContainer = document.querySelector('.solution-back-button-container');
    const backButton = document.querySelector('.back-button');
    const solutionsSection = document.getElementById('solutions'); // Get the solutions section

    if (solutionsGrid && solutionCards.length > 0 && backButtonContainer && backButton && solutionsSection) {
        
        // --- START: EVENT-DRIVEN FIX ---
        
        // Helper function to handle scrolling consistently.
        const scrollToSolutionsSection = () => {
            const header = document.getElementById('main-header');
            const headerHeight = header ? header.offsetHeight : 0; // Get sticky header height

            if (lenis) {
                lenis.scrollTo(solutionsSection, {
                    offset: -(headerHeight + 20), // Add a 20px margin for spacing
                    duration: 1.2,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                });
            } else {
                const targetPosition = solutionsSection.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        };

        solutionCards.forEach(card => {
            card.dataset.originalAos = card.getAttribute('data-aos');
            card.dataset.originalAosDelay = card.getAttribute('data-aos-delay');

            card.addEventListener('click', (event) => {
                if (!card.classList.contains('expanded')) {
                    event.preventDefault();
                    expandCard(card);
                }
            });
        });

        backButton.addEventListener('click', collapseCards);

        function expandCard(cardToExpand) {
            // Add an event listener that waits for the CSS transition to finish, then scrolls.
            // { once: true } ensures it only runs once per click and cleans itself up.
            cardToExpand.addEventListener('transitionend', scrollToSolutionsSection, { once: true });

            solutionsGrid.classList.add('expanded-view');

            solutionCards.forEach(card => {
                if (card === cardToExpand) {
                    card.classList.add('expanded');
                    card.style.cursor = 'default';
                    card.removeAttribute('data-aos');
                    card.removeAttribute('data-aos-delay');
                } else {
                    card.classList.add('hidden');
                    card.removeAttribute('data-aos');
                    card.removeAttribute('data-aos-delay');
                }
            });

            backButtonContainer.classList.add('visible');
        }

        function collapseCards() {
            // Find the currently expanded card to listen for its transition.
            const expandedCard = document.querySelector('.solution-card.expanded');
            
            // If an expanded card exists, wait for its transition to end before scrolling.
            if (expandedCard) {
                expandedCard.addEventListener('transitionend', scrollToSolutionsSection, { once: true });
            }

            solutionsGrid.classList.remove('expanded-view');

            solutionCards.forEach(card => {
                card.classList.remove('expanded', 'hidden');
                card.style.cursor = 'pointer';

                if (card.dataset.originalAos) {
                    card.setAttribute('data-aos', card.dataset.originalAos);
                }
                if (card.dataset.originalAosDelay) {
                    card.setAttribute('data-aos-delay', card.dataset.originalAosDelay);
                }
            });

            backButtonContainer.classList.remove('visible');
            
            if (typeof AOS !== 'undefined') {
                AOS.refreshHard();
            }
        }
        
        // --- END: EVENT-DRIVEN FIX ---
    }

    // --- New: Team Carousel Touch-to-Pause Logic (for mobile) ---
    const teamCarouselTrack = document.querySelector('.team-carousel-track');
    if (teamCarouselTrack) {
        // Function to check if a touch device is being used
        const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

        if (isTouchDevice()) {
            teamCarouselTrack.addEventListener('touchstart', () => {
                teamCarouselTrack.style.animationPlayState = 'paused';
            }, { passive: true }); // Using passive: true for better scroll performance

            teamCarouselTrack.addEventListener('touchend', () => {
                teamCarouselTrack.style.animationPlayState = 'running';
            }, { passive: true });

            teamCarouselTrack.addEventListener('touchcancel', () => {
                teamCarouselTrack.style.animationPlayState = 'running';
            }, { passive: true });
        }
    }


    // --- Page-Specific Logic: Run animations ONLY on the homepage ---
    // Initialize Lenis unconditionally (unless reduced motion is preferred)
    if (!prefersReducedMotion.matches) { 
        lenis = new Lenis(); // Initialize lenis
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            if (lenis) lenis.raf(time * 1000); // Check if lenis exists before calling raf
        });
        gsap.ticker.lagSmoothing(0);

        gsap.registerPlugin(ScrollTrigger); // Register ScrollTrigger here if Lenis is initialized
    }

    const heroContent = document.querySelector('.hero-content'); // Moved outside conditional block for wider access

    if (heroSection && !prefersReducedMotion.matches) {
        
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
                if (lenis) { // Use lenis if initialized
                    lenis.scrollTo(0, { duration: 1.5 });
                } else { // Fallback
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }

    } else {
        // Fallback for pages without Lenis/GSAP or with reduced motion
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