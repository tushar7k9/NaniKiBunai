/**
 * Main App Component
 *
 * Now using Context Providers for global state management with Supabase!
 */

import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'

// Context Providers
import { AuthProvider } from './contexts/AuthContext'
import { StoreSettingsProvider } from './contexts/StoreSettingsContext'
import { ProductsProvider } from './contexts/ProductsContext'
import { CartProvider } from './contexts/CartContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { FlyToCartProvider, useFlyToCart } from './components/FlyToCart'

// Components
import Header from './components/Header'
import Cart from './components/Cart'
import SearchOverlay from './components/SearchOverlay'
import MaintenanceGate from './components/MaintenanceGate'
import AnnouncementBanner from './components/AnnouncementBanner'
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

// Admin — all lazy-loaded: shoppers never download the admin area
// (pages, admin CSS, recharts). Loaded on demand when the admin logs in.
import AdminRoute from './components/AdminRoute'
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'))
const AdminOrders = React.lazy(() => import('./pages/admin/Orders'))
const AdminProducts = React.lazy(() => import('./pages/admin/Products'))
const AdminReviews = React.lazy(() => import('./pages/admin/Reviews'))
const AdminMessages = React.lazy(() => import('./pages/admin/Messages'))
const AdminUsers = React.lazy(() => import('./pages/admin/Users'))
const AdminUserDetail = React.lazy(() => import('./pages/admin/UserDetail'))
const AdminAnalytics = React.lazy(() => import('./pages/admin/Analytics'))
const AdminSettings = React.lazy(() => import('./pages/admin/Settings'))

// Inline styles: the admin CSS itself is lazy, so the fallback can't rely on it
const AdminFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      border: '3px solid rgba(196, 137, 106, 0.25)', borderTopColor: '#C4896A',
      animation: 'spin 0.6s linear infinite',
    }} />
    <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
  </div>
)

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
  const { cartIconRef, registerCartOpener } = useFlyToCart()

  // Let the mobile "added to bag" toast open the cart drawer
  useEffect(() => {
    registerCartOpener(() => setIsCartOpen(true))
  }, [registerCartOpener])

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Admin routes — separate layout, no Header/Footer */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <React.Suspense fallback={<AdminFallback />}>
                <AdminLayout />
              </React.Suspense>
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:userId" element={<AdminUserDetail />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Store routes */}
        <Route path="*" element={
          <div className="App">
            <AnnouncementBanner />
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
            <MaintenanceGate>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
              </Routes>
            </MaintenanceGate>
            <Footer />
          </div>
        } />
      </Routes>
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
      <StoreSettingsProvider>
        <ProductsProvider>
          <CartProvider>
            <FavoritesProvider>
              <FlyToCartProvider>
                <AppContent />
              </FlyToCartProvider>
            </FavoritesProvider>
          </CartProvider>
        </ProductsProvider>
      </StoreSettingsProvider>
    </AuthProvider>
  )
}

export default App
