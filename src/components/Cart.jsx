import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingBag } from 'react-icons/fi'
import './Cart.css'

const Cart = ({ isOpen, onClose, cartItems, updateQuantity, removeFromCart }) => {
  const navigate = useNavigate()
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const hasStockIssues = () => {
    return cartItems.some(item =>
      item.stock_quantity === 0 ||
      (item.stock_quantity !== undefined && item.quantity > item.stock_quantity)
    )
  }

  const handleCheckout = () => {
    if (hasStockIssues()) {
      alert('Please remove out-of-stock items or adjust quantities before proceeding to checkout.')
      return
    }
    onClose()
    // Pass state to indicate this is a valid checkout navigation from cart
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
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Cart Header */}
            <div className="cart-header">
              <div className="cart-title-section">
                <FiShoppingBag className="cart-icon" />
                <h2>Shopping Cart</h2>
                <span className="cart-item-count">({getTotalItems()} items)</span>
              </div>
              <motion.button
                className="cart-close-btn"
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX />
              </motion.button>
            </div>

            {/* Cart Content */}
            <div className="cart-content">
              {cartItems.length === 0 ? (
                <div className="cart-empty">
                  <motion.div
                    className="empty-cart-icon"
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    🧺
                  </motion.div>
                  <h3>Your cart is empty</h3>
                  <p>Add some cozy handmade items to get started!</p>
                  <motion.button
                    className="continue-shopping-btn"
                    onClick={onClose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Continue Shopping
                  </motion.button>
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
                      className={`cart-item ${isOutOfStock ? 'out-of-stock' : ''}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {/* Item Image */}
                      <div className="cart-item-image">
                        <img
                          src={item.images?.[0] || item.image}
                          alt={item.name}
                        />
                        {isOutOfStock && (
                          <div className="cart-out-of-stock-overlay">
                            Out of Stock
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="cart-item-details">
                        <h4 className="cart-item-name">{item.name}</h4>
                        <p className="cart-item-price">${item.price}</p>

                        {/* Stock Warnings */}
                        {isOutOfStock && (
                          <div className="cart-stock-warning out-of-stock">
                            ✕ This item is no longer available
                          </div>
                        )}
                        {!isOutOfStock && exceedsStock && (
                          <div className="cart-stock-warning exceeds-stock">
                            ⚠️ Only {item.stock_quantity} available
                          </div>
                        )}
                        {!isOutOfStock && !exceedsStock && isLowStock && (
                          <div className="cart-stock-warning low-stock">
                            🧶 Only {item.stock_quantity} left
                          </div>
                        )}

                        {/* Color and Size - Horizontal Layout */}
                        {((item.selectedColor || item.selected_color) || (item.selectedSize || item.selected_size)) && (
                          <div className="cart-item-variants">
                            {(item.selectedColor || item.selected_color) && (
                              <div className="cart-item-color">
                                <span>Color:</span>
                                <div
                                  className="color-indicator"
                                  style={{ backgroundColor: item.selectedColor || item.selected_color }}
                                />
                              </div>
                            )}
                            {(item.selectedSize || item.selected_size) && (
                              <div className="cart-item-size">
                                <span>Size: </span>
                                <span className="size-value">{item.selectedSize || item.selected_size}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quantity Controls */}
                        <div className="cart-item-quantity">
                          <motion.button
                            className="quantity-btn-cart"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedColor || item.selected_color, item.selectedSize || item.selected_size)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={item.quantity <= 1 || isOutOfStock}
                          >
                            <FiMinus />
                          </motion.button>
                          <span className="quantity-display">{item.quantity}</span>
                          <motion.button
                            className="quantity-btn-cart"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedColor || item.selected_color, item.selectedSize || item.selected_size)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={isOutOfStock || (item.stock_quantity !== undefined && item.quantity >= item.stock_quantity)}
                          >
                            <FiPlus />
                          </motion.button>
                        </div>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="cart-item-actions">
                        <div className="cart-item-total">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <motion.button
                          className="remove-item-btn"
                          onClick={() => removeFromCart(
                            item.id,
                            item.selectedColor || item.selected_color,
                            item.selectedSize || item.selected_size,
                            item.cart_item_id
                          )}
                          whileHover={{ scale: 1.1, color: '#ff6b6b' }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FiTrash2 />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                  )}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="cart-footer">
                <div className="cart-subtotal">
                  <span>Subtotal:</span>
                  <span className="subtotal-amount">${calculateTotal().toFixed(2)}</span>
                </div>
                {hasStockIssues() && (
                  <div className="cart-checkout-warning">
                    ⚠️ Please review stock availability before checkout
                  </div>
                )}
                <p className="cart-note">Shipping & taxes calculated at checkout</p>
                <motion.button
                  className="checkout-btn"
                  onClick={handleCheckout}
                  whileHover={!hasStockIssues() ? { scale: 1.02 } : {}}
                  whileTap={!hasStockIssues() ? { scale: 0.98 } : {}}
                  disabled={hasStockIssues()}
                >
                  Proceed to Checkout
                </motion.button>
                <motion.button
                  className="continue-shopping-btn-footer"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue Shopping
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Cart
