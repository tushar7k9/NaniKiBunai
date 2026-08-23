import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiShoppingCart, FiMenu, FiX, FiSearch, FiHeart, FiUser, FiLogOut, FiPackage, FiGrid } from 'react-icons/fi'
import { GiWool } from 'react-icons/gi'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import MobileMenu from './MobileMenu'
import './Header.css'

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* An "i" whose dot is our own element (the stem is a dotless ı), so the
   brand animation can hide the dots and stamp them back one by one */
const DottedI = ({ dotRef, visible }) => (
  <span className="brand-i">
    ı
    <span ref={dotRef} className="brand-i__dot" style={{ opacity: visible ? 1 : 0 }} />
  </span>
)

/* Timeline of the brand intro, in seconds (relative to animation start).
   One continuous keyframe animation — no segment handoffs to drop frames. */
const T = {
  land: 0.28,       // ball lands on Bunai's i
  bounce: 0.38,     // little bounce
  settle: 0.46,
  hop1: 0.58,       // departs Bunai → stamps its dot
  apex1: 0.76,
  ki: 0.94,
  hop2: 1.06,       // departs ki
  apex2: 1.24,
  nani: 1.42,
  leap: 1.56,       // departs Nani for the icon slot
  apexL: 1.78,
  done: 2.0,
}
const START_DELAY = 0.55 // let the header finish sliding in

/* Brand logo with the home-page intro: a mini wool ball drops onto the "i"
   of Bunai, hops right-to-left across ki and Nani (stamping each dot as it
   departs), then leaps into the icon slot growing into the full mark. */
const BrandLogo = ({ onClick }) => {
  const location = useLocation()
  const isHome = location.pathname === '/'

  // 'static' → normal logo · 'prep' → dots/icon hidden, measuring ·
  // 'play' → traveller in flight · 'done' → finished (≡ static)
  const [step, setStep] = useState(() => (isHome && !REDUCED_MOTION ? 'prep' : 'static'))
  const [pts, setPts] = useState(null)
  const [stamped, setStamped] = useState({ b: false, k: false, n: false })
  const timersRef = useRef([])

  const brandRef = useRef(null)
  const iconRef = useRef(null)
  const naniRef = useRef(null)
  const kiRef = useRef(null)
  const bunaiRef = useRef(null)

  useEffect(() => {
    if (!isHome || REDUCED_MOTION) {
      setStep('static')
      return
    }
    let cancelled = false
    setStep('prep')
    setStamped({ b: false, k: false, n: false })
    Promise.resolve(document.fonts?.ready).then(() =>
      requestAnimationFrame(() => {
        if (cancelled || !brandRef.current) return
        const hr = brandRef.current.getBoundingClientRect()
        const center = (el) => {
          const r = el.getBoundingClientRect()
          return { x: r.left - hr.left + r.width / 2, y: r.top - hr.top + r.height / 2 }
        }
        const iconSvg = iconRef.current?.querySelector('svg')
        if (!iconSvg || !bunaiRef.current || !kiRef.current || !naniRef.current) return
        // The traveller is a mini wool ball — bigger than the i-dots it stamps
        const tSize = Math.max(12, bunaiRef.current.getBoundingClientRect().width * 2.6)
        setPts({
          tSize,
          hop: hr.height * 0.55,
          grow: iconSvg.getBoundingClientRect().width / tSize,
          b: center(bunaiRef.current),
          k: center(kiRef.current),
          n: center(naniRef.current),
          i: center(iconSvg),
        })
        setStep('play')
        // Stamp each dot exactly when the ball departs it; reveal the icon
        // as the ball lands on it
        const at = (sec, fn) => timersRef.current.push(setTimeout(fn, (START_DELAY + sec) * 1000))
        at(T.hop1, () => setStamped((s) => ({ ...s, b: true })))
        at(T.hop2, () => setStamped((s) => ({ ...s, k: true })))
        at(T.leap, () => setStamped((s) => ({ ...s, n: true })))
        at(T.done, () => setStep('done'))
      })
    )
    return () => {
      cancelled = true
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [isHome, location.key])

  const playing = step === 'play'
  const dotVisible = (key) => (step === 'static' || step === 'done' ? true : stamped[key])
  // The traveller lands as the full-size icon, then the real icon takes over
  const iconShown = step === 'static' || step === 'done'

  // The full journey as one keyframed path: drop, bounce, two hops, leap
  const seg = React.useMemo(() => {
    if (!pts) return null
    const o = pts.tSize / 2
    const { b, k, n, i, hop, grow } = pts
    const apex = (p, q, h) => Math.min(p.y, q.y) - h - o
    const D = T.done
    return {
      x: [b.x - o, b.x - o, b.x - o, b.x - o, b.x - o, (b.x + k.x) / 2 - o, k.x - o, k.x - o, (k.x + n.x) / 2 - o, n.x - o, n.x - o, (n.x + i.x) / 2 - o, i.x - o],
      y: [b.y - o - 34, b.y - o, b.y - o - 9, b.y - o, b.y - o, apex(b, k, hop), k.y - o, k.y - o, apex(k, n, hop), n.y - o, n.y - o, apex(n, i, hop), i.y - o],
      opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      rotate: [-120, 0, 0, 0, 0, -90, -180, -180, -270, -360, -360, -540, -720],
      scale: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, grow * 0.6, grow],
      transition: {
        duration: D,
        delay: START_DELAY,
        ease: 'easeInOut',
        times: [0, T.land, T.bounce, T.settle, T.hop1, T.apex1, T.ki, T.hop2, T.apex2, T.nani, T.leap, T.apexL, T.done].map((t) => t / D),
      },
    }
  }, [pts])

  return (
    <div className="header-logo" onClick={onClick}>
      <motion.h1
        ref={brandRef}
        aria-label="Nani ki Bunai"
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
      >
        <motion.span
          ref={iconRef}
          className="logo-yarn"
          aria-hidden="true"
          whileHover={{ rotate: 20 }}
          initial={false}
          animate={
            iconShown
              ? step === 'static'
                ? { opacity: 1, scale: 1, rotate: 0 }
                : { opacity: 1, scale: [1.06, 1], rotate: 0, transition: { duration: 0.2 } }
              : { opacity: 0, scale: 1, rotate: 0, transition: { duration: 0 } }
          }
          transition={{ duration: 0.2 }}
        ><GiWool /></motion.span>
        {' '}
        <span aria-hidden="true">Nan<DottedI dotRef={naniRef} visible={dotVisible('n')} /></span>
        <em aria-hidden="true">k<DottedI dotRef={kiRef} visible={dotVisible('k')} /></em>
        <span aria-hidden="true">Buna<DottedI dotRef={bunaiRef} visible={dotVisible('b')} /></span>
        {playing && pts && seg && (
          <motion.span
            className="brand-traveler"
            style={{ width: pts.tSize, height: pts.tSize }}
            initial={{
              x: pts.b.x - pts.tSize / 2,
              y: pts.b.y - pts.tSize / 2 - 34,
              opacity: 0, rotate: -120, scale: 1,
            }}
            animate={seg}
            transition={seg.transition}
          >
            <GiWool size={pts.tSize} aria-hidden="true" />
          </motion.span>
        )}
      </motion.h1>
    </div>
  )
}

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
        <BrandLogo onClick={() => navigate('/')} />

        {/* Desktop nav — mobile uses the MobileMenu drawer below */}
        <nav className="header-nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/products" className={location.pathname === '/products' ? 'active' : ''}>Products</Link>
          {/* <Link to="/our-story" className={location.pathname === '/our-story' ? 'active' : ''}>Our Story</Link> */}
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Contact</Link>
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
            aria-label="Open menu"
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        favoritesCount={favoritesCount}
      />
    </motion.header>
  )
}

export default Header
