// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;

    // --- 1. Loading Screen Logic ---
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.addEventListener('transitionend', () => {
                loader.style.display = 'none';
            });
        }, 2000); 
    }

    // --- 2. Sticky Header Logic ---
    const header = document.getElementById('main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // --- 3. Enhanced Mobile Hamburger Menu Logic ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        const navLinksItems = document.querySelectorAll('.nav-links li');

        hamburger.addEventListener('click', () => {
            toggleNav();
        });

        // Close nav when a link is clicked
        navLinksItems.forEach(item => {
            item.addEventListener('click', () => {
                if (navLinks.classList.contains('nav-active')) {
                    toggleNav();
                }
            });
        });

        function toggleNav() {
            navLinks.classList.toggle('nav-active');
            hamburger.classList.toggle('toggle');
            body.classList.toggle('body-no-scroll');
        }
    }

    // --- 4. Scroll-to-Top Button Logic ---
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

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
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
            if (prefersDark) {
                htmlEl.setAttribute('data-theme', 'dark');
            } else {
                htmlEl.setAttribute('data-theme', 'light');
            }
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
            // Clear existing options
            budgetSelect.innerHTML = '';

            // Add the default placeholder option
            const placeholder = new Option('SELECT A RANGE', '', true, true);
            placeholder.disabled = true;
            budgetSelect.appendChild(placeholder);

            // Populate with new options
            budgetRanges[currency].forEach(range => {
                const option = new Option(range.text, range.value);
                budgetSelect.appendChild(option);
            });

            // Add the custom range option
            const customOption = new Option('CUSTOM RANGE', 'custom');
            budgetSelect.appendChild(customOption);
        };

        // Event listener for currency change
        currencySelect.addEventListener('change', (e) => {
            populateBudgetOptions(e.target.value);
            // Hide custom field when currency changes
            customBudgetGroup.style.display = 'none'; 
        });

        // Event listener for budget change
        budgetSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customBudgetGroup.style.display = 'block';
            } else {
                customBudgetGroup.style.display = 'none';
            }
        });

        // Initial population on page load
        populateBudgetOptions(currencySelect.value);
    }
});