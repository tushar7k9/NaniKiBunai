import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LuHand, LuLeaf, LuPackage, LuHeart } from 'react-icons/lu'
import { SketchStar, SketchSparkle, SketchStitch } from './SketchElements'
import './Hero.css'

const Hero = () => {
  const navigate = useNavigate()

  return (
    <section className="hero">
      {/* Subtle background shapes */}
      <div className="hero-bg-shape hero-bg-shape--1" aria-hidden="true" />
      <div className="hero-bg-shape hero-bg-shape--2" aria-hidden="true" />

      <div className="hero-content">
        {/* Left — Text */}
        <motion.div
          className="hero-text"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.p
            className="hero-eyebrow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Handcrafted with Love
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            Nani ki{' '}
            <span className="hero-highlight">
              <em>Bunai</em>
              <SketchStitch className="hero-stitch-accent" width={90} color="var(--terracotta-light)" />
            </span>
          </motion.h1>

          <motion.p
            className="hero-tagline"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Where every stitch tells a <span className="accent-text">story</span>
          </motion.p>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
          >
            Discover premium handcrafted clothing, lovingly made by skilled artisans.
            Each piece carries the warmth and timeless elegance of generations.
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <motion.button
              className="btn-primary"
              onClick={() => navigate('/products')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Shop Collection
            </motion.button>
            {/* <motion.button
              className="btn-secondary"
              onClick={() => navigate('/our-story')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Our Story
            </motion.button> */}
          </motion.div>
        </motion.div>

        {/* Right — Image */}
        <motion.div
          className="hero-image"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-image-frame">
            <img
              src="https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=700&q=80"
              alt="Handcrafted knitted scarf - Nani ki Bunai"
              className="hero-product-img"
            />
          </div>

          {/* Floating card */}
          <motion.div
            className="hero-floating-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
          >
            <span className="floating-card-icon">🧶</span>
            <div>
              <p className="floating-card-title">100% Handmade</p>
              <p className="floating-card-sub">Premium Natural Wool</p>
            </div>
          </motion.div>

          {/* Sketch accents on image */}
          <SketchStar className="hero-sketch-star" size={24} delay={1.4} color="var(--accent-gold)" />
          <SketchSparkle className="hero-sketch-sparkle" size={18} delay={1.6} />
        </motion.div>
      </div>

      {/* Trust strip */}
      <motion.div
        className="hero-trust"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.3 }}
      >
        <div className="trust-item">
          <LuHand className="trust-icon" aria-hidden="true" />
          <span>Handmade</span>
        </div>
        <div className="trust-dot" />
        <div className="trust-item">
          <LuLeaf className="trust-icon" aria-hidden="true" />
          <span>Natural Wool</span>
        </div>
        <div className="trust-dot" />
        <div className="trust-item">
          <LuPackage className="trust-icon" aria-hidden="true" />
          <span>Ships in 3&ndash;5 Days</span>
        </div>
        <div className="trust-dot" />
        <div className="trust-item">
          <LuHeart className="trust-icon" aria-hidden="true" />
          <span>Made with Love</span>
        </div>
      </motion.div>
    </section>
  )
}

export default Hero
