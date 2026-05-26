import React, { useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHeart, FiShoppingBag, FiCheck } from 'react-icons/fi'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../hooks/useCart'
import { useFavorites } from '../hooks/useFavorites'
import { useFlyToCart } from '../components/FlyToCart'
import './Favorites.css'

/* ─── Favorite Card (reuses Products page card pattern) ─── */
const FavoriteCard = ({ product, addToCart, toggleFavorite, index }) => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = React.useState(false)
  const [justAdded, setJustAdded] = React.useState(false)
  const imageRef = React.useRef(null)
  const { fly } = useFlyToCart()

  const addedSize = product.sizes?.[0] || 'S'
  const addedColor = product.colors?.[0]

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
      selectedColor: addedColor,
      selectedSize: addedSize
    })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  const isOutOfStock = product.stock_quantity === 0

  return (
    <motion.article
      className={`fav-card${isOutOfStock ? ' fav-card--oos' : ''}`}
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => navigate(`/product/${product.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="fav-card__image-wrap">
        <img
          ref={imageRef}
          src={product.images[0]}
          alt={product.name}
          className="fav-card__img fav-card__img--primary"
          loading="lazy"
        />
        {product.images.length > 1 && (
          <img
            src={product.images[1]}
            alt={`${product.name} alternate`}
            className={`fav-card__img fav-card__img--secondary${isHovered ? ' visible' : ''}`}
            loading="lazy"
          />
        )}

        {/* Remove from favorites */}
        <motion.button
          className="fav-card__remove"
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id) }}
          whileTap={{ scale: 0.85 }}
        >
          <FiHeart />
        </motion.button>

        {/* Sold Out */}
        {isOutOfStock && (
          <div className="fav-card__oos-overlay"><span>Sold Out</span></div>
        )}

        {/* Add to Bag */}
        {!isOutOfStock && (
          <motion.button
            className={`fav-card__add-bag${justAdded ? ' fav-card__add-bag--added' : ''}`}
            onClick={handleAddToCart}
            initial={false}
            animate={{ y: isHovered || justAdded ? 0 : '100%', opacity: isHovered || justAdded ? 1 : 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {justAdded ? (
              <>
                <FiCheck />
                <span>Added — {addedSize}</span>
                {addedColor && <span className="fav-card__added-dot" style={{ backgroundColor: addedColor }} />}
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
      <div className="fav-card__info">
        <span className="fav-card__category">{product.category}</span>
        <h3 className="fav-card__name">{product.name}</h3>
        <div className="fav-card__row">
          <span className="fav-card__price">&#8377;{product.price}</span>
          {product.colors && product.colors.length > 0 && (
            <div className="fav-card__colors">
              {product.colors.slice(0, 4).map((color, i) => (
                <span key={i} className="fav-card__dot" style={{ backgroundColor: color }} />
              ))}
              {product.colors.length > 4 && (
                <span className="fav-card__dot-more">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )
}

/* ─── Favorites Page ─── */
const Favorites = () => {
  const navigate = useNavigate()
  const { products, loading: productsLoading } = useProducts()
  const { addToCart } = useCart()
  const { favorites, toggleFavorite } = useFavorites()

  const favoriteProducts = useMemo(() => {
    return products.filter(product => favorites.includes(product.id))
  }, [products, favorites])

  if (productsLoading) {
    return (
      <div className="fav-page">
        <div className="fav-hero">
          <div className="fav-hero__inner">
            <div className="skeleton" style={{ height: 20, width: 100, marginBottom: 20 }} />
            <div className="skeleton" style={{ height: 40, width: 240, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 18, width: 200 }} />
          </div>
        </div>
        <div className="fav-grid-wrap">
          <div className="fav-grid">
            {[0,1,2].map(i => (
              <div key={i} className="fav-card">
                <div className="skeleton" style={{ height: 300, borderRadius: '12px 12px 0 0' }} />
                <div style={{ padding: '16px' }}>
                  <div className="skeleton" style={{ height: 12, width: 50, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 16, width: 60 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fav-page">
      {/* Hero */}
      <motion.section
        className="fav-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="fav-hero__inner">
          <nav className="fav-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span className="fav-breadcrumb__current">Wishlist</span>
          </nav>

          <motion.h1
            className="fav-hero__title"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            Your Wishlist
          </motion.h1>

          <motion.p
            className="fav-hero__subtitle"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Pieces you've been dreaming about
          </motion.p>

          <div className="fav-hero__stitch" />
        </div>
      </motion.section>

      {/* Content */}
      <div className="fav-grid-wrap">
        {favoriteProducts.length === 0 ? (
          <motion.div
            className="fav-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="fav-empty__icon"><FiHeart /></div>
            <h3>Nothing saved yet</h3>
            <p>Tap the heart on any product to save it here.</p>
            <button className="fav-empty__btn" onClick={() => navigate('/products')}>
              Browse Collection
            </button>
          </motion.div>
        ) : (
          <>
            <div className="fav-count">
              {favoriteProducts.length} piece{favoriteProducts.length !== 1 ? 's' : ''} saved
            </div>

            <motion.div className="fav-grid" layout>
              <AnimatePresence mode="popLayout">
                {favoriteProducts.map((product, index) => (
                  <FavoriteCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                    toggleFavorite={toggleFavorite}
                    index={index}
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
