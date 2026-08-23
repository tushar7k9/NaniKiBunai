import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  FiPackage,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiTruck,
  FiExternalLink,
  FiCopy,
  FiCheck,
  FiClock,
} from 'react-icons/fi'
import * as adminService from '../../services/adminService'
import './Orders.css'

const LIMIT = 20

const ORDER_STATUSES = [
  'all',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'returned',
  'refunded',
]

// Valid next statuses from each status
const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'processing'],
  delivered: ['completed', 'returned', 'shipped'],
  completed: [],
  cancelled: ['refunded'],
  returned: ['refunded'],
  refunded: [],
}

const TERMINAL_STATUSES = ['completed', 'refunded']
const TRACKING_VISIBLE_STATUSES = ['processing', 'shipped', 'delivered']

// Transitions that require confirmation
const CONFIRM_TRANSITIONS = {
  'shipped→processing': 'This will clear the tracking number and shipment date. Continue?',
  'delivered→shipped': 'This will clear the delivery date. Continue?',
  'delivered→returned': 'Mark this order as returned by the customer? It will be excluded from revenue. Continue?',
}

// Backward transitions render as ghost buttons in the detail actions
const BACKWARD_TRANSITIONS = ['shipped→processing', 'delivered→shipped']

// Human labels for status action buttons
const ACTION_LABELS = {
  confirmed: 'Confirm order',
  processing: 'Start processing',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  completed: 'Complete',
  cancelled: 'Cancel order',
  returned: 'Mark returned',
  refunded: 'Mark refunded',
}

// One-click forward step per status, shown directly on the row.
// Shipping needs a tracking number, so it expands the row instead.
const QUICK_ACTIONS = {
  pending: { to: 'confirmed', label: 'Confirm' },
  confirmed: { to: 'processing', label: 'Process' },
  processing: { to: 'shipped', label: 'Ship…', expand: true },
  shipped: { to: 'delivered', label: 'Delivered' },
  delivered: { to: 'completed', label: 'Complete' },
}

// Orders still waiting on the admin after this long are highlighted
const STALE_STATUSES = ['pending', 'confirmed']
const STALE_AFTER_MS = 48 * 60 * 60 * 1000

const timeAgo = (d) => {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`

// ── Expanded row detail ──────────────────────────────────────
const OrderDetail = ({ order, onStatusUpdate, onTrackingUpdate }) => {
  const [status, setStatus] = useState(order.status)
  const [tracking, setTracking] = useState(order.tracking_number || '')
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingTracking, setSavingTracking] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [trackingMsg, setTrackingMsg] = useState('')
  const [pendingShipment, setPendingShipment] = useState(false)
  const [confirmTransition, setConfirmTransition] = useState(null) // { to, message }
  const [copiedField, setCopiedField] = useState(null)
  const trackingInputRef = useRef(null)

  const copyToClipboard = async (field, value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1600)
    } catch { /* clipboard unavailable — ignore */ }
  }

  const isTerminal = TERMINAL_STATUSES.includes(status)
  const showTracking = TRACKING_VISIBLE_STATUSES.includes(status)
  const allowedNextStatuses = STATUS_TRANSITIONS[status] || []

  const executeStatusChange = async (newStatus, opts = {}) => {
    setSavingStatus(true)
    setStatusMsg('')
    try {
      const updated = await adminService.updateOrderStatus(order.id, newStatus, {
        fromStatus: status,
        trackingNumber: opts.trackingNumber,
      })
      onStatusUpdate(order.id, updated)
      if (opts.trackingNumber !== undefined) onTrackingUpdate(order.id, updated)
      // Sync local tracking from response (may have been cleared)
      setTracking(updated.tracking_number || '')
      setStatus(newStatus)
      setStatusMsg(opts.successMsg || 'Status updated')
    } catch {
      setStatusMsg('Failed to update status')
    } finally {
      setSavingStatus(false)
      setTimeout(() => setStatusMsg(''), 2500)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (newStatus === status) return

    // Shipped requires tracking number
    if (newStatus === 'shipped' && !tracking.trim()) {
      setStatus(newStatus)
      setPendingShipment(true)
      setConfirmTransition(null)
      setStatusMsg('Enter tracking number to confirm shipment')
      setTimeout(() => trackingInputRef.current?.focus(), 100)
      return
    }

    // Check if this transition needs confirmation
    const confirmKey = `${status}→${newStatus}`
    const confirmMsg = CONFIRM_TRANSITIONS[confirmKey]
    if (confirmMsg) {
      setConfirmTransition({ to: newStatus, message: confirmMsg })
      return
    }

    // Cancellation always needs confirmation
    if (newStatus === 'cancelled') {
      setConfirmTransition({ to: 'cancelled', message: 'Are you sure you want to cancel this order?' })
      return
    }

    // Direct transition (no confirmation needed)
    await executeStatusChange(newStatus)
  }

  const handleConfirmTransition = async () => {
    if (!confirmTransition) return
    const newStatus = confirmTransition.to
    setConfirmTransition(null)
    await executeStatusChange(newStatus)
  }

  const handleCancelTransition = () => {
    setConfirmTransition(null)
  }

  const handleConfirmShipment = async () => {
    if (!tracking.trim()) {
      setTrackingMsg('Tracking number is required to ship')
      setTimeout(() => setTrackingMsg(''), 2500)
      trackingInputRef.current?.focus()
      return
    }
    setPendingShipment(false)
    await executeStatusChange('shipped', {
      trackingNumber: tracking.trim(),
      successMsg: 'Order shipped with tracking',
    })
  }

  const handleCancelShipment = () => {
    setStatus(order.status)
    setPendingShipment(false)
    setStatusMsg('')
  }

  const handleTrackingSave = async () => {
    if (!tracking.trim()) return
    setSavingTracking(true)
    setTrackingMsg('')
    try {
      const updated = await adminService.updateTrackingNumber(order.id, tracking.trim())
      onTrackingUpdate(order.id, updated)
      setTrackingMsg('Tracking saved')
    } catch {
      setTrackingMsg('Failed to save tracking')
    } finally {
      setSavingTracking(false)
      setTimeout(() => setTrackingMsg(''), 2500)
    }
  }

  const addr = order.shipping_address || {}
  const customerName = [addr.firstName, addr.lastName].filter(Boolean).join(' ')
  const addressLine = [
    addr.address,
    addr.city,
    addr.state,
    addr.zipCode,
    addr.country,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="adm-orders__detail">
      <div className="adm-orders__detail-grid">
        {/* Left: Order items */}
        <div className="adm-orders__detail-section">
          <h4 className="adm-orders__detail-heading">Items</h4>
          <table className="adm-orders__items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Color</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {(order.order_items || []).map((item, i) => {
                const note = item.product_snapshot?.customer_instructions
                return (
                  <React.Fragment key={i}>
                    <tr>
                      <td className="adm-orders__item-name">
                        {item.products?.name || item.product_snapshot?.name || '—'}
                      </td>
                      <td>{item.selected_size || '—'}</td>
                      <td>
                        {item.selected_color ? (
                          <span className="adm-orders__color-swatch">
                            <span
                              className="adm-orders__color-dot"
                              style={{ background: item.selected_color }}
                            />
                          </span>
                        ) : '—'}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.total_price || item.price_per_unit * item.quantity)}</td>
                    </tr>
                    {note && (
                      <tr className="adm-orders__item-note-row">
                        <td colSpan={5}>
                          <span className="adm-orders__item-note">
                            <span className="adm-orders__item-note-label">Note:</span> {note}
                          </span>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Right: Shipping + Notes */}
        <div className="adm-orders__detail-sidebar">
          {/* Shipping address */}
          <div className="adm-orders__detail-section">
            <h4 className="adm-orders__detail-heading">Shipping Address</h4>
            {addressLine ? (
              <p className="adm-orders__detail-text">
                {customerName && <strong>{customerName}</strong>}
                {customerName && <br />}
                {addressLine}
                {order.customer_phone && (
                  <>
                    <br />
                    <span style={{ color: 'var(--text-muted)' }}>{order.customer_phone}</span>
                    <button
                      className="adm-orders__copy-btn"
                      title="Copy phone"
                      onClick={() => copyToClipboard('phone', order.customer_phone)}
                    >
                      {copiedField === 'phone' ? <FiCheck /> : <FiCopy />}
                    </button>
                  </>
                )}
                {order.customer_email && (
                  <>
                    <br />
                    <span style={{ color: 'var(--text-muted)' }}>{order.customer_email}</span>
                    <button
                      className="adm-orders__copy-btn"
                      title="Copy email"
                      onClick={() => copyToClipboard('email', order.customer_email)}
                    >
                      {copiedField === 'email' ? <FiCheck /> : <FiCopy />}
                    </button>
                  </>
                )}
              </p>
            ) : (
              <p className="adm-orders__detail-text adm-orders__detail-text--muted">
                No address on file
              </p>
            )}
          </div>

          {/* Order Breakdown */}
          <div className="adm-orders__detail-section">
            <h4 className="adm-orders__detail-heading">Order Summary</h4>
            <div className="adm-orders__breakdown">
              <div className="adm-orders__breakdown-row">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {Number(order.shipping_cost) > 0 && (
                <div className="adm-orders__breakdown-row">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shipping_cost)}</span>
                </div>
              )}
              {Number(order.tax_amount) > 0 && (
                <div className="adm-orders__breakdown-row">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax_amount)}</span>
                </div>
              )}
              {Number(order.discount_amount) > 0 && (
                <div className="adm-orders__breakdown-row adm-orders__breakdown-row--discount">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="adm-orders__breakdown-row adm-orders__breakdown-row--total">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
              {order.payment_method && (
                <div className="adm-orders__breakdown-meta">
                  Paid via {order.payment_method}
                </div>
              )}
              {order.tracking_number && (
                <div className="adm-orders__breakdown-meta">
                  Tracking: {order.tracking_number}
                </div>
              )}
            </div>
          </div>

          {/* Customer notes */}
          {order.customer_notes && (
            <div className="adm-orders__detail-section">
              <h4 className="adm-orders__detail-heading">Customer Note</h4>
              <p className="adm-orders__detail-text adm-orders__detail-text--note">
                {order.customer_notes}
              </p>
            </div>
          )}

          {/* Admin notes */}
          {order.admin_notes && (
            <div className="adm-orders__detail-section">
              <h4 className="adm-orders__detail-heading">Admin Note</h4>
              <p className="adm-orders__detail-text adm-orders__detail-text--note" style={{ borderLeftColor: 'var(--terracotta)', background: '#f5f0eb' }}>
                {order.admin_notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={`adm-orders__detail-actions${pendingShipment ? ' adm-orders__detail-actions--pending-ship' : ''}`}>
        {/* Status update */}
        <div className="adm-orders__action-group">
          <label className="adm-orders__action-label">Update Status</label>
          <div className="adm-orders__action-row">
            {isTerminal ? (
              <span className="adm-orders__terminal-badge">
                {status.charAt(0).toUpperCase() + status.slice(1)} — Final
              </span>
            ) : (
              <div className="adm-orders__status-actions">
                {allowedNextStatuses.map((s) => {
                  const isBackward = BACKWARD_TRANSITIONS.includes(`${status}→${s}`)
                  const variant =
                    s === 'cancelled'
                      ? 'adm-btn--danger'
                      : isBackward
                        ? 'adm-btn--ghost'
                        : s === 'returned' || s === 'refunded'
                          ? 'adm-btn--secondary'
                          : 'adm-btn--primary'
                  return (
                    <button
                      key={s}
                      className={`adm-btn ${variant} adm-btn--sm`}
                      onClick={() => handleStatusChange(s)}
                      disabled={savingStatus || pendingShipment || !!confirmTransition}
                    >
                      {ACTION_LABELS[s] || s}
                    </button>
                  )
                })}
              </div>
            )}
            {savingStatus && <span className="adm-orders__saving">Saving…</span>}
            {statusMsg && (
              <span
                className={
                  statusMsg.includes('Failed')
                    ? 'adm-orders__msg adm-orders__msg--error'
                    : pendingShipment
                    ? 'adm-orders__msg adm-orders__msg--warn'
                    : 'adm-orders__msg adm-orders__msg--ok'
                }
              >
                {statusMsg}
              </span>
            )}
          </div>

          {/* Confirmation banner for destructive transitions */}
          {confirmTransition && (
            <div className="adm-orders__confirm-banner">
              <p className="adm-orders__confirm-text">{confirmTransition.message}</p>
              <div className="adm-orders__confirm-actions">
                <button
                  className="adm-btn adm-btn--primary adm-btn--sm"
                  onClick={handleConfirmTransition}
                  disabled={savingStatus}
                >
                  {savingStatus ? 'Updating…' : 'Yes, continue'}
                </button>
                <button
                  className="adm-btn adm-btn--ghost adm-btn--sm"
                  onClick={handleCancelTransition}
                  disabled={savingStatus}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tracking number — only visible for processing/shipped/delivered */}
        {showTracking && (
          <div className={`adm-orders__action-group${pendingShipment ? ' adm-orders__action-group--highlight' : ''}`}>
            <label className="adm-orders__action-label">
              <FiTruck style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Tracking Number
              {pendingShipment && <span className="adm-orders__required-badge">Required</span>}
            </label>
            <div className="adm-orders__action-row">
              <input
                ref={trackingInputRef}
                className={`adm-input adm-orders__tracking-input${pendingShipment ? ' adm-orders__tracking-input--required' : ''}`}
                type="text"
                placeholder="Enter tracking number…"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pendingShipment) handleConfirmShipment()
                }}
              />
              {pendingShipment ? (
                <>
                  <button
                    className="adm-btn adm-btn--primary adm-btn--sm"
                    onClick={handleConfirmShipment}
                    disabled={savingStatus}
                  >
                    {savingStatus ? 'Shipping…' : 'Confirm Shipment'}
                  </button>
                  <button
                    className="adm-btn adm-btn--ghost adm-btn--sm"
                    onClick={handleCancelShipment}
                    disabled={savingStatus}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="adm-btn adm-btn--secondary adm-btn--sm"
                  onClick={handleTrackingSave}
                  disabled={savingTracking || !tracking.trim()}
                >
                  {savingTracking ? 'Saving…' : 'Save'}
                </button>
              )}
              {trackingMsg && (
                <span
                  className={
                    trackingMsg.includes('Failed') || trackingMsg.includes('required')
                      ? 'adm-orders__msg adm-orders__msg--error'
                      : 'adm-orders__msg adm-orders__msg--ok'
                  }
                >
                  {trackingMsg}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
const Orders = () => {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [statusCounts, setStatusCounts] = useState(null)
  const [quickSavingId, setQuickSavingId] = useState(null)

  const loadCounts = useCallback(async () => {
    try {
      setStatusCounts(await adminService.getOrderStatusCounts())
    } catch (err) {
      console.error('Failed to load order counts:', err)
    }
  }, [])

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminService.getAllOrders({
        status: statusFilter,
        search,
        page,
        limit: LIMIT,
      })
      setOrders(result.orders)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
    setExpandedIds(new Set())
  }, [statusFilter, search])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  const toggleRow = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleStatusUpdate = (orderId, updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updatedOrder } : o))
    )
    loadCounts()
  }

  // One-click forward step from the row. Shipping needs a tracking number,
  // so it expands the row to the full actions instead.
  const handleQuickAction = async (order) => {
    const quick = QUICK_ACTIONS[order.status]
    if (!quick) return
    if (quick.expand) {
      setExpandedIds((prev) => new Set(prev).add(order.id))
      return
    }
    setQuickSavingId(order.id)
    try {
      const updated = await adminService.updateOrderStatus(order.id, quick.to, {
        fromStatus: order.status,
      })
      handleStatusUpdate(order.id, updated)
    } catch (err) {
      console.error('Quick status update failed:', err)
    } finally {
      setQuickSavingId(null)
    }
  }

  const handleTrackingUpdate = (orderId, updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updatedOrder } : o))
    )
  }

  // Pagination window: show at most 5 page buttons
  const pageNumbers = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
    return Array.from({ length: 5 }, (_, i) => start + i)
  })()

  return (
    <div>
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Orders</h1>
          <p className="adm-page-sub">
            {total} order{total !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      {/* Status tabs — live counts show where the work is */}
      <div className="adm-orders__tabs">
        {ORDER_STATUSES.map((s) => {
          const count = s === 'all' ? statusCounts?.all : statusCounts?.[s]
          // hide empty statuses to reduce clutter (keep 'all' and the active tab)
          if (s !== 'all' && s !== statusFilter && statusCounts && !count) return null
          return (
            <button
              key={s}
              className={`adm-orders__tab${statusFilter === s ? ' adm-orders__tab--active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {count != null && <span className="adm-orders__tab-count">{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="adm-filters">
        {/* Search */}
        <form
          className="adm-orders__search-form"
          onSubmit={handleSearchSubmit}
        >
          <div className="adm-orders__search-wrap">
            <FiSearch className="adm-orders__search-icon" />
            <input
              className="adm-input adm-orders__search-input"
              type="text"
              placeholder="Order # or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="adm-btn adm-btn--secondary adm-btn--sm">
            Search
          </button>
        </form>

        {/* Clear search */}
        {search && (
          <button
            className="adm-btn adm-btn--sm adm-btn--danger"
            onClick={() => {
              setSearch('')
              setSearchInput('')
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="adm-table-wrap">
        {loading ? (
          <div className="adm-loading">
            <div className="adm-spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty__icon">
              <FiPackage />
            </div>
            <p className="adm-empty__text">
              {search || statusFilter !== 'all'
                ? 'No orders match your filters.'
                : 'No orders yet.'}
            </p>
          </div>
        ) : (
          <>
            <table className="adm-table adm-orders__table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isExpanded = expandedIds.has(order.id)
                  const itemCount = (order.order_items || []).reduce(
                    (sum, i) => sum + (i.quantity || 1),
                    0
                  )
                  const quick = QUICK_ACTIONS[order.status]
                  const isStale =
                    STALE_STATUSES.includes(order.status) &&
                    Date.now() - new Date(order.created_at).getTime() > STALE_AFTER_MS
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`adm-orders__row${isExpanded ? ' adm-orders__row--expanded' : ''}${isStale ? ' adm-orders__row--stale' : ''}`}
                        onClick={() => toggleRow(order.id)}
                      >
                        <td className="adm-orders__order-num" data-cell="title">
                          {order.order_number || order.id.slice(0, 8).toUpperCase()}
                          {isStale && (
                            <span className="adm-orders__stale-tag" title="Waiting for action for over 48 hours">
                              <FiClock /> needs action
                            </span>
                          )}
                        </td>
                        <td className="adm-orders__email" data-label="Customer">
                          {order.customer_email || '—'}
                        </td>
                        <td className="adm-orders__date" data-label="Date">
                          {formatDate(order.created_at)}
                          <span className="adm-orders__age">{timeAgo(order.created_at)}</span>
                        </td>
                        <td className="adm-orders__count" data-label="Items">{itemCount}</td>
                        <td className="adm-orders__total" data-label="Total">
                          {formatCurrency(order.total_amount)}
                        </td>
                        <td data-label="Status">
                          <span className={`adm-badge adm-badge--${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td data-label="Payment">
                          <span
                            className={`adm-badge adm-badge--${order.payment_status || 'pending'}`}
                          >
                            {order.payment_status || 'pending'}
                          </span>
                        </td>
                        <td className="adm-orders__quick-cell" data-cell="actions">
                          {quick && !isExpanded && (
                            <button
                              className="adm-btn adm-btn--secondary adm-btn--sm adm-orders__quick-btn"
                              disabled={quickSavingId === order.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuickAction(order)
                              }}
                            >
                              {quickSavingId === order.id ? 'Saving…' : quick.label}
                            </button>
                          )}
                        </td>
                        <td className="adm-orders__chevron-cell" data-cell="expand">
                          {isExpanded ? (
                            <FiChevronUp className="adm-orders__chevron" />
                          ) : (
                            <FiChevronDown className="adm-orders__chevron" />
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="adm-orders__detail-row" data-row="detail">
                          <td colSpan={9} className="adm-orders__detail-cell">
                            <OrderDetail
                              order={order}
                              onStatusUpdate={handleStatusUpdate}
                              onTrackingUpdate={handleTrackingUpdate}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="adm-pagination">
                <button
                  className="adm-pagination__btn"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  ←
                </button>

                {pageNumbers[0] > 1 && (
                  <>
                    <button
                      className="adm-pagination__btn"
                      onClick={() => setPage(1)}
                    >
                      1
                    </button>
                    {pageNumbers[0] > 2 && (
                      <span className="adm-pagination__info">…</span>
                    )}
                  </>
                )}

                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    className={`adm-pagination__btn${n === page ? ' adm-pagination__btn--active' : ''}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}

                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                      <span className="adm-pagination__info">…</span>
                    )}
                    <button
                      className="adm-pagination__btn"
                      onClick={() => setPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  className="adm-pagination__btn"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                >
                  →
                </button>

                <span className="adm-pagination__info">
                  {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Orders
