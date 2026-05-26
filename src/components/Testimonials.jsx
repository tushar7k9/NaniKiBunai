import React from 'react'
import { motion } from 'framer-motion'
import { SketchStar, SketchSparkle, SketchUnderline } from './SketchElements'
import './Testimonials.css'

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Mumbai',
    avatar: '👩',
    rating: 5,
    text: 'The sweater I ordered for my mother was absolutely beautiful. The craftsmanship is incredible — every stitch is perfect. She cried when she opened it!',
    product: 'Hand-knit Cashmere Sweater',
    date: 'March 2025',
  },
  {
    id: 2,
    name: 'Rahul Verma',
    location: 'Delhi',
    avatar: '👨',
    rating: 5,
    text: 'I was skeptical about buying handmade online but Nani ki Bunai exceeded all expectations. The quality is just like something my grandmother would make.',
    product: 'Merino Wool Scarf',
    date: 'February 2025',
  },
  {
    id: 3,
    name: 'Ananya Patel',
    location: 'Ahmedabad',
    avatar: '👩‍🦱',
    rating: 5,
    text: 'Ordered a blanket for my newborn and it\'s the softest thing I\'ve ever touched. The attention to detail is remarkable. True love in every stitch!',
    product: 'Baby Alpaca Blanket',
    date: 'April 2025',
  },
]

const Testimonials = () => {
  return (
    <section className="testimonials">
      <div className="testimonials-bg-blob" aria-hidden="true" />

      {/* Minimal sketch accents */}
      <div className="testimonials-sketch-layer" aria-hidden="true">
        <SketchStar className="test-sketch-star1" size={22} delay={0.2} />
        <SketchStar className="test-sketch-star2" size={16} color="var(--accent-gold)" delay={0.5} />
        <SketchSparkle className="test-sketch-sparkle1" size={16} delay={0.4} />
      </div>

      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="handcrafted-badge" style={{ marginBottom: 16 }}>Happy Customers</div>
          <h2>Stories of Warmth</h2>
          <SketchUnderline className="test-sketch-underline" width={180} color="var(--accent-gold)" />
          <p>Real words from people who carry a piece of our craft with them</p>
        </motion.div>

        <div className="testimonials-grid">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.id}
              className="testimonial-card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -3 }}
            >
              <div className="testimonial-quote">"</div>

              <div className="testimonial-stars">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="star-filled">★</span>
                ))}
              </div>

              <p className="testimonial-text">{t.text}</p>

              <div className="testimonial-product">
                <span className="product-tag">{t.product}</span>
              </div>

              <div className="testimonial-author">
                <div className="author-avatar">{t.avatar}</div>
                <div className="author-info">
                  <span className="author-name">{t.name}</span>
                  <span className="author-meta">{t.location} · {t.date}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="testimonials-trust"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="trust-rating-summary">
            <span className="big-rating">4.9</span>
            <div className="rating-details">
              <div className="big-stars">★★★★★</div>
              <span>Based on 1,000+ reviews</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Testimonials
