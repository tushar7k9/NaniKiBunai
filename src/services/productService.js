/**
 * Product Service
 *
 * All product-related API calls
 * Backend Endpoints Expected:
 * - GET  /products                    - Get all products
 * - GET  /products/:id                - Get single product
 * - GET  /products/category/:category - Get products by category
 * - GET  /products/search?q=query     - Search products
 */

import { apiClient } from './api'

export const productService = {
  /**
   * Fetch all products
   * @returns {Promise<Array>} Array of product objects
   */
  getAllProducts: async () => {
    try {
      const response = await apiClient.get('/products')
      return response.data || response
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  },

  /**
   * Fetch single product by ID
   * @param {number|string} id - Product ID
   * @returns {Promise<Object>} Product object
   */
  getProductById: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}`)
      return response.data || response
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error)
      throw error
    }
  },

  /**
   * Fetch products by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of products in that category
   */
  getProductsByCategory: async (category) => {
    try {
      const response = await apiClient.get(`/products/category/${category}`)
      return response.data || response
    } catch (error) {
      console.error(`Error fetching products for category ${category}:`, error)
      throw error
    }
  },

  /**
   * Search products
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching products
   */
  searchProducts: async (query) => {
    try {
      const response = await apiClient.get(`/products/search?q=${encodeURIComponent(query)}`)
      return response.data || response
    } catch (error) {
      console.error('Error searching products:', error)
      throw error
    }
  },

  /**
   * Fetch featured products
   * @returns {Promise<Array>} Array of featured products
   */
  getFeaturedProducts: async () => {
    try {
      const response = await apiClient.get('/products/featured')
      return response.data || response
    } catch (error) {
      console.error('Error fetching featured products:', error)
      throw error
    }
  },

  /**
   * Get product reviews
   * @param {number|string} productId - Product ID
   * @returns {Promise<Array>} Array of reviews
   */
  getProductReviews: async (productId) => {
    try {
      const response = await apiClient.get(`/products/${productId}/reviews`)
      return response.data || response
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error)
      throw error
    }
  },

  /**
   * Add product review
   * @param {number|string} productId - Product ID
   * @param {object} reviewData - Review data (rating, comment, etc.)
   * @returns {Promise<Object>} Created review
   */
  addProductReview: async (productId, reviewData) => {
    try {
      const response = await apiClient.post(`/products/${productId}/reviews`, reviewData)
      return response.data || response
    } catch (error) {
      console.error(`Error adding review for product ${productId}:`, error)
      throw error
    }
  },
}

export default productService
