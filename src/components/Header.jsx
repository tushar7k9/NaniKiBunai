import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiShoppingCart, FiMenu, FiX, FiSearch, FiHeart, FiUser, FiLogOut } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Header.css'

const Header = ({ cartCount, favoritesCount, onCartClick, onFavoritesClick }) => {
  const navigate = useNavigate()
  const { user, signOut, isAuthenticated } = useAuth()
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
        <div className="header-logo">
          <motion.h1
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Nani ki Bunai
          </motion.h1>
        </div>

        <nav className={`header-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <a href="/">Home</a>
          <a href="/collections">Collections</a>
          <a href="/products">Products</a>
          <a href="/our-story">Our Story</a>
          <a href="/contact">Contact</a>
        </nav>

        <div className="header-actions">
          <motion.button
            className="icon-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiSearch />
          </motion.button>

          <motion.button
            className="icon-btn favorites-btn"
            onClick={() => window.location.href = '/favorites'}
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
                className="icon-btn user-btn"
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

                  <button
                    className="dropdown-item"
                    onClick={handleProfileClick}
                  >
                    <FiUser />
                    <span>My Profile</span>
                  </button>

                  <button
                    className="dropdown-item"
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
