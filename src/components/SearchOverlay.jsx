import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiX, FiArrowRight } from 'react-icons/fi'
import { useProducts } from '../hooks/useProducts'
import './SearchOverlay.css'

const recentSearchesKey = 'nkb_recent_searches'
const MAX_RECENT = 5

const getRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem(recentSearchesKey)) || []
  } catch { return [] }
}

const saveRecentSearch = (query) => {
  const recent = getRecentSearches().filter(q => q !== query)
  recent.unshift(query)
  localStorage.setItem(recentSearchesKey, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

const SearchOverlay = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { searchProducts } = useProducts()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState([])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setRecentSearches(getRecentSearches())
      // Small delay to let animation start
      setTimeout(() => inputRef.current?.focus(), 150)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose])

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return []
    return searchProducts(query).slice(0, 8)
  }, [query, searchProducts])

  const handleSelect = (product) => {
    saveRecentSearch(query.trim())
    onClose()
    navigate(`/product/${product.id}`)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    saveRecentSearch(query.trim())
    onClose()
    navigate(`/products?q=${encodeURIComponent(query.trim())}`)
  }

  const handleRecentClick = (q) => {
    setQuery(q)
  }

  const clearRecent = () => {
    localStorage.removeItem(recentSearchesKey)
    setRecentSearches([])
  }

  const showRecent = query.length < 2 && recentSearches.length > 0
  const showResults = query.length >= 2
  const noResults = showResults && results.length === 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="search-panel"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <form onSubmit={handleSubmit} className="search-input-wrap">
              <FiSearch className="search-input__icon" />
              <input
                ref={inputRef}
                className="search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products..."
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="search-input__clear"
                  onClick={() => { setQuery(''); inputRef.current?.focus() }}
                >
                  <FiX />
                </button>
              )}
              <button type="submit" className="search-input__submit">
                <FiArrowRight />
              </button>
            </form>

            <div className="search-body">
              {/* Recent Searches */}
              {showRecent && (
                <div className="search-section">
                  <div className="search-section__header">
                    <span className="search-section__label">Recent</span>
                    <button className="search-section__clear" onClick={clearRecent}>Clear</button>
                  </div>
                  <div className="search-recent">
                    {recentSearches.map((q, i) => (
                      <button key={i} className="search-recent__item" onClick={() => handleRecentClick(q)}>
                        <FiSearch /> {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {showResults && !noResults && (
                <div className="search-section">
                  <span className="search-section__label">{results.length} result{results.length !== 1 ? 's' : ''}</span>
                  <div className="search-results">
                    {results.map((product, i) => (
                      <motion.button
                        key={product.id}
                        className="search-result"
                        onClick={() => handleSelect(product)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                      >
                        <img
                          src={product.images?.[0]}
                          alt={product.name}
                          className="search-result__img"
                        />
                        <div className="search-result__info">
                          <span className="search-result__category">{product.category}</span>
                          <span className="search-result__name">{product.name}</span>
                          <span className="search-result__price">&#8377;{product.price}</span>
                        </div>
                        <FiArrowRight className="search-result__arrow" />
                      </motion.button>
                    ))}
                  </div>

                  {results.length >= 8 && (
                    <button className="search-view-all" onClick={handleSubmit}>
                      View all results for "{query}"
                    </button>
                  )}
                </div>
              )}

              {/* No Results */}
              {noResults && (
                <div className="search-empty">
                  <p className="search-empty__text">No products found for "{query}"</p>
                  <p className="search-empty__hint">Try a different search term</p>
                </div>
              )}

              {/* Empty state — no query yet */}
              {!showRecent && !showResults && (
                <div className="search-idle">
                  <p className="search-idle__text">Start typing to search our collection</p>
                </div>
              )}
            </div>

            {/* Keyboard hint */}
            <div className="search-footer">
              <span><kbd>Esc</kbd> to close</span>
              <span><kbd>Enter</kbd> to search all</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SearchOverlay
