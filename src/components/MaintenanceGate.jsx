import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiTool, FiMail, FiPauseCircle } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { useStoreSettings } from '../hooks/useStoreSettings'
import './MaintenanceGate.css'

/**
 * Public ribbon shown to every visitor while ordering is paused, so nobody
 * discovers it only at the cart. Hidden during maintenance (the curtain or
 * the admin's maintenance ribbon takes over there).
 */
export const OrdersPausedRibbon = () => {
  const { settings } = useStoreSettings()
  if (!settings.orders_paused || settings.maintenance_mode) return null

  const message =
    settings.orders_paused_message?.trim() ||
    "We're not taking new orders right now — browsing is open, ordering resumes soon!"

  return (
    <div className="orders-paused-ribbon" role="status">
      <FiPauseCircle />
      <span>{message}</span>
    </div>
  )
}

// The admin must always be able to sign in to turn maintenance off —
// AdminRoute redirects a signed-out admin to /login, so gating these
// paths would lock them out of their own store.
const ALLOWED_PATHS = ['/login', '/register']

/**
 * Wraps the store routes (never /admin — that lives outside this tree).
 * When maintenance mode is ON:
 *  - visitors see a full-screen branded curtain on every store route
 *  - the admin sees the store normally, plus a ribbon reminding them
 *    that visitors currently see the maintenance screen
 */
const MaintenanceGate = ({ children }) => {
  const location = useLocation()
  const { isAdmin, loading: authLoading } = useAuth()
  const { settings, loading: settingsLoading } = useStoreSettings()

  if (!settings.maintenance_mode) return children
  if (ALLOWED_PATHS.includes(location.pathname)) return children

  // Fail-open while we don't yet know who the user is — avoids flashing
  // the curtain at the admin (and a maintenance flag can't be trusted
  // before settings have actually loaded)
  if (authLoading || settingsLoading) return children

  if (isAdmin) {
    return (
      <>
        <div className="maintenance-ribbon">
          <FiTool />
          <span>
            Maintenance mode is <strong>ON</strong> — visitors see the maintenance screen.
          </span>
          <Link to="/admin/settings">Manage</Link>
        </div>
        {children}
      </>
    )
  }

  return (
    <div className="maintenance-curtain">
      <motion.div
        className="maintenance-curtain__inner"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="maintenance-curtain__logo">🧶</span>
        <h1 className="maintenance-curtain__title">
          Nani <em>ki</em> Bunai
        </h1>
        <div className="maintenance-curtain__stitch" />
        <h2 className="maintenance-curtain__heading">We&rsquo;ll be back soon</h2>
        <p className="maintenance-curtain__message">
          {settings.maintenance_message?.trim() ||
            'Our little store is getting some love and care. Please check back in a while.'}
        </p>
        <a className="maintenance-curtain__contact" href="mailto:info@nanikibunai.com">
          <FiMail /> info@nanikibunai.com
        </a>
      </motion.div>
    </div>
  )
}

export default MaintenanceGate
