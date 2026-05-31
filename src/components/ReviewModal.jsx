import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiStar, FiCamera, FiTrash2, FiCheck } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { reviewService } from '../services/reviewService'
import './ReviewModal.css'

const ratingLabels = ['', 'Awful', 'Poor', 'Okay', 'Good', 'Loved it!']

const ReviewModal = ({ isOpen, onClose, productId, productName, existingReview = null }) => {
  const { user, isAuthenticated } = useAuth()
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState(existingReview?.title || '')
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '')
  const [images, setImages] = useState(existingReview?.images || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [purchaseStatus, setPurchaseStatus] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submittedRating, setSubmittedRating] = useState(0)

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 0)
      setTitle(existingReview.title || '')
      setReviewText(existingReview.review_text || '')
      setImages(existingReview.images || [])
    } else {
      setRating(0)
      setTitle('')
      setReviewText('')
      setImages([])
    }
    setError(null)
    setSubmitted(false)
  }, [existingReview, isOpen])

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      checkPurchaseStatus()
    }
  }, [isOpen, isAuthenticated, productId])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const checkPurchaseStatus = async () => {
    try {
      const status = await reviewService.checkUserPurchase(productId)
      setPurchaseStatus(status)
    } catch (err) {
      console.error('Error checking purchase status:', err)
    }
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 5) {
      setError('You can only upload up to 5 images')
      return
    }

    const imagePromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) {
          reject(new Error('Image size must be less than 5MB'))
          return
        }
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    })

    Promise.all(imagePromises)
      .then((base64Images) => {
        setImages([...images, ...base64Images])
        setError(null)
      })
      .catch((err) => setError(err.message))
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!isAuthenticated) {
      setError('You must be logged in to submit a review')
      return
    }
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setIsSubmitting(true)
    try {
      const reviewData = {
        productId,
        rating,
        title: title.trim() || null,
        reviewText: reviewText.trim() || null,
        images,
      }

      if (existingReview) {
        await reviewService.updateReview(existingReview.id, reviewData)
        onClose(true)
      } else {
        await reviewService.createReview(reviewData)
        setSubmittedRating(rating)
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Error submitting review:', err)
      setError(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessDismiss = useCallback(() => {
    setSubmitted(false)
    onClose(true)
  }, [onClose])

  const activeRating = hoveredRating || rating

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="rm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => onClose(false)}
        >
          <motion.div
            className="rm-modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                /* ── Success Screen ── */
                <motion.div
                  key="success"
                  className="rm-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div
                    className="rm-success__check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <FiCheck />
                  </motion.div>

                  <motion.h2
                    className="rm-success__title"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    Thank you for your review!
                  </motion.h2>

                  <motion.div
                    className="rm-success__stars"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                  >
                    {[1, 2, 3, 4, 5].map(s => (
                      <FiStar
                        key={s}
                        style={{
                          fill: s <= submittedRating ? 'var(--terracotta)' : 'none',
                          stroke: s <= submittedRating ? 'var(--terracotta)' : 'var(--border-subtle)',
                        }}
                      />
                    ))}
                  </motion.div>

                  <motion.p
                    className="rm-success__message"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Your review has been submitted and is pending approval. It'll be visible on the product page once our team gives it a quick look.
                  </motion.p>

                  <motion.p
                    className="rm-success__note"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    We appreciate you taking the time to share your experience — it helps fellow craft lovers make the right choice.
                  </motion.p>

                  <motion.div
                    className="rm-success__stitch"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.45, duration: 0.4 }}
                  />

                  <motion.button
                    className="rm-btn rm-btn--submit rm-success__btn"
                    onClick={handleSuccessDismiss}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue Shopping
                  </motion.button>
                </motion.div>
              ) : (
                /* ── Review Form ── */
                <motion.div
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Header */}
                  <div className="rm-header">
                    <div>
                      <h2 className="rm-title">
                        {existingReview ? 'Edit Your Review' : 'Share Your Experience'}
                      </h2>
                      <span className="rm-product-name">{productName}</span>
                    </div>
                    <button className="rm-close" onClick={() => onClose(false)}>
                      <FiX />
                    </button>
                  </div>

                  <div className="rm-stitch" />

                  {/* Verified badge */}
                  {purchaseStatus?.hasPurchased && (
                    <div className="rm-verified">
                      <span>Your review will be marked as a verified purchase</span>
                    </div>
                  )}

                  {/* Pending notice */}
                  {existingReview && !existingReview.is_approved && (
                    <div className="rm-pending-notice">
                      <FiStar className="rm-pending-notice__icon" />
                      <span>This review is pending approval. You can edit it — it will be re-reviewed after saving.</span>
                    </div>
                  )}

                  <form className="rm-form" onSubmit={handleSubmit}>
                    {/* Error */}
                    {error && (
                      <motion.div
                        className="rm-error"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* Star Rating */}
                    <div className="rm-field">
                      <label className="rm-label">Rating</label>
                      <div className="rm-stars">
                        <div className="rm-stars__row">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <motion.button
                              key={star}
                              type="button"
                              className="rm-star"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              whileTap={{ scale: 0.85 }}
                              style={{
                                color: star <= activeRating ? 'var(--terracotta)' : 'var(--border-subtle)',
                              }}
                            >
                              <FiStar style={{
                                fill: star <= activeRating ? 'var(--terracotta)' : 'none',
                                stroke: star <= activeRating ? 'var(--terracotta)' : 'var(--border-subtle)',
                              }} />
                            </motion.button>
                          ))}
                        </div>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={activeRating}
                            className={`rm-stars__label${activeRating >= 4 ? ' positive' : ''}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                          >
                            {activeRating > 0 ? ratingLabels[activeRating] : 'Tap to rate'}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="rm-field">
                      <label className="rm-label" htmlFor="rm-title">
                        Title <span className="rm-optional">optional</span>
                      </label>
                      <input
                        type="text"
                        id="rm-title"
                        className="rm-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Summarize your experience"
                        maxLength={100}
                      />
                      <span className="rm-char-count">{title.length}/100</span>
                    </div>

                    {/* Review Text */}
                    <div className="rm-field">
                      <label className="rm-label" htmlFor="rm-text">
                        Review <span className="rm-optional">optional</span>
                      </label>
                      <textarea
                        id="rm-text"
                        className="rm-textarea"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="What did you love about this piece? How does it feel?"
                        rows={4}
                        maxLength={1000}
                      />
                      <span className="rm-char-count">{reviewText.length}/1000</span>
                    </div>

                    {/* Image Upload */}
                    <div className="rm-field">
                      <label className="rm-label">
                        Photos <span className="rm-optional">up to 5</span>
                      </label>

                      <div className="rm-upload-area">
                        {images.length > 0 && (
                          <div className="rm-image-grid">
                            {images.map((image, index) => (
                              <div key={index} className="rm-image-preview">
                                <img src={image} alt={`Preview ${index + 1}`} />
                                <button
                                  type="button"
                                  className="rm-image-remove"
                                  onClick={() => removeImage(index)}
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {images.length < 5 && (
                          <label className="rm-upload-btn">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                            />
                            <FiCamera />
                            <span>Add Photos</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="rm-footer">
                      <button
                        type="button"
                        className="rm-btn rm-btn--cancel"
                        onClick={() => onClose(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="submit"
                        className="rm-btn rm-btn--submit"
                        disabled={isSubmitting || rating === 0}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSubmitting
                          ? 'Submitting...'
                          : existingReview
                          ? 'Update Review'
                          : 'Submit Review'}
                      </motion.button>
                    </div>

                    <p className="rm-disclaimer">
                      Your review will be visible after approval.
                    </p>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ReviewModal
