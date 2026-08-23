import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiCheckCircle } from 'react-icons/fi'
import { SketchStar, SketchSparkle, SketchUnderline } from './SketchElements'
import { reviewService } from '../services/reviewService'
import './Testimonials.css'

const MIN_REVIEWS = 3

const formatMonthYear = (d) =>
  new Date(d).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

const initials = (name) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '☺'

/* Real approved customer reviews (admin-featured first). The section only
   renders once there are at least MIN_REVIEWS approved text reviews —
   nothing fake, nothing sparse. */
const Testimonials = () => {
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    reviewService.getHomeTestimonials().then((res) => {
      if (!cancelled) setData(res)
    })
    return () => { cancelled = true }
  }, [])

  if (!data || data.cards.length < MIN_REVIEWS) return null

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
          {data.cards.map((t, index) => (
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

              <p className="testimonial-text">{t.review_text}</p>

              {t.product_name && (
                <div className="testimonial-product">
                  <span className="product-tag">{t.product_name}</span>
                </div>
              )}

              <div className="testimonial-author">
                <div className="author-avatar author-avatar--initials">
                  {initials(t.user_name)}
                </div>
                <div className="author-info">
                  <span className="author-name">{t.user_name || 'A happy customer'}</span>
                  <span className="author-meta">
                    {formatMonthYear(t.created_at)}
                    {t.is_verified_purchase && (
                      <span className="author-verified">
                        <FiCheckCircle /> Verified purchase
                      </span>
                    )}
                  </span>
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
            <span className="big-rating">{data.average.toFixed(1)}</span>
            <div className="rating-details">
              <div className="big-stars">
                {'★'.repeat(Math.round(data.average))}
                {'☆'.repeat(5 - Math.round(data.average))}
              </div>
              <span>Based on {data.count} review{data.count !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Testimonials
