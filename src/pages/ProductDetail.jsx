import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHeart, FiShoppingBag, FiChevronLeft, FiChevronRight, FiStar, FiEdit3, FiThumbsUp, FiTruck, FiShield, FiRefreshCw, FiX, FiMaximize2 } from 'react-icons/fi'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../hooks/useCart'
import { useFavorites } from '../hooks/useFavorites'
import { useAuth } from '../hooks/useAuth'
import { reviewService } from '../services/reviewService'
import ReviewModal from '../components/ReviewModal'
import { useFlyToCart } from '../components/FlyToCart'
import './ProductDetail.css'

/* ─── Size Chart Data ─── */
const sizeChartData = {
  scarves: {
    label: 'Scarves',
    headers: ['Size', 'Length', 'Width'],
    rows: [
      ['S', '60"', '6"'],
      ['M', '70"', '8"'],
      ['L', '80"', '10"'],
      ['XL', '90"', '12"'],
      ['XXL', '100"', '14"'],
    ]
  },
  sweaters: {
    label: 'Sweaters & Cardigans',
    headers: ['Size', 'Chest', 'Length', 'Sleeve'],
    rows: [
      ['S', '34-36"', '25"', '32"'],
      ['M', '38-40"', '26"', '33"'],
      ['L', '42-44"', '27"', '34"'],
      ['XL', '46-48"', '28"', '35"'],
      ['XXL', '50-52"', '29"', '36"'],
    ]
  },
  hats: {
    label: 'Hats & Beanies',
    headers: ['Size', 'Head Circumference'],
    rows: [
      ['S', '20-21"'],
      ['M', '21.5-22.5"'],
      ['L', '23-24"'],
      ['XL', '24.5-25.5"'],
      ['XXL', '26-27"'],
    ]
  },
  gloves: {
    label: 'Gloves & Mittens',
    headers: ['Size', 'Palm Width', 'Length'],
    rows: [
      ['S', '3"', '7"'],
      ['M', '3.5"', '7.5"'],
      ['L', '4"', '8"'],
      ['XL', '4.5"', '8.5"'],
      ['XXL', '5"', '9"'],
    ]
  },
  blankets: {
    label: 'Blankets',
    headers: ['Size', 'Dimensions'],
    rows: [
      ['S', '40" x 50"'],
      ['M', '50" x 60"'],
      ['L', '60" x 80"'],
      ['XL', '70" x 90"'],
      ['XXL', '80" x 100"'],
    ]
  },
  socks: {
    label: 'Socks',
    headers: ['Size', 'Foot Length', 'US Shoe'],
    rows: [
      ['S', '8.5-9"', '5-7'],
      ['M', '9.5-10"', '7.5-9'],
      ['L', '10.5-11"', '9.5-11'],
      ['XL', '11.5-12"', '11.5-13'],
      ['XXL', '12.5-13"', '13.5-15'],
    ]
  },
  baby: {
    label: 'Baby Items',
    headers: ['Size', 'Age Range', 'Weight'],
    rows: [
      ['S', '0-3 months', 'Up to 12 lbs'],
      ['M', '3-6 months', '12-17 lbs'],
      ['L', '6-12 months', '17-22 lbs'],
      ['XL', '12-18 months', '22-28 lbs'],
      ['XXL', '18-24 months', '28-33 lbs'],
    ]
  },
  accessories: {
    label: 'Accessories',
    headers: ['Size', 'Dimensions'],
    rows: [
      ['S', 'Small / Compact'],
      ['M', 'Medium / Standard'],
      ['L', 'Large / Oversized'],
      ['XL', 'Extra Large'],
      ['XXL', 'XXL'],
    ]
  },
}

/* ─── Custom Measurement Fields by Category ─── */
const customMeasurementFields = {
  scarves: [
    { key: 'length', label: 'Desired Length', unit: 'inches', placeholder: '70' },
    { key: 'width', label: 'Desired Width', unit: 'inches', placeholder: '8' },
  ],
  sweaters: [
    { key: 'chest', label: 'Chest', unit: 'inches', placeholder: '40' },
    { key: 'length', label: 'Length', unit: 'inches', placeholder: '26' },
    { key: 'sleeve', label: 'Sleeve', unit: 'inches', placeholder: '33' },
  ],
  hats: [
    { key: 'circumference', label: 'Head Circumference', unit: 'inches', placeholder: '22' },
  ],
  gloves: [
    { key: 'palmWidth', label: 'Palm Width', unit: 'inches', placeholder: '3.5' },
    { key: 'handLength', label: 'Hand Length', unit: 'inches', placeholder: '7.5' },
  ],
  blankets: [
    { key: 'width', label: 'Width', unit: 'inches', placeholder: '60' },
    { key: 'height', label: 'Height', unit: 'inches', placeholder: '80' },
  ],
  socks: [
    { key: 'footLength', label: 'Foot Length', unit: 'inches', placeholder: '10' },
    { key: 'shoeSize', label: 'Shoe Size (US)', unit: '', placeholder: '9' },
  ],
  baby: [
    { key: 'ageMonths', label: 'Age', unit: 'months', placeholder: '6' },
    { key: 'weight', label: 'Weight', unit: 'lbs', placeholder: '17' },
  ],
  accessories: [
    { key: 'notes', label: 'Size Notes', unit: '', placeholder: 'Describe your preferred size' },
  ],
}

/* ─── Size Chart Modal ─── */
const SizeChartModal = ({ isOpen, onClose, category }) => {
  const chart = sizeChartData[category] || sizeChartData.accessories

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="sc-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="sc-modal"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sc-header">
              <div>
                <h3 className="sc-title">Size Chart</h3>
                <span className="sc-subtitle">{chart.label}</span>
              </div>
              <button className="sc-close" onClick={onClose}><FiX /></button>
            </div>

            <div className="sc-table-wrap">
              <table className="sc-table">
                <thead>
                  <tr>
                    {chart.headers.map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {chart.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className={j === 0 ? 'sc-size-cell' : ''}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="sc-note">
              All measurements are approximate. Handcrafted items may vary slightly.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const { products, loading: productsLoading, getProductById } = useProducts()
  const { addToCart } = useCart()
  const { favorites, toggleFavorite } = useFavorites()
  const { isAuthenticated } = useAuth()

  const product = getProductById(id)
  const isFavorite = favorites.includes(parseInt(id))

  // Review state
  const [productReviews, setProductReviews] = useState([])
  const [reviewStats, setReviewStats] = useState(null)
  const [userReview, setUserReview] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [votedReviews, setVotedReviews] = useState([])

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [isCustomSize, setIsCustomSize] = useState(false)
  const [customMeasurements, setCustomMeasurements] = useState({})
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false)
  const mainImageRef = useRef(null)
  const { fly } = useFlyToCart()

  // Set default size when product loads
  useEffect(() => {
    if (product?.sizes?.length > 0 && !selectedSize) {
      setSelectedSize(product.sizes[0])
    }
  }, [product, selectedSize])

  // Fetch reviews
  useEffect(() => {
    if (product) {
      fetchReviews()
      if (isAuthenticated) fetchUserReview()
      setVotedReviews(reviewService.getVotedReviews())
    }
  }, [product, isAuthenticated])

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true)
      const [reviews, stats] = await Promise.all([
        reviewService.getProductReviews(product.id),
        reviewService.getProductReviewStats(product.id),
      ])
      setProductReviews(reviews)
      setReviewStats(stats)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const fetchUserReview = async () => {
    try {
      const review = await reviewService.getUserReview(product.id)
      setUserReview(review)
    } catch (error) {
      console.error('Error fetching user review:', error)
    }
  }

  const handleReviewModalClose = (success) => {
    setIsReviewModalOpen(false)
    if (success) {
      fetchReviews()
      if (isAuthenticated) fetchUserReview()
    }
  }

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      alert('Please log in to write a review')
      navigate('/login')
      return
    }
    setIsReviewModalOpen(true)
  }

  const handleMarkHelpful = async (reviewId) => {
    try {
      const result = await reviewService.toggleHelpfulVote(reviewId)
      setProductReviews((prev) =>
        prev.map((r) => r.id === reviewId ? { ...r, helpful_count: result.newCount } : r)
      )
      setVotedReviews(reviewService.getVotedReviews())
    } catch (error) {
      console.error('Error toggling helpful vote:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const nextImage = () => setCurrentImageIndex((p) => (p + 1) % product.images.length)
  const prevImage = () => setCurrentImageIndex((p) => p === 0 ? product.images.length - 1 : p - 1)

  const handleAddToCart = () => {
    // Trigger fly animation
    if (mainImageRef.current) {
      const rect = mainImageRef.current.getBoundingClientRect()
      fly(product.images[currentImageIndex], rect)
    }

    const sizeValue = isCustomSize
      ? `Custom (${Object.entries(customMeasurements).filter(([,v]) => v).map(([k,v]) => {
          const field = (customMeasurementFields[product.category] || []).find(f => f.key === k)
          return `${field?.label || k}: ${v}${field?.unit ? ' ' + field.unit : ''}`
        }).join(', ')})`
      : (selectedSize || product.sizes?.[0] || 'S')

    addToCart({
      ...product,
      quantity: 1,
      selectedColor: product.colors[selectedColor],
      selectedSize: sizeValue
    })
  }

  const renderStars = (rating) => (
    [...Array(5)].map((_, i) => (
      <FiStar key={i} className={i < Math.floor(rating) ? 'star filled' : 'star'} />
    ))
  )

  const isOutOfStock = product?.stock_quantity === 0
  const isLowStock = product?.stock_quantity !== undefined
    && product?.stock_quantity <= (product?.low_stock_threshold || 10)
    && product?.stock_quantity > 0

  // ── Loading ──
  if (productsLoading) {
    return (
      <div className="pd-page">
        <div className="pd-layout">
          <div className="pd-gallery">
            <div className="skeleton pd-skeleton-main" />
            <div className="pd-thumbs">
              {[0,1,2].map(i => <div key={i} className="skeleton pd-skeleton-thumb" />)}
            </div>
          </div>
          <div className="pd-info">
            <div className="skeleton" style={{ height: 14, width: 80, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 36, width: '70%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 28, width: 100, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 80, marginBottom: 24 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {[0,1,2].map(i => <div key={i} className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="pd-not-found">
        <h2>Product not found</h2>
        <p>The product you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/products')}>Browse Collection</button>
      </div>
    )
  }

  return (
    <div className="pd-page">

      {/* Breadcrumb */}
      <nav className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span className="pd-breadcrumb__sep">/</span>
        <Link to="/products">Products</Link>
        <span className="pd-breadcrumb__sep">/</span>
        <span className="pd-breadcrumb__current">{product.name}</span>
      </nav>

      {/* ── Main Layout ── */}
      <div className="pd-layout">

        {/* Gallery */}
        <motion.div
          className="pd-gallery"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="pd-main-image" ref={mainImageRef}>
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={product.images[currentImageIndex]}
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>

            {product.images.length > 1 && (
              <>
                <button className="pd-gallery-btn pd-gallery-btn--prev" onClick={prevImage}>
                  <FiChevronLeft />
                </button>
                <button className="pd-gallery-btn pd-gallery-btn--next" onClick={nextImage}>
                  <FiChevronRight />
                </button>
              </>
            )}

            <motion.button
              className={`pd-fav-btn${isFavorite ? ' active' : ''}`}
              onClick={() => toggleFavorite(parseInt(id))}
              whileTap={{ scale: 0.85 }}
            >
              <FiHeart />
            </motion.button>

            {isOutOfStock && (
              <div className="pd-sold-out">Sold Out</div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="pd-thumbs">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`pd-thumb${i === currentImageIndex ? ' active' : ''}`}
                  onClick={() => setCurrentImageIndex(i)}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div
          className="pd-info"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Category + Handcrafted label */}
          <div className="pd-info__top">
            <span className="pd-category">{product.category}</span>
            <span className="pd-handcrafted">Handcrafted</span>
          </div>

          <h1 className="pd-title">{product.name}</h1>

          {/* Rating */}
          {!reviewsLoading && reviewStats && reviewStats.averageRating > 0 && (
            <div className="pd-rating">
              <div className="pd-rating__stars">{renderStars(reviewStats.averageRating)}</div>
              <span className="pd-rating__text">
                {reviewStats.averageRating}
                {reviewStats.totalReviews > 0 && ` (${reviewStats.totalReviews})`}
              </span>
            </div>
          )}

          <div className="pd-price">&#8377;{product.price}</div>

          {/* Stock */}
          {isLowStock && (
            <span className="pd-low-stock">Only {product.stock_quantity} left in stock</span>
          )}
          {isOutOfStock && (
            <span className="pd-out-of-stock">Currently unavailable</span>
          )}

          {/* Description */}
          <p className="pd-description">{product.fullDescription || product.description}</p>

          {/* Stitch divider */}
          <div className="pd-stitch" />

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="pd-option-group">
              <h3 className="pd-option-label">Color</h3>
              <div className="pd-colors">
                {product.colors.map((color, i) => (
                  <button
                    key={i}
                    className={`pd-color-dot${i === selectedColor ? ' active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="pd-option-group">
              <div className="pd-size-header">
                <h3 className="pd-option-label">Size</h3>
                <button
                  className="pd-size-chart-link"
                  onClick={() => setIsSizeChartOpen(true)}
                >
                  <FiMaximize2 /> Size Chart
                </button>
              </div>
              <div className="pd-sizes">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`pd-size-btn${!isCustomSize && selectedSize === size ? ' active' : ''}`}
                    onClick={() => { setSelectedSize(size); setIsCustomSize(false) }}
                  >
                    {size}
                  </button>
                ))}
                <button
                  className={`pd-size-btn pd-size-btn--custom${isCustomSize ? ' active' : ''}`}
                  onClick={() => setIsCustomSize(!isCustomSize)}
                >
                  Custom
                </button>
              </div>

              {/* Custom measurement fields — CSS grid-rows transition */}
              <div className={`pd-custom-size${isCustomSize ? ' open' : ''}`}>
                <div className="pd-custom-size__inner">
                  <p className="pd-custom-size__hint">
                    Share your measurements and we'll handcraft it to fit you perfectly.
                  </p>
                  <div className="pd-custom-size__fields">
                    {(customMeasurementFields[product.category] || customMeasurementFields.accessories).map((field) => (
                      <div key={field.key} className="pd-custom-size__field">
                        <label>{field.label}</label>
                        <div className="pd-custom-size__input-wrap">
                          <input
                            type="text"
                            placeholder={field.placeholder}
                            value={customMeasurements[field.key] || ''}
                            onChange={(e) => setCustomMeasurements(prev => ({
                              ...prev, [field.key]: e.target.value
                            }))}
                          />
                          {field.unit && <span className="pd-custom-size__unit">{field.unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add to Bag */}
          <motion.button
            className="pd-add-to-bag"
            onClick={handleAddToCart}
            whileHover={!isOutOfStock ? { scale: 1.01 } : {}}
            whileTap={!isOutOfStock ? { scale: 0.99 } : {}}
            disabled={isOutOfStock}
          >
            <FiShoppingBag />
            {isOutOfStock ? 'Out of Stock' : `Add to Bag — ₹${product.price}`}
          </motion.button>

          {/* Trust signals */}
          <div className="pd-trust">
            <div className="pd-trust__item">
              <FiTruck />
              <span>Free shipping over ₹500</span>
            </div>
            <div className="pd-trust__item">
              <FiShield />
              <span>Handcrafted quality</span>
            </div>
            <div className="pd-trust__item">
              <FiRefreshCw />
              <span>Easy returns</span>
            </div>
          </div>

          {/* Stitch divider */}
          <div className="pd-stitch" />

          {/* Product Details accordion-style */}
          <div className="pd-details">
            {(product.materials || []).length > 0 && (
              <div className="pd-detail-row">
                <span className="pd-detail-key">Materials</span>
                <span className="pd-detail-val">{product.materials.join(', ')}</span>
              </div>
            )}
            {product.dimensions && (
              <div className="pd-detail-row">
                <span className="pd-detail-key">Dimensions</span>
                <span className="pd-detail-val">{product.dimensions}</span>
              </div>
            )}
            {product.weight && (
              <div className="pd-detail-row">
                <span className="pd-detail-key">Weight</span>
                <span className="pd-detail-val">{product.weight}</span>
              </div>
            )}
            {product.careInstructions && (
              <div className="pd-detail-row">
                <span className="pd-detail-key">Care</span>
                <span className="pd-detail-val">{product.careInstructions}</span>
              </div>
            )}
          </div>

          {/* ── Reviews Section (inside right column) ── */}
          <div className="pd-stitch" />
          <motion.section
            className="pd-reviews"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="pd-reviews__header">
              <div>
                <h2>Reviews</h2>
                {!reviewsLoading && reviewStats && reviewStats.totalReviews > 0 && (
                  <span className="pd-reviews__header-count">
                    {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {reviewStats && reviewStats.totalReviews > 0 && !userReview && (
                <button className="pd-write-review-btn" onClick={handleWriteReview}>
                  <FiEdit3 /> Write a Review
                </button>
              )}
            </div>

            {reviewsLoading ? (
              <div className="pd-reviews-loading">
                {[0, 1, 2].map(i => (
                  <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 10 }} />
                ))}
              </div>
            ) : reviewStats && reviewStats.totalReviews > 0 ? (
              <>
                {/* Summary */}
                <div className="pd-reviews__summary">
                  <div className="pd-reviews__overview">
                    <span className="pd-reviews__big-num">{reviewStats.averageRating}</span>
                    <div className="pd-reviews__overview-right">
                      <div className="pd-reviews__stars-row">{renderStars(reviewStats.averageRating)}</div>
                      <span className="pd-reviews__count-text">out of 5</span>
                    </div>
                  </div>

                  <div className="pd-reviews__bars">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewStats.ratingDistribution[star]
                      const pct = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0
                      return (
                        <div key={star} className="pd-bar-row">
                          <span className="pd-bar-label">{star}</span>
                          <FiStar className="pd-bar-star-icon" />
                          <div className="pd-bar-track">
                            <motion.div
                              className="pd-bar-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: (5 - star) * 0.08 }}
                            />
                          </div>
                          <span className="pd-bar-count">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Review List */}
                <div className="pd-reviews__list">
                  {productReviews.map((review, i) => (
                    <motion.div
                      key={review.id}
                      className="pd-review-card"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.35 }}
                    >
                      <div className="pd-review-card__top">
                        <div className="pd-review-card__author-row">
                          <span className="pd-review-author">{review.user_name || 'Anonymous'}</span>
                          {review.is_verified_purchase && (
                            <span className="pd-review-verified">Verified</span>
                          )}
                          <span className="pd-review-date">{formatDate(review.created_at)}</span>
                        </div>
                        <div className="pd-review-stars">{renderStars(review.rating)}</div>
                      </div>

                      {review.title && <h4 className="pd-review-title">{review.title}</h4>}
                      {review.review_text && <p className="pd-review-text">{review.review_text}</p>}

                      {review.images && review.images.length > 0 && (
                        <div className="pd-review-images">
                          {review.images.map((img, idx) => (
                            <img key={idx} src={img} alt={`Review ${idx + 1}`} />
                          ))}
                        </div>
                      )}

                      <div className="pd-review-card__footer">
                        <button
                          className={`pd-helpful-btn${votedReviews.includes(review.id) ? ' voted' : ''}`}
                          onClick={() => handleMarkHelpful(review.id)}
                        >
                          <FiThumbsUp /> Helpful ({review.helpful_count || 0})
                        </button>

                        {userReview && userReview.id === review.id && (
                          <button className="pd-edit-btn" onClick={handleWriteReview}>
                            <FiEdit3 /> Edit
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="pd-no-reviews">
                <div className="pd-no-reviews__icon">
                  <FiStar />
                </div>
                <h3>No reviews yet</h3>
                <p>Be the first to share your experience with this piece.</p>
                <button className="pd-write-review-btn" onClick={handleWriteReview}>
                  <FiEdit3 /> Write a Review
                </button>
              </div>
            )}
          </motion.section>
        </motion.div>
      </div>

      {/* Size Chart Modal */}
      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        category={product.category}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={handleReviewModalClose}
        productId={product.id}
        productName={product.name}
        existingReview={userReview}
      />
    </div>
  )
}

export default ProductDetail
