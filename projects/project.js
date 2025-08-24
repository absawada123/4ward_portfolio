// projects/project.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Sticky Project Header Logic ---
    const stickyHeader = document.getElementById('project-header');
    const mainProjectTitle = document.querySelector('.project-title-main');

    if (stickyHeader && mainProjectTitle) {
        const showHeader = () => {
            const titlePosition = mainProjectTitle.getBoundingClientRect();
            if (titlePosition.bottom < 75) {
                stickyHeader.classList.add('visible');
            } else {
                stickyHeader.classList.remove('visible');
            }
        };

        window.addEventListener('scroll', showHeader);
        showHeader();
    }

    // --- 2. Image Gallery Logic ---
    const mainImage = document.querySelector('.main-project-image');
    const thumbnails = document.querySelectorAll('.thumbnail');

    if (mainImage && thumbnails.length > 0) {
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
                mainImage.src = this.src;
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // --- 3. Image Zoom Modal Logic ---
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const mainProjectImage = document.querySelector('.main-project-image');
    const closeModalBtn = document.querySelector('.close-modal-btn');

    if (modal && modalImage && mainProjectImage && closeModalBtn) {
        // Open the modal
        mainProjectImage.addEventListener('click', () => {
            modal.style.display = 'flex';
            modalImage.src = mainProjectImage.src;
            document.body.classList.add('body-no-scroll');
        });

        // Close the modal via the 'X' button
        const closeModal = () => {
            modal.style.display = 'none';
            document.body.classList.remove('body-no-scroll');
        };

        closeModalBtn.addEventListener('click', closeModal);

        // Close the modal by clicking on the background
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
});