/**
 * Main App Component
 *
 * Now using Context Providers for global state management with Supabase!
 */

import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'

// Context Providers
import { AuthProvider } from './contexts/AuthContext'
import { ProductsProvider } from './contexts/ProductsContext'
import { CartProvider } from './contexts/CartContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { FlyToCartProvider, useFlyToCart } from './components/FlyToCart'

// Components
import Header from './components/Header'
import Cart from './components/Cart'
import SearchOverlay from './components/SearchOverlay'
import Hero from './components/Hero'
import Categories from './components/Categories'
import FeaturedProducts from './components/FeaturedProducts'
import Testimonials from './components/Testimonials'
import Story from './components/Story'
import Footer from './components/Footer'
import { SketchWaveDivider } from './components/SketchElements'

// Pages
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Favorites from './pages/Favorites'
import Collections from './pages/Collections'
import Contact from './pages/Contact'
import OurStory from './pages/OurStory'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'

import './App.css'

// Import hooks
import { useCart } from './hooks/useCart'
import { useFavorites } from './hooks/useFavorites'

/**
 * Scroll to top on route change
 */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

/**
 * Homepage composition — defined outside AppContent to prevent remounts
 */
const HomePage = () => (
  <>
    <Hero />
    <Categories />
    <SketchWaveDivider />
    <FeaturedProducts />
    <Testimonials />
    <SketchWaveDivider />
    <Story />
  </>
)

/**
 * Main App Content (wrapped by providers)
 */
function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Get cart and favorites from context
  const { cart, getTotalItems, updateQuantity, removeFromCart } = useCart()
  const { favorites, getFavoritesCount } = useFavorites()
  const { cartIconRef } = useFlyToCart()

  return (
    <Router>
      <ScrollToTop />
      <div className="App">
        <Header
          cartCount={getTotalItems()}
          favoritesCount={getFavoritesCount()}
          onCartClick={() => setIsCartOpen(true)}
          onSearchClick={() => setIsSearchOpen(true)}
          onFavoritesClick={() => {/* Will navigate to /favorites */}}
          cartIconRef={cartIconRef}
        />
        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/contact" element={<Contact />} />
          {/* <Route path="/our-story" element={<OurStory />} /> */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}

/**
 * App Component with Context Providers
 *
 * Provider hierarchy matters!
 * AuthProvider must be outermost (others depend on auth)
 * ProductsProvider is independent
 * CartProvider and FavoritesProvider depend on AuthProvider
 */
function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <FavoritesProvider>
            <FlyToCartProvider>
              <AppContent />
            </FlyToCartProvider>
          </FavoritesProvider>
        </CartProvider>
      </ProductsProvider>
    </AuthProvider>
  )
}

export default App
