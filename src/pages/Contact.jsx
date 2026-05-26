import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend, FiCheck } from 'react-icons/fi'
import './Contact.css'

const contactInfo = [
  { icon: <FiPhone />, title: 'Phone', detail: '+91 98765 43210', sub: 'Mon–Sat, 10am–7pm' },
  { icon: <FiMail />, title: 'Email', detail: 'hello@nanikibunai.com', sub: 'We reply within 24 hours' },
  { icon: <FiMapPin />, title: 'Workshop', detail: 'Jaipur, Rajasthan', sub: 'By appointment only' },
  { icon: <FiClock />, title: 'Hours', detail: 'Mon–Sat: 10am–7pm', sub: 'Sunday: Closed' },
]

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!formData.name.trim()) errs.name = 'Name is required'
    if (!formData.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Email is invalid'
    if (!formData.message.trim()) errs.message = 'Message is required'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length === 0) {
      console.log('Form submitted:', formData)
      setSubmitted(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } else {
      setErrors(errs)
    }
  }

  return (
    <div className="ct-page">
      {/* Hero */}
      <motion.section
        className="ct-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="ct-hero__inner">
          <nav className="ct-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span className="ct-breadcrumb__current">Contact</span>
          </nav>

          <motion.h1
            className="ct-hero__title"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            Get in Touch
          </motion.h1>

          <motion.p
            className="ct-hero__subtitle"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            We'd love to hear from you
          </motion.p>

          <div className="ct-hero__stitch" />
        </div>
      </motion.section>

      {/* Contact Info Strip */}
      <div className="ct-info-strip">
        {contactInfo.map((info, i) => (
          <motion.div
            key={i}
            className="ct-info-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.35 }}
          >
            <div className="ct-info-card__icon">{info.icon}</div>
            <div className="ct-info-card__body">
              <span className="ct-info-card__title">{info.title}</span>
              <span className="ct-info-card__detail">{info.detail}</span>
              <span className="ct-info-card__sub">{info.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main: Form + Side */}
      <div className="ct-layout">
        {/* Form */}
        <motion.div
          className="ct-form-wrap"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2 className="ct-section-title">Send a Message</h2>
          <p className="ct-section-sub">
            Whether it's a question, custom order request, or just to say hello — we're all ears.
          </p>

          {/* Success */}
          <AnimatePresence>
            {submitted && (
              <motion.div
                className="ct-success"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <FiCheck /> Message sent! We'll get back to you soon.
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="ct-form">
            <div className="ct-form__grid">
              <div className="ct-field">
                <label className="ct-label">Name <span className="ct-required">*</span></label>
                <input
                  className={`ct-input${errors.name ? ' ct-input--error' : ''}`}
                  type="text" name="name" value={formData.name}
                  onChange={handleChange} placeholder="Your name"
                />
                {errors.name && <span className="ct-error">{errors.name}</span>}
              </div>
              <div className="ct-field">
                <label className="ct-label">Email <span className="ct-required">*</span></label>
                <input
                  className={`ct-input${errors.email ? ' ct-input--error' : ''}`}
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="you@example.com"
                />
                {errors.email && <span className="ct-error">{errors.email}</span>}
              </div>
              <div className="ct-field">
                <label className="ct-label">Phone <span className="ct-optional">optional</span></label>
                <input
                  className="ct-input" type="tel" name="phone"
                  value={formData.phone} onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="ct-field">
                <label className="ct-label">Subject <span className="ct-optional">optional</span></label>
                <input
                  className="ct-input" type="text" name="subject"
                  value={formData.subject} onChange={handleChange}
                  placeholder="What's this about?"
                />
              </div>
            </div>

            <div className="ct-field">
              <label className="ct-label">Message <span className="ct-required">*</span></label>
              <textarea
                className={`ct-textarea${errors.message ? ' ct-input--error' : ''}`}
                name="message" value={formData.message}
                onChange={handleChange} rows={5}
                placeholder="Tell us what's on your mind..."
              />
              {errors.message && <span className="ct-error">{errors.message}</span>}
            </div>

            <motion.button
              type="submit"
              className="ct-submit"
              whileTap={{ scale: 0.98 }}
            >
              <FiSend /> Send Message
            </motion.button>
          </form>
        </motion.div>

        {/* Side */}
        <motion.div
          className="ct-side"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {/* Quote Card — editorial letter-style */}
          <div className="ct-maker-card">
            <div className="ct-maker-card__top">
              <div className="ct-maker-card__seal">N</div>
              <span className="ct-maker-card__label">A note from the maker</span>
            </div>
            <div className="ct-maker-card__stitch" />
            <blockquote className="ct-maker-card__quote">
              Every piece I create is made with love, just like I'm making it for my own grandchildren.
            </blockquote>
            <div className="ct-maker-card__footer">
              <span className="ct-maker-card__signature">Nani</span>
              <span className="ct-maker-card__role">Founder & Master Artisan</span>
            </div>
          </div>

          {/* Workshop Card */}
          <div className="ct-side-card">
            <span className="ct-side-card__label">Visit us</span>
            <h3 className="ct-side-card__title">Our Workshop</h3>
            <p className="ct-side-card__text">
              Want to see where the magic happens? Schedule a visit to our cozy workshop and watch the craft process firsthand.
            </p>
            <button className="ct-side-btn">Schedule a Visit</button>
          </div>

          {/* Custom Orders */}
          <div className="ct-side-card ct-side-card--highlight">
            <span className="ct-side-card__label">Custom orders</span>
            <h3 className="ct-side-card__title">Made Just for You</h3>
            <p className="ct-side-card__text">
              Looking for something unique? We take custom orders — choose your colors, size, and pattern.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Contact
