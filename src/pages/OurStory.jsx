import React, { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { FiHeart, FiAward, FiUsers, FiTrendingUp } from 'react-icons/fi'
import './OurStory.css'

const OurStory = () => {
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  const timeline = [
    {
      year: '1970',
      title: 'The Beginning',
      description: 'A young grandmother learned to knit from her own nani, starting a tradition that would span generations.',
      emoji: '🧶',
      color: '#FFB6C1'
    },
    {
      year: '1985',
      title: 'First Workshop',
      description: 'Opened a small workshop in the neighborhood, teaching local children and adults the art of knitting.',
      emoji: '🏠',
      color: '#87CEEB'
    },
    {
      year: '1995',
      title: 'Family Business',
      description: 'Daughters and granddaughters joined the craft, bringing new designs while preserving traditional techniques.',
      emoji: '👨‍👩‍👧‍👦',
      color: '#98FB98'
    },
    {
      year: '2005',
      title: 'Award Recognition',
      description: 'Received the "Master Craftsperson" award for excellence in traditional handcrafts.',
      emoji: '🏆',
      color: '#FFD700'
    },
    {
      year: '2010',
      title: 'Going Digital',
      description: 'Launched online presence, sharing patterns and finished pieces with the world.',
      emoji: '💻',
      color: '#DDA0DD'
    },
    {
      year: '2015',
      title: '10,000th Item',
      description: 'Celebrated creating the 10,000th handmade item, each one unique and made with love.',
      emoji: '🎉',
      color: '#FFA500'
    },
    {
      year: '2020',
      title: 'Community Growth',
      description: 'Built a community of 5,000+ knitting enthusiasts sharing techniques and stories.',
      emoji: '🌍',
      color: '#FF6B9D'
    },
    {
      year: '2024',
      title: 'Today',
      description: 'Three generations working together, creating beautiful pieces and keeping traditions alive.',
      emoji: '✨',
      color: '#B8936E'
    }
  ]

  const values = [
    {
      icon: <FiHeart />,
      title: 'Made with Love',
      description: 'Every stitch is infused with care, just like making something for family.',
      color: '#ff6b6b'
    },
    {
      icon: <FiAward />,
      title: 'Quality First',
      description: 'We use only the finest materials and traditional techniques perfected over decades.',
      color: '#FFD700'
    },
    {
      icon: <FiUsers />,
      title: 'Community',
      description: 'Building connections through shared love of handcrafted items and storytelling.',
      color: '#87CEEB'
    },
    {
      icon: <FiTrendingUp />,
      title: 'Sustainable',
      description: 'Eco-friendly materials, slow fashion, and pieces that last for generations.',
      color: '#98FB98'
    }
  ]

  const stats = [
    { number: '50+', label: 'Years of Experience', emoji: '📅' },
    { number: '10,000+', label: 'Items Created', emoji: '🧶' },
    { number: '3', label: 'Generations', emoji: '👵' },
    { number: '500+', label: 'Patterns', emoji: '📝' }
  ]

  return (
    <div className="story-page">
      {/* Hero Section */}
      <motion.section
        className="story-hero"
        style={{ opacity }}
      >
        <div className="story-hero-overlay"></div>
        <motion.div
          className="story-hero-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="hero-yarn-ball"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            🧶
          </motion.div>
          <h1 className="story-title">Our Story</h1>
          <p className="story-tagline">
            A Tale Woven Through Time, One Stitch at a Time
          </p>
          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            <span>Scroll to explore</span>
            <div className="scroll-line"></div>
          </motion.div>
        </motion.div>

        {/* Floating elements - reduced for performance */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`hero-float-item item-${i + 1}`}
            animate={{
              y: [0, -15, 0]
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8
            }}
          >
            {['🧵', '🧶', '✨'][i]}
          </motion.div>
        ))}
      </motion.section>

      {/* Introduction */}
      <motion.section
        className="story-intro"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="intro-content">
          <motion.div
            className="intro-image"
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <div className="image-placeholder">
              <motion.span
                className="placeholder-emoji"
                animate={{
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity
                }}
              >
                👵
              </motion.span>
            </div>
          </motion.div>
          <div className="intro-text">
            <h2>Meet Nani</h2>
            <p>
              Over 50 years ago, a young woman sat beside her grandmother, learning the ancient art
              of knitting. Little did she know that those simple stitches would become the foundation
              of a legacy that would touch thousands of lives.
            </p>
            <p>
              Today, Nani ki Bunai is more than a business—it's a celebration of tradition, family,
              and the timeless beauty of handcrafted items. Each piece tells a story, carries a memory,
              and is made with the same love and care as if it were for our own family.
            </p>
            <div className="signature">
              <span className="signature-line">With love,</span>
              <span className="signature-name">Nani & Family</span>
              <span className="signature-emoji">💝</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="story-stats"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="stats-container">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="stat-card"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <span className="stat-emoji">{stat.emoji}</span>
              <h3 className="stat-number">{stat.number}</h3>
              <p className="stat-label">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Timeline Section */}
      <motion.section
        className="story-timeline"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="timeline-header">
          <h2>Our Journey</h2>
          <p>Five decades of stitching stories and creating memories</p>
        </div>

        <div className="timeline-container">
          <div className="timeline-line"></div>
          {timeline.map((event, index) => (
            <motion.div
              key={index}
              className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <motion.div
                className="timeline-content"
                style={{ '--event-color': event.color }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="timeline-year">{event.year}</div>
                <motion.div
                  className="timeline-emoji"
                  whileHover={{ scale: 1.3, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {event.emoji}
                </motion.div>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
              </motion.div>
              <motion.div
                className="timeline-dot"
                style={{ backgroundColor: event.color }}
                whileHover={{ scale: 1.5 }}
              ></motion.div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Values Section */}
      <motion.section
        className="story-values"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="values-header">
          <h2>Our Values</h2>
          <p>The principles that guide every stitch we make</p>
        </div>

        <div className="values-grid">
          {values.map((value, index) => (
            <motion.div
              key={index}
              className="value-card"
              style={{ '--value-color': value.color }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
            >
              <motion.div
                className="value-icon"
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                {value.icon}
              </motion.div>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section
        className="story-cta"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="cta-content">
          <motion.div
            className="cta-emoji-group"
            animate={{
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity
            }}
          >
            <span>🧶</span>
            <span>💝</span>
            <span>✨</span>
          </motion.div>
          <h2>Be Part of Our Story</h2>
          <p>
            Every piece we create adds a new chapter to our tale. Let us craft something
            special for you and your loved ones.
          </p>
          <div className="cta-buttons">
            <motion.a
              href="/products"
              className="cta-btn primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore Products
            </motion.a>
            <motion.a
              href="/contact"
              className="cta-btn secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get in Touch
            </motion.a>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

export default OurStory
