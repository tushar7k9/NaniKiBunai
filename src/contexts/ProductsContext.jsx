import React, { createContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const ProductsContext = createContext()

/**
 * Products Context Provider
 *
 * Manages product data globally
 * Now using Supabase as backend!
 *
 * Products are fetched from Supabase database
 * Falls back to static data if Supabase fails
 */

// Toggle this to true when Supabase credentials are added
const USE_SUPABASE = true

// Static product data (will be replaced by API)
const STATIC_PRODUCTS = [
  {
    id: 1,
    name: 'Cozy Winter Scarf',
    category: 'scarves',
    price: 45,
    images: [
      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400',
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400',
      'https://images.unsplash.com/photo-1606400082777-ef05f3c5cde7?w=400'
    ],
    description: 'Handmade with love and extra warmth. Perfect for chilly winter days.',
    colors: ['#FFB6C1', '#E6E6FA', '#FFE4B5'],
    difficulty: 'beginner'
  },
  {
    id: 2,
    name: 'Classic Cardigan',
    category: 'sweaters',
    price: 120,
    images: [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400'
    ],
    description: 'Nani\'s signature design, passed down generations. A timeless classic.',
    colors: ['#DEB887', '#F5DEB3', '#D2691E'],
    difficulty: 'advanced'
  },
  {
    id: 3,
    name: 'Chunky Beanie',
    category: 'hats',
    price: 35,
    images: [
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400',
      'https://images.unsplash.com/photo-1533642310407-f985136ea0b1?w=400',
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400'
    ],
    description: 'Perfect for cold mornings and warm hearts. Keeps you cozy all day.',
    colors: ['#B0E0E6', '#F0E68C', '#DDA0DD'],
    difficulty: 'beginner'
  },
  {
    id: 4,
    name: 'Wool Mittens Pair',
    category: 'gloves',
    price: 40,
    images: [
      'https://images.unsplash.com/photo-1606400082777-ef05f3c5cde7?w=400',
      'https://images.unsplash.com/photo-1544923408-75c5cef46f14?w=400',
      'https://images.unsplash.com/photo-1610979402004-dbf5eca5cbbf?w=400'
    ],
    description: 'Connected with string so you never lose them. Made from premium wool.',
    colors: ['#FF6347', '#98FB98', '#87CEEB'],
    difficulty: 'intermediate'
  },
  {
    id: 5,
    name: 'Granny Square Blanket',
    category: 'blankets',
    price: 180,
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
      'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=400'
    ],
    description: 'The coziest hug you\'ll ever receive. Hand-stitched with care.',
    colors: ['#FFB6C1', '#DDA0DD', '#F0E68C', '#98FB98'],
    difficulty: 'advanced'
  },
  {
    id: 6,
    name: 'Tea Cozy Set',
    category: 'accessories',
    price: 28,
    images: [
      'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400',
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400',
      'https://images.unsplash.com/photo-1588195538326-c5b1e5b43ce5?w=400'
    ],
    description: 'Keep your tea warm while you knit. Comes with matching coasters.',
    colors: ['#FFE4B5', '#DEB887', '#F5DEB3'],
    difficulty: 'beginner'
  },
  {
    id: 7,
    name: 'Cable Knit Sweater',
    category: 'sweaters',
    price: 140,
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400'
    ],
    description: 'Intricate cables that tell a story. A masterpiece of knitting.',
    colors: ['#F5F5DC', '#E6E6FA', '#FFE4E1'],
    difficulty: 'advanced'
  },
  {
    id: 8,
    name: 'Cozy Socks',
    category: 'socks',
    price: 22,
    images: [
      'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400',
      'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=400',
      'https://images.unsplash.com/photo-1575407686532-f4a37ecb6b56?w=400'
    ],
    description: 'Like walking on clouds made of love. Super soft and comfortable.',
    colors: ['#FFB6C1', '#98FB98', '#87CEEB'],
    difficulty: 'intermediate'
  },
  {
    id: 9,
    name: 'Striped Scarf',
    category: 'scarves',
    price: 50,
    images: [
      'https://images.unsplash.com/photo-1610628785958-603ebe9eae9a?w=400',
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400',
      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400'
    ],
    description: 'Rainbow stripes to brighten your day. Made with vibrant colors.',
    colors: ['#FF6347', '#FFD700', '#98FB98', '#87CEEB', '#DDA0DD'],
    difficulty: 'intermediate'
  },
  {
    id: 10,
    name: 'Knit Pillow Cover',
    category: 'accessories',
    price: 38,
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400'
    ],
    description: 'Add warmth to your living space. Beautifully textured design.',
    colors: ['#DEB887', '#F5DEB3', '#E6E6FA'],
    difficulty: 'beginner'
  },
  {
    id: 11,
    name: 'Baby Booties',
    category: 'baby',
    price: 25,
    images: [
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400'
    ],
    description: 'Tiny treasures for tiny feet. Soft and gentle on baby\'s skin.',
    colors: ['#FFB6C1', '#B0E0E6', '#F0E68C'],
    difficulty: 'beginner'
  },
  {
    id: 12,
    name: 'Pom-Pom Hat',
    category: 'hats',
    price: 42,
    images: [
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400',
      'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=400',
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400'
    ],
    description: 'Extra bouncy pom-pom on top. Fun and fashionable for all ages.',
    colors: ['#FF6347', '#DDA0DD', '#98FB98'],
    difficulty: 'intermediate'
  }
]

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Load products on component mount
   */
  useEffect(() => {
    loadProducts()
  }, [])

  /**
   * Load products from Supabase or static data
   * @param {boolean} silent - refresh without toggling the global loading
   *   state (used by the cart to re-check availability without flashing
   *   skeletons across the storefront)
   */
  const loadProducts = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)

    try {
      if (USE_SUPABASE) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } else {
        // Use static data
        setProducts(STATIC_PRODUCTS)
      }
    } catch (err) {
      console.error('Error loading products from Supabase:', err)
      setError(err.message)

      // Fallback to static data on error
      setProducts(STATIC_PRODUCTS)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get product by ID
   */
  const getProductById = (id) => {
    return products.find(p => p.id === parseInt(id))
  }

  /**
   * Get products by category
   */
  const getProductsByCategory = (category) => {
    if (category === 'all') return products
    return products.filter(p => p.category === category)
  }

  /**
   * Search products
   */
  const searchProducts = (query) => {
    const lowerQuery = query.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    )
  }

  const value = {
    products,
    loading,
    error,
    getProductById,
    getProductsByCategory,
    searchProducts,
    refreshProducts: loadProducts,
  }

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  )
}

export default ProductsProvider
