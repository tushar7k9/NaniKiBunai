import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiShoppingBag, FiLock, FiMessageSquare, FiX, FiTruck, FiShield, FiArrowRight } from 'react-icons/fi'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { orderService } from '../services/orderService'
import './Checkout.css'

/* ─── NoteButton with smart tooltip ─── */
const NoteButton = ({ text, onClick }) => {
  const btnRef = useRef(null)
  const [flipAbove, setFlipAbove] = useState(true)

  const handleMouseEnter = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    // If less than 120px above the button, show below instead
    setFlipAbove(rect.top > 120)
  }, [])

  return (
    <div className="co-summary__item-note-wrap">
      <button
        ref={btnRef}
        type="button"
        className="co-summary__item-note has-note"
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
      >
        <FiMessageSquare /> Edit note
        <span className={`co-summary__item-tooltip${flipAbove ? '' : ' tooltip--below'}`}>
          <span className="co-summary__item-tooltip-text">{text}</span>
        </span>
      </button>
    </div>
  )
}

const Checkout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart, getTotalPrice, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!location.state?.fromCart) {
      alert('Please proceed to checkout through your shopping cart.')
      navigate('/products')
    }
  }, [location, navigate])

  const [shippingInfo, setShippingInfo] = useState({
    firstName: user?.user_metadata?.firstName || '',
    lastName: user?.user_metadata?.lastName || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    address: user?.user_metadata?.shippingAddress?.street || '',
    city: user?.user_metadata?.shippingAddress?.city || '',
    state: user?.user_metadata?.shippingAddress?.state || '',
    zipCode: user?.user_metadata?.shippingAddress?.zip || '',
    country: user?.user_metadata?.shippingAddress?.country || 'India',
  })

  const [orderNotes, setOrderNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [productInstructions, setProductInstructions] = useState({})
  const [activeInstructionIndex, setActiveInstructionIndex] = useState(null)
  const [orderError, setOrderError] = useState(null)
  const [currentStep, setCurrentStep] = useState(1) // 1: info, 2: review

  const shippingCost = getTotalPrice() >= 500 ? 0 : 49
  const tax = Math.round(getTotalPrice() * 0.05)
  const total = getTotalPrice() + shippingCost + tax

  const handleInstructionChange = (index, value) => {
    setProductInstructions((prev) => ({ ...prev, [index]: value }))
  }

  // Lock body when instruction popup is open
  useEffect(() => {
    if (activeInstructionIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [activeInstructionIndex])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const hasStockIssues = cart.some(item =>
      item.stock_quantity === 0 ||
      (item.stock_quantity !== undefined && item.quantity > item.stock_quantity)
    )

    if (hasStockIssues) {
      setOrderError('Some items have stock issues. Please review your cart.')
      return
    }

    setIsProcessing(true)
    setOrderError(null)

    try {
      const shippingAddress = {
        firstName: shippingInfo.firstName,
        lastName: shippingInfo.lastName,
        address: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        zipCode: shippingInfo.zipCode,
        country: shippingInfo.country,
      }

      const orderData = {
        shippingAddress,
        billingAddress: shippingAddress,
        customerEmail: shippingInfo.email,
        customerPhone: shippingInfo.phone,
        items: cart,
        subtotal: getTotalPrice(),
        shippingCost,
        taxAmount: tax,
        discountAmount: 0,
        totalAmount: total,
        customerNotes: orderNotes || null,
        productInstructions,
        paymentMethod: 'simulated',
      }

      const result = await orderService.createOrder(orderData)
      await orderService.updatePaymentStatus(result.order.id, 'paid', 'simulated-payment-intent')
      await orderService.updateOrderStatus(result.order.id, 'confirmed')

      clearCart()
      setIsProcessing(false)

      if (isAuthenticated && user) {
        alert(`Order placed! Your order number is: ${result.order.order_number}`)
        navigate('/orders')
      } else {
        alert(
          `Order placed!\n\nOrder: ${result.order.order_number}\n\nLog in with ${shippingInfo.email} to track your order.`
        )
        navigate('/')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      setOrderError(error.message || 'Failed to place order. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleShippingChange = (e) => {
    const { name, value } = e.target
    setShippingInfo((prev) => ({ ...prev, [name]: value }))
  }

  const isShippingValid = () => {
    return shippingInfo.firstName && shippingInfo.lastName && shippingInfo.email &&
      shippingInfo.phone && shippingInfo.address && shippingInfo.city &&
      shippingInfo.state && shippingInfo.zipCode
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <div className="co-page">
        <div className="co-empty">
          <div className="co-empty__icon"><FiShoppingBag /></div>
          <h2>Your bag is empty</h2>
          <p>Add some handcrafted pieces before checking out.</p>
          <button className="co-empty__btn" onClick={() => navigate('/products')}>
            Browse Collection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="co-page">
      {/* Breadcrumb */}
      <nav className="co-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/products">Products</Link>
        <span>/</span>
        <span className="co-breadcrumb__current">Checkout</span>
      </nav>

      {/* Progress Steps */}
      <div className="co-steps">
        <button
          className={`co-step${currentStep >= 1 ? ' active' : ''}`}
          onClick={() => setCurrentStep(1)}
        >
          <span className="co-step__num">1</span>
          <span className="co-step__label">Shipping</span>
        </button>
        <div className={`co-step__line${currentStep >= 2 ? ' filled' : ''}`} />
        <button
          className={`co-step${currentStep >= 2 ? ' active' : ''}`}
          onClick={() => isShippingValid() && setCurrentStep(2)}
        >
          <span className="co-step__num">2</span>
          <span className="co-step__label">Review & Pay</span>
        </button>
      </div>

      <div className="co-layout">
        {/* Left: Form or Review */}
        <div className="co-main">
          <AnimatePresence mode="wait">
            {currentStep === 1 ? (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="co-section-title">Shipping Details</h2>

                {orderError && (
                  <div className="co-error">{orderError}</div>
                )}

                <form className="co-form" onSubmit={(e) => { e.preventDefault(); isShippingValid() && setCurrentStep(2) }}>
                  <div className="co-form__grid">
                    <div className="co-field">
                      <label className="co-label">First Name</label>
                      <input className="co-input" type="text" name="firstName" value={shippingInfo.firstName} onChange={handleShippingChange} required />
                    </div>
                    <div className="co-field">
                      <label className="co-label">Last Name</label>
                      <input className="co-input" type="text" name="lastName" value={shippingInfo.lastName} onChange={handleShippingChange} required />
                    </div>
                    <div className="co-field co-field--full">
                      <label className="co-label">Email</label>
                      <input className="co-input" type="email" name="email" value={shippingInfo.email} onChange={handleShippingChange} required />
                    </div>
                    <div className="co-field co-field--full">
                      <label className="co-label">Phone</label>
                      <input className="co-input" type="tel" name="phone" value={shippingInfo.phone} onChange={handleShippingChange} required />
                    </div>
                    <div className="co-field co-field--full">
                      <label className="co-label">Address</label>
                      <input className="co-input" type="text" name="address" value={shippingInfo.address} onChange={handleShippingChange} required />
                    </div>
                    <div className="co-field">
                      <label className="co-label">City</label>
                      <input className="co-input" type="text" name="city" value={shippingInfo.city} onChange={handleShippingChange} required />
                    </div>
                    <div className="co-field">
                      <label className="co-label">State</label>
                      <input className="co-input" type="text" name="state" value={shippingInfo.state} onChange={handleShippingChange} required />
                    </div>
                    <div className="co-field">
                      <label className="co-label">PIN Code</label>
                      <input className="co-input" type="text" name="zipCode" value={shippingInfo.zipCode} onChange={handleShippingChange} required />
                    </div>
                    <div className="co-field">
                      <label className="co-label">Country</label>
                      <input className="co-input" type="text" name="country" value={shippingInfo.country} onChange={handleShippingChange} required />
                    </div>
                  </div>

                  {/* Order Notes */}
                  <div className="co-field" style={{ marginTop: 20 }}>
                    <label className="co-label">Order Notes <span className="co-optional">optional</span></label>
                    <textarea
                      className="co-textarea"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Any special requests for your order?"
                      rows={3}
                    />
                  </div>

                  <button
                    type="submit"
                    className="co-next-btn"
                    disabled={!isShippingValid()}
                  >
                    Continue to Review <FiArrowRight />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="co-section-title">Review Your Order</h2>

                {orderError && (
                  <div className="co-error">{orderError}</div>
                )}

                {/* Shipping Summary */}
                <div className="co-review-block">
                  <div className="co-review-block__header">
                    <h3>Shipping to</h3>
                    <button className="co-review-block__edit" onClick={() => setCurrentStep(1)}>Edit</button>
                  </div>
                  <p className="co-review-block__text">
                    {shippingInfo.firstName} {shippingInfo.lastName}<br />
                    {shippingInfo.address}<br />
                    {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}<br />
                    {shippingInfo.phone}
                  </p>
                </div>

                {/* Contact */}
                <div className="co-review-block">
                  <div className="co-review-block__header">
                    <h3>Contact</h3>
                    <button className="co-review-block__edit" onClick={() => setCurrentStep(1)}>Edit</button>
                  </div>
                  <p className="co-review-block__text">
                    {shippingInfo.email}
                  </p>
                </div>

                {/* Order Notes if any */}
                {orderNotes && (
                  <div className="co-review-block">
                    <div className="co-review-block__header">
                      <h3>Order Notes</h3>
                      <button className="co-review-block__edit" onClick={() => setCurrentStep(1)}>Edit</button>
                    </div>
                    <p className="co-review-block__text">{orderNotes}</p>
                  </div>
                )}

                {/* Place Order */}
                <div className="co-place-order">
                  <p className="co-review-hint">
                    Review your items in the summary panel, then place your order.
                  </p>
                  <div className="co-secure-note">
                    <FiLock /> <span>Secure checkout</span>
                  </div>
                  <motion.button
                    className="co-place-order-btn"
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isProcessing ? 'Processing...' : `Place Order — ₹${total.toFixed(0)}`}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Order Summary (sticky) */}
        <div className="co-summary">
          <h3 className="co-summary__title">Summary</h3>

          <div className="co-summary__items">
            {cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="co-summary__item">
                <div className="co-summary__item-img-wrap">
                  <img src={item.images?.[0] || item.image} alt={item.name} />
                  <span className="co-summary__item-qty">{item.quantity}</span>
                </div>
                <div className="co-summary__item-info">
                  <span className="co-summary__item-name">{item.name}</span>
                  <div className="co-summary__item-meta">
                    {(item.selectedColor || item.selected_color) && (
                      <span
                        className="co-summary__item-dot"
                        style={{ backgroundColor: item.selectedColor || item.selected_color }}
                      />
                    )}
                    {(item.selectedSize || item.selected_size) && (
                      <span className="co-summary__item-tag">{item.selectedSize || item.selected_size}</span>
                    )}
                  </div>
                  {/* Per-product note */}
                  {productInstructions[index] ? (
                    <NoteButton
                      text={productInstructions[index]}
                      onClick={() => setActiveInstructionIndex(index)}
                    />
                  ) : (
                    <button
                      type="button"
                      className="co-summary__item-note"
                      onClick={() => setActiveInstructionIndex(index)}
                    >
                      <FiMessageSquare /> Add note
                    </button>
                  )}
                </div>
                <span className="co-summary__item-price">&#8377;{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="co-summary__stitch" />

          <div className="co-summary__row">
            <span>Subtotal</span>
            <span>&#8377;{getTotalPrice().toFixed(0)}</span>
          </div>
          <div className="co-summary__row">
            <span>Shipping</span>
            <span>{shippingCost === 0 ? 'Free' : `₹${shippingCost}`}</span>
          </div>
          <div className="co-summary__row">
            <span>Tax (5%)</span>
            <span>&#8377;{tax}</span>
          </div>

          <div className="co-summary__stitch" />

          <div className="co-summary__row co-summary__row--total">
            <span>Total</span>
            <span>&#8377;{total.toFixed(0)}</span>
          </div>

          {shippingCost === 0 && (
            <div className="co-summary__free-ship">
              <FiTruck /> Free shipping applied
            </div>
          )}

          {/* Trust */}
          <div className="co-summary__trust">
            <div><FiShield /> Handcrafted quality</div>
            <div><FiTruck /> Ships within 3-5 days</div>
          </div>
        </div>
      </div>

      {/* Instruction Modal */}
      <AnimatePresence>
        {activeInstructionIndex !== null && (
          <motion.div
            className="co-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveInstructionIndex(null)}
          >
            <motion.div
              className="co-modal"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="co-modal__header">
                <div>
                  <h3>Special Instructions</h3>
                  <span className="co-modal__product">{cart[activeInstructionIndex]?.name}</span>
                </div>
                <button className="co-modal__close" onClick={() => setActiveInstructionIndex(null)}><FiX /></button>
              </div>
              <div className="co-modal__stitch" />
              <textarea
                className="co-modal__textarea"
                placeholder="Any specific requests for this item? (e.g., custom stitching, color preferences, gift wrapping)"
                value={productInstructions[activeInstructionIndex] || ''}
                onChange={(e) => handleInstructionChange(activeInstructionIndex, e.target.value)}
                rows={4}
              />
              <button className="co-modal__save" onClick={() => setActiveInstructionIndex(null)}>
                Save Note
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Checkout
