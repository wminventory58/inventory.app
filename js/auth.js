// WARNING: This method of storing a password client-side is highly insecure and
// is NOT suitable for production environments. Passwords should always be
// securely stored and validated on a server.
const CORRECT_PASSWORD = "punt2teaf3wrof"; // Replace with a more complex hardcoded password for testing

// Get references to the HTML elements
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const errorMessage = document.getElementById('errorMessage');
const loginForm = document.getElementById('loginForm'); // Assuming the form has an ID 'loginForm'

// Add an event listener to the login form for submission
if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
        // Prevent the default form submission
        event.preventDefault();

        // Get the value from the password input field
        const enteredPassword = passwordInput.value;

        // Compare the entered password with CORRECT_PASSWORD
        if (enteredPassword === CORRECT_PASSWORD) {
            // Passwords match:
            // Set an item in sessionStorage to indicate authentication
            sessionStorage.setItem('authenticated', 'true');
            // Redirect the user to index.html
            window.location.href = 'index.html';
        } else {
            // Passwords do not match:
            // Display an error message
            errorMessage.textContent = 'Invalid password. Please try again.';
            errorMessage.style.display = 'block'; // Make sure the error message is visible
            // Clear the password input field
            passwordInput.value = '';
        }
    });
} else {
    console.error("Login form with ID 'loginForm' not found.");
}