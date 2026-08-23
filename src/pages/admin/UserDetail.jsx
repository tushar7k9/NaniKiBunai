import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  FiArrowLeft,
  FiShoppingBag,
  FiShoppingCart,
  FiHeart,
  FiStar,
  FiChevronDown,
  FiChevronUp,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiLogIn,
} from 'react-icons/fi'
import * as adminService from '../../services/adminService'
import { ADMIN_EMAIL } from '../../contexts/AuthContext'
import './UserDetail.css'

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`

const displayName = (user) => {
  const meta = user?.user_metadata || {}
  const first = meta.firstName || meta.first_name || ''
  const last = meta.lastName || meta.last_name || ''
  return `${first} ${last}`.trim()
}

const formatAddress = (addr) => {
  if (!addr) return null
  const parts = [addr.street, addr.city, addr.state, addr.zip || addr.zipCode || addr.pincode, addr.country]
    .filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

const Stars = ({ rating }) => (
  <span className="adm-user-detail__stars">
    {[1, 2, 3, 4, 5].map((n) => (
      <FiStar key={n} className={n <= rating ? 'adm-user-detail__star--filled' : 'adm-user-detail__star'} />
    ))}
  </span>
)

const UserDetail = () => {
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [cart, setCart] = useState([])
  const [favorites, setFavorites] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set())

  useEffect(() => {
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const loadUser = async () => {
    try {
      setLoading(true)
      setError(null)
      // User first — we need the email to match pre-signup guest orders
      const userData = await adminService.getAuthUser(userId)
      setUser(userData)

      const [ordersData, cartData, favoritesData, reviewsData] = await Promise.all([
        adminService.getUserOrdersAdmin(userId, userData.email),
        adminService.getUserCartAdmin(userId),
        adminService.getUserFavoritesAdmin(userId),
        adminService.getUserReviewsAdmin(userId),
      ])
      setOrders(ordersData)
      setCart(cartData)
      setFavorites(favoritesData)
      setReviews(reviewsData)
    } catch (err) {
      console.error('Failed to load user:', err)
      setError(err.message || 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  const toggleOrder = (id) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return <div className="adm-loading"><div className="adm-spinner" /></div>
  }

  if (error || !user) {
    return (
      <div className="adm-user-detail">
        <Link to="/admin/users" className="adm-user-detail__back">
          <FiArrowLeft /> Back to Users
        </Link>
        <div className="adm-empty">
          <p className="adm-empty__text">{error || 'User not found'}</p>
        </div>
      </div>
    )
  }

  const name = displayName(user)
  const meta = user.user_metadata || {}
  const address = formatAddress(meta.shippingAddress)
  const lifetimeValue = orders
    .filter((o) => !adminService.REVENUE_EXCLUDED_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

  const statCards = [
    { icon: <FiShoppingBag />, label: 'Orders', value: orders.length, color: '#5A3E85' },
    { icon: <FiShoppingBag />, label: 'Lifetime Value', value: formatCurrency(lifetimeValue), color: '#2d8659' },
    { icon: <FiShoppingCart />, label: 'Cart Items', value: cart.length, color: '#C4896A' },
    { icon: <FiHeart />, label: 'Favorites', value: favorites.length, color: '#c0392b' },
    { icon: <FiStar />, label: 'Reviews', value: reviews.length, color: '#D4AF37' },
  ]

  return (
    <div className="adm-user-detail">
      <Link to="/admin/users" className="adm-user-detail__back">
        <FiArrowLeft /> Back to Users
      </Link>

      {/* Profile header */}
      <div className="adm-user-detail__profile">
        <div className="adm-user-detail__avatar">
          {(name || user.email || '?')[0].toUpperCase()}
        </div>
        <div className="adm-user-detail__info">
          <div className="adm-user-detail__title-row">
            <h1 className="adm-user-detail__name">{name || user.email}</h1>
            {(user.email || '').toLowerCase() === ADMIN_EMAIL && (
              <span className="adm-badge adm-badge--admin">Admin</span>
            )}
            <span className={`adm-badge adm-badge--${user.email_confirmed_at ? 'active' : 'pending'}`}>
              {user.email_confirmed_at ? 'Confirmed' : 'Pending confirmation'}
            </span>
          </div>
          <div className="adm-user-detail__meta">
            <span><FiMail /> {user.email}</span>
            {(meta.phone || user.phone) && <span><FiPhone /> {meta.phone || user.phone}</span>}
            <span><FiCalendar /> Joined {formatDate(user.created_at)}</span>
            <span><FiLogIn /> Last sign-in {formatDate(user.last_sign_in_at)}</span>
            <span style={{ textTransform: 'capitalize' }}>Provider: {user.provider}</span>
          </div>
          {address && (
            <div className="adm-user-detail__address">
              <FiMapPin /> {address}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="adm-stats">
        {statCards.map((card, i) => (
          <div key={i} className="adm-stat-card">
            <div className="adm-stat-card__icon" style={{ color: card.color, background: `${card.color}12` }}>
              {card.icon}
            </div>
            <span className="adm-stat-card__label">{card.label}</span>
            <span className="adm-stat-card__value">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Orders */}
      <section className="adm-user-detail__section">
        <h2 className="adm-user-detail__section-title">Orders</h2>
        {orders.length === 0 ? (
          <div className="adm-empty"><p className="adm-empty__text">No orders yet</p></div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const expanded = expandedOrderIds.has(order.id)
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className="adm-user-detail__order-row"
                        onClick={() => toggleOrder(order.id)}
                      >
                        <td style={{ width: 30 }} data-cell="expand">
                          {expanded ? <FiChevronUp /> : <FiChevronDown />}
                        </td>
                        <td style={{ fontWeight: 500 }} data-cell="title">
                          {order.order_number}
                          {!order.user_id && (
                            <span className="adm-user-detail__guest-tag">guest</span>
                          )}
                        </td>
                        <td data-label="Date">{formatDate(order.created_at)}</td>
                        <td data-label="Items">{(order.order_items || []).length}</td>
                        <td data-label="Total">{formatCurrency(order.total_amount)}</td>
                        <td data-label="Status"><span className={`adm-badge adm-badge--${order.status}`}>{order.status}</span></td>
                        <td data-label="Payment"><span className={`adm-badge adm-badge--${order.payment_status || 'pending'}`}>{order.payment_status || 'pending'}</span></td>
                      </tr>
                      {expanded && (
                        <tr className="adm-user-detail__order-items" data-row="detail">
                          <td colSpan={7}>
                            <div className="adm-user-detail__items">
                              {(order.order_items || []).map((item) => {
                                const productName =
                                  item.products?.name || item.product_snapshot?.name || 'Product'
                                const image =
                                  item.products?.images?.[0] || item.product_snapshot?.image
                                return (
                                  <div key={item.id} className="adm-user-detail__item">
                                    {image && (
                                      <img src={image} alt={productName} className="adm-user-detail__item-img" />
                                    )}
                                    <div className="adm-user-detail__item-info">
                                      <span className="adm-user-detail__item-name">{productName}</span>
                                      <span className="adm-user-detail__item-meta">
                                        {[item.selected_color, item.selected_size].filter(Boolean).join(' · ')}
                                      </span>
                                    </div>
                                    <span className="adm-user-detail__item-qty">×{item.quantity}</span>
                                    <span className="adm-user-detail__item-price">
                                      {formatCurrency(item.total_price)}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Cart */}
      <section className="adm-user-detail__section">
        <h2 className="adm-user-detail__section-title">Current Cart</h2>
        {cart.length === 0 ? (
          <div className="adm-empty"><p className="adm-empty__text">Cart is empty</p></div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td data-cell="title">
                      <div className="adm-user-detail__product-cell">
                        {item.products?.images?.[0] && (
                          <img src={item.products.images[0]} alt="" className="adm-user-detail__item-img" />
                        )}
                        <span>{item.products?.name || 'Product'}</span>
                      </div>
                    </td>
                    <td data-label="Variant">{[item.selected_color, item.selected_size].filter(Boolean).join(' · ') || '—'}</td>
                    <td data-label="Qty">{item.quantity}</td>
                    <td data-label="Price">{formatCurrency(item.price_snapshot ?? item.products?.price ?? 0)}</td>
                    <td data-label="Added">{formatDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Favorites */}
      <section className="adm-user-detail__section">
        <h2 className="adm-user-detail__section-title">Favorites</h2>
        {favorites.length === 0 ? (
          <div className="adm-empty"><p className="adm-empty__text">No favorites yet</p></div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {favorites.map((fav) => (
                  <tr key={fav.id}>
                    <td data-cell="title">
                      <div className="adm-user-detail__product-cell">
                        {fav.products?.images?.[0] && (
                          <img src={fav.products.images[0]} alt="" className="adm-user-detail__item-img" />
                        )}
                        <span>{fav.products?.name || 'Product'}</span>
                      </div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }} data-label="Category">{fav.products?.category || '—'}</td>
                    <td data-label="Price">{formatCurrency(fav.products?.price ?? 0)}</td>
                    <td data-label="Added">{formatDate(fav.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Reviews */}
      <section className="adm-user-detail__section">
        <h2 className="adm-user-detail__section-title">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="adm-empty"><p className="adm-empty__text">No reviews yet</p></div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td data-cell="title">{review.products?.name || '—'}</td>
                    <td data-label="Rating"><Stars rating={review.rating} /></td>
                    <td className="adm-user-detail__review-text">
                      {review.title && <strong>{review.title} — </strong>}
                      {review.review_text
                        ? review.review_text.length > 100
                          ? review.review_text.slice(0, 100) + '…'
                          : review.review_text
                        : '—'}
                    </td>
                    <td data-label="Status">
                      <span className={`adm-badge adm-badge--${review.is_approved ? 'active' : 'pending'}`}>
                        {review.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td data-label="Date">{formatDate(review.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default UserDetail
