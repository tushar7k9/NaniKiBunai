import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import './FlyToCart.css'

const FlyToCartContext = createContext(null)

export const useFlyToCart = () => useContext(FlyToCartContext)

export const FlyToCartProvider = ({ children }) => {
  const [flyItems, setFlyItems] = useState([])
  const cartIconRef = useRef(null)

  const fly = useCallback((imageSrc, startRect) => {
    if (!cartIconRef.current) return

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

  return (
    <FlyToCartContext.Provider value={{ fly, cartIconRef }}>
      {children}
      <div className="fly-layer">
        {flyItems.map(item => (
          <FlyingItem key={item.id} {...item} />
        ))}
      </div>
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
