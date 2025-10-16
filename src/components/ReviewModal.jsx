import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiStar, FiUpload, FiImage, FiTrash2 } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { reviewService } from '../services/reviewService'
import './ReviewModal.css'

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

  // Update state when existingReview changes (for editing)
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 0)
      setTitle(existingReview.title || '')
      setReviewText(existingReview.review_text || '')
      setImages(existingReview.images || [])
    } else {
      // Reset form when creating new review
      setRating(0)
      setTitle('')
      setReviewText('')
      setImages([])
    }
    setError(null)
  }, [existingReview, isOpen])

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      checkPurchaseStatus()
    }
  }, [isOpen, isAuthenticated, productId])

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

    // Convert images to base64 for storage
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
      .catch((err) => {
        setError(err.message)
      })
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
      } else {
        await reviewService.createReview(reviewData)
      }

      onClose(true) // Pass true to indicate successful submission
    } catch (err) {
      console.error('Error submitting review:', err)
      setError(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="review-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="review-modal-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="review-modal-header">
            <div>
              <h2>{existingReview ? 'Edit Your Review' : 'Write a Review'}</h2>
              <p className="product-name">{productName}</p>
            </div>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>

          {purchaseStatus?.hasPurchased && (
            <div className="verified-purchase-badge">
              <span>You purchased this product - Your review will be marked as verified</span>
            </div>
          )}

          <form className="review-modal-form" onSubmit={handleSubmit}>
            {error && (
              <div className="review-error">
                {error}
              </div>
            )}

            <div className="form-group">
              <label>Rating *</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    <FiStar />
                  </button>
                ))}
                <span className="rating-text">
                  {rating === 0 ? 'Select a rating' : `${rating} out of 5 stars`}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="title">Review Title (Optional)</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                maxLength={100}
              />
              <span className="char-count">{title.length}/100</span>
            </div>

            <div className="form-group">
              <label htmlFor="reviewText">Your Review (Optional)</label>
              <textarea
                id="reviewText"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell us what you think about this product..."
                rows={5}
                maxLength={1000}
              />
              <span className="char-count">{reviewText.length}/1000</span>
            </div>

            <div className="form-group">
              <label>Photos (Optional)</label>
              <p className="help-text">Add up to 5 photos (max 5MB each)</p>

              <div className="image-upload-area">
                {images.length < 5 && (
                  <label className="upload-btn">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <FiUpload />
                    <span>Upload Photos</span>
                  </label>
                )}

                {images.length > 0 && (
                  <div className="image-preview-grid">
                    {images.map((image, index) => (
                      <div key={index} className="image-preview">
                        <img src={image} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeImage(index)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="review-modal-footer">
              <motion.button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="submit-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting
                  ? 'Submitting...'
                  : existingReview
                  ? 'Update Review'
                  : 'Submit Review'}
              </motion.button>
            </div>

            <p className="review-disclaimer">
              Your review will be visible after approval. Please follow our community guidelines.
            </p>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ReviewModal
