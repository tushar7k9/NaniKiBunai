import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FiX,
  FiHome,
  FiGrid,
  FiMail,
  FiUser,
  FiPackage,
  FiHeart,
  FiLogOut,
  FiLogIn,
  FiMapPin,
  FiPhone,
} from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import './MobileMenu.css'

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

const MobileMenu = ({ isOpen, onClose, favoritesCount = 0 }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut, isAuthenticated, isAdmin } = useAuth()

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const go = (path) => {
    onClose()
    navigate(path)
  }

  const handleSignOut = async () => {
    onClose()
    await signOut()
    navigate('/')
  }

  const firstName = user?.user_metadata?.firstName || user?.user_metadata?.first_name
  const displayName = firstName || user?.email?.split('@')[0] || 'there'

  const browseLinks = [
    { path: '/', label: 'Home', icon: <FiHome /> },
    { path: '/products', label: 'Products', icon: <FiGrid /> },
    { path: '/contact', label: 'Contact', icon: <FiMail /> },
  ]

  // Portal to <body>: the header has backdrop-filter + motion transforms,
  // which would otherwise become the containing block for position:fixed
  // and confine the overlay/drawer to the header's box
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="mm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          <motion.aside
            className="mm-drawer"
            role="dialog"
            aria-label="Menu"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          >
            {/* Brand header */}
            <div className="mm-brand">
              <span className="mm-brand__logo">🧶</span>
              <div className="mm-brand__text">
                <span className="mm-brand__name">Nani <em>ki</em> Bunai</span>
                <span className="mm-brand__tag">handcrafted with love</span>
              </div>
              <button className="mm-close" onClick={onClose} aria-label="Close menu">
                <FiX />
              </button>
            </div>

            <motion.div
              className="mm-body"
              variants={listVariants}
              initial="hidden"
              animate="show"
            >
              {/* Browse */}
              <span className="mm-section-label">Browse</span>
              {browseLinks.map((link) => (
                <motion.button
                  key={link.path}
                  variants={itemVariants}
                  className={`mm-item${location.pathname === link.path ? ' mm-item--active' : ''}`}
                  onClick={() => go(link.path)}
                >
                  <span className="mm-item__icon">{link.icon}</span>
                  {link.label}
                </motion.button>
              ))}

              <div className="mm-divider" />

              {/* Account */}
              <span className="mm-section-label">Account</span>
              {isAuthenticated ? (
                <>
                  <motion.div className="mm-user" variants={itemVariants}>
                    <div className="mm-user__avatar">
                      {(firstName || user?.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="mm-user__text">
                      <span className="mm-user__name">Hi, {displayName}</span>
                      <span className="mm-user__email">{user?.email}</span>
                    </div>
                  </motion.div>

                  <motion.button
                    variants={itemVariants}
                    className={`mm-item${location.pathname === '/orders' ? ' mm-item--active' : ''}`}
                    onClick={() => go('/orders')}
                  >
                    <span className="mm-item__icon"><FiPackage /></span>
                    My Orders
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    className={`mm-item${location.pathname === '/favorites' ? ' mm-item--active' : ''}`}
                    onClick={() => go('/favorites')}
                  >
                    <span className="mm-item__icon"><FiHeart /></span>
                    Favorites
                    {favoritesCount > 0 && (
                      <span className="mm-item__badge">{favoritesCount}</span>
                    )}
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    className={`mm-item${location.pathname === '/profile' ? ' mm-item--active' : ''}`}
                    onClick={() => go('/profile')}
                  >
                    <span className="mm-item__icon"><FiUser /></span>
                    My Profile
                  </motion.button>

                  {isAdmin && (
                    <motion.button
                      variants={itemVariants}
                      className="mm-item mm-item--admin"
                      onClick={() => go('/admin')}
                    >
                      <span className="mm-item__icon"><FiGrid /></span>
                      Admin Dashboard
                    </motion.button>
                  )}

                  <motion.button
                    variants={itemVariants}
                    className="mm-item mm-item--signout"
                    onClick={handleSignOut}
                  >
                    <span className="mm-item__icon"><FiLogOut /></span>
                    Sign Out
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    variants={itemVariants}
                    className={`mm-item${location.pathname === '/favorites' ? ' mm-item--active' : ''}`}
                    onClick={() => go('/favorites')}
                  >
                    <span className="mm-item__icon"><FiHeart /></span>
                    Favorites
                    {favoritesCount > 0 && (
                      <span className="mm-item__badge">{favoritesCount}</span>
                    )}
                  </motion.button>
                  <motion.button
                    variants={itemVariants}
                    className="mm-signin"
                    onClick={() => go('/login')}
                  >
                    <FiLogIn />
                    Sign In / Register
                  </motion.button>
                </>
              )}
            </motion.div>

            {/* Footer */}
            <div className="mm-footer">
              <span><FiMapPin /> Gurugram, Haryana</span>
              <span><FiMail /> info@nanikibunai.com</span>
              <span><FiPhone /> +91 98765 43210</span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default MobileMenu
