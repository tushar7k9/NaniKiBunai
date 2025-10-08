/**
 * Register Page
 *
 * User registration with email and password
 * Redirects to home page after successful registration
 */

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import './Auth.css'

function Register() {
  const navigate = useNavigate()
  const { signUp, signInWithProvider, loading } = useAuth()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('') // Clear error when user types
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    // Validation
    if (!formData.email || !formData.password || !formData.firstName) {
      setError('Please fill in all required fields')
      setIsSubmitting(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsSubmitting(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsSubmitting(false)
      return
    }

    // Sign up
    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
      }
    )

    setIsSubmitting(false)

    if (signUpError) {
      setError(signUpError)
    } else {
      // Success! Show message or redirect
      navigate('/')
    }
  }

  const handleGoogleSignup = async () => {
    const { error: googleError } = await signInWithProvider('google')
    if (googleError) {
      setError(googleError)
    }
  }

  const handleGithubSignup = async () => {
    const { error: githubError } = await signInWithProvider('github')
    if (githubError) {
      setError(githubError)
    }
  }

  return (
    <div className="auth-page">
      {/* Decorative yarn elements */}
      <motion.div
        style={{
          position: 'absolute',
          top: '80px',
          right: '12%',
          fontSize: '90px',
          zIndex: 1,
          opacity: 0.13,
        }}
        animate={{
          rotate: [0, 15, -15, 0],
          y: [0, -15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        🧶
      </motion.div>
      <motion.div
        style={{
          position: 'absolute',
          bottom: '100px',
          left: '5%',
          fontSize: '75px',
          zIndex: 1,
          opacity: 0.1,
        }}
        animate={{
          rotate: [0, -12, 12, 0],
          y: [0, 12, 0],
        }}
        transition={{
          duration: 7.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      >
        🧶
      </motion.div>

      <div className="auth-container">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Sign up to start shopping with Nani Ki Bunai</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error">
              <p>{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  disabled={isSubmitting || loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  disabled={isSubmitting || loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                disabled={isSubmitting || loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={isSubmitting || loading}
              />
              <small>Minimum 6 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={isSubmitting || loading}
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>Or continue with</span>
          </div>

          {/* Social Signup */}
          <div className="social-login">
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="social-button google"
              disabled={isSubmitting || loading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.71.48-1.62.77-2.7.77-2.08 0-3.84-1.4-4.47-3.3H1.83v2.07A7.96 7.96 0 0 0 8.98 17Z"/>
                <path fill="#FBBC05" d="M4.51 10.52A4.8 4.8 0 0 1 4.26 9c0-.53.09-1.04.25-1.52V5.41H1.83A7.96 7.96 0 0 0 1 9c0 1.3.31 2.52.83 3.59l2.68-2.07Z"/>
                <path fill="#EA4335" d="M8.98 3.7c1.17 0 2.23.4 3.06 1.2l2.3-2.3A7.96 7.96 0 0 0 8.98 1a7.96 7.96 0 0 0-7.15 4.41l2.68 2.07C5.14 5.1 6.9 3.7 8.98 3.7Z"/>
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={handleGithubSignup}
              className="social-button github"
              disabled={isSubmitting || loading}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              GitHub
            </button>
          </div>

          {/* Login Link */}
          <div className="auth-footer-link">
            <p>
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Register
