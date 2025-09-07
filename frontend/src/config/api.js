// frontend/src/config/api.js

/**
 * Centralized API configuration for the English Vocabulary Learner app
 * 
 * This file manages all API endpoints and base URLs to ensure consistency
 * across the application and easy maintenance.
 */

// Production API URL for deployment
const PRODUCTION_API_URL = 'https://englishvoclearner-backend.onrender.com';

// Development API URL for local testing
const DEVELOPMENT_API_URL = 'http://127.0.0.1:5000';

/**
 * Get the appropriate API base URL based on environment
 * Priority: Environment variable > Production URL
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL || PRODUCTION_API_URL;

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    CHECK_ACTIVATION_CODE: '/api/auth/check-activation-code',
  },
  
  // Quiz endpoints
  QUIZ: {
    LEVELS: '/api/levels',
    QUESTION: '/api/question',
    VOCABULARY_QUESTION: '/api/vocabulary-question',
    CHECK_ANSWER: '/api/check-answer',
  },
  
  // User endpoints
  USER: {
    STATS: '/api/user/stats',
    MISTAKES: '/api/user/mistakes',
  },
  
  // Vocabulary endpoints
  VOCABULARY: {
    BASE: '/api/vocabulary',
    SUGGESTIONS: '/api/vocabulary/suggestions',
    SEARCH: '/api/vocabulary/search',
    NOTES: (word) => `/api/vocabulary/${encodeURIComponent(word)}/notes`,
    REVIEW: (word) => `/api/vocabulary/${encodeURIComponent(word)}/review`,
    DELETE: (word) => `/api/vocabulary/${encodeURIComponent(word)}`,
  },
};

/**
 * Helper function to build full API URL
 * @param {string} endpoint - The endpoint path
 * @returns {string} Full API URL
 */
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Helper function for common fetch options
 * @param {Object} authHeaders - Authorization headers from useAuth
 * @param {Object} additionalOptions - Additional fetch options
 * @returns {Object} Fetch options object
 */
export const getFetchOptions = (authHeaders = {}, additionalOptions = {}) => {
  return {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    ...additionalOptions,
  };
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  buildApiUrl,
  getFetchOptions,
};
