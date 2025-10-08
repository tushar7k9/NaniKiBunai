/**
 * Favorites Context - Now with Supabase Integration!
 *
 * Manages favorites/wishlist state with Supabase backend
 * Requires user authentication
 * Falls back to localStorage for guest users
 */

import React, { createContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { favoritesStorage } from '../utils/localStorage'
import { useAuth } from '../hooks/useAuth'

export const FavoritesContext = createContext()

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]) // Array of product IDs
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { user, isAuthenticated } = useAuth()

  /**
   * Load favorites when user changes
   */
  useEffect(() => {
    loadFavorites()
  }, [user])

  /**
   * Save to localStorage for guest users
   */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      favoritesStorage.set(favorites)
    }
  }, [favorites, loading, isAuthenticated])

  /**
   * Load favorites from Supabase (authenticated) or localStorage (guest)
   */
  const loadFavorites = async () => {
    setLoading(true)
    setError(null)

    try {
      if (isAuthenticated && user) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', user.id)

        if (error) throw error

        // Extract product IDs
        const favoriteIds = (data || []).map(item => item.product_id)
        setFavorites(favoriteIds)
      } else {
        // Load from localStorage for guest users
        const localFavorites = favoritesStorage.get()
        setFavorites(localFavorites)
      }
    } catch (err) {
      console.error('Error loading favorites:', err)
      setError(err.message)

      // Fallback to localStorage
      const localFavorites = favoritesStorage.get()
      setFavorites(localFavorites)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Add product to favorites
   */
  const addFavorite = async (productId) => {
    try {
      if (isAuthenticated && user) {
        // Add to Supabase
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: productId,
          })

        if (error) {
          // If already exists, ignore the error
          if (!error.message.includes('duplicate')) {
            throw error
          }
        }
      }

      // Update local state
      if (!favorites.includes(productId)) {
        setFavorites([...favorites, productId])
      }

      return true
    } catch (err) {
      console.error('Error adding to favorites:', err)
      setError(err.message)

      // Add locally anyway
      if (!favorites.includes(productId)) {
        setFavorites([...favorites, productId])
      }

      return false
    }
  }

  /**
   * Remove product from favorites
   */
  const removeFavorite = async (productId) => {
    try {
      if (isAuthenticated && user) {
        // Remove from Supabase
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId)

        if (error) throw error
      }

      // Update local state
      const filtered = favorites.filter(id => id !== productId)
      setFavorites(filtered)

      return true
    } catch (err) {
      console.error('Error removing from favorites:', err)
      setError(err.message)

      // Remove locally anyway
      const filtered = favorites.filter(id => id !== productId)
      setFavorites(filtered)

      return false
    }
  }

  /**
   * Toggle favorite status
   */
  const toggleFavorite = async (productId) => {
    if (favorites.includes(productId)) {
      return await removeFavorite(productId)
    } else {
      return await addFavorite(productId)
    }
  }

  /**
   * Check if product is in favorites
   */
  const isFavorite = (productId) => {
    return favorites.includes(productId)
  }

  /**
   * Clear all favorites
   */
  const clearFavorites = async () => {
    try {
      if (isAuthenticated && user) {
        // Clear from Supabase
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)

        if (error) throw error
      }

      // Clear local state
      setFavorites([])
      return true
    } catch (err) {
      console.error('Error clearing favorites:', err)
      setError(err.message)

      // Clear locally anyway
      setFavorites([])

      return false
    }
  }

  /**
   * Sync guest favorites to user account after login
   */
  const syncGuestFavorites = async () => {
    if (!isAuthenticated || !user) return

    try {
      const guestFavorites = favoritesStorage.get()

      if (guestFavorites.length > 0) {
        // Add all guest favorites to user's favorites
        for (const productId of guestFavorites) {
          await addFavorite(productId)
        }

        // Clear guest favorites from localStorage
        favoritesStorage.set([])
      }
    } catch (err) {
      console.error('Error syncing guest favorites:', err)
    }
  }

  /**
   * Get count of favorites
   */
  const getFavoritesCount = () => {
    return favorites.length
  }

  const value = {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    syncGuestFavorites,
    getFavoritesCount,
    refreshFavorites: loadFavorites,
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export default FavoritesProvider
