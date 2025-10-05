import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Cart from './components/Cart'
import Hero from './components/Hero'
import Categories from './components/Categories'
import FeaturedProducts from './components/FeaturedProducts'
import Story from './components/Story'
import Footer from './components/Footer'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Favorites from './pages/Favorites'
import Collections from './pages/Collections'
import Contact from './pages/Contact'
import OurStory from './pages/OurStory'
import './App.css'

function App() {
  const [cart, setCart] = useState([])
  const [favorites, setFavorites] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const addToCart = (product) => {
    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(item => item.id === product.id)

    if (existingItemIndex !== -1) {
      // Update quantity if product exists
      const updatedCart = [...cart]
      updatedCart[existingItemIndex].quantity = product.quantity
      setCart(updatedCart)
    } else {
      // Add new product to cart
      setCart([...cart, product])
    }
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId)
      return
    }

    const updatedCart = cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    )
    setCart(updatedCart)
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const toggleFavorite = (productId) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId))
    } else {
      setFavorites([...favorites, productId])
    }
  }

  const HomePage = () => (
    <>
      <Hero />
      <Categories />
      <FeaturedProducts addToCart={addToCart} />
      <Story />
    </>
  )

  return (
    <Router>
      <div className="App">
        <Header
          cartCount={getTotalItems()}
          favoritesCount={favorites.length}
          onCartClick={() => setIsCartOpen(true)}
          onFavoritesClick={() => {}}
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
          <Route path="/products" element={<Products addToCart={addToCart} cart={cart} favorites={favorites} toggleFavorite={toggleFavorite} />} />
          <Route path="/product/:id" element={<ProductDetail addToCart={addToCart} cart={cart} favorites={favorites} toggleFavorite={toggleFavorite} />} />
          <Route path="/favorites" element={<Favorites favorites={favorites} toggleFavorite={toggleFavorite} addToCart={addToCart} cart={cart} />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/our-story" element={<OurStory />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}

export default App
