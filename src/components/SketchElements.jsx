import React from 'react'
import { motion } from 'framer-motion'

/* ─── Curved arrow pointing down-right ─── */
export const SketchArrow = ({ className = '', color = 'var(--terracotta)', delay = 0 }) => (
  <svg className={className} width="80" height="64" viewBox="0 0 80 64" fill="none" aria-hidden="true">
    <motion.path
      d="M6,8 C14,4 24,10 34,20 C44,30 54,36 66,50"
      stroke={color} strokeWidth="2.2" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.75 }}
      viewport={{ once: true }}
      transition={{ duration: 1.1, delay, ease: 'easeInOut' }}
    />
    <motion.path
      d="M58,46 L68,52 L60,58"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.75 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: delay + 0.9 }}
    />
  </svg>
)

/* ─── Horizontal arrow pointing right ─── */
export const SketchArrowRight = ({ className = '', color = 'var(--terracotta)', delay = 0 }) => (
  <svg className={className} width="64" height="26" viewBox="0 0 64 26" fill="none" aria-hidden="true">
    <motion.path
      d="M2,13 C10,9 20,8 30,13 C38,17 46,10 56,13"
      stroke={color} strokeWidth="2" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.75 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay, ease: 'easeInOut' }}
    />
    <motion.path
      d="M49,7 L58,13 L49,19"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.75 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: delay + 0.8 }}
    />
  </svg>
)

/* ─── Squiggly underline ─── */
export const SketchUnderline = ({ className = '', color = 'var(--terracotta)', width = 200 }) => (
  <svg
    className={className}
    width={width}
    height="14"
    viewBox={`0 0 ${width} 14`}
    fill="none"
    aria-hidden="true"
  >
    <motion.path
      d={`M4,7 C${width * 0.1},3 ${width * 0.2},11 ${width * 0.3},7 C${width * 0.4},3 ${width * 0.5},11 ${width * 0.6},7 C${width * 0.7},3 ${width * 0.8},11 ${width * 0.9},7 C${width * 0.95},5 ${width - 4},7 ${width - 4},7`}
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.55 }}
      viewport={{ once: true }}
      transition={{ duration: 1.3, ease: 'easeInOut' }}
    />
  </svg>
)

/* ─── Hand-drawn star ─── */
export const SketchStar = ({ className = '', color = 'var(--accent-gold)', size = 22, delay = 0 }) => (
  <motion.svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 22 22"
    fill="none"
    aria-hidden="true"
    initial={{ scale: 0, rotate: -40, opacity: 0 }}
    whileInView={{ scale: 1, rotate: 0, opacity: 0.85 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay, type: 'spring', stiffness: 200 }}
  >
    <path
      d="M11,2 L13.2,8.2 L19.8,9 L14.8,13.8 L16.4,20.4 L11,17 L5.6,20.4 L7.2,13.8 L2.2,9 L8.8,8.2 Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </motion.svg>
)

/* ─── Small sparkle cross ─── */
export const SketchSparkle = ({ className = '', color = 'var(--terracotta-light)', size = 18, delay = 0 }) => (
  <motion.svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden="true"
    initial={{ scale: 0, opacity: 0 }}
    whileInView={{ scale: 1, opacity: 0.7 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay, type: 'spring' }}
  >
    <motion.path
      d="M9,1 L9,17 M1,9 L17,9 M3,3 L15,15 M15,3 L3,15"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    />
  </motion.svg>
)

/* ─── Scattered dot cluster ─── */
export const SketchDots = ({ className = '', color = 'var(--terracotta-light)', size = 56 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
    {[
      [8, 10], [22, 6], [40, 12], [52, 8],
      [4, 24], [16, 28], [32, 20], [48, 26],
      [10, 42], [26, 46], [44, 40], [54, 48],
    ].map(([x, y], i) => (
      <motion.circle
        key={i}
        cx={x} cy={y} r="2.8"
        fill={color}
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 0.5 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: i * 0.05 }}
      />
    ))}
  </svg>
)

/* ─── Yarn ball doodle ─── */
export const SketchYarnBall = ({ className = '', color = 'var(--terracotta)', size = 52, delay = 0 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden="true">
    <motion.circle
      cx="26" cy="26" r="22"
      stroke={color} strokeWidth="1.8"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.65 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay }}
    />
    <motion.path
      d="M8,18 C17,9 35,14 44,26 C39,38 20,44 10,36"
      stroke={color} strokeWidth="1.4" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.55 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: delay + 0.7 }}
    />
    <motion.path
      d="M15,8 C21,22 28,32 40,44"
      stroke={color} strokeWidth="1.2" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.45 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay + 1.2 }}
    />
    <motion.path
      d="M4,32 C18,28 34,30 48,26"
      stroke={color} strokeWidth="1.1" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.4 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay + 1.5 }}
    />
  </svg>
)

/* ─── Crossed knitting needles ─── */
export const SketchNeedles = ({ className = '', color = 'var(--soft-brown)', size = 64, delay = 0 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <motion.line
      x1="10" y1="54" x2="54" y2="10"
      stroke={color} strokeWidth="2.2" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.6 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay }}
    />
    <motion.circle
      cx="55" cy="9" r="5"
      fill={color}
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 0.65 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: delay + 0.6 }}
    />
    <motion.line
      x1="10" y1="10" x2="54" y2="54"
      stroke={color} strokeWidth="2.2" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.6 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: delay + 0.2 }}
    />
    <motion.circle
      cx="55" cy="55" r="5"
      fill={color}
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 0.65 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: delay + 0.8 }}
    />
  </svg>
)

/* ─── Wavy dotted section divider ─── */
export const SketchWaveDivider = ({ className = '', color = 'var(--terracotta-light)' }) => (
  <div className={`sketch-wave-divider ${className}`} aria-hidden="true">
    <svg width="100%" height="28" viewBox="0 0 1200 28" preserveAspectRatio="none" fill="none">
      <motion.path
        d="M0,14 C50,6 100,22 150,14 C200,6 250,22 300,14 C350,6 400,22 450,14 C500,6 550,22 600,14 C650,6 700,22 750,14 C800,6 850,22 900,14 C950,6 1000,22 1050,14 C1100,6 1150,22 1200,14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="8 6"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.5 }}
        viewport={{ once: true }}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
      />
    </svg>
  </div>
)

/* ─── Rough circle highlight (wraps around text/numbers) ─── */
export const SketchCircleHighlight = ({ className = '', color = 'var(--terracotta)', width = 130, height = 56 }) => (
  <svg
    className={className}
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    fill="none"
    aria-hidden="true"
  >
    <motion.path
      d={`M${width * 0.18},${height * 0.85}
          C${width * 0.05},${height * 0.55} ${width * 0.07},${height * 0.12} ${width * 0.5},${height * 0.07}
          C${width * 0.93},${height * 0.04} ${width * 0.98},${height * 0.48} ${width * 0.9},${height * 0.82}
          C${width * 0.82},${height * 0.98} ${width * 0.58},${height * 0.98} ${width * 0.38},${height * 0.94}
          C${width * 0.22},${height * 0.91} ${width * 0.12},${height * 0.92} ${width * 0.18},${height * 0.85}`}
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.5 }}
      viewport={{ once: true }}
      transition={{ duration: 1.6, ease: 'easeInOut' }}
    />
  </svg>
)

/* ─── Small loopy stitch mark (decorative) ─── */
export const SketchStitch = ({ className = '', color = 'var(--terracotta-light)', width = 80 }) => (
  <svg className={className} width={width} height="16" viewBox={`0 0 ${width} 16`} fill="none" aria-hidden="true">
    {Array.from({ length: Math.floor(width / 14) }).map((_, i) => (
      <motion.path
        key={i}
        d={`M${i * 14 + 2},8 C${i * 14 + 5},2 ${i * 14 + 9},14 ${i * 14 + 12},8`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.6 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: i * 0.06 }}
      />
    ))}
  </svg>
)
