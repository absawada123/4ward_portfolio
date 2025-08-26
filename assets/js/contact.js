(function() {
    // Initialize EmailJS with your Public Key
    emailjs.init('Fz7FHyBRLNwDQlEt_');
})();

window.onload = function() {
    // We need to make sure the main.js script has run first to populate budget options.
    // A small delay can help ensure the DOM is fully ready.
    setTimeout(function() {
        const contactForm = document.querySelector('form.modern-form');
        if (contactForm) {
            contactForm.addEventListener('submit', function(event) {
                event.preventDefault(); // Prevent the default form submission

                // Replace 'YOUR_TEMPLATE_ID' with the actual Template ID from your EmailJS dashboard.
                const serviceID = 'service_gi9lkbo';
                const templateID = 'template_rz5era6'; // <-- IMPORTANT: REPLACE THIS

                const submitButton = this.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;
                
                // Update button state to indicate sending
                submitButton.textContent = 'Sending...';
                submitButton.disabled = true;

                // Send the form data using EmailJS
                emailjs.sendForm(serviceID, templateID, this)
                    .then(() => {
                        // On success
                        alert('Your message has been sent successfully!');
                        submitButton.textContent = originalButtonText;
                        submitButton.disabled = false;
                        this.reset(); // Reset the form fields
                        // Also reset budget dropdown to its initial state if needed
                        document.getElementById('custom-budget-group').style.display = 'none';

                    }, (err) => {
                        // On error
                        alert('Failed to send the message. Please try again later. Error: ' + JSON.stringify(err));
                        submitButton.textContent = originalButtonText;
                        submitButton.disabled = false;
                    });
            });
        }
    }, 500); // 500ms delay to ensure all scripts are loaded and executed
}