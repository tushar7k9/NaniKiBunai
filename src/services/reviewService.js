/**
 * Review Service
 *
 * Handles all review-related operations with Supabase backend
 * Works with reviews table
 */

import { supabase } from '../lib/supabase'

export const reviewService = {
  /**
   * Get all approved reviews for a product
   * @param {number} productId - Product ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit results
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.sortBy - Sort by field (rating, created_at, helpful_count)
   * @param {string} options.sortOrder - Sort order (asc, desc)
   * @returns {Promise<Object>} Reviews data with user info
   */
  getProductReviews: async (productId, options = {}) => {
    try {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)

      // Apply sorting
      const sortBy = options.sortBy || 'created_at'
      const sortOrder = options.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        )
      }

      const { data: reviews, error } = await query

      if (error) {
        console.error('Error fetching product reviews:', error)
        throw error
      }

      console.log('Reviews:', reviews)

      return reviews || []
    } catch (error) {
      console.error('Error in getProductReviews:', error)
      throw error
    }
  },

  /**
   * Get review statistics for a product
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Review statistics
   */
  getProductReviewStats: async (productId) => {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating, is_verified_purchase')
        .eq('product_id', productId)
        .eq('is_approved', true)

      if (error) {
        console.error('Error fetching review stats:', error)
        throw error
      }

      if (!reviews || reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          verifiedPurchases: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        }
      }

      const totalReviews = reviews.length
      const averageRating =
        reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      const verifiedPurchases = reviews.filter(
        (r) => r.is_verified_purchase
      ).length

      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      reviews.forEach((review) => {
        ratingDistribution[review.rating]++
      })

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        verifiedPurchases,
        ratingDistribution,
      }
    } catch (error) {
      console.error('Error in getProductReviewStats:', error)
      throw error
    }
  },

  /**
   * Check if user has purchased the product and can leave a verified review
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Purchase status and order_id
   */
  checkUserPurchase: async (productId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { hasPurchased: false, orderId: null }
      }

      // Check if user has a completed/delivered order with this product
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(
          `
          order_id,
          orders!inner(
            id,
            user_id,
            status
          )
        `
        )
        .eq('product_id', productId)

      if (error) {
        console.error('Error checking user purchase:', error)
        throw error
      }

      // Find an order that belongs to this user and is delivered/completed
      const validOrder = orderItems?.find(
        (item) =>
          item.orders.user_id === user.id &&
          ['delivered', 'completed', 'confirmed'].includes(item.orders.status)
      )

      return {
        hasPurchased: !!validOrder,
        orderId: validOrder?.order_id || null,
      }
    } catch (error) {
      console.error('Error in checkUserPurchase:', error)
      throw error
    }
  },

  /**
   * Check if user has already reviewed this product
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Existing review if any
   */
  getUserReview: async (productId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return null
      }

      const { data: review, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user review:', error)
        throw error
      }

      return review
    } catch (error) {
      console.error('Error in getUserReview:', error)
      throw error
    }
  },

  /**
   * Create a new review
   * @param {Object} reviewData - Review information
   * @param {number} reviewData.productId - Product ID
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.title - Review title (optional)
   * @param {string} reviewData.reviewText - Review text (optional)
   * @param {Array} reviewData.images - Review images (optional)
   * @returns {Promise<Object>} Created review
   */
  createReview: async (reviewData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User must be logged in to create a review')
      }

      // Check if user has purchased the product
      const { hasPurchased, orderId } = await reviewService.checkUserPurchase(
        reviewData.productId
      )

      // Check if user has already reviewed this product
      const existingReview = await reviewService.getUserReview(
        reviewData.productId
      )
      if (existingReview) {
        throw new Error('You have already reviewed this product')
      }

      // Get user's display name from metadata
      const userName = user.user_metadata?.firstName || user.email?.split('@')[0] || 'Anonymous'

      const review = {
        product_id: reviewData.productId,
        user_id: user.id,
        user_name: userName, // Store user name for display
        order_id: orderId,
        rating: reviewData.rating,
        title: reviewData.title || null,
        review_text: reviewData.reviewText || null,
        images: reviewData.images || [],
        is_verified_purchase: hasPurchased,
        is_approved: false, // Reviews need approval before being visible
      }

      const { data: createdReview, error } = await supabase
        .from('reviews')
        .insert([review])
        .select()
        .single()

      if (error) {
        console.error('Error creating review:', error)
        throw error
      }

      return createdReview
    } catch (error) {
      console.error('Error in createReview:', error)
      throw error
    }
  },

  /**
   * Update an existing review
   * @param {number} reviewId - Review ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated review
   */
  updateReview: async (reviewId, updateData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User must be logged in to update a review')
      }

      const update = {
        rating: updateData.rating,
        title: updateData.title || null,
        review_text: updateData.reviewText || null,
        images: updateData.images || [],
        is_approved: false, // Re-approval needed after editing
        updated_at: new Date().toISOString(),
      }

      const { data: updatedReview, error } = await supabase
        .from('reviews')
        .update(update)
        .eq('id', reviewId)
        .eq('user_id', user.id) // Ensure user owns this review
        .select()
        .single()

      if (error) {
        console.error('Error updating review:', error)
        throw error
      }

      return updatedReview
    } catch (error) {
      console.error('Error in updateReview:', error)
      throw error
    }
  },

  /**
   * Delete a review
   * @param {number} reviewId - Review ID
   * @returns {Promise<boolean>} Success status
   */
  deleteReview: async (reviewId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User must be logged in to delete a review')
      }

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id) // Ensure user owns this review

      if (error) {
        console.error('Error deleting review:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in deleteReview:', error)
      throw error
    }
  },

  /**
   * Mark a review as helpful
   * @param {number} reviewId - Review ID
   * @returns {Promise<Object>} Updated review
   */
  markReviewHelpful: async (reviewId) => {
    try {
      // Increment helpful_count
      const { data: review, error: fetchError } = await supabase
        .from('reviews')
        .select('helpful_count')
        .eq('id', reviewId)
        .single()

      if (fetchError) {
        console.error('Error fetching review:', fetchError)
        throw fetchError
      }

      const { data: updatedReview, error: updateError } = await supabase
        .from('reviews')
        .update({ helpful_count: (review.helpful_count || 0) + 1 })
        .eq('id', reviewId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating helpful count:', updateError)
        throw updateError
      }

      return updatedReview
    } catch (error) {
      console.error('Error in markReviewHelpful:', error)
      throw error
    }
  },

  /**
   * Get user's all reviews
   * @returns {Promise<Array>} Array of user's reviews
   */
  getUserReviews: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User must be logged in')
      }

      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(
          `
          *,
          products(id, name, images)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user reviews:', error)
        throw error
      }

      return reviews || []
    } catch (error) {
      console.error('Error in getUserReviews:', error)
      throw error
    }
  },

  /**
   * Get user display name from user metadata
   * Note: We store firstName in user_metadata during signup
   * This is a helper function to get display name for reviews
   * @param {string} userId - User ID
   * @returns {Promise<string>} User display name
   */
  getUserDisplayName: async (userId) => {
    try {
      // For the current user, we can get their metadata
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user && user.id === userId) {
        return user.user_metadata?.firstName || 'Anonymous'
      }

      // For other users, we can't access their auth data directly
      // Return a generic name
      return 'Customer'
    } catch (error) {
      console.error('Error getting user display name:', error)
      return 'Anonymous'
    }
  },
}

export default reviewService
