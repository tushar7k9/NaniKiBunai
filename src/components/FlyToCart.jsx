import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheckCircle } from 'react-icons/fi'
import './FlyToCart.css'

const FlyToCartContext = createContext(null)

export const useFlyToCart = () => useContext(FlyToCartContext)

const TOAST_DURATION = 3000

// Coarse-pointer devices get the mobile feedback (toast + fly-from-button)
const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none), (pointer: coarse)').matches

export const FlyToCartProvider = ({ children }) => {
  const [flyItems, setFlyItems] = useState([])
  const [toast, setToast] = useState(null) // { id, imageSrc, name }
  const cartIconRef = useRef(null)
  const cartOpenerRef = useRef(null)
  const toastTimerRef = useRef(null)

  const fly = useCallback((imageSrc, startRect) => {
    if (!cartIconRef.current || !startRect) return

    const cartRect = cartIconRef.current.getBoundingClientRect()
    const id = Date.now() + Math.random()

    setFlyItems(prev => [...prev, {
      id,
      imageSrc,
      startX: startRect.left + startRect.width / 2 - 32,
      startY: startRect.top + startRect.height / 2 - 32,
      endX: cartRect.left + cartRect.width / 2 - 10,
      endY: cartRect.top + cartRect.height / 2 - 10,
    }])

    // Bounce cart icon near end of flight
    setTimeout(() => {
      if (!cartIconRef.current) return
      cartIconRef.current.classList.add('cart-bounce')
      setTimeout(() => cartIconRef.current?.classList.remove('cart-bounce'), 500)
    }, 950)

    // Cleanup
    setTimeout(() => {
      setFlyItems(prev => prev.filter(item => item.id !== id))
    }, 1300)
  }, [])

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimerRef.current)
    setToast(null)
  }, [])

  /**
   * Unified "added to bag" feedback.
   * Desktop: fly the image from the product photo to the cart icon (unchanged).
   * Touch/mobile: fly from the tapped button (the photo may be scrolled
   * off-screen) AND show a confirmation toast with a View Bag action.
   */
  const notifyAdded = useCallback(({ imageSrc, name, imageRect, buttonRect }) => {
    const touch = isTouchDevice()
    const startRect = touch ? (buttonRect || imageRect) : (imageRect || buttonRect)
    fly(imageSrc, startRect)

    if (touch) {
      clearTimeout(toastTimerRef.current)
      setToast({ id: Date.now(), imageSrc, name })
      toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION)
    }
  }, [fly])

  // The cart drawer lives in AppContent — it registers its opener here so
  // the toast's "View Bag" button can open it
  const registerCartOpener = useCallback((fn) => {
    cartOpenerRef.current = fn
  }, [])

  const handleViewBag = useCallback(() => {
    dismissToast()
    cartOpenerRef.current?.()
  }, [dismissToast])

  useEffect(() => () => clearTimeout(toastTimerRef.current), [])

  return (
    <FlyToCartContext.Provider value={{ fly, notifyAdded, cartIconRef, registerCartOpener }}>
      {children}
      <div className="fly-layer">
        {flyItems.map(item => (
          <FlyingItem key={item.id} {...item} />
        ))}
      </div>

      {/* Mobile "added to bag" toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="added-toast"
            role="status"
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <img className="added-toast__img" src={toast.imageSrc} alt="" onClick={dismissToast} />
            <div className="added-toast__text" onClick={dismissToast}>
              <span className="added-toast__title">
                <FiCheckCircle /> Added to bag
              </span>
              {toast.name && <span className="added-toast__name">{toast.name}</span>}
            </div>
            <button className="added-toast__cta" onClick={handleViewBag}>
              View Bag
            </button>
            <motion.div
              key={`bar-${toast.id}`}
              className="added-toast__progress"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </FlyToCartContext.Provider>
  )
}

const FlyingItem = ({ imageSrc, startX, startY, endX, endY }) => {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    el.style.setProperty('--fly-start-x', `${startX}px`)
    el.style.setProperty('--fly-start-y', `${startY}px`)
    el.style.setProperty('--fly-end-x', `${endX}px`)
    el.style.setProperty('--fly-end-y', `${endY}px`)

    // Force a reflow then trigger animation
    void el.offsetHeight
    el.classList.add('fly-item--active')
  }, [startX, startY, endX, endY])

  return (
    <div ref={ref} className="fly-item">
      <img src={imageSrc} alt="" />
    </div>
  )
}
