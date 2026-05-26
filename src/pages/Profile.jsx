import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUser, FiSave, FiLoader, FiCheck } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import './Profile.css'

function Profile() {
  const { user, updateUserMetadata } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    },
    newsletterSubscribed: false,
  })

  useEffect(() => {
    if (user) {
      const meta = user.user_metadata || {}
      setProfileData({
        firstName: meta.firstName || meta.first_name || '',
        lastName: meta.lastName || meta.last_name || '',
        email: user.email || '',
        phone: meta.phone || '',
        shippingAddress: meta.shippingAddress || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: '',
        },
        newsletterSubscribed: meta.newsletterSubscribed || false,
      })
      setLoading(false)
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('address_')) {
      const addressField = name.replace('address_', '')
      setProfileData(prev => ({
        ...prev,
        shippingAddress: { ...prev.shippingAddress, [addressField]: value },
      }))
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await updateUserMetadata({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        shippingAddress: profileData.shippingAddress,
        newsletterSubscribed: profileData.newsletterSubscribed,
      })
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error updating profile:', err.message)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const initials = (profileData.firstName?.[0] || '') + (profileData.lastName?.[0] || '')

  if (loading) {
    return (
      <div className="pf-page">
        <div className="pf-hero">
          <div className="pf-hero__inner">
            <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px' }} />
            <div className="skeleton" style={{ height: 36, width: 200, margin: '0 auto 10px' }} />
            <div className="skeleton" style={{ height: 16, width: 160, margin: '0 auto' }} />
          </div>
        </div>
        <div className="pf-content">
          {[0,1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10, marginBottom: 14 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="pf-page">
      {/* Hero */}
      <motion.section
        className="pf-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="pf-hero__inner">
          <nav className="pf-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span className="pf-breadcrumb__current">Profile</span>
          </nav>

          <div className="pf-avatar">
            {initials ? initials.toUpperCase() : <FiUser />}
          </div>

          <motion.h1
            className="pf-hero__title"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {profileData.firstName ? `${profileData.firstName}'s Profile` : 'My Profile'}
          </motion.h1>

          <motion.p
            className="pf-hero__subtitle"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Manage your account & preferences
          </motion.p>

          <div className="pf-hero__stitch" />
        </div>
      </motion.section>

      {/* Content */}
      <div className="pf-content">
        {/* Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              className="pf-toast pf-toast--success"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <FiCheck /> {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              className="pf-toast pf-toast--error"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          {/* Personal */}
          <div className="pf-section">
            <h2 className="pf-section__title">Personal Information</h2>
            <div className="pf-grid">
              <div className="pf-field">
                <label className="pf-label">First Name</label>
                <input className="pf-input" type="text" name="firstName" value={profileData.firstName} onChange={handleChange} placeholder="Your first name" />
              </div>
              <div className="pf-field">
                <label className="pf-label">Last Name</label>
                <input className="pf-input" type="text" name="lastName" value={profileData.lastName} onChange={handleChange} placeholder="Your last name" />
              </div>
              <div className="pf-field pf-field--full">
                <label className="pf-label">Email</label>
                <input className="pf-input pf-input--disabled" type="email" value={profileData.email} disabled />
                <span className="pf-hint">Email cannot be changed</span>
              </div>
              <div className="pf-field pf-field--full">
                <label className="pf-label">Phone</label>
                <input className="pf-input" type="tel" name="phone" value={profileData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="pf-section">
            <h2 className="pf-section__title">Default Shipping Address</h2>
            <div className="pf-grid">
              <div className="pf-field pf-field--full">
                <label className="pf-label">Street</label>
                <input className="pf-input" type="text" name="address_street" value={profileData.shippingAddress.street} onChange={handleChange} placeholder="Your street address" />
              </div>
              <div className="pf-field">
                <label className="pf-label">City</label>
                <input className="pf-input" type="text" name="address_city" value={profileData.shippingAddress.city} onChange={handleChange} placeholder="City" />
              </div>
              <div className="pf-field">
                <label className="pf-label">State</label>
                <input className="pf-input" type="text" name="address_state" value={profileData.shippingAddress.state} onChange={handleChange} placeholder="State" />
              </div>
              <div className="pf-field">
                <label className="pf-label">PIN Code</label>
                <input className="pf-input" type="text" name="address_zip" value={profileData.shippingAddress.zip} onChange={handleChange} placeholder="PIN code" />
              </div>
              <div className="pf-field">
                <label className="pf-label">Country</label>
                <input className="pf-input" type="text" name="address_country" value={profileData.shippingAddress.country} onChange={handleChange} placeholder="Country" />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="pf-section">
            <h2 className="pf-section__title">Preferences</h2>
            <label className="pf-checkbox">
              <input
                type="checkbox"
                name="newsletterSubscribed"
                checked={profileData.newsletterSubscribed}
                onChange={handleChange}
              />
              <span className="pf-checkbox__box" />
              <span className="pf-checkbox__text">
                Subscribe to newsletter for updates and special offers
              </span>
            </label>
          </div>

          {/* Save */}
          <motion.button
            type="submit"
            className="pf-save"
            disabled={saving}
            whileTap={!saving ? { scale: 0.98 } : {}}
          >
            {saving ? (
              <><FiLoader className="pf-spinner" /> Saving...</>
            ) : (
              <><FiSave /> Save Changes</>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  )
}

export default Profile
