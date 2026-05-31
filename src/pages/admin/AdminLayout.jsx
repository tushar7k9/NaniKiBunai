import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { FiGrid, FiShoppingBag, FiPackage, FiStar, FiMessageSquare, FiArrowLeft, FiMenu, FiX } from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import * as adminService from '../../services/adminService'
import './AdminLayout.css'

const AdminLayout = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    adminService.getUnreadCount().then(setUnreadCount).catch(() => {})
  }, [location.pathname])

  const navItems = [
    { to: '/admin', icon: <FiGrid />, label: 'Dashboard', end: true },
    { to: '/admin/orders', icon: <FiShoppingBag />, label: 'Orders' },
    { to: '/admin/products', icon: <FiPackage />, label: 'Products' },
    { to: '/admin/reviews', icon: <FiStar />, label: 'Reviews' },
    { to: '/admin/messages', icon: <FiMessageSquare />, label: 'Messages', badge: unreadCount },
  ]

  return (
    <div className="adm">
      {/* Mobile toggle */}
      <button className="adm-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`adm-sidebar${sidebarOpen ? ' adm-sidebar--open' : ''}`}>
        <div className="adm-sidebar__header">
          <span className="adm-sidebar__brand">NaniKiBunai</span>
          <span className="adm-sidebar__badge">Admin</span>
        </div>

        <nav className="adm-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `adm-nav__item${isActive ? ' adm-nav__item--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="adm-nav__icon">{item.icon}</span>
              <span className="adm-nav__label">{item.label}</span>
              {item.badge > 0 && <span className="adm-nav__badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="adm-sidebar__footer">
          <div className="adm-sidebar__user">
            <div className="adm-sidebar__avatar">
              {user?.user_metadata?.firstName?.[0] || 'A'}
            </div>
            <div className="adm-sidebar__user-info">
              <span className="adm-sidebar__user-name">
                {user?.user_metadata?.firstName || 'Admin'}
              </span>
              <span className="adm-sidebar__user-email">{user?.email}</span>
            </div>
          </div>
          <Link to="/" className="adm-sidebar__back">
            <FiArrowLeft /> Back to Store
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="adm-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
