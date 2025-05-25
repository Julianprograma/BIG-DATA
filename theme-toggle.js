document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const currentTheme = localStorage.getItem('theme');
    const sunIconClass = 'fa-sun';
    const moonIconClass = 'fa-moon';

    // Function to set the theme and update the icon
    function setTheme(theme) {
        if (theme === 'light-mode') {
            document.body.classList.add('light-mode');
            if (themeToggleBtn) { // Check if button exists
                themeToggleBtn.innerHTML = `<i class="fas ${moonIconClass}"></i>`;
                themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
            }
            localStorage.setItem('theme', 'light-mode');
        } else {
            document.body.classList.remove('light-mode');
             if (themeToggleBtn) { // Check if button exists
                themeToggleBtn.innerHTML = `<i class="fas ${sunIconClass}"></i>`;
                themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
            }
            localStorage.setItem('theme', 'dark-mode'); // Default to dark mode
        }
    }

    // Apply the saved theme on initial load
    if (currentTheme) {
        setTheme(currentTheme);
    } else {
        // Default to dark mode if no theme is saved
        setTheme('dark-mode');
    }

    // Add event listener to the toggle button, if it exists
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (document.body.classList.contains('light-mode')) {
                setTheme('dark-mode');
            } else {
                setTheme('light-mode');
            }
        });
    }
});