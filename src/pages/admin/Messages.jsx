import React, { useState, useEffect, useCallback } from 'react'
import {
  FiMail, FiPhone, FiChevronDown, FiChevronUp,
  FiCheckCircle, FiCheck, FiExternalLink
} from 'react-icons/fi'
import * as adminService from '../../services/adminService'
import './Messages.css'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Messages' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
]

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const Messages = () => {
  const [messages, setMessages] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const loadMessages = useCallback(async (status) => {
    try {
      setLoading(true)
      const data = await adminService.getAllMessages({ status })
      setMessages(data)
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMessages(statusFilter)
  }, [statusFilter, loadMessages])

  const handleRowClick = async (msg) => {
    const isExpanding = expandedId !== msg.id

    // Toggle expanded row
    setExpandedId(isExpanding ? msg.id : null)

    // Auto-mark as read when opening a 'new' message
    if (isExpanding && msg.status === 'new') {
      try {
        await adminService.updateMessageStatus(msg.id, 'read')
        setMessages(prev =>
          prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m)
        )
      } catch (err) {
        console.error('Failed to auto-mark as read:', err)
      }
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    setActionLoading(`${id}-${newStatus}`)
    try {
      await adminService.updateMessageStatus(id, newStatus)
      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, status: newStatus } : m)
      )
    } catch (err) {
      console.error('Failed to update message status:', err)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="adm-messages">
      {/* Page header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Messages</h1>
          <p className="adm-page-sub">Customer enquiries and contact submissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="adm-filters">
        <select
          className="adm-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="adm-loading">
          <div className="adm-spinner" />
        </div>
      ) : messages.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty__icon"><FiMail /></div>
          <p className="adm-empty__text">
            {statusFilter === 'new' ? 'No new messages.' :
             statusFilter === 'read' ? 'No read messages.' :
             statusFilter === 'replied' ? 'No replied messages.' :
             'No messages yet.'}
          </p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-messages__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {messages.map(msg => {
                const isExpanded = expandedId === msg.id
                const isNew = msg.status === 'new'

                return (
                  <React.Fragment key={msg.id}>
                    {/* Main row */}
                    <tr
                      className={`adm-messages__row${isNew ? ' adm-messages__row--new' : ''}${isExpanded ? ' adm-messages__row--expanded' : ''}`}
                      onClick={() => handleRowClick(msg)}
                    >
                      <td>
                        <span className={`adm-messages__name${isNew ? ' adm-messages__name--bold' : ''}`}>
                          {msg.name}
                        </span>
                      </td>
                      <td className="adm-messages__email">{msg.email}</td>
                      <td>
                        {msg.subject ? (
                          <span className={isNew ? 'adm-messages__subject--bold' : ''}>
                            {msg.subject}
                          </span>
                        ) : (
                          <span className="adm-messages__no-subject">No subject</span>
                        )}
                      </td>
                      <td className="adm-messages__date">{formatDate(msg.created_at)}</td>
                      <td>
                        <span className={`adm-badge adm-badge--${msg.status}`}>{msg.status}</span>
                      </td>
                      <td className="adm-messages__chevron-cell">
                        <span className="adm-messages__chevron">
                          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isExpanded && (
                      <tr className="adm-messages__expanded-row">
                        <td colSpan={6}>
                          <div className="adm-messages__detail">
                            {/* Message body */}
                            <div className="adm-messages__body">
                              <p className="adm-messages__message-text">{msg.message}</p>
                            </div>

                            {/* Contact info + actions */}
                            <div className="adm-messages__detail-footer">
                              <div className="adm-messages__contact-info">
                                <span className="adm-messages__contact-item">
                                  <FiMail />
                                  {msg.email}
                                </span>
                                {msg.phone && (
                                  <span className="adm-messages__contact-item">
                                    <FiPhone />
                                    {msg.phone}
                                  </span>
                                )}
                              </div>

                              <div className="adm-messages__detail-actions">
                                {msg.status !== 'read' && msg.status !== 'replied' && (
                                  <button
                                    className="adm-btn adm-btn--secondary adm-btn--sm"
                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(msg.id, 'read') }}
                                    disabled={actionLoading === `${msg.id}-read`}
                                  >
                                    <FiCheck />
                                    Mark as Read
                                  </button>
                                )}
                                {msg.status !== 'replied' && (
                                  <button
                                    className="adm-btn adm-btn--secondary adm-btn--sm"
                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(msg.id, 'replied') }}
                                    disabled={actionLoading === `${msg.id}-replied`}
                                  >
                                    <FiCheckCircle />
                                    Mark as Replied
                                  </button>
                                )}
                                <a
                                  href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'Your message')}`}
                                  className="adm-btn adm-btn--primary adm-btn--sm"
                                  onClick={(e) => e.stopPropagation()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FiExternalLink />
                                  Reply
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Messages
