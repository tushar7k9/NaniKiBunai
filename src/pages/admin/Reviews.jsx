import React, { useState, useEffect, useCallback } from 'react'
import { FiStar, FiCheck, FiTrash2, FiCheckCircle } from 'react-icons/fi'
import * as adminService from '../../services/adminService'
import './Reviews.css'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
]

const StarRating = ({ rating }) => (
  <span className="adm-reviews__stars" aria-label={`${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map(n => (
      <span key={n} className={n <= rating ? 'adm-reviews__star--filled' : 'adm-reviews__star--empty'}>
        ★
      </span>
    ))}
  </span>
)

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const Reviews = () => {
  const [reviews, setReviews] = useState([])
  const [filter, setFilter] = useState('all')
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const loadReviews = useCallback(async (activeFilter) => {
    try {
      setLoading(true)
      const data = await adminService.getAllReviews({ filter: activeFilter })
      setReviews(data)
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCounts = useCallback(async () => {
    try {
      const [all, pending, approved] = await Promise.all([
        adminService.getAllReviews({ filter: 'all' }),
        adminService.getAllReviews({ filter: 'pending' }),
        adminService.getAllReviews({ filter: 'approved' }),
      ])
      setCounts({ all: all.length, pending: pending.length, approved: approved.length })
    } catch (err) {
      console.error('Failed to load review counts:', err)
    }
  }, [])

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  useEffect(() => {
    loadReviews(filter)
  }, [filter, loadReviews])

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await adminService.approveReview(id)
      await Promise.all([loadReviews(filter), loadCounts()])
    } catch (err) {
      console.error('Failed to approve review:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    setActionLoading(`reject-${id}`)
    try {
      await adminService.rejectReview(id)
      await Promise.all([loadReviews(filter), loadCounts()])
    } catch (err) {
      console.error('Failed to reject review:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkApprove = async () => {
    const pendingIds = reviews.filter(r => !r.is_approved).map(r => r.id)
    if (pendingIds.length === 0) return
    setActionLoading('bulk')
    try {
      await adminService.bulkApproveReviews(pendingIds)
      await Promise.all([loadReviews(filter), loadCounts()])
    } catch (err) {
      console.error('Failed to bulk approve:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const pendingCount = counts.pending

  return (
    <div className="adm-reviews">
      {/* Page header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Reviews</h1>
          <p className="adm-page-sub">Manage and moderate customer reviews</p>
        </div>
        {filter === 'pending' && pendingCount > 0 && (
          <button
            className="adm-btn adm-btn--success"
            onClick={handleBulkApprove}
            disabled={actionLoading === 'bulk'}
          >
            <FiCheckCircle />
            {actionLoading === 'bulk' ? 'Approving…' : `Approve All Pending (${pendingCount})`}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="adm-reviews__tabs">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`adm-reviews__tab${filter === key ? ' adm-reviews__tab--active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
            {key !== 'all' && counts[key] > 0 && (
              <span className="adm-reviews__tab-count">{counts[key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="adm-loading">
          <div className="adm-spinner" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty__icon"><FiStar /></div>
          <p className="adm-empty__text">
            {filter === 'pending' ? 'No reviews awaiting approval.' :
             filter === 'approved' ? 'No approved reviews yet.' :
             'No reviews yet.'}
          </p>
        </div>
      ) : (
        <div className="adm-reviews__grid">
          {reviews.map(review => {
            const productImg = review.products?.images?.[0]
            const productName = review.products?.name || 'Unknown Product'
            const isPending = !review.is_approved
            const isApproving = actionLoading === review.id
            const isRejecting = actionLoading === `reject-${review.id}`

            return (
              <div key={review.id} className={`adm-reviews__card${isPending ? ' adm-reviews__card--pending' : ''}`}>
                {/* Card header: product info + status indicator */}
                <div className="adm-reviews__card-header">
                  <div className="adm-reviews__product">
                    {productImg ? (
                      <img
                        src={productImg}
                        alt={productName}
                        className="adm-reviews__product-img"
                      />
                    ) : (
                      <div className="adm-reviews__product-img adm-reviews__product-img--placeholder">
                        <FiStar />
                      </div>
                    )}
                    <span className="adm-reviews__product-name">{productName}</span>
                  </div>
                  {isPending ? (
                    <span className="adm-badge adm-badge--pending">Pending</span>
                  ) : (
                    <span className="adm-badge adm-badge--active">Approved</span>
                  )}
                </div>

                {/* Reviewer info */}
                <div className="adm-reviews__reviewer">
                  <div className="adm-reviews__reviewer-left">
                    <span className="adm-reviews__reviewer-name">{review.user_name || 'Anonymous'}</span>
                    {review.is_verified_purchase && (
                      <span className="adm-reviews__verified">
                        <FiCheck /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="adm-reviews__date">{formatDate(review.created_at)}</span>
                </div>

                {/* Rating + title */}
                <div className="adm-reviews__rating-row">
                  <StarRating rating={review.rating} />
                  {review.title && (
                    <span className="adm-reviews__review-title">{review.title}</span>
                  )}
                </div>

                {/* Review text */}
                {review.review_text && (
                  <p className="adm-reviews__review-text">{review.review_text}</p>
                )}

                {/* Review images */}
                {review.images && review.images.length > 0 && (
                  <div className="adm-reviews__images">
                    {review.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Review image ${i + 1}`}
                        className="adm-reviews__review-img"
                      />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="adm-reviews__actions">
                  {isPending && (
                    <button
                      className="adm-btn adm-btn--success adm-btn--sm"
                      onClick={() => handleApprove(review.id)}
                      disabled={isApproving}
                    >
                      <FiCheck />
                      {isApproving ? 'Approving…' : 'Approve'}
                    </button>
                  )}
                  <button
                    className="adm-btn adm-btn--danger adm-btn--sm"
                    onClick={() => handleReject(review.id)}
                    disabled={isRejecting}
                  >
                    <FiTrash2 />
                    {isRejecting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Reviews
