import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiCreditCard, FiTruck, FiShoppingBag, FiLock, FiMessageSquare, FiX } from 'react-icons/fi'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { orderService } from '../services/orderService'
import './Checkout.css'

const Checkout = () => {
  const navigate = useNavigate()
  const { cart, getTotalPrice, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()

  // Form state
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  })

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  })

  const [orderNotes, setOrderNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [productInstructions, setProductInstructions] = useState({})
  const [activeInstructionIndex, setActiveInstructionIndex] = useState(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, isAbove: false })
  const [orderError, setOrderError] = useState(null)

  const summaryItemsRef = useRef(null)

  const shippingCost = 10
  const tax = getTotalPrice() * 0.08 // 8% tax
  const total = getTotalPrice() + shippingCost + tax

  // Handle product instruction change
  const handleInstructionChange = (index, value) => {
    setProductInstructions((prev) => ({
      ...prev,
      [index]: value,
    }))
  }

  // Close popup on scroll
  useEffect(() => {
    const summaryItems = summaryItemsRef.current
    if (summaryItems && activeInstructionIndex !== null) {
      const handleScroll = () => {
        setActiveInstructionIndex(null)
      }
      
      summaryItems.addEventListener('scroll', handleScroll)
      return () => summaryItems.removeEventListener('scroll', handleScroll)
    }
  }, [activeInstructionIndex])

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (activeInstructionIndex !== null) {
      // Disable scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Re-enable scroll
      document.body.style.overflow = 'auto'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [activeInstructionIndex])

  // Toggle instruction popup
  const toggleInstructionPopup = (index, event) => {
    if (activeInstructionIndex === index) {
      setActiveInstructionIndex(null)
    } else {
      // Get button position
      const button = event.currentTarget
      const rect = button.getBoundingClientRect()
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      
      // Calculate position based on screen size
      if (windowWidth <= 768) {
        // Mobile/Tablet: center on screen
        setPopupPosition({ top: 0, left: 0, isAbove: false })
      } else {
        // Desktop: position below button with boundary detection
        const popupWidth = 420
        const popupHeight = 400 // approximate height
        
        // Calculate left position (ensure it doesn't go off-screen)
        let left = rect.right - popupWidth
        if (left < 10) left = 10 // min 10px from left edge
        if (left + popupWidth > windowWidth - 10) {
          left = windowWidth - popupWidth - 10 // max 10px from right edge
        }
        
        // Calculate top position and determine if popup should be above or below
        let top = rect.bottom + 10
        let isAbove = false
        
        // If popup would go below viewport, show it above the button
        if (top + popupHeight > windowHeight - 20) {
          top = rect.top - popupHeight - 10
          isAbove = true
          
          // If still not enough space above, center it
          if (top < 20) {
            top = (windowHeight - popupHeight) / 2
            isAbove = false // centered, so no arrow positioning needed
          }
        }
        
        setPopupPosition({ top, left, isAbove })
      }
      
      setActiveInstructionIndex(index)
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsProcessing(true)
    setOrderError(null)

    try {
      // Prepare shipping address
      const shippingAddress = {
        firstName: shippingInfo.firstName,
        lastName: shippingInfo.lastName,
        address: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        zipCode: shippingInfo.zipCode,
        country: shippingInfo.country,
      }

      // Prepare order data
      const orderData = {
        shippingAddress,
        billingAddress: shippingAddress, // Using same as shipping for now
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
        paymentMethod: 'simulated', // Will be updated when payment is integrated
      }

      // Create order in database
      const result = await orderService.createOrder(orderData)

      // Simulate payment processing (will be replaced with actual payment integration)
      // For now, we'll mark it as paid immediately
      await orderService.updatePaymentStatus(result.order.id, 'paid', 'simulated-payment-intent')
      await orderService.updateOrderStatus(result.order.id, 'confirmed')

      console.log('Order created successfully:', result)

      // Clear cart
      clearCart()
      setIsProcessing(false)

      // Show different messages based on authentication status
      if (isAuthenticated && user) {
        // Logged-in user: redirect to orders page
        alert(`Order placed successfully! Your order number is: ${result.order.order_number}`)
        navigate('/orders')
      } else {
        // Guest user: show message about tracking
        alert(
          `Order placed successfully!\n\n` +
          `Your order number is: ${result.order.order_number}\n\n` +
          `To track your order status, please log in with the email address: ${shippingInfo.email}\n\n` +
          `If you don't have an account, you can sign up using the same email to view your order history.`
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

  const handlePaymentChange = (e) => {
    const { name, value } = e.target
    setPaymentInfo((prev) => ({ ...prev, [name]: value }))
  }

  // Redirect if cart is empty
  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="empty-checkout">
          <FiShoppingBag className="empty-icon" />
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart before checkout</p>
          <motion.button
            className="continue-shopping-btn"
            onClick={() => navigate('/products')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Continue Shopping
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      {/* Back Button */}
      <motion.button
        className="back-button"
        onClick={() => navigate(-1)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <FiArrowLeft /> Back
      </motion.button>

      <div className="checkout-container">
        {/* Left Side - Forms */}
        <div className="checkout-forms">
          <motion.div
            className="checkout-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Checkout</h1>
            <p>Complete your order</p>
          </motion.div>

          {/* Error Message */}
          {orderError && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
              }}
            >
              {orderError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Shipping Information */}
            <motion.section
              className="checkout-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="section-header">
                <FiTruck />
                <h2>Shipping Information</h2>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={shippingInfo.firstName}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={shippingInfo.lastName}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={shippingInfo.email}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Address *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={shippingInfo.city}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state">State *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={shippingInfo.state}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="zipCode">ZIP Code *</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={shippingInfo.zipCode}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country *</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={shippingInfo.country}
                    onChange={handleShippingChange}
                    required
                  />
                </div>
              </div>
            </motion.section>

          </form>
        </div>

        {/* Right Side - Order Summary */}
        <motion.div
          className="order-summary"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2>Order Summary</h2>

          <div className="summary-items" ref={summaryItemsRef}>
            {cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="summary-item">
                <img
                  src={item.images?.[0] || item.image}
                  alt={item.name}
                  className="summary-item-image"
                />
                <div className="summary-item-details">
                  <h4>{item.name}</h4>
                  <p>Qty: {item.quantity}</p>
                  {(item.selectedColor || item.selected_color) && (
                    <div className="summary-item-variant">
                      <span
                        className="color-dot-small"
                        style={{
                          backgroundColor: item.selectedColor || item.selected_color,
                        }}
                      />
                      <span>{item.selectedSize || item.selected_size}</span>
                    </div>
                  )}
                </div>
                <div className="summary-item-actions">
                  <div className="summary-item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  <div className="instruction-icon-container">
                    <motion.button
                      type="button"
                      className={`instruction-icon ${productInstructions[index] ? 'has-instruction' : ''}`}
                      onClick={(e) => toggleInstructionPopup(index, e)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      title="Add special instructions"
                    >
                      <FiMessageSquare />
                    </motion.button>

                    <AnimatePresence>
                      {activeInstructionIndex === index && (
                        <>
                          <motion.div
                            className="instruction-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveInstructionIndex(null)}
                          />
                          <motion.div
                            className={`instruction-popup ${popupPosition.isAbove ? 'popup-above' : ''}`}
                            style={window.innerWidth > 768 ? {
                              top: `${popupPosition.top}px`,
                              left: `${popupPosition.left}px`,
                            } : {}}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="instruction-popup-header">
                              <h4>Special Instructions</h4>
                              <button
                                type="button"
                                className="close-popup-btn"
                                onClick={() => setActiveInstructionIndex(null)}
                              >
                                <FiX />
                              </button>
                            </div>
                            <p className="instruction-popup-product">{item.name}</p>
                            <textarea
                              className="instruction-textarea"
                              placeholder="Add any special instructions for this item..."
                              value={productInstructions[index] || ''}
                              onChange={(e) => handleInstructionChange(index, e.target.value)}
                              rows="4"
                            />
                            <button
                              type="button"
                              className="save-instruction-btn"
                              onClick={() => setActiveInstructionIndex(null)}
                            >
                              Save
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (8%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <motion.button
            type="submit"
            className="place-order-btn"
            onClick={handleSubmit}
            disabled={isProcessing}
            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          >
            {isProcessing ? 'Processing...' : `Place Order - $${total.toFixed(2)}`}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default Checkout
