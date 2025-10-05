import React from 'react'
import { motion } from 'framer-motion'
import './WoolBall.css'

const WoolBall = () => {
  return (
    <div className="wool-ball-container">
      {/* Main yarn emoji with animations */}
      <motion.div 
        className="yarn-emoji-main"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ 
          scale: 1, 
          rotate: 0,
        }}
        transition={{ 
          duration: 1.2, 
          ease: "easeOut",
          rotate: { duration: 1.5, ease: "easeInOut" }
        }}
      >
        <motion.span
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🧶
        </motion.span>
      </motion.div>

      {/* Floating yarn emojis around */}
      <motion.div
        className="yarn-emoji-float yarn-float-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: [0, 0.6, 0.6, 0],
          y: [-20, -60],
          x: [-10, 10],
          rotate: [0, 360]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      >
        🧶
      </motion.div>

      <motion.div
        className="yarn-emoji-float yarn-float-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: [0, 0.5, 0.5, 0],
          y: [-20, -70],
          x: [10, -15],
          rotate: [0, -360]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.2
        }}
      >
        🧶
      </motion.div>

      <motion.div
        className="yarn-emoji-float yarn-float-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: [0, 0.4, 0.4, 0],
          y: [-15, -55],
          x: [-5, 20],
          rotate: [0, 180]
        }}
        transition={{ 
          duration: 4.5, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      >
        🧶
      </motion.div>

      {/* Sparkles around the yarn */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="sparkle"
          style={{
            position: 'absolute',
            fontSize: '20px',
            left: '50%',
            top: '50%',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: [0, Math.cos(i * 45 * Math.PI / 180) * 100],
            y: [0, Math.sin(i * 45 * Math.PI / 180) * 100],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut"
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  )
}

export default WoolBall
