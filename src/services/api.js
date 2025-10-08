/**
 * Base API Client Configuration
 *
 * This is the foundation for all API calls. When backend is ready:
 * 1. Update API_BASE_URL in .env file
 * 2. Add authentication token to headers
 * 3. Uncomment error handling as needed
 */

// Read from environment variable (will be set in .env)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

/**
 * Base API client with common HTTP methods
 */
export const apiClient = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint (e.g., '/products')
   * @param {object} options - Additional fetch options
   * @returns {Promise} Response data
   */
  get: async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token when available
          // 'Authorization': `Bearer ${getAuthToken()}`,
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API GET Error:', error)
      throw error
    }
  },

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @param {object} options - Additional fetch options
   * @returns {Promise} Response data
   */
  post: async (endpoint, data, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${getAuthToken()}`,
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API POST Error:', error)
      throw error
    }
  },

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @param {object} options - Additional fetch options
   * @returns {Promise} Response data
   */
  put: async (endpoint, data, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${getAuthToken()}`,
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API PUT Error:', error)
      throw error
    }
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {object} options - Additional fetch options
   * @returns {Promise} Response data
   */
  delete: async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${getAuthToken()}`,
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API DELETE Error:', error)
      throw error
    }
  },
}

/**
 * Helper function to get auth token from localStorage
 * Will be used when authentication is implemented
 */
export const getAuthToken = () => {
  return localStorage.getItem('auth_token')
}

/**
 * Helper function to set auth token
 */
export const setAuthToken = (token) => {
  localStorage.setItem('auth_token', token)
}

/**
 * Helper function to remove auth token
 */
export const removeAuthToken = () => {
  localStorage.removeItem('auth_token')
}

export default apiClient
