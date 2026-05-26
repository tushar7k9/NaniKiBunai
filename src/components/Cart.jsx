import React, { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingBag, FiArrowRight } from 'react-icons/fi'
import './Cart.css'

/* ─── Particle Dissolve Effect ─── */
const PARTICLE_COUNT = 40
const PARTICLE_COLORS = ['#C4896A', '#E8B49A', '#F2D5C4', '#5C4033', '#8B6F4E', '#D4AF37', '#F8F6F1']

const spawnParticles = (rect, containerEl) => {
  const container = containerEl || document.body
  const frag = document.createDocumentFragment()

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const particle = document.createElement('span')
    particle.className = 'cart-particle'

    // Random start position within the item bounds
    const originX = rect.left + Math.random() * rect.width
    const originY = rect.top + Math.random() * rect.height

    // Random scatter direction
    const angle = Math.random() * Math.PI * 2
    const distance = 40 + Math.random() * 80
    const tx = Math.cos(angle) * distance
    const ty = Math.sin(angle) * distance

    // Random size and color
    const size = 3 + Math.random() * 7
    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
    const duration = 500 + Math.random() * 300
    const delay = Math.random() * 120

    particle.style.cssText = `
      left: ${originX}px;
      top: ${originY}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      --tx: ${tx}px;
      --ty: ${ty}px;
      animation-duration: ${duration}ms;
      animation-delay: ${delay}ms;
    `

    frag.appendChild(particle)
  }

  container.appendChild(frag)

  // Cleanup particles after animation
  setTimeout(() => {
    container.querySelectorAll('.cart-particle').forEach(p => p.remove())
  }, 1200)
}

const Cart = ({ isOpen, onClose, cartItems, updateQuantity, removeFromCart }) => {
  const navigate = useNavigate()
  const [removingId, setRemovingId] = useState(null)
  const itemRefs = useRef({})

  const handleRemove = useCallback((item, index) => {
    const itemKey = `${item.id}-${index}`
    const el = itemRefs.current[itemKey]

    if (el) {
      const rect = el.getBoundingClientRect()
      spawnParticles(rect)
    }

    setRemovingId(itemKey)

    // Wait for dissolve + collapse
    setTimeout(() => {
      removeFromCart(
        item.id,
        item.selectedColor || item.selected_color,
        item.selectedSize || item.selected_size,
        item.cart_item_id
      )
      setRemovingId(null)
    }, 500)
  }, [removeFromCart])

  const calculateTotal = () =>
    cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)

  const getTotalItems = () =>
    cartItems.reduce((total, item) => total + item.quantity, 0)

  const hasStockIssues = () =>
    cartItems.some(item =>
      item.stock_quantity === 0 ||
      (item.stock_quantity !== undefined && item.quantity > item.stock_quantity)
    )

  const handleCheckout = () => {
    if (hasStockIssues()) {
      alert('Please remove out-of-stock items or adjust quantities before proceeding.')
      return
    }
    onClose()
    navigate('/checkout', { state: { fromCart: true } })
  }

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            {/* Header */}
            <div className="cart-header">
              <div className="cart-header__left">
                <h2 className="cart-header__title">Your Bag</h2>
                <span className="cart-header__count">{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}</span>
              </div>
              <button className="cart-close" onClick={onClose}>
                <FiX />
              </button>
            </div>

            {/* Content */}
            <div className="cart-content">
              {cartItems.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty__icon">
                    <FiShoppingBag />
                  </div>
                  <h3>Your bag is empty</h3>
                  <p>Discover something handcrafted just for you.</p>
                  <button className="cart-empty__btn" onClick={onClose}>
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="cart-items">
                  {cartItems.map((item, index) => {
                    const isOutOfStock = item.stock_quantity === 0
                    const isLowStock = item.stock_quantity !== undefined &&
                      item.stock_quantity > 0 &&
                      item.stock_quantity <= (item.low_stock_threshold || 10)
                    const exceedsStock = item.stock_quantity !== undefined &&
                      item.quantity > item.stock_quantity

                    return (
                      <motion.div
                        key={`${item.id}-${index}`}
                        ref={el => { if (el) itemRefs.current[`${item.id}-${index}`] = el }}
                        className={`cart-item${isOutOfStock ? ' cart-item--oos' : ''}${removingId === `${item.id}-${index}` ? ' cart-item--dissolving' : ''}`}
                        initial={{ opacity: 0, x: 24 }}
                        animate={removingId === `${item.id}-${index}` ? {} : { opacity: 1, x: 0 }}
                        exit={{ height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.3, exit: { duration: 0.3 } }}
                        layout
                      >
                        {/* Image */}
                        <div className="cart-item__img">
                          <img src={item.images?.[0] || item.image} alt={item.name} />
                          {isOutOfStock && <div className="cart-item__oos-badge">Sold Out</div>}
                        </div>

                        {/* Details */}
                        <div className="cart-item__body">
                          <div className="cart-item__top-row">
                            <h4 className="cart-item__name">{item.name}</h4>
                            <button
                              className="cart-item__remove"
                              onClick={() => handleRemove(item, index)}
                              disabled={removingId !== null}
                            >
                              <FiTrash2 />
                            </button>
                          </div>

                          {/* Variants */}
                          <div className="cart-item__variants">
                            {(item.selectedColor || item.selected_color) && (
                              <div className="cart-item__variant">
                                <span
                                  className="cart-item__color-dot"
                                  style={{ backgroundColor: item.selectedColor || item.selected_color }}
                                />
                              </div>
                            )}
                            {(item.selectedSize || item.selected_size) && (
                              <span className="cart-item__variant-tag">
                                {item.selectedSize || item.selected_size}
                              </span>
                            )}
                          </div>

                          {/* Warnings */}
                          {isOutOfStock && (
                            <span className="cart-item__warning cart-item__warning--oos">No longer available</span>
                          )}
                          {!isOutOfStock && exceedsStock && (
                            <span className="cart-item__warning cart-item__warning--exceed">Only {item.stock_quantity} available</span>
                          )}
                          {!isOutOfStock && !exceedsStock && isLowStock && (
                            <span className="cart-item__warning cart-item__warning--low">Only {item.stock_quantity} left</span>
                          )}

                          {/* Bottom: quantity + price */}
                          <div className="cart-item__bottom">
                            <div className="cart-item__qty">
                              <button
                                className="cart-item__qty-btn"
                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedColor || item.selected_color, item.selectedSize || item.selected_size)}
                                disabled={item.quantity <= 1 || isOutOfStock}
                              >
                                <FiMinus />
                              </button>
                              <span className="cart-item__qty-num">{item.quantity}</span>
                              <button
                                className="cart-item__qty-btn"
                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedColor || item.selected_color, item.selectedSize || item.selected_size)}
                                disabled={isOutOfStock || (item.stock_quantity !== undefined && item.quantity >= item.stock_quantity)}
                              >
                                <FiPlus />
                              </button>
                            </div>
                            <span className="cart-item__price">&#8377;{(item.price * item.quantity).toFixed(0)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="cart-footer">
                {hasStockIssues() && (
                  <div className="cart-footer__warning">
                    Please review stock availability before checkout
                  </div>
                )}

                <div className="cart-footer__row">
                  <span className="cart-footer__label">Subtotal</span>
                  <span className="cart-footer__total">&#8377;{calculateTotal().toFixed(0)}</span>
                </div>
                <p className="cart-footer__note">Shipping & taxes calculated at checkout</p>

                <button
                  className="cart-footer__checkout"
                  onClick={handleCheckout}
                  disabled={hasStockIssues()}
                >
                  Checkout
                  <FiArrowRight />
                </button>
                <button className="cart-footer__continue" onClick={onClose}>
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Cart
