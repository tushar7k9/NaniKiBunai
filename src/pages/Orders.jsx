import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock, FiChevronDown } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { orderService } from '../services/orderService'
import './Orders.css'

const statusConfig = {
  pending:    { icon: FiClock,       label: 'Pending',    color: 'var(--terracotta)' },
  confirmed:  { icon: FiClock,       label: 'Confirmed',  color: 'var(--terracotta)' },
  processing: { icon: FiPackage,     label: 'Processing', color: 'var(--soft-brown)' },
  shipped:    { icon: FiTruck,       label: 'Shipped',    color: 'var(--deep-brown)' },
  delivered:  { icon: FiCheckCircle, label: 'Delivered',  color: '#2d8659' },
  completed:  { icon: FiCheckCircle, label: 'Completed',  color: '#2d8659' },
  cancelled:  { icon: FiXCircle,     label: 'Cancelled',  color: '#c0392b' },
  refunded:   { icon: FiXCircle,     label: 'Refunded',   color: '#c0392b' },
}

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const Orders = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { navigate('/login'); return }
    fetchOrders()
    linkGuestOrders()
  }, [isAuthenticated, authLoading])

  const linkGuestOrders = async () => {
    try {
      if (user?.email) await orderService.linkGuestOrdersToUser(user.email, user.id)
    } catch (err) { console.error('Error linking guest orders:', err) }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const userOrders = await orderService.getUserOrders(null, { includeGuestOrders: true })
      setOrders(userOrders)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load orders.')
    } finally { setLoading(false) }
  }

  // Loading
  if (loading) {
    return (
      <div className="ord-page">
        <div className="ord-hero">
          <div className="ord-hero__inner">
            <div className="skeleton" style={{ height: 20, width: 100, marginBottom: 20 }} />
            <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 18, width: 260 }} />
          </div>
        </div>
        <div className="ord-content">
          {[0,1,2].map(i => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 12 }} />
          ))}
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="ord-page">
        <div className="ord-empty">
          <div className="ord-empty__icon"><FiXCircle /></div>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="ord-empty__btn" onClick={fetchOrders}>Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ord-page">
      {/* Hero */}
      <motion.section
        className="ord-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="ord-hero__inner">
          <nav className="ord-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span className="ord-breadcrumb__current">Orders</span>
          </nav>

          <motion.h1
            className="ord-hero__title"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            My Orders
          </motion.h1>

          <motion.p
            className="ord-hero__subtitle"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Track your handcrafted pieces
          </motion.p>

          <div className="ord-hero__stitch" />
        </div>
      </motion.section>

      {/* Content */}
      <div className="ord-content">
        {orders.length === 0 ? (
          <motion.div
            className="ord-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="ord-empty__icon"><FiPackage /></div>
            <h3>No orders yet</h3>
            <p>Your handcrafted journey starts here.</p>
            <button className="ord-empty__btn" onClick={() => navigate('/products')}>
              Browse Collection
            </button>
          </motion.div>
        ) : (
          <div className="ord-list">
            {orders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.pending
              const StatusIcon = status.icon
              const isExpanded = expandedId === order.id

              return (
                <motion.div
                  key={order.id}
                  className="ord-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                >
                  {/* Card Header — always visible */}
                  <button
                    className="ord-card__header"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="ord-card__left">
                      {/* Item thumbnails */}
                      <div className="ord-card__thumbs">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <img
                            key={idx}
                            src={item.product_snapshot?.images?.[0] || '/placeholder.png'}
                            alt=""
                            className="ord-card__thumb"
                          />
                        ))}
                        {order.items?.length > 3 && (
                          <span className="ord-card__thumb-more">+{order.items.length - 3}</span>
                        )}
                      </div>

                      <div className="ord-card__meta">
                        <span className="ord-card__number">#{order.order_number}</span>
                        <span className="ord-card__date">{formatDate(order.created_at)}</span>
                      </div>
                    </div>

                    <div className="ord-card__right">
                      <span className="ord-card__status" style={{ color: status.color }}>
                        <StatusIcon /> {status.label}
                      </span>
                      <span className="ord-card__total">&#8377;{parseFloat(order.total_amount).toFixed(0)}</span>
                      <FiChevronDown className={`ord-card__chevron${isExpanded ? ' open' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded Details */}
                  <div className={`ord-details${isExpanded ? ' open' : ''}`}>
                    <div className="ord-details__inner">
                      {/* Items */}
                      <div className="ord-details__section">
                        <h4 className="ord-details__label">Items</h4>
                        <div className="ord-details__items">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="ord-item">
                              <img
                                src={item.product_snapshot?.images?.[0] || '/placeholder.png'}
                                alt={item.product_snapshot?.name || 'Product'}
                                className="ord-item__img"
                              />
                              <div className="ord-item__info">
                                <span className="ord-item__name">{item.product_snapshot?.name}</span>
                                <div className="ord-item__meta">
                                  <span>Qty: {item.quantity}</span>
                                  {item.selected_color && (
                                    <span className="ord-item__dot" style={{ backgroundColor: item.selected_color }} />
                                  )}
                                  {item.selected_size && (
                                    <span className="ord-item__tag">{item.selected_size}</span>
                                  )}
                                </div>
                                {item.product_snapshot?.customer_instructions && (
                                  <span className="ord-item__note">Note: {item.product_snapshot.customer_instructions}</span>
                                )}
                              </div>
                              <span className="ord-item__price">&#8377;{parseFloat(item.total_price).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping */}
                      {order.shipping_address && (
                        <div className="ord-details__section">
                          <h4 className="ord-details__label">Shipping</h4>
                          <p className="ord-details__text">
                            {order.shipping_address.firstName} {order.shipping_address.lastName}<br />
                            {order.shipping_address.address}<br />
                            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                          </p>
                        </div>
                      )}

                      {/* Summary */}
                      <div className="ord-details__section">
                        <h4 className="ord-details__label">Summary</h4>
                        <div className="ord-summary">
                          <div className="ord-summary__row">
                            <span>Subtotal</span>
                            <span>&#8377;{parseFloat(order.subtotal).toFixed(0)}</span>
                          </div>
                          <div className="ord-summary__row">
                            <span>Shipping</span>
                            <span>&#8377;{parseFloat(order.shipping_cost || 0).toFixed(0)}</span>
                          </div>
                          <div className="ord-summary__row">
                            <span>Tax</span>
                            <span>&#8377;{parseFloat(order.tax_amount || 0).toFixed(0)}</span>
                          </div>
                          {order.discount_amount > 0 && (
                            <div className="ord-summary__row ord-summary__row--discount">
                              <span>Discount</span>
                              <span>-&#8377;{parseFloat(order.discount_amount).toFixed(0)}</span>
                            </div>
                          )}
                          <div className="ord-summary__row ord-summary__row--total">
                            <span>Total</span>
                            <span>&#8377;{parseFloat(order.total_amount).toFixed(0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tracking */}
                      {order.tracking_number && (
                        <div className="ord-details__section">
                          <h4 className="ord-details__label">Tracking</h4>
                          <p className="ord-details__text">
                            <strong>{order.tracking_number}</strong>
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      {order.customer_notes && (
                        <div className="ord-details__section">
                          <h4 className="ord-details__label">Your Notes</h4>
                          <p className="ord-details__text ord-details__text--note">{order.customer_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders
