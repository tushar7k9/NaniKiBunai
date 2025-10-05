import React from 'react'
import { motion } from 'framer-motion'
import { FiShoppingCart, FiHeart } from 'react-icons/fi'
import './FeaturedProducts.css'

const products = [
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

const FeaturedProducts = ({ addToCart }) => {
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

        <div className="products-grid">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              className="product-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="product-image-wrapper">
                <div className={`product-image ${product.image}`}>
                  <motion.div
                    className="product-overlay"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.button
                      className="icon-btn"
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
                    onClick={() => addToCart(product)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiShoppingCart />
                    Add to Cart
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="view-all-container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.button
            className="btn-primary"
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
