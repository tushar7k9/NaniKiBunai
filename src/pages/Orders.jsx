import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock,
  FiChevronDown, FiExternalLink, FiAlertCircle, FiRotateCcw,
} from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { orderService } from '../services/orderService'
import './Orders.css'

// ── Status config ──
const statusConfig = {
  pending:    { icon: FiClock,       label: 'Pending',    color: 'var(--terracotta)' },
  confirmed:  { icon: FiClock,       label: 'Confirmed',  color: 'var(--terracotta)' },
  processing: { icon: FiPackage,     label: 'Processing', color: 'var(--soft-brown)' },
  shipped:    { icon: FiTruck,       label: 'Shipped',    color: 'var(--deep-brown)' },
  delivered:  { icon: FiCheckCircle, label: 'Delivered',  color: '#2d8659' },
  completed:  { icon: FiCheckCircle, label: 'Completed',  color: '#2d8659' },
  cancelled:  { icon: FiXCircle,     label: 'Cancelled',  color: '#c0392b' },
  returned:   { icon: FiRotateCcw,   label: 'Returned',   color: '#8A4B08' },
  refunded:   { icon: FiXCircle,     label: 'Refunded',   color: '#c0392b' },
}

/**
 * Payment-aware status message — the money situation changes what the
 * customer most needs to hear (COD: refunds only exist for paid orders).
 */
const getStatusMessage = (order) => {
  const paid = order.payment_status === 'paid'
  const amount = `₹${parseFloat(order.total_amount).toFixed(0)}`
  switch (order.status) {
    case 'pending':
      return "We've received your order and will confirm it shortly."
    case 'confirmed':
      return "Your order is confirmed! We're preparing your handcrafted piece."
    case 'processing':
      return 'Your piece is being crafted with care and attention.'
    case 'shipped':
      return paid
        ? 'Your order is on its way! Arriving soon.'
        : `Your order is on its way! Please keep ${amount} ready — pay in cash on delivery.`
    case 'delivered':
      return paid
        ? 'Your handcrafted piece has arrived. We hope you love it!'
        : `Your handcrafted piece has arrived — please complete the ${amount} cash payment if you haven't already.`
    case 'completed':
      return 'Thank you for being part of our handcrafted journey.'
    case 'cancelled':
      return paid
        ? `This order was cancelled — your refund of ${amount} is being processed (7–10 business days).`
        : "This order was cancelled. You haven't been charged."
    case 'returned':
      return paid
        ? `Return received — your refund of ${amount} is on its way (7–10 business days).`
        : 'Return recorded. No payment was due.'
    case 'refunded':
      return `Your refund of ${amount} has been completed.`
    default:
      return ''
  }
}

const paymentStatusConfig = {
  paid:                { label: 'Paid',               color: '#2d8659', bg: 'rgba(45, 134, 89, 0.1)' },
  pending:             { label: 'Pay on delivery',    color: '#b8860b', bg: 'rgba(184, 134, 11, 0.1)' },
  failed:              { label: 'Payment Failed',     color: '#c0392b', bg: 'rgba(192, 57, 43, 0.1)' },
  refunded:            { label: 'Refunded',           color: '#9A8C82', bg: 'rgba(154, 140, 130, 0.1)' },
  partially_refunded:  { label: 'Partially Refunded', color: '#9A8C82', bg: 'rgba(154, 140, 130, 0.1)' },
}

const ORDER_STEPS = [
  { key: 'pending',    label: 'Ordered' },
  { key: 'confirmed',  label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped',    label: 'Shipped' },
  { key: 'delivered',  label: 'Delivered' },
]

// ── Helpers ──
const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const detectCarrier = (trackingNumber) => {
  if (!trackingNumber) return { name: null, url: null }
  const tn = trackingNumber.trim()
  if (/^E\w+IN$/i.test(tn))
    return { name: 'India Post', url: 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx' }
  if (/^DL/i.test(tn))
    return { name: 'Delhivery', url: `https://www.delhivery.com/track/package/${tn}` }
  if (/^\d{10,11}$/.test(tn))
    return { name: 'BlueDart', url: `https://www.bluedart.com/tracking?tracknumbers=${tn}` }
  if (/^D\d{8,9}$/i.test(tn))
    return { name: 'DTDC', url: `https://www.dtdc.in/tracking/tracking_results.asp?TrkType=consignment&strCnno=${tn}` }
  return { name: 'Courier', url: null }
}

// ── Progress Stepper ──
const OrderProgressStepper = ({ order, events }) => {
  if (['cancelled', 'returned', 'refunded'].includes(order.status)) {
    const labels = {
      cancelled: 'Order Cancelled',
      returned: 'Order Returned',
      refunded: 'Order Refunded',
    }
    return (
      <div className="ord-stepper ord-stepper--cancelled">
        <div className="ord-stepper__cancelled-indicator">
          {order.status === 'returned' ? <FiRotateCcw /> : <FiXCircle />}
          <span>{labels[order.status]}</span>
        </div>
      </div>
    )
  }

  const currentIndex = order.status === 'completed'
    ? 4
    : ORDER_STEPS.findIndex(s => s.key === order.status)

  // Real dates from the audit trail (confirmed/processing have no columns);
  // dedicated columns win for shipped/delivered, events fill the rest
  const eventDate = (statusKey) =>
    events?.find(
      (e) => e.event_type === 'status_change' && e.to_status === statusKey
    )?.created_at || null

  const getTimestamp = (stepKey) => {
    if (stepKey === 'pending') return order.created_at
    if (stepKey === 'confirmed') return eventDate('confirmed')
    if (stepKey === 'processing') return eventDate('processing')
    if (stepKey === 'shipped') return order.shipped_at || eventDate('shipped')
    if (stepKey === 'delivered') return order.delivered_at || eventDate('delivered')
    return null
  }

  return (
    <div className="ord-stepper">
      {ORDER_STEPS.map((step, i) => {
        let state = 'future'
        if (i < currentIndex) state = 'completed'
        else if (i === currentIndex) state = 'current'

        const ts = getTimestamp(step.key)
        const lineState = i <= currentIndex ? 'completed' : i === currentIndex + 1 ? 'active' : 'future'

        return (
          <React.Fragment key={step.key}>
            {i > 0 && <div className={`ord-stepper__line ord-stepper__line--${lineState}`} />}
            <div className={`ord-stepper__step ord-stepper__step--${state}`}>
              <div className="ord-stepper__dot" />
              <span className="ord-stepper__label">{step.label}</span>
              {ts && state !== 'future' && (
                <span className="ord-stepper__date">{formatDate(ts)}</span>
              )}
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Main Component ──
const Orders = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelError, setCancelError] = useState(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelledJustNow, setCancelledJustNow] = useState(null) // orderId
  const [orderEvents, setOrderEvents] = useState({}) // orderId -> events[]

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

  const handleCancelOrder = async () => {
    if (!cancellingId) return
    try {
      setCancelError(null)
      setCancelLoading(true)
      const updated = await orderService.cancelOrder(
        cancellingId,
        cancelReason.trim() || null
      )
      // The RPC returns the authoritative row — sync it into state
      setOrders(prev => prev.map(o =>
        o.id === cancellingId ? { ...o, ...updated } : o
      ))
      setCancelledJustNow(cancellingId)
      setShowCancelConfirm(false)
      setCancellingId(null)
      setCancelReason('')
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel order. Please try again.')
    } finally {
      setCancelLoading(false)
    }
  }

  // Expand a card; lazily fetch its audit events (real dates for the stepper)
  const toggleExpand = (order) => {
    const next = expandedId === order.id ? null : order.id
    setExpandedId(next)
    if (next !== order.id) setCancelledJustNow(null)
    if (next && !orderEvents[order.id]) {
      orderService.getOrderEvents(order.id).then(events =>
        setOrderEvents(prev => ({ ...prev, [order.id]: events }))
      )
    }
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
              const carrier = detectCarrier(order.tracking_number)
              const showTracking = order.tracking_number && ['shipped', 'delivered', 'completed'].includes(order.status)
              const payStatus = paymentStatusConfig[order.payment_status]

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
                    onClick={() => toggleExpand(order)}
                  >
                    <div className="ord-card__left">
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
                        {payStatus && (
                          <span
                            className="ord-card__pay"
                            style={{ color: payStatus.color, background: payStatus.bg }}
                          >
                            {payStatus.label}
                          </span>
                        )}
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

                      {/* Cancellation confirmation (just happened) */}
                      {cancelledJustNow === order.id && (
                        <div className="ord-cancel-success">
                          <FiCheckCircle /> Your order has been cancelled.
                        </div>
                      )}

                      {/* 1. Progress Stepper */}
                      <div className="ord-details__section">
                        <OrderProgressStepper order={order} events={orderEvents[order.id]} />
                      </div>

                      {/* 2. Status Message */}
                      <div className="ord-details__section">
                        <p className="ord-status-message">
                          {getStatusMessage(order)}
                        </p>
                      </div>

                      {/* 3. Items */}
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

                      {/* 4. Tracking */}
                      {showTracking && (
                        <div className="ord-details__section">
                          <h4 className="ord-details__label">Tracking</h4>
                          <div className="ord-tracking">
                            <div className="ord-tracking__row">
                              <FiTruck className="ord-tracking__icon" />
                              <div className="ord-tracking__info">
                                {carrier.name && (
                                  <span className="ord-tracking__carrier">{carrier.name}</span>
                                )}
                                {carrier.url ? (
                                  <a
                                    href={carrier.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ord-tracking__number"
                                  >
                                    {order.tracking_number} <FiExternalLink />
                                  </a>
                                ) : (
                                  <span className="ord-tracking__number">{order.tracking_number}</span>
                                )}
                              </div>
                            </div>
                            {order.shipped_at && (
                              <span className="ord-tracking__date">Shipped on {formatDate(order.shipped_at)}</span>
                            )}
                            {['delivered', 'completed'].includes(order.status) && order.delivered_at && (
                              <span className="ord-tracking__date">Delivered on {formatDate(order.delivered_at)}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 5. Shipping */}
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

                      {/* 6. Summary + Payment Badge */}
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
                          {payStatus && (
                            <div className="ord-summary__payment">
                              <span
                                className="ord-payment-badge"
                                style={{ color: payStatus.color, backgroundColor: payStatus.bg }}
                              >
                                {payStatus.label}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 7. Customer Notes */}
                      {order.customer_notes && (
                        <div className="ord-details__section">
                          <h4 className="ord-details__label">Your Notes</h4>
                          <p className="ord-details__text ord-details__text--note">{order.customer_notes}</p>
                        </div>
                      )}

                      {/* 8. Cancel Order */}
                      {['pending', 'confirmed'].includes(order.status) && (
                        <div className="ord-details__section ord-details__section--actions">
                          <button
                            className="ord-cancel-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCancellingId(order.id)
                              setShowCancelConfirm(true)
                              setCancelError(null)
                            }}
                          >
                            Cancel Order
                          </button>
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

      {/* Cancel Confirmation Dialog */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            className="ord-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowCancelConfirm(false); setCancellingId(null); setCancelError(null) }}
          >
            <motion.div
              className="ord-confirm"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ord-confirm__icon"><FiAlertCircle /></div>
              <h3 className="ord-confirm__title">Cancel this order?</h3>
              <p className="ord-confirm__text">
                This action cannot be undone. Your order will be cancelled.
                {orders.find(o => o.id === cancellingId)?.payment_status === 'paid'
                  ? ' Your payment will be refunded within 7–10 business days.'
                  : " You haven't been charged."}
              </p>
              <textarea
                className="ord-confirm__reason"
                rows={2}
                maxLength={300}
                placeholder="Help us improve — why are you cancelling? (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={cancelLoading}
              />
              {cancelError && <p className="ord-confirm__error">{cancelError}</p>}
              <div className="ord-confirm__actions">
                <button
                  className="ord-confirm__btn ord-confirm__btn--cancel"
                  onClick={handleCancelOrder}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Cancelling…' : 'Yes, Cancel Order'}
                </button>
                <button
                  className="ord-confirm__btn ord-confirm__btn--keep"
                  onClick={() => { setShowCancelConfirm(false); setCancellingId(null); setCancelError(null); setCancelReason('') }}
                  disabled={cancelLoading}
                >
                  Keep Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Orders
