import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowRight, FiCalendar, FiStar } from 'react-icons/fi'
import './Collections.css'

const collectionsData = [
  {
    id: 1,
    name: 'Winter Warmth',
    season: 'Winter',
    description: 'Cozy essentials to keep you warm through the coldest days. Each piece knitted with extra love and thick wool.',
    emoji: '❄️',
    color: '#B0E0E6',
    itemCount: 24,
    featured: true,
    items: ['Chunky scarves', 'Thick sweaters', 'Wool socks', 'Warm mittens'],
    year: '2024',
    image: '🧣'
  },
  {
    id: 2,
    name: 'Spring Blossom',
    season: 'Spring',
    description: 'Light and airy pieces in pastel colors, perfect for those gentle spring breezes.',
    emoji: '🌸',
    color: '#FFB6C1',
    itemCount: 18,
    featured: true,
    items: ['Light cardigans', 'Cotton shawls', 'Flower brooches', 'Baby blankets'],
    year: '2024',
    image: '🌷'
  },
  {
    id: 3,
    name: 'Autumn Harvest',
    season: 'Autumn',
    description: 'Rich, earthy tones inspired by falling leaves and harvest time. Nani\'s favorite season to knit.',
    emoji: '🍂',
    color: '#DEB887',
    itemCount: 21,
    featured: false,
    items: ['Pumpkin orange scarves', 'Brown cardigans', 'Leaf-pattern throws', 'Harvest baskets'],
    year: '2024',
    image: '🍁'
  },
  {
    id: 4,
    name: 'Baby Treasures',
    season: 'All Seasons',
    description: 'Precious tiny pieces made for the littlest ones. Soft, gentle, and made with extra tender care.',
    emoji: '👶',
    color: '#F0E68C',
    itemCount: 15,
    featured: true,
    items: ['Baby booties', 'Tiny hats', 'Soft blankets', 'Cute onesies'],
    year: '2024',
    image: '🍼'
  },
  {
    id: 5,
    name: 'Home & Hearth',
    season: 'All Seasons',
    description: 'Transform your house into a home with handmade decorative pieces that warm the soul.',
    emoji: '🏡',
    color: '#DDA0DD',
    itemCount: 27,
    featured: false,
    items: ['Throw pillows', 'Table runners', 'Wall hangings', 'Tea cozies'],
    year: '2024',
    image: '🛋️'
  },
  {
    id: 6,
    name: 'Summer Breeze',
    season: 'Summer',
    description: 'Lightweight cotton and linen pieces for warm summer days and cool evenings by the sea.',
    emoji: '☀️',
    color: '#98FB98',
    itemCount: 12,
    featured: false,
    items: ['Beach bags', 'Sun hats', 'Light shawls', 'Cotton totes'],
    year: '2024',
    image: '🏖️'
  },
  {
    id: 7,
    name: 'Heritage Collection',
    season: 'All Seasons',
    description: 'Traditional patterns passed down through generations. These are the stitches that tell our family story.',
    emoji: '📜',
    color: '#E6E6FA',
    itemCount: 30,
    featured: true,
    items: ['Traditional sweaters', 'Classic patterns', 'Vintage designs', 'Family heirlooms'],
    year: 'Classic',
    image: '👵'
  },
  {
    id: 8,
    name: 'Modern Minimalist',
    season: 'All Seasons',
    description: 'Clean lines and contemporary designs meet traditional craftsmanship. Nani goes modern!',
    emoji: '✨',
    color: '#F5F5DC',
    itemCount: 16,
    featured: false,
    items: ['Simple scarves', 'Monochrome sweaters', 'Geometric patterns', 'Clean designs'],
    year: '2024',
    image: '🎨'
  }
]

const Collections = () => {
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'featured', 'seasonal'

  const filteredCollections = collectionsData.filter(collection => {
    if (filter === 'featured') return collection.featured
    if (filter === 'seasonal') return collection.season !== 'All Seasons'
    return true
  })

  return (
    <div className="collections-page">
      {/* Hero Section */}
      <motion.section
        className="collections-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="collections-hero-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="hero-badge">
            <span className="badge-emoji">🧶</span>
            <span>Handcrafted Collections</span>
          </div>
          <h1 className="collections-main-title">
            Curated with Love
          </h1>
          <p className="collections-main-subtitle">
            Each collection tells a story, woven with threads of tradition and sprinkled with modern creativity
          </p>

          {/* Removed floating elements for better performance */}
        </motion.div>
      </motion.section>

      {/* Filter Tabs */}
      <motion.div
        className="collections-filters"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="filter-tabs">
          <motion.button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            All Collections
          </motion.button>
          <motion.button
            className={`filter-tab ${filter === 'featured' ? 'active' : ''}`}
            onClick={() => setFilter('featured')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiStar /> Featured
          </motion.button>
          <motion.button
            className={`filter-tab ${filter === 'seasonal' ? 'active' : ''}`}
            onClick={() => setFilter('seasonal')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiCalendar /> Seasonal
          </motion.button>
        </div>
      </motion.div>

      {/* Collections Grid */}
      <div className="collections-container">
        <motion.div className="collections-grid" layout>
          <AnimatePresence mode="popLayout">
            {filteredCollections.map((collection, index) => (
              <motion.div
                key={collection.id}
                className="collection-card"
                style={{ '--card-color': collection.color }}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.5
                }}
                whileHover={{ y: -15 }}
                onClick={() => setSelectedCollection(collection)}
              >
                {collection.featured && (
                  <motion.div
                    className="featured-badge"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.08 + 0.3 }}
                  >
                    <FiStar /> Featured
                  </motion.div>
                )}

                <div className="collection-header">
                  <motion.div
                    className="collection-emoji-bg"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {collection.emoji}
                  </motion.div>
                  <motion.div
                    className="collection-image"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {collection.image}
                  </motion.div>
                </div>

                <div className="collection-content">
                  <div className="collection-meta">
                    <span className="collection-season">{collection.season}</span>
                    <span className="collection-year">{collection.year}</span>
                  </div>

                  <h3 className="collection-name">{collection.name}</h3>
                  <p className="collection-description">{collection.description}</p>

                  <div className="collection-items">
                    <h4>Includes:</h4>
                    <ul>
                      {collection.items.slice(0, 3).map((item, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 + 0.1 * i }}
                        >
                          {item}
                        </motion.li>
                      ))}
                      {collection.items.length > 3 && (
                        <li className="more-items">+{collection.items.length - 3} more</li>
                      )}
                    </ul>
                  </div>

                  <div className="collection-footer">
                    <span className="item-count">{collection.itemCount} items</span>
                    <motion.button
                      className="explore-btn"
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Explore <FiArrowRight />
                    </motion.button>
                  </div>
                </div>

                {/* Decorative corner */}
                <div className="card-corner"></div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modal for Collection Details */}
      <AnimatePresence>
        {selectedCollection && (
          <motion.div
            className="collection-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCollection(null)}
          >
            <motion.div
              className="collection-modal"
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              style={{ '--modal-color': selectedCollection.color }}
            >
              <button
                className="modal-close"
                onClick={() => setSelectedCollection(null)}
              >
                ✕
              </button>

              <div className="modal-header">
                <span className="modal-emoji">{selectedCollection.image}</span>
                <div>
                  <h2>{selectedCollection.name}</h2>
                  <p className="modal-season">{selectedCollection.season} • {selectedCollection.year}</p>
                </div>
              </div>

              <div className="modal-content">
                <p className="modal-description">{selectedCollection.description}</p>

                <div className="modal-items">
                  <h3>Complete Collection:</h3>
                  <div className="modal-items-grid">
                    {selectedCollection.items.map((item, i) => (
                      <motion.div
                        key={i}
                        className="modal-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <span className="item-bullet">🧶</span>
                        {item}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <motion.button
                  className="view-products-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/products'}
                >
                  View All Products <FiArrowRight />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background decorations removed for better performance and cleaner look */}
    </div>
  )
}

export default Collections
