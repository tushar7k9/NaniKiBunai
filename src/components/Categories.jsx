import React from 'react'
import { motion } from 'framer-motion'
import { GiSocks, GiClothes, GiWinterGloves } from 'react-icons/gi'
import ScarfIcon from './ScarfIcon'
import './Categories.css'

const categories = [
  {
    id: 1,
    name: "Sweaters",
    icon: <GiClothes />,
    description: "Cozy handknit sweaters",
    color: "#C4896A",
  },
  {
    id: 2,
    name: "Socks",
    icon: <GiSocks />,
    description: "Warm knitted socks",
    color: "#8B6F4E",
  },
  {
    id: 3,
    name: "Scarves",
    icon: null,
    description: "Elegant handwoven scarves",
    color: "#A67B5B",
  },
  {
    id: 4,
    name: "Gloves",
    icon: <GiWinterGloves />,
    description: "Soft winter gloves",
    color: "#BF8B6E",
  },
];

const Categories = () => {
  return (
    <section className="categories">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Our Collections</h2>
          <p>Handcrafted with love, designed for comfort</p>
        </motion.div>

        <div className="categories-grid">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              className="category-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <div className="category-icon" style={{ color: category.color, fontSize: '4rem' }}>
                {category.name === "Scarves" ? (
                  <ScarfIcon color={category.color} />
                ) : (
                  category.icon
                )}
              </div>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <motion.button
                className="category-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Categories
