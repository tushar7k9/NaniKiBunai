import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GiHearts, GiWool, GiSparkles } from 'react-icons/gi'
import { FiUsers, FiPackage, FiAward, FiHeart } from 'react-icons/fi'
import { SketchNeedles, SketchYarnBall } from './SketchElements'
import './Story.css'

const stats = [
  { icon: <FiPackage />, number: '200+', label: 'Products' },
  { icon: <FiUsers />, number: '1000+', label: 'Happy Customers' },
  { icon: <FiAward />, number: '25+', label: 'Years of Expertise' },
  { icon: <FiHeart />, number: '100%', label: 'Handmade' },
]

const Story = () => {
  const navigate = useNavigate()

  return (
    <section className="story">
      <div className="container">
        {/* Stats strip */}
        {/* <motion.div
          className="story-stats"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="stat-item"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="stat-icon">{stat.icon}</div>
              <div>
                <span className="stat-number">{stat.number}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </motion.div> */}

        <div className="story-content">
          <motion.div
            className="story-text"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="handcrafted-badge" style={{ marginBottom: 20 }}>Our Story</div>
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
                <div className="feature-icon"><GiHearts /></div>
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
                <div className="feature-icon"><GiWool /></div>
                <div className="feature-text">
                  <h3>Premium Materials</h3>
                  <p>We use only the finest natural fibers — merino wool, cashmere,
                     and alpaca — for unmatched comfort.</p>
                </div>
              </motion.div>

              <motion.div
                className="story-feature"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="feature-icon"><GiSparkles /></div>
                <div className="feature-text">
                  <h3>Timeless Design</h3>
                  <p>Our designs blend traditional patterns with contemporary style,
                     creating pieces that never go out of fashion.</p>
                </div>
              </motion.div>
            </div>

            {/* <motion.button
              className="btn-primary"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/our-story')}
            >
              Learn More About Us
            </motion.button> */}
          </motion.div>

          <motion.div
            className="story-image"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="story-image-wrapper">
              <div className="story-img-frame">
                <img
                  src="https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80"
                  alt="Handcrafted blankets and knitwear"
                  className="story-real-img"
                />
              </div>
              <div className="story-badge">
                <span className="badge-number">25+</span>
                <span className="badge-text">Years of Expertise</span>
              </div>

              {/* Just two tasteful sketch accents */}
              <SketchNeedles className="story-sketch-needles" size={60} delay={0.8} />
              <SketchYarnBall className="story-sketch-yarn" size={48} delay={1.0} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Story
