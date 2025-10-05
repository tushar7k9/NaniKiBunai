import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend, FiHeart } from 'react-icons/fi'
import './Contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required'
    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length === 0) {
      // Form is valid
      console.log('Form submitted:', formData)
      setSubmitted(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false)
      }, 5000)
    } else {
      setErrors(newErrors)
    }
  }

  const contactInfo = [
    {
      icon: <FiPhone />,
      title: 'Phone',
      detail: '+1 (555) 123-4567',
      subtext: 'Mon-Sat, 9am-6pm',
      color: '#87CEEB'
    },
    {
      icon: <FiMail />,
      title: 'Email',
      detail: 'hello@nanikibunai.com',
      subtext: 'We reply within 24 hours',
      color: '#FFB6C1'
    },
    {
      icon: <FiMapPin />,
      title: 'Workshop',
      detail: '123 Knitting Lane',
      subtext: 'Cozy Town, CT 12345',
      color: '#98FB98'
    },
    {
      icon: <FiClock />,
      title: 'Hours',
      detail: 'Mon-Sat: 9am-6pm',
      subtext: 'Sunday: Closed',
      color: '#DDA0DD'
    }
  ]

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <motion.section
        className="contact-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="contact-hero-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="hero-emoji-group">
            <motion.span
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              💌
            </motion.span>
          </div>
          <h1 className="contact-title">Let's Stay in Touch</h1>
          <p className="contact-subtitle">
            We'd love to hear from you! Whether you have questions about our products,
            want to share your knitting stories, or just want to say hello.
          </p>

          {/* Floating decorations */}
          <motion.div
            className="floating-element element-1"
            animate={{
              y: [-10, 10, -10],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🧶
          </motion.div>
          <motion.div
            className="floating-element element-2"
            animate={{
              y: [10, -10, 10],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            ✨
          </motion.div>
        </motion.div>
      </motion.section>

      <div className="contact-container">
        {/* Contact Info Cards */}
        <motion.div
          className="contact-info-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {contactInfo.map((info, index) => (
            <motion.div
              key={index}
              className="contact-info-card"
              style={{ '--card-color': info.color }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <motion.div
                className="info-icon"
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                {info.icon}
              </motion.div>
              <h3>{info.title}</h3>
              <p className="info-detail">{info.detail}</p>
              <p className="info-subtext">{info.subtext}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <div className="contact-main">
          {/* Form Section */}
          <motion.div
            className="contact-form-section"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="form-header">
              <h2>Send Us a Message</h2>
              <p>Fill out the form below and Nani will get back to you soon!</p>
            </div>

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    Your Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && (
                    <motion.span
                      className="error-message"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.name}
                    </motion.span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && (
                    <motion.span
                      className="error-message"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.email}
                    </motion.span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message">
                  Your Message <span className="required">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us what's on your mind..."
                  rows="6"
                  className={errors.message ? 'error' : ''}
                ></textarea>
                {errors.message && (
                  <motion.span
                    className="error-message"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.message}
                  </motion.span>
                )}
              </div>

              <motion.button
                type="submit"
                className="submit-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiSend /> Send Message
              </motion.button>
            </form>

            {/* Success Message */}
            <AnimatePresence>
              {submitted && (
                <motion.div
                  className="success-message"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <FiHeart className="success-icon" />
                  <h3>Message Sent!</h3>
                  <p>Thank you for reaching out! Nani will get back to you soon.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Side Image/Info Section */}
          <motion.div
            className="contact-side-section"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="side-card">
              <motion.div
                className="side-emoji"
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                👵
              </motion.div>
              <h3>Meet Nani</h3>
              <p>
                Behind every stitch is a story. Nani has been knitting for over 50 years,
                passing down traditional techniques while embracing modern designs.
              </p>
              <div className="side-quote">
                <span className="quote-mark">"</span>
                <p>Every piece I create is made with love, just like I'm making it for my own grandchildren.</p>
                <span className="quote-mark">"</span>
              </div>
            </div>

            <div className="side-card">
              <div className="side-icon-group">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  🧶
                </motion.span>
                <motion.span
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                >
                  🪡
                </motion.span>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                >
                  ✨
                </motion.span>
              </div>
              <h3>Visit Our Workshop</h3>
              <p>
                Want to see where the magic happens? Schedule a visit to our cozy workshop
                and watch the knitting process firsthand!
              </p>
              <motion.button
                className="side-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Schedule a Visit
              </motion.button>
            </div>

            <div className="side-card fun-facts">
              <h3>🧵 Fun Facts</h3>
              <ul>
                <li>✨ Over 10,000 items knitted</li>
                <li>🌈 500+ unique patterns created</li>
                <li>❤️ 3 generations of knitters</li>
                <li>🎨 Custom orders welcome</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="bg-threads">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={`bg-thread thread-${i + 1}`}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 8 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default Contact
