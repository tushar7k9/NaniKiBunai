/**
 * User Profile Page
 *
 * Displays and allows editing of user profile information
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiLoader } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import './Profile.css'

function Profile() {
  const { user } = useAuth()
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

  // Fetch user profile on mount
  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)

      // Fetch profile from user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Parse the data
      setProfileData({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: user.email || '',
        phone: data.phone || '',
        shippingAddress: data.default_shipping_address || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: '',
        },
        newsletterSubscribed: data.newsletter_subscribed || false,
      })
    } catch (err) {
      console.error('Error fetching profile:', err.message)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name.startsWith('address_')) {
      // Handle address fields
      const addressField = name.replace('address_', '')
      setProfileData({
        ...profileData,
        shippingAddress: {
          ...profileData.shippingAddress,
          [addressField]: value,
        },
      })
    } else {
      setProfileData({
        ...profileData,
        [name]: type === 'checkbox' ? checked : value,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      // Update profile in database
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
          default_shipping_address: profileData.shippingAddress,
          newsletter_subscribed: profileData.newsletterSubscribed,
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess('Profile updated successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error updating profile:', err.message)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading-spinner">
            <FiLoader className="spinner" />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <motion.div
          className="profile-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="profile-header">
            <div className="profile-avatar">
              <FiUser />
            </div>
            <h1>My Profile</h1>
            <p>Manage your account information</p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <motion.div
              className="profile-success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {success}
            </motion.div>
          )}

          {error && (
            <motion.div
              className="profile-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="profile-form">
            {/* Personal Information */}
            <div className="form-section">
              <h2>Personal Information</h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">
                    <FiUser /> First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">
                    <FiUser /> Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <FiMail /> Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  disabled
                  className="disabled-input"
                />
                <small>Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <FiPhone /> Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="form-section">
              <h2>
                <FiMapPin /> Shipping Address
              </h2>

              <div className="form-group">
                <label htmlFor="address_street">Street Address</label>
                <input
                  type="text"
                  id="address_street"
                  name="address_street"
                  value={profileData.shippingAddress.street}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address_city">City</label>
                  <input
                    type="text"
                    id="address_city"
                    name="address_city"
                    value={profileData.shippingAddress.city}
                    onChange={handleChange}
                    placeholder="New York"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address_state">State</label>
                  <input
                    type="text"
                    id="address_state"
                    name="address_state"
                    value={profileData.shippingAddress.state}
                    onChange={handleChange}
                    placeholder="NY"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address_zip">ZIP Code</label>
                  <input
                    type="text"
                    id="address_zip"
                    name="address_zip"
                    value={profileData.shippingAddress.zip}
                    onChange={handleChange}
                    placeholder="10001"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address_country">Country</label>
                  <input
                    type="text"
                    id="address_country"
                    name="address_country"
                    value={profileData.shippingAddress.country}
                    onChange={handleChange}
                    placeholder="USA"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="form-section">
              <h2>Preferences</h2>

              <div className="form-group checkbox-group">
                <label htmlFor="newsletterSubscribed" className="checkbox-label">
                  <input
                    type="checkbox"
                    id="newsletterSubscribed"
                    name="newsletterSubscribed"
                    checked={profileData.newsletterSubscribed}
                    onChange={handleChange}
                  />
                  <span>Subscribe to newsletter for updates and special offers</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <motion.button
              type="submit"
              className="profile-save-btn"
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
            >
              {saving ? (
                <>
                  <FiLoader className="spinner" /> Saving...
                </>
              ) : (
                <>
                  <FiSave /> Save Changes
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default Profile
