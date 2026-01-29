/**
 * API Service - Centralized API calls with JWT authentication
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

/**
 * Get the stored JWT token
 */
const getToken = () => {
    return localStorage.getItem('token');
};

/**
 * Create headers with JWT authorization
 */
const getHeaders = (includeContentType = true) => {
    const headers = {};
    const token = getToken();

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
};

import toast from 'react-hot-toast';

/**
 * Handle API response
 */
const handleResponse = async (response) => {
    if (response.status === 401) {
        // Token expired or invalid - clear auth and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Authentication required');
    }

    if (response.status === 402) {
        toast.error('Insufficient credits');
        throw new Error('Insufficient credits');
    }

    if (response.status === 403) {
        toast.error('Access denied or limit reached');
        throw new Error('Access denied or limit reached');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || `Request failed with status ${response.status}`;

        // Don't toast for 404s if they are expected "not found" checks? 
        // Usually 404 is an error in typical flow, so toast it unless specifically handled.
        // For now, toast everything.
        toast.error(message);

        throw new Error(message);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

/**
 * API methods
 */
export const api = {
    get: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders(false),
        });
        return handleResponse(response);
    },

    post: async (endpoint, data) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    put: async (endpoint, data) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    delete: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders(false),
        });
        return handleResponse(response);
    },
};

export default api;
