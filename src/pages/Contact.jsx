import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend, FiCheck, FiAlertCircle } from 'react-icons/fi'
import './Contact.css'

const SUPABASE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
const MESSAGE_MAX = 5000
const MESSAGE_MIN = 10

const contactInfo = [
  { icon: <FiPhone />, title: 'Phone', detail: '+91 99110 02480', sub: 'Mon–Sat, 10am–7pm' },
  { icon: <FiMail />, title: 'Email', detail: 'nanikiibunai@gmail.com', sub: 'We reply within 24 hours' },
  { icon: <FiMapPin />, title: 'Workshop', detail: 'Gurgaon, Haryana', sub: 'By appointment only' },
  { icon: <FiClock />, title: 'Workshop Hours', detail: 'Mon–Sat: 10am–7pm', sub: 'Sunday: Closed' },
]

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors] = useState({})
  const [honey, setHoney] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    if (submitError) setSubmitError('')
  }

  const validate = () => {
    const errs = {}
    if (!formData.name.trim()) errs.name = 'Name is required'
    else if (formData.name.trim().length > 100) errs.name = 'Name must be under 100 characters'

    if (!formData.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errs.email = 'Please enter a valid email'

    if (formData.phone.trim()) {
      const cleaned = formData.phone.replace(/[\s\-\(\)]/g, '')
      if (!/^\+?\d{7,15}$/.test(cleaned)) errs.phone = 'Please enter a valid phone number'
    }

    if (formData.subject.trim().length > 200) errs.subject = 'Subject must be under 200 characters'

    if (!formData.message.trim()) errs.message = 'Message is required'
    else if (formData.message.trim().length < MESSAGE_MIN) errs.message = `Message must be at least ${MESSAGE_MIN} characters`
    else if (formData.message.trim().length > MESSAGE_MAX) errs.message = `Message must be under ${MESSAGE_MAX} characters`

    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch(`${SUPABASE_FUNCTION_URL}/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          subject: formData.subject.trim() || undefined,
          message: formData.message.trim(),
          _honey: honey || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setSubmitError('You\'ve sent too many messages recently. Please try again in an hour.')
        } else if (res.status === 400 && data.errors) {
          const fieldErrors = {}
          data.errors.forEach((err) => { fieldErrors[err.field] = err.message })
          setErrors(fieldErrors)
        } else {
          setSubmitError('Something went wrong. Please try again or email us directly.')
        }
        return
      }

      setSubmitted(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 6000)
    } catch {
      setSubmitError('Could not send your message. Please check your internet connection and try again.')
    } finally {
      setIsSubmitting(false)
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

          {/* Success / Error Banners */}
          <AnimatePresence>
            {submitted && (
              <motion.div
                className="ct-success"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <FiCheck /> Message sent! We'll get back to you within 24 hours.
              </motion.div>
            )}
            {submitError && (
              <motion.div
                className="ct-error-banner"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <FiAlertCircle /> {submitError}
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
                  className={`ct-input${errors.phone ? ' ct-input--error' : ''}`}
                  type="tel" name="phone"
                  value={formData.phone} onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
                {errors.phone && <span className="ct-error">{errors.phone}</span>}
              </div>
              <div className="ct-field">
                <label className="ct-label">Subject <span className="ct-optional">optional</span></label>
                <input
                  className={`ct-input${errors.subject ? ' ct-input--error' : ''}`}
                  type="text" name="subject"
                  value={formData.subject} onChange={handleChange}
                  placeholder="What's this about?"
                />
                {errors.subject && <span className="ct-error">{errors.subject}</span>}
              </div>
            </div>

            {/* Honeypot — hidden from real users */}
            <div className="ct-honey" aria-hidden="true" tabIndex={-1}>
              <label>Leave this empty</label>
              <input
                type="text"
                name="_honey"
                value={honey}
                onChange={(e) => setHoney(e.target.value)}
                autoComplete="off"
                tabIndex={-1}
              />
            </div>

            <div className="ct-field">
              <div className="ct-label-row">
                <label className="ct-label">Message <span className="ct-required">*</span></label>
                <span className={`ct-char-count${formData.message.length > MESSAGE_MAX ? ' ct-char-count--over' : ''}`}>
                  {formData.message.length}/{MESSAGE_MAX}
                </span>
              </div>
              <textarea
                className={`ct-textarea${errors.message ? ' ct-input--error' : ''}`}
                name="message" value={formData.message}
                onChange={handleChange} rows={5}
                placeholder="Tell us what's on your mind..."
                maxLength={MESSAGE_MAX + 100}
              />
              {errors.message && <span className="ct-error">{errors.message}</span>}
            </div>

            <motion.button
              type="submit"
              className={`ct-submit${isSubmitting ? ' ct-submit--loading' : ''}`}
              whileTap={isSubmitting ? {} : { scale: 0.98 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="ct-spinner" />
                  Sending...
                </>
              ) : (
                <>
                  <FiSend /> Send Message
                </>
              )}
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

          {/* Workshop Card — locked */}
          <div className="ct-side-card ct-side-card--locked">
            <div className="ct-side-card__content">
              <span className="ct-side-card__label">Visit us</span>
              <h3 className="ct-side-card__title">Our Workshop</h3>
              <p className="ct-side-card__text">
                Want to see where the magic happens? Schedule a visit to our cozy workshop and watch the craft process firsthand.
              </p>
              <button className="ct-side-btn" disabled>Schedule a Visit</button>
            </div>
            <div className="ct-side-card__overlay">
              <span className="ct-side-card__overlay-badge">Coming Soon</span>
            </div>
          </div>

          {/* Custom Orders */}
          <div className="ct-side-card ct-side-card--highlight">
            <span className="ct-side-card__label">Custom orders</span>
            <h3 className="ct-side-card__title">Made Just for You</h3>
            <p className="ct-side-card__text">
              Looking for something unique? We take custom orders — choose your colors, size, and pattern.
            </p>
            <a href="tel:+919911002480" className="ct-side-card__phone">
              <FiPhone /> +91 99110 02480
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Contact
