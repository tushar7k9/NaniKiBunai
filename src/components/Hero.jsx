import React from 'react'
import { motion } from 'framer-motion'
import WoolBall from './WoolBall'
import './Hero.css'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <motion.div
          className="hero-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Nani ki Bunai
          </motion.h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Where love meets every stitch
          </motion.p>
          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Discover the warmth of premium handcrafted clothing, lovingly made by skilled hands.
            Each piece tells a story of tradition, care, and timeless elegance.
          </motion.p>
          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <button className="btn-primary">Shop Collection</button>
            <button className="btn-secondary">Our Story</button>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-image"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <WoolBall />
        </motion.div>
      </div>

      <motion.div
        className="scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <span>Scroll to explore</span>
        <div className="scroll-line"></div>
      </motion.div>
    </section>
  )
}

export default Hero
