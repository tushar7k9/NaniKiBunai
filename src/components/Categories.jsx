import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SketchYarnBall, SketchStar } from './SketchElements'
import './Categories.css'

/* On phones the row scrolls horizontally — give it a gentle one-time nudge
   when it first appears so it's obvious there are more categories */
const nudgeScroll = (el) => {
  if (!el || el.scrollWidth <= el.clientWidth) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const start = performance.now()
  const DIST = 36
  const DUR = 900
  const tick = (now) => {
    const p = Math.min(1, (now - start) / DUR)
    // out and back: sin curve peaks at DIST mid-way
    el.scrollLeft = Math.sin(p * Math.PI) * DIST
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

const categories = [
  {
    id: 1,
    name: 'Sweaters',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80',
    slug: 'sweaters',
  },
  {
    id: 2,
    name: 'Scarves',
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&q=80',
    slug: 'scarves',
  },
  {
    id: 3,
    name: 'Hats',
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&q=80',
    slug: 'hats',
  },
  {
    id: 4,
    name: 'Gloves',
    image: 'https://images.unsplash.com/photo-1606400082777-ef05f3c5cde7?w=400&q=80',
    slug: 'gloves',
  },
  {
    id: 5,
    name: 'Socks',
    image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&q=80',
    slug: 'socks',
  },
  {
    id: 6,
    name: 'Blankets',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&q=80',
    slug: 'blankets',
  },
  {
    id: 7,
    name: 'Baby',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&q=80',
    slug: 'baby',
  },
  {
    id: 8,
    name: 'Accessories',
    image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80',
    slug: 'accessories',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

const Categories = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const nudgedRef = useRef(false)

  return (
    <section className="categories">
      {/* Minimal sketch accents */}
      <div className="categories-sketch-layer" aria-hidden="true">
        <SketchYarnBall className="cat-sketch-yarn" size={52} delay={0.3} />
        <SketchStar className="cat-sketch-star" size={20} delay={0.5} color="var(--accent-gold)" />
      </div>

      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="handcrafted-badge" style={{ marginBottom: 16 }}>Browse by Category</div>
          <h2>Our Collections</h2>
          <p>Handcrafted with love, designed for comfort</p>
        </motion.div>

        <motion.div
          ref={gridRef}
          className="categories-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          onViewportEnter={() => {
            if (nudgedRef.current) return
            nudgedRef.current = true
            // let the entrance stagger settle before hinting
            setTimeout(() => nudgeScroll(gridRef.current), 700)
          }}
        >
          {categories.map((category) => (
            <motion.div
              key={category.id}
              className="category-item"
              variants={itemVariants}
              onClick={() => navigate(`/products?category=${category.slug}`)}
            >
              <motion.div
                className="category-circle-wrapper"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="category-circle">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="category-circle-img"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              </motion.div>

              <p className="category-name">{category.name}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Categories
