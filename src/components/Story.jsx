import React from 'react'
import { motion } from 'framer-motion'
import { GiHearts, GiWool, GiSparkles } from 'react-icons/gi'
import './Story.css'

const Story = () => {
  return (
    <section className="story">
      <div className="container">
        <div className="story-content">
          <motion.div
            className="story-text"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2>The Story Behind Every Stitch</h2>
            <p className="story-intro">
              Nani ki Bunai brings you the warmth and love of handmade craftsmanship.
              Each piece is carefully knitted by skilled artisans, carrying forward generations
              of tradition and expertise.
            </p>

            <div className="story-features">
              <motion.div
                className="story-feature"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="feature-icon">
                  <GiHearts />
                </div>
                <div className="feature-text">
                  <h3>Made with Love</h3>
                  <p>Every product is handcrafted with care and attention to detail,
                     ensuring exceptional quality in every stitch.</p>
                </div>
              </motion.div>

              <motion.div
                className="story-feature"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="feature-icon">
                  <GiWool />
                </div>
                <div className="feature-text">
                  <h3>Premium Materials</h3>
                  <p>We use only the finest natural fibers - merino wool, cashmere,
                     and alpaca - for unmatched comfort and durability.</p>
                </div>
              </motion.div>

              <motion.div
                className="story-feature"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="feature-icon">
                  <GiSparkles />
                </div>
                <div className="feature-text">
                  <h3>Timeless Design</h3>
                  <p>Our designs blend traditional patterns with contemporary style,
                     creating pieces that never go out of fashion.</p>
                </div>
              </motion.div>
            </div>

            <motion.button
              className="btn-primary"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More About Us
            </motion.button>
          </motion.div>

          <motion.div
            className="story-image"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="story-image-wrapper">
              <div className="story-image-placeholder">
                <div className="knitting-animation"></div>
              </div>
              <div className="story-badge">
                <span className="badge-number">25+</span>
                <span className="badge-text">Years of Expertise</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Story
