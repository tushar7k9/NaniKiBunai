/**
 * Favorites/Wishlist Service
 *
 * All favorites-related API calls
 * Backend Endpoints Expected:
 * - GET    /favorites/:userId          - Get user's favorites
 * - POST   /favorites/add              - Add to favorites
 * - DELETE /favorites/:userId/:productId - Remove from favorites
 * - POST   /favorites/toggle           - Toggle favorite status
 */

import { apiClient } from './api'

export const favoritesService = {
  /**
   * Get user's favorites
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of favorite product IDs or full product objects
   */
  getFavorites: async (userId) => {
    try {
      const response = await apiClient.get(`/favorites/${userId}`)
      return response.data || response
    } catch (error) {
      console.error(`Error fetching favorites for user ${userId}:`, error)
      throw error
    }
  },

  /**
   * Add product to favorites
   * @param {string} userId - User ID
   * @param {number|string} productId - Product ID
   * @returns {Promise<Object>} Updated favorites
   */
  addFavorite: async (userId, productId) => {
    try {
      const response = await apiClient.post('/favorites/add', {
        userId,
        productId,
      })
      return response.data || response
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  },

  /**
   * Remove product from favorites
   * @param {string} userId - User ID
   * @param {number|string} productId - Product ID
   * @returns {Promise<Object>} Updated favorites
   */
  removeFavorite: async (userId, productId) => {
    try {
      const response = await apiClient.delete(`/favorites/${userId}/${productId}`)
      return response.data || response
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  },

  /**
   * Toggle favorite status (add if not exists, remove if exists)
   * @param {string} userId - User ID
   * @param {number|string} productId - Product ID
   * @returns {Promise<Object>} Updated favorites with action performed
   */
  toggleFavorite: async (userId, productId) => {
    try {
      const response = await apiClient.post('/favorites/toggle', {
        userId,
        productId,
      })
      return response.data || response
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  },

  /**
   * Check if product is in favorites
   * @param {string} userId - User ID
   * @param {number|string} productId - Product ID
   * @returns {Promise<boolean>} True if favorited
   */
  isFavorite: async (userId, productId) => {
    try {
      const response = await apiClient.get(`/favorites/${userId}/check/${productId}`)
      return response.isFavorite || false
    } catch (error) {
      console.error('Error checking favorite status:', error)
      return false
    }
  },

  /**
   * Get favorite products with full details
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of full product objects
   */
  getFavoriteProducts: async (userId) => {
    try {
      const response = await apiClient.get(`/favorites/${userId}/products`)
      return response.data || response
    } catch (error) {
      console.error('Error fetching favorite products:', error)
      throw error
    }
  },
}

export default favoritesService
