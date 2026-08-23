import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiUsers } from 'react-icons/fi'
import * as adminService from '../../services/adminService'
import { ADMIN_EMAIL } from '../../contexts/AuthContext'
import './Users.css'

const LIMIT = 20

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`

const displayName = (u) => {
  const meta = u.user_metadata || {}
  const first = meta.firstName || meta.first_name || ''
  const last = meta.lastName || meta.last_name || ''
  return `${first} ${last}`.trim() || '—'
}

const Users = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [orderStats, setOrderStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const [usersData, ordersData] = await Promise.all([
        adminService.listAuthUsers(),
        adminService.getAnalyticsOrders(),
      ])
      setUsers(usersData)

      // Per-user order count + lifetime value, matching orders by user_id
      // or (for pre-signup guest orders) by email
      const emailToId = {}
      usersData.forEach((u) => {
        if (u.email) emailToId[u.email.toLowerCase()] = u.id
      })
      const stats = {}
      ordersData.forEach((o) => {
        const key = o.user_id || emailToId[(o.customer_email || '').toLowerCase()]
        if (!key) return
        if (!stats[key]) stats[key] = { orderCount: 0, lifetimeValue: 0 }
        stats[key].orderCount += 1
        if (!adminService.REVENUE_EXCLUDED_STATUSES.includes(o.status)) {
          stats[key].lifetimeValue += Number(o.total_amount || 0)
        }
      })
      setOrderStats(stats)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        (u.email || '').toLowerCase().includes(q) ||
        displayName(u).toLowerCase().includes(q)
    )
  }, [users, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT))
  const currentPage = Math.min(page, totalPages)
  const pageUsers = filtered.slice((currentPage - 1) * LIMIT, currentPage * LIMIT)

  // Windowed page numbers (current ± 2)
  const pageNumbers = useMemo(() => {
    const nums = []
    for (
      let n = Math.max(1, currentPage - 2);
      n <= Math.min(totalPages, currentPage + 2);
      n++
    ) {
      nums.push(n)
    }
    return nums
  }, [currentPage, totalPages])

  if (loading) {
    return <div className="adm-loading"><div className="adm-spinner" /></div>
  }

  return (
    <div className="adm-users">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Users</h1>
          <p className="adm-page-sub">
            {users.length} registered {users.length === 1 ? 'user' : 'users'}
          </p>
        </div>
      </div>

      {error && (
        <div className="adm-empty">
          <p className="adm-empty__text">{error}</p>
          <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={loadUsers}>
            Retry
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* Search */}
          <div className="adm-filters">
            <div className="adm-users__search-wrap">
              <FiSearch className="adm-users__search-icon" />
              <input
                className="adm-input adm-users__search-input"
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="adm-empty">
              <FiUsers className="adm-empty__icon" />
              <p className="adm-empty__text">
                {search ? 'No users match your search' : 'No registered users yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Signed Up</th>
                      <th>Last Sign-in</th>
                      <th>Provider</th>
                      <th>Confirmed</th>
                      <th>Orders</th>
                      <th>Lifetime Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageUsers.map((u) => {
                      const stats = orderStats[u.id] || { orderCount: 0, lifetimeValue: 0 }
                      return (
                        <tr
                          key={u.id}
                          className="adm-users__row"
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                        >
                          <td data-cell="title">
                            <div className="adm-users__identity">
                              <div className="adm-users__avatar">
                                {(displayName(u)[0] !== '—' && displayName(u)[0]) ||
                                  (u.email || '?')[0].toUpperCase()}
                              </div>
                              <div className="adm-users__identity-text">
                                <span className="adm-users__name">
                                  {displayName(u)}
                                  {(u.email || '').toLowerCase() === ADMIN_EMAIL && (
                                    <span className="adm-badge adm-badge--admin">Admin</span>
                                  )}
                                </span>
                                <span className="adm-users__email">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td data-label="Signed Up">{formatDate(u.created_at)}</td>
                          <td data-label="Last Sign-in">{formatDate(u.last_sign_in_at)}</td>
                          <td style={{ textTransform: 'capitalize' }} data-label="Provider">{u.provider}</td>
                          <td data-label="Confirmed">
                            <span className={`adm-badge adm-badge--${u.email_confirmed_at ? 'active' : 'pending'}`}>
                              {u.email_confirmed_at ? 'Confirmed' : 'Pending'}
                            </span>
                          </td>
                          <td data-label="Orders">{stats.orderCount}</td>
                          <td style={{ fontWeight: 500 }} data-label="Lifetime Value">{formatCurrency(stats.lifetimeValue)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="adm-pagination">
                  <button
                    className="adm-pagination__btn"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={currentPage === 1}
                  >
                    ←
                  </button>

                  {pageNumbers[0] > 1 && (
                    <>
                      <button className="adm-pagination__btn" onClick={() => setPage(1)}>
                        1
                      </button>
                      {pageNumbers[0] > 2 && <span className="adm-pagination__info">…</span>}
                    </>
                  )}

                  {pageNumbers.map((n) => (
                    <button
                      key={n}
                      className={`adm-pagination__btn${n === currentPage ? ' adm-pagination__btn--active' : ''}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ))}

                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                        <span className="adm-pagination__info">…</span>
                      )}
                      <button className="adm-pagination__btn" onClick={() => setPage(totalPages)}>
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    className="adm-pagination__btn"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={currentPage === totalPages}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Users
