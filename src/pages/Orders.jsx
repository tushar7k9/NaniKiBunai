import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock, FiArrowLeft } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { orderService } from '../services/orderService'
import './Orders.css'

const Orders = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    // Wait for auth to finish loading before checking authentication
    if (authLoading) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    fetchOrders()
    linkGuestOrders()
  }, [isAuthenticated, authLoading])

  const linkGuestOrders = async () => {
    try {
      if (user && user.email) {
        // Try to link any guest orders with this email to the user account
        await orderService.linkGuestOrdersToUser(user.email, user.id)
      }
    } catch (err) {
      console.error('Error linking guest orders:', err)
      // Don't show error to user, just log it
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      // Fetch orders including guest orders with same email
      const userOrders = await orderService.getUserOrders(null, { includeGuestOrders: true })
      setOrders(userOrders)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return <FiClock className="status-icon pending" />
      case 'processing':
      case 'shipped':
        return <FiTruck className="status-icon processing" />
      case 'delivered':
      case 'completed':
        return <FiCheckCircle className="status-icon completed" />
      case 'cancelled':
      case 'refunded':
        return <FiXCircle className="status-icon cancelled" />
      default:
        return <FiPackage className="status-icon" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return '#f59e0b'
      case 'processing':
      case 'shipped':
        return '#3b82f6'
      case 'delivered':
      case 'completed':
        return '#10b981'
      case 'cancelled':
      case 'refunded':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading-container">
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <FiPackage size={48} />
          </motion.div>
          <p>Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="error-container">
          <FiXCircle size={48} color="#ef4444" />
          <h2>Error</h2>
          <p>{error}</p>
          <motion.button
            className="retry-btn"
            onClick={fetchOrders}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">
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

      <div className="orders-container">
        <motion.div
          className="orders-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>My Orders</h1>
          <p>View and track your order history</p>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            className="empty-orders"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <FiPackage size={64} />
            <h2>No orders yet</h2>
            <p>Start shopping to see your orders here</p>
            <motion.button
              className="shop-now-btn"
              onClick={() => navigate('/products')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Shop Now
            </motion.button>
          </motion.div>
        ) : (
          <div className="orders-list">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                className="order-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
              >
                <div className="order-card-header">
                  <div className="order-info">
                    <h3>Order #{order.order_number}</h3>
                    <p className="order-date">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="order-status" style={{ color: getStatusColor(order.status) }}>
                    {getStatusIcon(order.status)}
                    <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                  </div>
                </div>

                <div className="order-summary">
                  <div className="order-items-preview">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <img
                        key={idx}
                        src={item.product_snapshot?.images?.[0] || '/placeholder.png'}
                        alt={item.product_snapshot?.name || 'Product'}
                        className="order-item-thumbnail"
                      />
                    ))}
                    {order.items?.length > 3 && (
                      <div className="more-items">+{order.items.length - 3}</div>
                    )}
                  </div>
                  <div className="order-total">
                    <span>Total:</span>
                    <strong>${parseFloat(order.total_amount).toFixed(2)}</strong>
                  </div>
                </div>

                {selectedOrder?.id === order.id && (
                  <motion.div
                    className="order-details"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="order-details-section">
                      <h4>Items</h4>
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="order-item-detail">
                          <img
                            src={item.product_snapshot?.images?.[0] || '/placeholder.png'}
                            alt={item.product_snapshot?.name || 'Product'}
                          />
                          <div className="item-info">
                            <p className="item-name">{item.product_snapshot?.name}</p>
                            <p className="item-quantity">Qty: {item.quantity}</p>
                            {item.selected_color && (
                              <p className="item-variant">
                                <span
                                  className="color-dot"
                                  style={{ backgroundColor: item.selected_color }}
                                />
                                {item.selected_size}
                              </p>
                            )}
                            {item.product_snapshot?.customer_instructions && (
                              <p className="item-instructions">
                                Note: {item.product_snapshot.customer_instructions}
                              </p>
                            )}
                          </div>
                          <div className="item-price">
                            ${parseFloat(item.total_price).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-details-section">
                      <h4>Shipping Address</h4>
                      <div className="address">
                        <p>
                          {order.shipping_address.firstName} {order.shipping_address.lastName}
                        </p>
                        <p>{order.shipping_address.address}</p>
                        <p>
                          {order.shipping_address.city}, {order.shipping_address.state}{' '}
                          {order.shipping_address.zipCode}
                        </p>
                        <p>{order.shipping_address.country}</p>
                      </div>
                    </div>

                    <div className="order-details-section">
                      <h4>Order Summary</h4>
                      <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Shipping:</span>
                        <span>${parseFloat(order.shipping_cost || 0).toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Tax:</span>
                        <span>${parseFloat(order.tax_amount || 0).toFixed(2)}</span>
                      </div>
                      {order.discount_amount > 0 && (
                        <div className="summary-row discount">
                          <span>Discount:</span>
                          <span>-${parseFloat(order.discount_amount).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="summary-row total">
                        <span>Total:</span>
                        <strong>${parseFloat(order.total_amount).toFixed(2)}</strong>
                      </div>
                    </div>

                    {order.tracking_number && (
                      <div className="order-details-section">
                        <h4>Tracking Information</h4>
                        <p className="tracking-number">
                          Tracking #: <strong>{order.tracking_number}</strong>
                        </p>
                      </div>
                    )}

                    {order.customer_notes && (
                      <div className="order-details-section">
                        <h4>Order Notes</h4>
                        <p>{order.customer_notes}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders
