import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { FiHeart, FiShoppingBag, FiChevronDown, FiCheck, FiStar } from 'react-icons/fi'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../hooks/useCart'
import { useFavorites } from '../hooks/useFavorites'
import { useFlyToCart } from '../components/FlyToCart'
import './Products.css'

const categories = [
  { id: 'all', name: 'All' },
  { id: 'scarves', name: 'Scarves' },
  { id: 'sweaters', name: 'Sweaters' },
  { id: 'hats', name: 'Hats' },
  { id: 'gloves', name: 'Gloves' },
  { id: 'blankets', name: 'Blankets' },
  { id: 'socks', name: 'Socks' },
  { id: 'baby', name: 'Baby' },
  { id: 'accessories', name: 'Accessories' }
]

const sortOptions = [
  { id: 'featured', name: 'Featured' },
  { id: 'price-low', name: 'Price: Low to High' },
  { id: 'price-high', name: 'Price: High to Low' },
  { id: 'name', name: 'Name: A-Z' }
]

const storyMoments = [
  "Every piece carries the warmth of hands that made it",
  "Slow fashion, timeless craft — made to be cherished",
  "From our hands to your home, with love in every loop",
]

/* ─── Category Reveal Transition ─── */
const CategoryReveal = ({ categoryName, onComplete }) => {
  return (
    <motion.div
      className="category-reveal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onAnimationComplete={(def) => {
        // Only trigger on the exit animation completing
        if (def === 'exit') onComplete?.()
      }}
    >
      {/* Background wipe */}
      <motion.div
        className="category-reveal__bg"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Category name */}
      <motion.h2
        className="category-reveal__name"
        initial={{ opacity: 0, y: 20, letterSpacing: '0.15em' }}
        animate={{ opacity: 1, y: 0, letterSpacing: '0.25em' }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {categoryName}
      </motion.h2>

      {/* Stitch line */}
      <motion.div
        className="category-reveal__stitch"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Subtitle accent */}
      <motion.span
        className="category-reveal__accent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.3 }}
      >
        curated for you
      </motion.span>
    </motion.div>
  )
}

/* ─── Product Card ─── */
const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    setIsTouch(mq.matches)
    const handler = (e) => setIsTouch(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isTouch
}

const ProductCard = ({ product, addToCart, isFavorite, toggleFavorite, index }) => {
  const navigate = useNavigate()
  const isTouch = useIsTouchDevice()
  const [isHovered, setIsHovered] = useState(false)
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'S')
  const [justAdded, setJustAdded] = useState(false)
  const imageRef = useRef(null)
  const { fly } = useFlyToCart()

  const handleAddToCart = (e) => {
    e.stopPropagation()
    if (justAdded) return
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect()
      fly(product.images[0], rect)
    }
    addToCart({
      ...product,
      quantity: 1,
      selectedColor: product.colors[selectedColor],
      selectedSize
    })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  const handleCardClick = () => {
    navigate(`/product/${product.id}`)
  }

  const isOutOfStock = product.stock_quantity === 0
  const isLowStock = product.stock_quantity !== undefined
    && product.stock_quantity <= (product.low_stock_threshold || 10)
    && product.stock_quantity > 0
  const isFeatured = (index + 1) % 5 === 0

  return (
    <motion.article
      className={`p-card${isFeatured ? ' p-card--featured' : ''}${isOutOfStock ? ' p-card--sold-out' : ''}`}
      layout
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
        layout: { duration: 0.35, ease: [0.25, 1, 0.5, 1] }
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="p-card__image-wrap">
        <img
          ref={imageRef}
          src={product.images[0]}
          alt={product.name}
          className="p-card__img p-card__img--primary"
          loading="lazy"
        />
        {product.images.length > 1 && (
          <img
            src={product.images[1]}
            alt={`${product.name} alternate`}
            className={`p-card__img p-card__img--secondary${isHovered ? ' visible' : ''}`}
            loading="lazy"
          />
        )}

        {/* Favorite */}
        <motion.button
          className={`p-card__fav${isFavorite ? ' active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id) }}
          initial={false}
          animate={{ opacity: isTouch || isFavorite || isHovered ? 1 : 0 }}
          whileTap={{ scale: 0.85 }}
        >
          <FiHeart />
        </motion.button>

        {/* Sold Out overlay */}
        {isOutOfStock && (
          <div className="p-card__sold-out-overlay">
            <span>Sold Out</span>
          </div>
        )}

        {/* Add to Bag overlay */}
        {!isOutOfStock && (
          <motion.button
            className={`p-card__add-bag${justAdded ? ' p-card__add-bag--added' : ''}`}
            onClick={handleAddToCart}
            initial={false}
            animate={isTouch ? { y: 0, opacity: 1 } : { y: isHovered || justAdded ? 0 : '100%', opacity: isHovered || justAdded ? 1 : 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {justAdded ? (
              <>
                <FiCheck />
                <span>Added — {selectedSize}</span>
                {product.colors[selectedColor] && <span className="p-card__added-dot" style={{ backgroundColor: product.colors[selectedColor] }} />}
              </>
            ) : (
              <>
                <FiShoppingBag />
                <span>Add to Bag</span>
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Info */}
      <div className="p-card__info">
        <div className="p-card__top-row">
          <span className="p-card__category">{product.category}</span>
          {product.average_rating > 0 && (
            <span className="p-card__rating">
              <FiStar style={{ fill: 'var(--terracotta)', stroke: 'var(--terracotta)', fontSize: '0.7rem' }} />
              {product.average_rating}
            </span>
          )}
        </div>
        <h3 className="p-card__name">{product.name}</h3>

        {/* Size pills */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="p-card__sizes">
            {product.sizes.map((size) => (
              <button
                key={size}
                className={`p-card__size${selectedSize === size ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSelectedSize(size) }}
              >
                {size}
              </button>
            ))}
            <button
              className="p-card__size p-card__size--custom"
              onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`, { state: { customSize: true } }) }}
              title="Custom size — enter your measurements"
            >
              Custom
            </button>
          </div>
        )}

        <div className="p-card__row">
          <span className="p-card__price">&#8377;{product.price}</span>

          {/* Color dots */}
          {product.colors && product.colors.length > 0 && (
            <div className="p-card__colors">
              {product.colors.slice(0, 4).map((color, i) => (
                <span
                  key={i}
                  className={`p-card__dot${i === selectedColor ? ' active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={(e) => { e.stopPropagation(); setSelectedColor(i) }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="p-card__dot-more">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>

        {isLowStock && (
          <span className="p-card__low-stock">Only {product.stock_quantity} left</span>
        )}
      </div>
    </motion.article>
  )
}

/* ─── Story Moment Divider ─── */
const StoryMoment = ({ text }) => (
  <div className="story-moment">
    <div className="story-moment__line" />
    <p className="story-moment__text">{text}</p>
    <div className="story-moment__line" />
  </div>
)

/* ─── Main Products Page ─── */
const Products = () => {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [sortBy, setSortBy] = useState('featured')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef(null)
  const filterBarRef = useRef(null)
  const [isFilterSticky, setIsFilterSticky] = useState(false)

  // Transition state: 'idle' | 'revealing' | 'entering'
  const [transitionState, setTransitionState] = useState('idle')
  const [revealCategory, setRevealCategory] = useState(null)
  const revealTimerRef = useRef(null)
  const isFirstRender = useRef(true)

  const { products, loading: productsLoading } = useProducts()
  const { addToCart } = useCart()
  const { favorites, toggleFavorite } = useFavorites()

  // Handle category change with reveal transition
  const handleCategoryChange = useCallback((catId) => {
    if (catId === selectedCategory) return
    // Skip reveal on first load
    if (isFirstRender.current) {
      isFirstRender.current = false
      setSelectedCategory(catId)
      return
    }

    const catName = categories.find(c => c.id === catId)?.name || 'All'
    setRevealCategory(catName)
    setTransitionState('revealing')

    // After reveal plays, apply the actual filter change
    clearTimeout(revealTimerRef.current)
    revealTimerRef.current = setTimeout(() => {
      setSelectedCategory(catId)
      setTransitionState('entering')
      // Reset to idle after cards have cascaded
      setTimeout(() => setTransitionState('idle'), 600)
    }, 750)
  }, [selectedCategory])

  // Mark first render done on mount
  useEffect(() => {
    isFirstRender.current = false
    return () => clearTimeout(revealTimerRef.current)
  }, [])

  // Sticky filter bar detection
  useEffect(() => {
    const handleScroll = () => {
      if (filterBarRef.current) {
        const rect = filterBarRef.current.getBoundingClientRect()
        setIsFilterSticky(rect.top <= 72)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close sort dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = selectedCategory === 'all'
      ? products
      : products.filter(p => p.category === selectedCategory)

    let sorted = [...filtered]
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        break
    }
    return sorted
  }, [products, selectedCategory, sortBy])

  const currentSortLabel = sortOptions.find(o => o.id === sortBy)?.name || 'Featured'

  // Key that resets stagger when filter/sort changes
  const gridKey = `${selectedCategory}-${sortBy}`

  // ── Loading Skeleton ──
  if (productsLoading) {
    return (
      <div className="products-page">
        <div className="products-hero">
          <div className="products-hero__inner">
            <div className="skeleton" style={{ height: 20, width: 120, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 48, width: 320, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 20, width: 280 }} />
          </div>
        </div>
        <div className="products-filter-bar">
          <div className="products-filter-bar__inner">
            <div style={{ display: 'flex', gap: 10 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 38, width: 80, borderRadius: 20 }} />
              ))}
            </div>
          </div>
        </div>
        <div className="products-grid-wrap">
          <div className="products-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="p-card">
                <div className="skeleton" style={{ height: 320, borderRadius: '12px 12px 0 0' }} />
                <div style={{ padding: '20px 16px' }}>
                  <div className="skeleton" style={{ height: 12, width: 60, marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 18, width: '75%', marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 18, width: 50 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Rendered page ──
  return (
    <div className="products-page">

      {/* ── Hero ── */}
      <motion.section
        className="products-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="products-hero__inner">
          <nav className="products-breadcrumb">
            <Link to="/">Home</Link>
            <span className="products-breadcrumb__sep">/</span>
            <span>Shop</span>
          </nav>

          <motion.h1
            className="products-hero__title"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Our Collection
          </motion.h1>

          <motion.p
            className="products-hero__subtitle"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Handcrafted with love, worn with pride
          </motion.p>

          <div className="products-hero__stitch" />
        </div>
      </motion.section>

      {/* ── Filter Bar ── */}
      <motion.div
        ref={filterBarRef}
        className={`products-filter-bar${isFilterSticky ? ' sticky' : ''}`}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="products-filter-bar__inner">
          {/* Category pills with sliding indicator */}
          <LayoutGroup>
            <div className="products-filter-pills">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter-pill${selectedCategory === cat.id ? ' active' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {selectedCategory === cat.id && (
                    <motion.span
                      className="filter-pill__bg"
                      layoutId="activePill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="filter-pill__label">{cat.name}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>

          {/* Right side: count + sort */}
          <div className="products-filter-bar__right">
            <AnimatePresence mode="wait">
              <motion.span
                key={filteredAndSortedProducts.length}
                className="products-count"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                {filteredAndSortedProducts.length} piece{filteredAndSortedProducts.length !== 1 ? 's' : ''}
              </motion.span>
            </AnimatePresence>

            <div className="sort-dropdown" ref={sortRef}>
              <button
                className="sort-dropdown__trigger"
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                {currentSortLabel}
                <FiChevronDown className={`sort-dropdown__icon${isSortOpen ? ' open' : ''}`} />
              </button>
              <AnimatePresence>
                {isSortOpen && (
                  <motion.ul
                    className="sort-dropdown__menu"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {sortOptions.map((opt) => (
                      <li key={opt.id}>
                        <button
                          className={`sort-dropdown__item${sortBy === opt.id ? ' active' : ''}`}
                          onClick={() => { setSortBy(opt.id); setIsSortOpen(false) }}
                        >
                          {opt.name}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Product Grid ── */}
      <div className="products-grid-wrap">

        {/* Single AnimatePresence so transitions are serialized:
            grid exits → reveal enters → reveal exits → new grid enters */}
        <AnimatePresence mode="wait">
          {transitionState === 'revealing' ? (
            <CategoryReveal key="reveal" categoryName={revealCategory} />
          ) : (
            <motion.div
              className="products-grid"
              key={gridKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {filteredAndSortedProducts.map((product, index) => (
                <React.Fragment key={product.id}>
                  <ProductCard
                    product={product}
                    addToCart={addToCart}
                    isFavorite={favorites.includes(product.id)}
                    toggleFavorite={toggleFavorite}
                    index={index}
                  />
                  {/* Story moment after every 8th product */}
                  {(index + 1) % 8 === 0 && index < filteredAndSortedProducts.length - 1 && (
                    <motion.div
                      key={`story-${index}`}
                      className="story-moment-wrap"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index + 1) * 0.06 + 0.1, duration: 0.4 }}
                    >
                      <StoryMoment text={storyMoments[Math.floor(index / 8) % storyMoments.length]} />
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {filteredAndSortedProducts.length === 0 && (
          <motion.div
            className="products-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="products-empty__icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke="var(--terracotta-light)" strokeWidth="1.5" strokeDasharray="6 4" />
                <path d="M24 28c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="var(--terracotta)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="26" cy="36" r="1.5" fill="var(--terracotta)" />
                <circle cx="38" cy="36" r="1.5" fill="var(--terracotta)" />
                <path d="M28 42c1.5 1.5 6.5 1.5 8 0" stroke="var(--terracotta)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="products-empty__title">Nothing here yet</h3>
            <p className="products-empty__text">
              We couldn't find anything in this category.
            </p>
            <button
              className="products-empty__btn"
              onClick={() => setSelectedCategory('all')}
            >
              Browse All
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Products
