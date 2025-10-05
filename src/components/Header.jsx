import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiShoppingCart, FiMenu, FiX, FiSearch, FiHeart } from 'react-icons/fi'
import './Header.css'

const Header = ({ cartCount, favoritesCount, onCartClick, onFavoritesClick }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
