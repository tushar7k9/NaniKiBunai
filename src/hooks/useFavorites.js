/**
 * useFavorites Hook
 *
 * Custom hook to access Favorites Context
 * Provides easy access to favorites state and operations in any component
 *
 * Usage:
 * ```javascript
 * import { useFavorites } from '../hooks/useFavorites'
 *
 * function MyComponent() {
 *   const { favorites, toggleFavorite, isFavorite } = useFavorites()
 *
 *   return (
 *     <button onClick={() => toggleFavorite(productId)}>
 *       {isFavorite(productId) ? 'Remove from favorites' : 'Add to favorites'}
 *     </button>
 *   )
 * }
 * ```
 */

import { useContext } from 'react'
import { FavoritesContext } from '../contexts/FavoritesContext'

export const useFavorites = () => {
  const context = useContext(FavoritesContext)

  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }

  return context
}

export default useFavorites
