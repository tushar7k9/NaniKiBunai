/**
 * Cart Context - Fixed Supabase Integration!
 *
 * Manages cart state with Supabase backend
 * Requires user authentication
 * Falls back to localStorage for guest users
 */

import React, { createContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { cartStorage } from '../utils/localStorage'
import { useAuth } from '../hooks/useAuth'

export const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { user, isAuthenticated } = useAuth()
  const previousAuthState = useRef(isAuthenticated)
  /**
   * Load cart when user authentication changes
   * If user just logged in, sync guest cart first
   */
  useEffect(() => {
    const authChanged = previousAuthState.current !== isAuthenticated
    const userJustLoggedIn = authChanged && isAuthenticated

    previousAuthState.current = isAuthenticated

    const handleAuthChange = async () => {
      if (userJustLoggedIn) {
        // User just logged in - check if there's a guest cart to sync
        const guestCart = cartStorage.get()
        if (guestCart && guestCart.length > 0) {
          // Guest cart found - will sync after loadCart
          // Don't call syncGuestCart here, it will be handled after loadCart
        }
        await loadCart()
      } else if (authChanged || loading) {
        // Other auth changes or initial load
        await loadCart()
      }
    }

    handleAuthChange()
  }, [user, isAuthenticated])

  /**
   * Save to localStorage ONLY for guest users
   * Don't save if authenticated (data is in Supabase)
   */
  useEffect(() => {
    if (!loading && !isAuthenticated && cart.length >= 0) {
      cartStorage.set(cart)
    }
  }, [cart, loading, isAuthenticated])

  /**
   * Load cart from Supabase (authenticated) or localStorage (guest)
   */
  const loadCart = async () => {
    setLoading(true)
    setError(null)

    try {
      if (isAuthenticated && user) {
        // Check if there's a guest cart to merge BEFORE clearing
        const guestCart = cartStorage.get()
        const hasGuestCart = guestCart && guestCart.length > 0

        // Load from Supabase
        const { data, error } = await supabase
          .from('cart_items')
          .select(`
            *,
            products (*)
          `)
          .eq('user_id', user.id)

        if (error) throw error

        // Transform data to match cart format
        const cartItems = (data || []).map(item => ({
          id: item.product_id,
          ...item.products,
          quantity: item.quantity,
          selected_color: item.selected_color,
          selected_size: item.selected_size,
          cart_item_id: item.id, // Keep track of cart_items table ID
        }))

        setCart(cartItems)

        // If there was a guest cart, merge it now
        if (hasGuestCart) {
          // Guest cart detected, starting merge
          // Trigger merge in next tick to ensure cart is set
          setTimeout(() => {
            syncGuestCart()
          }, 0)
        } else {
          // Clear localStorage cart for authenticated users (only if no guest cart)
          cartStorage.set([])
        }
      } else {
        // Load from localStorage for guest users
        const localCart = cartStorage.get()
        setCart(localCart || [])
      }
    } catch (err) {
      console.error('Error loading cart:', err)
      setError(err.message)

      // Fallback to localStorage
      const localCart = cartStorage.get()
      setCart(localCart || [])
    } finally {
      setLoading(false)
    }
  }

  /**
   * Add item to cart
   */
  const addToCart = async (product) => {
    try {
      if (isAuthenticated && user) {
        // Check if item already exists in cart
        const existingItem = cart.find(item =>
          item.id === product.id &&
          item.selected_color === (product.selectedColor || product.selected_color) &&
          item.selected_size === (product.selectedSize || product.selected_size)
        )

        if (existingItem) {
          // Update quantity instead of adding duplicate
          // Always increment by 1, not by product.quantity
          const newQuantity = existingItem.quantity + 1
          return await updateQuantity(
            existingItem.id,
            newQuantity,
            existingItem.selected_color,
            existingItem.selected_size,
            existingItem.cart_item_id
          )
        }

        // Add new item to Supabase
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: product.quantity || 1,
            selected_color: product.selectedColor || product.selected_color || null,
            selected_size: product.selectedSize || product.selected_size || null,
            price_snapshot: product.price,
          })
          .select(`
            *,
            products (*)
          `)
          .single()

        if (error) throw error

        // Add to local state immediately (don't reload entire cart)
        const newCartItem = {
          id: data.product_id,
          ...data.products,
          quantity: data.quantity,
          selected_color: data.selected_color,
          selected_size: data.selected_size,
          cart_item_id: data.id,
        }

        setCart(prevCart => [...prevCart, newCartItem])
      } else {
        // Guest user - add to localStorage
        const existingIndex = cart.findIndex(item =>
          item.id === product.id &&
          item.selected_color === (product.selectedColor || product.selected_color) &&
          item.selected_size === (product.selectedSize || product.selected_size)
        )
        if (existingIndex !== -1) {
          // Update existing item
          // Always increment by 1, not by product.quantity
          const updated = [...cart]
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1
          }
          setCart(updated)
        } else {
          // Add new item with proper property names for localStorage
          const newItem = {
            ...product,
            quantity: product.quantity || 1,
            selected_color: product.selectedColor || product.selected_color || null,
            selected_size: product.selectedSize || product.selected_size || null
          }
          setCart(prevCart => [...prevCart, newItem])
        }
      }

      return true
    } catch (err) {
      console.error('Error adding to cart:', err)
      setError(err.message)
      return false
    }
  }

  /**
   * Update item quantity
   * @param {number} productId - Product ID
   * @param {number} quantity - New quantity
   * @param {string} selectedColor - Selected color variant
   * @param {string} selectedSize - Selected size variant
   * @param {number} cartItemId - Optional cart_items table ID (for authenticated users)
   */
  const updateQuantity = async (productId, quantity, selectedColor, selectedSize, cartItemId = null) => {
    try {
      // Validate quantity
      if (quantity < 1) {
        return await removeFromCart(productId, cartItemId)
      }

      // Find the specific cart item by product ID, color, and size
      const existingIndex = cart.findIndex(
        (item) =>
          item.id === productId &&
          item.selected_color === selectedColor &&
          item.selected_size === selectedSize
      )

      // Guard: Item must exist in cart
      if (existingIndex === -1) {
        console.error('Cart item not found:', { productId, selectedColor, selectedSize })
        setError('Item not found in cart')
        return false
      }

      const cartItem = cart[existingIndex]

      // Update in Supabase if authenticated
      if (isAuthenticated && user) {
        const itemId = cartItemId || cartItem.cart_item_id

        if (itemId) {
          const { error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', itemId)

          if (error) throw error
        } else {
          console.warn('No cart_item_id found for authenticated user')
        }
      }

      // Update local state
      const updated = [...cart]
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: quantity,
      }
      setCart(updated)

      return true
    } catch (err) {
      console.error('Error updating quantity:', err)
      setError(err.message)

      // Fallback: Try to update locally anyway using the same matching criteria
      const existingIndex = cart.findIndex(
        (item) =>
          item.id === productId &&
          item.selected_color === selectedColor &&
          item.selected_size === selectedSize
      )

      if (existingIndex !== -1) {
        const updated = [...cart]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: quantity,
        }
        setCart(updated)
      }

      return false
    }
  }

  /**
   * Remove item from cart
   * @param {number} productId - Product ID
   * @param {string} selectedColor - Selected color variant
   * @param {string} selectedSize - Selected size variant
   * @param {number} cartItemId - Optional cart_items table ID (for authenticated users)
   */
  const removeFromCart = async (productId, selectedColor = null, selectedSize = null, cartItemId = null) => {
    try {
      if (isAuthenticated && user) {
        // Find the specific cart item by product ID, color, and size
        const cartItem = cart.find(
          item =>
            item.id === productId &&
            item.selected_color === selectedColor &&
            item.selected_size === selectedSize
        )
        const itemId = cartItemId || cartItem?.cart_item_id

        if (itemId) {
          // Remove from Supabase
          const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', itemId)

          if (error) throw error
        }
      }

      // Update local state - remove only this specific item (matching product ID, color, and size)
      setCart(prevCart =>
        prevCart.filter(
          item =>
            !(
              item.id === productId &&
              item.selected_color === selectedColor &&
              item.selected_size === selectedSize
            )
        )
      )

      return true
    } catch (err) {
      console.error('Error removing from cart:', err)
      setError(err.message)

      // Remove locally anyway using same matching criteria
      setCart(prevCart =>
        prevCart.filter(
          item =>
            !(
              item.id === productId &&
              item.selected_color === selectedColor &&
              item.selected_size === selectedSize
            )
        )
      )

      return false
    }
  }

  /**
   * Clear entire cart
   */
  const clearCart = async () => {
    try {
      if (isAuthenticated && user) {
        // Clear from Supabase
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)

        if (error) throw error
      }

      // Clear local state
      setCart([])

      // Clear localStorage for guest users
      if (!isAuthenticated) {
        cartStorage.set([])
      }

      return true
    } catch (err) {
      console.error('Error clearing cart:', err)
      setError(err.message)

      // Clear locally anyway
      setCart([])

      return false
    }
  }

  /**
   * Sync guest cart to user account after login
   * Merges guest cart with existing user cart, combining quantities for duplicate items
   */
  const syncGuestCart = async () => {
    if (!isAuthenticated || !user) return

    try {
      const guestCart = cartStorage.get()

      if (!guestCart || guestCart.length === 0) {
        return
      }

      // Load current user's cart from Supabase
      const { data: userCartData, error: fetchError } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id)

      if (fetchError) throw fetchError

      // Transform user cart data to match cart format
      const userCart = (userCartData || []).map(item => ({
        id: item.product_id,
        ...item.products,
        quantity: item.quantity,
        selected_color: item.selected_color,
        selected_size: item.selected_size,
        cart_item_id: item.id,
      }))

      // Merge guest cart with user cart
      for (const guestItem of guestCart) {
        // Find if this exact item (product + color + size) already exists in user's cart
        const existingUserItem = userCart.find(
          userItem =>
            userItem.id === guestItem.id &&
            userItem.selected_color === (guestItem.selectedColor || guestItem.selected_color) &&
            userItem.selected_size === (guestItem.selectedSize || guestItem.selected_size)
        )

        if (existingUserItem) {
          // Item exists - update quantity by combining both
          const combinedQuantity = existingUserItem.quantity + (guestItem.quantity || 1)

          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: combinedQuantity })
            .eq('id', existingUserItem.cart_item_id)

          if (updateError) {
            console.error('Error updating merged item:', updateError)
          }
        } else {
          // Item doesn't exist - add it to user's cart
          const { error: insertError } = await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id: guestItem.id,
              quantity: guestItem.quantity || 1,
              selected_color: guestItem.selectedColor || guestItem.selected_color || null,
              selected_size: guestItem.selectedSize || guestItem.selected_size || null,
              price_snapshot: guestItem.price,
            })

          if (insertError) {
            console.error('Error adding guest item:', insertError)
          }
        }
      }

      // Clear guest cart from localStorage
      cartStorage.set([])

      // Reload the cart to reflect merged data
      await loadCart()

    } catch (err) {
      console.error('Error syncing guest cart:', err)
    }
  }

  /**
   * Get total number of items in cart
   */
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 0), 0)
  }

  /**
   * Get total price of cart
   */
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  /**
   * Get cart item by product ID
   */
  const getCartItem = (productId) => {
    return cart.find(item => item.id === productId)
  }

  /**
   * Check if product is in cart
   */
  const isInCart = (productId) => {
    return cart.some(item => item.id === productId)
  }

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    syncGuestCart,
    getTotalItems,
    getTotalPrice,
    getCartItem,
    isInCart,
    refreshCart: loadCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider
