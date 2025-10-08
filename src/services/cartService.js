/**
 * Cart Service
 *
 * All cart-related API calls
 * Backend Endpoints Expected:
 * - GET    /cart/:userId              - Get user's cart
 * - POST   /cart/add                  - Add item to cart
 * - PUT    /cart/update               - Update cart item quantity
 * - DELETE /cart/:userId/:productId   - Remove item from cart
 * - DELETE /cart/:userId              - Clear entire cart
 */

import { apiClient } from './api'

export const cartService = {
  /**
   * Get user's cart
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Cart object with items array
   */
  getCart: async (userId) => {
    try {
      const response = await apiClient.get(`/cart/${userId}`)
      return response.data || response
    } catch (error) {
      console.error(`Error fetching cart for user ${userId}:`, error)
      throw error
    }
  },

  /**
   * Add item to cart
   * @param {string} userId - User ID
   * @param {number|string} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @param {object} options - Additional options (color, size, etc.)
   * @returns {Promise<Object>} Updated cart
   */
  addToCart: async (userId, productId, quantity, options = {}) => {
    try {
      const response = await apiClient.post('/cart/add', {
        userId,
        productId,
        quantity,
        ...options,
      })
      return response.data || response
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  },

  /**
   * Update cart item quantity
   * @param {string} userId - User ID
   * @param {number|string} productId - Product ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Updated cart
   */
  updateCartItem: async (userId, productId, quantity) => {
    try {
      const response = await apiClient.put('/cart/update', {
        userId,
        productId,
        quantity,
      })
      return response.data || response
    } catch (error) {
      console.error('Error updating cart item:', error)
      throw error
    }
  },

  /**
   * Remove item from cart
   * @param {string} userId - User ID
   * @param {number|string} productId - Product ID
   * @returns {Promise<Object>} Updated cart
   */
  removeFromCart: async (userId, productId) => {
    try {
      const response = await apiClient.delete(`/cart/${userId}/${productId}`)
      return response.data || response
    } catch (error) {
      console.error('Error removing from cart:', error)
      throw error
    }
  },

  /**
   * Clear entire cart
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Empty cart
   */
  clearCart: async (userId) => {
    try {
      const response = await apiClient.delete(`/cart/${userId}`)
      return response.data || response
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  },

  /**
   * Sync local cart with server
   * Useful when user logs in and has items in localStorage
   * @param {string} userId - User ID
   * @param {Array} localCartItems - Cart items from localStorage
   * @returns {Promise<Object>} Merged cart
   */
  syncCart: async (userId, localCartItems) => {
    try {
      const response = await apiClient.post('/cart/sync', {
        userId,
        items: localCartItems,
      })
      return response.data || response
    } catch (error) {
      console.error('Error syncing cart:', error)
      throw error
    }
  },
}

export default cartService
