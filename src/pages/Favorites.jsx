import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHeart, FiShoppingCart, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import './Favorites.css'

const productsData = [
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

const FavoriteCard = ({ product, addToCart, toggleFavorite, cartItem }) => {
  const navigate = useNavigate()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const isInCart = cartItem !== undefined
  const quantity = cartItem?.quantity || 1

  const nextImage = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    )
  }

  const incrementQuantity = (e) => {
    e.stopPropagation()
    const newQuantity = quantity + 1
    addToCart({ ...product, quantity: newQuantity })
  }

  const decrementQuantity = (e) => {
    e.stopPropagation()
    const newQuantity = quantity - 1
    if (newQuantity > 0) {
      addToCart({ ...product, quantity: newQuantity })
    }
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    addToCart({ ...product, quantity: 1 })
  }

  const handleCardClick = () => {
    navigate(`/product/${product.id}`)
  }

  const handleRemoveFavorite = (e) => {
    e.stopPropagation()
    toggleFavorite(product.id)
  }

  return (
    <motion.div
      className="favorite-card"
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -10 }}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Remove from Favorites button */}
      <motion.button
        className="remove-favorite-btn active"
        onClick={handleRemoveFavorite}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiHeart />
      </motion.button>

      {/* Image Carousel */}
      <div className="favorite-image-carousel">
        <img
          src={product.images[currentImageIndex]}
          alt={product.name}
          className="favorite-image"
        />

        {/* Carousel Controls */}
        {product.images.length > 1 && (
          <>
            <button className="carousel-btn prev-btn" onClick={prevImage}>
              <FiChevronLeft />
            </button>
            <button className="carousel-btn next-btn" onClick={nextImage}>
              <FiChevronRight />
            </button>

            {/* Carousel Indicators */}
            <div className="carousel-indicators">
              {product.images.map((_, index) => (
                <span
                  key={index}
                  className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex(index)
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Info */}
      <div className="favorite-info">
        <h3 className="favorite-name">{product.name}</h3>
        <p className="favorite-description">{product.description}</p>

        {/* Color palette */}
        <div className="favorite-colors">
          {product.colors.map((color, i) => (
            <motion.span
              key={i}
              className="color-dot"
              style={{ backgroundColor: color }}
              whileHover={{ scale: 1.3 }}
            />
          ))}
        </div>

        <div className="favorite-meta">
          <span className="difficulty-badge">{product.difficulty}</span>
        </div>

        <div className="favorite-footer">
          <span className="favorite-price">${product.price}</span>

          {/* Show Add to Cart button OR Quantity Controls */}
          {!isInCart ? (
            <motion.button
              className="add-to-cart-btn-fav"
              onClick={handleAddToCart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiShoppingCart /> Add to Cart
            </motion.button>
          ) : (
            <div className="quantity-selector-fav" onClick={(e) => e.stopPropagation()}>
              <motion.button
                className="quantity-btn"
                onClick={decrementQuantity}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                -
              </motion.button>
              <span className="quantity-value">{quantity}</span>
              <motion.button
                className="quantity-btn"
                onClick={incrementQuantity}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                +
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const Favorites = ({ favorites, toggleFavorite, addToCart, cart }) => {
  const navigate = useNavigate()

  const favoriteProducts = productsData.filter(product =>
    favorites.includes(product.id)
  )

  const getCartItem = (productId) => {
    return cart.find(item => item.id === productId)
  }

  return (
    <div className="favorites-page">
      {/* Hero Section */}
      <motion.section
        className="favorites-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="favorites-hero-content">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="favorites-title">
              <FiHeart className="heart-icon" />
              My Favorites
            </h1>
            <p className="favorites-subtitle">
              Your handpicked collection of cozy treasures
            </p>
          </motion.div>
        </div>
      </motion.section>

      <div className="favorites-container">
        {favoriteProducts.length === 0 ? (
          <motion.div
            className="empty-favorites"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="empty-heart-icon"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              💝
            </motion.div>
            <h2>No favorites yet</h2>
            <p>Start adding items you love to your wishlist!</p>
            <motion.button
              className="browse-products-btn"
              onClick={() => navigate('/products')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Browse Products
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div className="favorites-count">
              <span>{favoriteProducts.length} item{favoriteProducts.length !== 1 ? 's' : ''} in your wishlist</span>
            </div>

            <motion.div
              className="favorites-grid"
              layout
            >
              <AnimatePresence mode="popLayout">
                {favoriteProducts.map((product) => (
                  <FavoriteCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                    toggleFavorite={toggleFavorite}
                    cartItem={getCartItem(product.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

export default Favorites
