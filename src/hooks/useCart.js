/**
 * useCart Hook
 *
 * Custom hook to access Cart Context
 * Provides easy access to cart state and operations in any component
 *
 * Usage:
 * ```javascript
 * import { useCart } from '../hooks/useCart'
 *
 * function MyComponent() {
 *   const { cart, addToCart, removeFromCart, getTotalItems } = useCart()
 *
 *   return <div>Total items: {getTotalItems()}</div>
 * }
 * ```
 */

import { useContext } from 'react'
import { CartContext } from '../contexts/CartContext'

export const useCart = () => {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}

export default useCart
