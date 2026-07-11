// Define your Backend URL
const API_BASE_URL = "http://localhost:8080/api/v1"; //example

export const authService = {

    // Fetch Branch List from Backend
    getBranches: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/branches`);

            if (!response.ok) {
                throw new Error("Failed to fetch branch list");
            }

            const data = await response.json();
            return data.data; // Returns the array of branches: [{ id: 1, name: "Colombo" }, ...]
        } catch (error) {
            console.error("API Error:", error);
            throw error; // Re-throw so the UI can show an alert if needed
        }
    },

    // Send Registration Data to Backend
    registerUser: async (userData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                // Converts your JS Object into JSON string for the server
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                // If backend returns 400/500, throw the specific error message
                throw new Error(data.message || "Registration failed");
            }

            return data.data; // Success response payload
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    // Login User
    login: async (credentials) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            return data.data; // Returns the payload (token, user info, etc.)
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    // Forgot Password - submit reset request to admin for approval
    forgotPassword: async (requestData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to submit password reset request");
            }

            return data.data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    // Check if username already exists
    checkUsername: async (username) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/check-username?username=${encodeURIComponent(username)}`);
            if (!response.ok) {
                throw new Error("Failed to check username");
            }
            const data = await response.json();
            return data.data.exists;
        } catch (error) {
            console.error("API Error checking username:", error);
            return false;
        }
    }
};
