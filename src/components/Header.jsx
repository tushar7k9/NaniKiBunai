import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiShoppingCart, FiMenu, FiX, FiSearch, FiHeart, FiUser, FiLogOut, FiPackage, FiGrid } from 'react-icons/fi'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Header.css'

const Header = ({ cartCount, favoritesCount, onCartClick, onFavoritesClick, cartIconRef, onSearchClick }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut, isAuthenticated, isAdmin } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setIsUserMenuOpen(false)
    navigate('/')
  }

  const handleSignIn = () => {
    navigate('/login')
  }

  const handleProfileClick = () => {
    setIsUserMenuOpen(false)
    navigate('/profile')
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isUserMenuOpen && !e.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isUserMenuOpen])

  return (
    <motion.header
      className={`header ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="header-container">
        <div className="header-logo" onClick={() => navigate('/')}>
          <motion.h1
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            <motion.span
              className="logo-yarn"
              whileHover={{ rotate: 20 }}
              transition={{ duration: 0.3 }}
            >🧶</motion.span>
            {' '}Nani <em>ki</em> Bunai
          </motion.h1>
        </div>

        {isMobileMenuOpen && (
          <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        <nav className={`header-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link to="/products" className={location.pathname === '/products' ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Products</Link>
          {/* <Link to="/our-story" className={location.pathname === '/our-story' ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Our Story</Link> */}
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
        </nav>

        <div className="header-actions">
          <motion.button
            className="icon-btn"
            onClick={onSearchClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiSearch />
          </motion.button>

          <motion.button
            className={`icon-btn favorites-btn${location.pathname === '/favorites' ? ' icon-btn--active' : ''}`}
            onClick={() => navigate('/favorites')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiHeart />
            {favoritesCount > 0 && (
              <motion.span
                className="favorites-count"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                {favoritesCount}
              </motion.span>
            )}
          </motion.button>

          <motion.button
            ref={cartIconRef}
            className="icon-btn cart-btn"
            onClick={onCartClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiShoppingCart />
            {cartCount > 0 && (
              <motion.span
                className="cart-count"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                {cartCount}
              </motion.span>
            )}
          </motion.button>

          {isAuthenticated ? (
            <div className="user-menu-container">
              <motion.button
                className={`icon-btn user-btn${['/profile', '/orders'].includes(location.pathname) ? ' icon-btn--active' : ''}`}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="My Account"
              >
                <FiUser />
              </motion.button>

              {isUserMenuOpen && (
                <motion.div
                  className="user-dropdown"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="user-info">
                    <div className="user-avatar">
                      <FiUser />
                    </div>
                    <div className="user-details">
                      <p className="user-name">
                        {user?.user_metadata?.firstName || 'User'}
                      </p>
                      <p className="user-email">{user?.email}</p>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  {isAdmin && (
                    <button
                      className={`dropdown-item dropdown-item--admin${location.pathname.startsWith('/admin') ? ' dropdown-item--active' : ''}`}
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        navigate('/admin')
                      }}
                    >
                      <FiGrid />
                      <span>Admin Dashboard</span>
                    </button>
                  )}

                  <button
                    className={`dropdown-item${location.pathname === '/profile' ? ' dropdown-item--active' : ''}`}
                    onClick={handleProfileClick}
                  >
                    <FiUser />
                    <span>My Profile</span>
                  </button>

                  <button
                    className={`dropdown-item${location.pathname === '/orders' ? ' dropdown-item--active' : ''}`}
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      navigate('/orders')
                    }}
                  >
                    <FiPackage />
                    <span>My Orders</span>
                  </button>

                  <button
                    className={`dropdown-item${location.pathname === '/favorites' ? ' dropdown-item--active' : ''}`}
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      navigate('/favorites')
                    }}
                  >
                    <FiHeart />
                    <span>Favorites</span>
                  </button>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item logout-item"
                    onClick={handleSignOut}
                  >
                    <FiLogOut />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <motion.button
              className="icon-btn login-btn"
              onClick={handleSignIn}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Sign In"
            >
              <FiUser />
            </motion.button>
          )}

          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </motion.header>
  )
}

export default Header
