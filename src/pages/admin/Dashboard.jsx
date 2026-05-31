import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiShoppingBag, FiDollarSign, FiPackage, FiStar, FiMessageSquare, FiArrowRight } from 'react-icons/fi'
import * as adminService from '../../services/adminService'
import './Dashboard.css'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [recentMessages, setRecentMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const [statsData, ordersData, messagesData] = await Promise.all([
        adminService.getStats(),
        adminService.getAllOrders({ limit: 5 }),
        adminService.getAllMessages({ status: 'new' }),
      ])
      setStats(statsData)
      setRecentOrders(ordersData.orders)
      setRecentMessages(messagesData.slice(0, 5))
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="adm-loading"><div className="adm-spinner" /></div>
  }

  const statCards = [
    { icon: <FiShoppingBag />, label: 'Total Orders', value: stats?.totalOrders || 0, color: '#5A3E85' },
    { icon: <FiDollarSign />, label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, color: '#2d8659' },
    { icon: <FiPackage />, label: 'Active Products', value: `${stats?.activeProducts || 0}/${stats?.totalProducts || 0}`, color: '#C4896A' },
    { icon: <FiStar />, label: 'Pending Reviews', value: stats?.pendingReviews || 0, color: '#D4AF37' },
    { icon: <FiMessageSquare />, label: 'Unread Messages', value: stats?.unreadMessages || 0, color: '#c0392b' },
  ]

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="adm-dashboard">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Dashboard</h1>
          <p className="adm-page-sub">Welcome back! Here's what's happening.</p>
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

      <div className="adm-dashboard__grid">
        {/* Recent Orders */}
        <div className="adm-dashboard__section">
          <div className="adm-dashboard__section-header">
            <h2 className="adm-dashboard__section-title">Recent Orders</h2>
            <Link to="/admin/orders" className="adm-dashboard__view-all">View All <FiArrowRight /></Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="adm-empty"><p className="adm-empty__text">No orders yet</p></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 500 }}>{order.order_number}</td>
                      <td>{order.customer_email || '—'}</td>
                      <td>₹{Number(order.total_amount).toLocaleString('en-IN')}</td>
                      <td><span className={`adm-badge adm-badge--${order.status}`}>{order.status}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Messages */}
        <div className="adm-dashboard__section">
          <div className="adm-dashboard__section-header">
            <h2 className="adm-dashboard__section-title">Unread Messages</h2>
            <Link to="/admin/messages" className="adm-dashboard__view-all">View All <FiArrowRight /></Link>
          </div>
          {recentMessages.length === 0 ? (
            <div className="adm-empty"><p className="adm-empty__text">No unread messages</p></div>
          ) : (
            <div className="adm-dashboard__messages">
              {recentMessages.map(msg => (
                <div key={msg.id} className="adm-dashboard__msg">
                  <div className="adm-dashboard__msg-header">
                    <span className="adm-dashboard__msg-name">{msg.name}</span>
                    <span className="adm-dashboard__msg-date">{formatDate(msg.created_at)}</span>
                  </div>
                  {msg.subject && <span className="adm-dashboard__msg-subject">{msg.subject}</span>}
                  <p className="adm-dashboard__msg-preview">
                    {msg.message.length > 120 ? msg.message.slice(0, 120) + '...' : msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
