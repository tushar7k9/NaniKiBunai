/**
 * useProducts Hook
 *
 * Custom hook to access Products Context
 * Provides easy access to products data and search functionality
 *
 * Usage:
 * ```javascript
 * import { useProducts } from '../hooks/useProducts'
 *
 * function ProductsList() {
 *   const { products, loading, getProductById } = useProducts()
 *
 *   if (loading) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       {products.map(product => (
 *         <ProductCard key={product.id} product={product} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */

import { useContext } from 'react'
import { ProductsContext } from '../contexts/ProductsContext'

export const useProducts = () => {
  const context = useContext(ProductsContext)

  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider')
  }

  return context
}

export default useProducts
