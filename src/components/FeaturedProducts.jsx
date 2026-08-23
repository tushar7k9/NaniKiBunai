import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiHeart, FiShoppingBag, FiArrowRight, FiCheck, FiStar } from 'react-icons/fi'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../hooks/useCart'
import { useFavorites } from '../hooks/useFavorites'
import { useFlyToCart } from './FlyToCart'
import './FeaturedProducts.css'

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&q=80'

const SkeletonCard = () => (
  <div className="fp-card">
    <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: '12px 12px 0 0' }} />
    <div style={{ padding: '18px' }}>
      <div className="skeleton" style={{ height: 11, width: '40%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: '75%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: 50 }} />
    </div>
  </div>
)

/* ─── Featured Card — mirrors Products page card ─── */
const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    // Touch device OR mobile-sized viewport: hover never (reliably) happens
    // in either, so the add-to-bag button must be always visible
    const mq = window.matchMedia('(hover: none), (pointer: coarse), (max-width: 768px)')
    setIsTouch(mq.matches)
    const handler = (e) => setIsTouch(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isTouch
}

const FeaturedCard = ({ product, index, addToCart, isFavorite, toggleFavorite }) => {
  const navigate = useNavigate()
  const isTouch = useIsTouchDevice()
  const [isHovered, setIsHovered] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const imageRef = useRef(null)
  const { notifyAdded } = useFlyToCart()

  const addedSize = product.sizes?.[0] || 'S'
  const addedColor = product.colors?.[0]

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation()
    if (justAdded) return
    notifyAdded({
      imageSrc: product.images?.[0] || FALLBACK_IMG,
      name: product.name,
      imageRect: imageRef.current?.getBoundingClientRect(),
      buttonRect: e.currentTarget?.getBoundingClientRect(),
    })
    addToCart({
      ...product,
      quantity: 1,
      selectedColor: addedColor,
      selectedSize: addedSize
    })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }, [justAdded, product, addToCart, notifyAdded, addedColor, addedSize])

  const isOutOfStock = product.stock_quantity === 0

  return (
    <motion.article
      className={`fp-card${isOutOfStock ? ' fp-card--oos' : ''}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => navigate(`/product/${product.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="fp-card__image-wrap">
        <img
          ref={imageRef}
          src={product.images?.[0] || FALLBACK_IMG}
          alt={product.name}
          className="fp-card__img fp-card__img--primary"
          loading="lazy"
          onError={(e) => { e.target.src = FALLBACK_IMG }}
        />
        {product.images?.length > 1 && (
          <img
            src={product.images[1]}
            alt={`${product.name} alt`}
            className={`fp-card__img fp-card__img--secondary${isHovered ? ' visible' : ''}`}
            loading="lazy"
          />
        )}

        {/* Favorite */}
        <motion.button
          className={`fp-card__fav${isFavorite ? ' active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id) }}
          initial={false}
          animate={{ opacity: isTouch || isFavorite || isHovered ? 1 : 0 }}
          whileTap={{ scale: 0.85 }}
        >
          <FiHeart />
        </motion.button>

        {/* Sold Out */}
        {isOutOfStock && (
          <div className="fp-card__oos"><span>Sold Out</span></div>
        )}

        {/* Add to Bag */}
        {!isOutOfStock && (
          <motion.button
            className={`fp-card__add-bag${justAdded ? ' fp-card__add-bag--added' : ''}`}
            onClick={handleAddToCart}
            initial={false}
            animate={isTouch ? { y: 0, opacity: 1 } : { y: isHovered || justAdded ? 0 : '100%', opacity: isHovered || justAdded ? 1 : 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {justAdded ? (
              <>
                <FiCheck />
                <span>Added — {addedSize}</span>
                {addedColor && <span className="fp-card__added-dot" style={{ backgroundColor: addedColor }} />}
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
      <div className="fp-card__info">
        <div className="fp-card__top-row">
          <span className="fp-card__category">{product.category}</span>
          {product.average_rating > 0 && (
            <span className="fp-card__rating">
              <FiStar style={{ fill: 'var(--terracotta)', stroke: 'var(--terracotta)', fontSize: '0.7rem' }} />
              {product.average_rating}
            </span>
          )}
        </div>
        <h3 className="fp-card__name">{product.name}</h3>
        <div className="fp-card__row">
          <span className="fp-card__price">&#8377;{product.price}</span>
          {product.colors && product.colors.length > 0 && (
            <div className="fp-card__colors">
              {product.colors.slice(0, 4).map((color, i) => (
                <span key={i} className="fp-card__dot" style={{ backgroundColor: color }} />
              ))}
              {product.colors.length > 4 && (
                <span className="fp-card__dot-more">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )
}

const FeaturedProducts = () => {
  const navigate = useNavigate()
  const { products: allProducts, loading: productsLoading } = useProducts()
  const { addToCart } = useCart()
  const { favorites, toggleFavorite } = useFavorites()

  const featuredProducts = useMemo(() => allProducts.slice(0, 6), [allProducts])

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
          <div className="handcrafted-badge" style={{ marginBottom: 16 }}>Featured Picks</div>
          <h2>Loved by Our Customers</h2>
          <p>Handpicked selections from our artisan collection</p>
        </motion.div>

        <div className="fp-grid">
          {productsLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : featuredProducts.map((product, index) => (
                <FeaturedCard
                  key={product.id}
                  product={product}
                  index={index}
                  addToCart={addToCart}
                  isFavorite={favorites.includes(product.id)}
                  toggleFavorite={toggleFavorite}
                />
              ))
          }
        </div>

        <motion.div
          className="fp-view-all"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.button
            className="fp-view-all__btn"
            onClick={() => navigate('/products')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View All Products <FiArrowRight />
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturedProducts
