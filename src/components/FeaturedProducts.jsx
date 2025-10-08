import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiShoppingCart, FiHeart } from 'react-icons/fi'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../hooks/useCart'
import { useFavorites } from '../hooks/useFavorites'
import './FeaturedProducts.css'

// Static featured products for fallback
const STATIC_FEATURED_PRODUCTS = [
  {
    id: 1,
    name: 'Classic Wool Sweater',
    price: 89.99,
    image: 'sweater',
    category: 'Sweaters',
    description: 'Soft merino wool, handknitted with care'
  },
  {
    id: 2,
    name: 'Cozy Winter Socks',
    price: 24.99,
    image: 'socks',
    category: 'Socks',
    description: 'Warm and comfortable for cold days'
  },
  {
    id: 3,
    name: 'Elegant Cashmere Scarf',
    price: 69.99,
    image: 'scarf',
    category: 'Scarves',
    description: 'Luxurious cashmere blend'
  },
  {
    id: 4,
    name: 'Premium Knit Gloves',
    price: 34.99,
    image: 'gloves',
    category: 'Gloves',
    description: 'Touchscreen compatible wool gloves'
  },
  {
    id: 5,
    name: 'Cable Knit Cardigan',
    price: 109.99,
    image: 'cardigan',
    category: 'Sweaters',
    description: 'Traditional cable pattern, modern fit'
  },
  {
    id: 6,
    name: 'Alpaca Wool Beanie',
    price: 39.99,
    image: 'beanie',
    category: 'Other',
    description: 'Soft alpaca blend for ultimate warmth'
  }
]

const FeaturedProducts = () => {
  const navigate = useNavigate()

  // Use context hooks
  const { products: allProducts, loading: productsLoading } = useProducts()
  const { addToCart, getCartItem } = useCart()
  const { favorites, toggleFavorite } = useFavorites()

  // Get featured products (first 6 products from Supabase, or static fallback)
  const featuredProducts = useMemo(() => {
    if (allProducts.length > 0) {
      return allProducts.slice(0, 6)
    }
    return STATIC_FEATURED_PRODUCTS
  }, [allProducts])

  // Debug logging
  React.useEffect(() => {
    console.log('FeaturedProducts - All Products:', allProducts)
    console.log('FeaturedProducts - Featured Products:', featuredProducts)
  }, [allProducts, featuredProducts])

  return (
    <section className="featured-products">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Featured Products</h2>
          <p>Handpicked selections from our artisan collection</p>
        </motion.div>

        {productsLoading ? (
          <div className="loading-state">
            <p>Loading featured products from Supabase...</p>
          </div>
        ) : (
          <div className="products-grid">
            {featuredProducts.map((product, index) => {
              const isFavorite = favorites.includes(product.id)
              const cartItem = getCartItem(product.id)

              return (
                <motion.div
                  key={product.id}
                  className="product-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="product-image-wrapper">
                    <div className={`product-image ${product.image || 'default'}`}>
                      <motion.div
                        className="product-overlay"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.button
                          className={`icon-btn ${isFavorite ? 'active' : ''}`}
                          onClick={() => toggleFavorite(product.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FiHeart />
                        </motion.button>
                      </motion.div>
                    </div>
                    <span className="product-badge">{product.category}</span>
                  </div>

                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <div className="product-footer">
                      <span className="product-price">${product.price}</span>
                      <motion.button
                        className="add-to-cart-btn"
                        onClick={() => addToCart({ ...product, quantity: 1 })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiShoppingCart />
                        Add to Cart
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}


        <motion.div
          className="view-all-container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.button
            className="btn-primary"
            onClick={() => navigate('/products')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View All Products
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturedProducts
