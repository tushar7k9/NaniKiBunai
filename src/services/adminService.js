import { supabase } from '../lib/supabase'

// Orders in these statuses don't count towards revenue
export const REVENUE_EXCLUDED_STATUSES = ['cancelled', 'refunded', 'returned']

// ── Dashboard Stats ──

export const getStats = async () => {
  const [orders, products, reviews, messages] = await Promise.all([
    supabase.from('orders').select('total_amount, status', { count: 'exact' }),
    supabase.from('products').select('id, is_active', { count: 'exact' }),
    supabase.from('reviews').select('id, is_approved', { count: 'exact' }),
    supabase.from('reachout_submissions').select('id, status', { count: 'exact' }),
  ])

  const totalRevenue = (orders.data || [])
    .filter(o => !REVENUE_EXCLUDED_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

  const activeProducts = (products.data || []).filter(p => p.is_active).length
  const pendingReviews = (reviews.data || []).filter(r => !r.is_approved).length
  const unreadMessages = (messages.data || []).filter(m => m.status === 'new').length

  return {
    totalOrders: orders.count || 0,
    totalRevenue,
    totalProducts: products.count || 0,
    activeProducts,
    pendingReviews,
    totalReviews: reviews.count || 0,
    unreadMessages,
    totalMessages: messages.count || 0,
  }
}

// ── Orders ──

export const getAllOrders = async ({ status, search, page = 1, limit = 20 } = {}) => {
  let query = supabase
    .from('orders')
    .select('*, order_items(*, products(name, images))', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`order_number.ilike.%${search}%,customer_email.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { orders: data || [], total: count || 0, page, totalPages: Math.ceil((count || 0) / limit) }
}

export const getOrderDetails = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, images, category))')
    .eq('id', orderId)
    .single()

  if (error) throw error
  return data
}

export const updateOrderStatus = async (orderId, status, { fromStatus, trackingNumber } = {}) => {
  const updates = { status, updated_at: new Date().toISOString() }

  // Set timestamps on forward transitions
  if (status === 'shipped') updates.shipped_at = new Date().toISOString()
  if (status === 'delivered') updates.delivered_at = new Date().toISOString()
  // Disruption timestamps (used by Analytics time-series).
  // 'returned' keeps shipped_at/delivered_at/tracking — the order WAS delivered.
  if (status === 'cancelled') updates.cancelled_at = new Date().toISOString()
  if (status === 'returned') updates.returned_at = new Date().toISOString()
  if (status === 'refunded') updates.refunded_at = new Date().toISOString()
  if (trackingNumber !== undefined) updates.tracking_number = trackingNumber

  // Cleanup on backward transitions and cancellations
  if (fromStatus === 'shipped' && status === 'processing') {
    updates.tracking_number = null
    updates.shipped_at = null
  }
  if (fromStatus === 'delivered' && status === 'shipped') {
    updates.delivered_at = null
  }
  if (status === 'cancelled') {
    updates.tracking_number = null
    updates.shipped_at = null
    updates.delivered_at = null
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateTrackingNumber = async (orderId, trackingNumber) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ tracking_number: trackingNumber, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Products ──

export const getAllProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const createProduct = async (productData) => {
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateProduct = async (id, updates) => {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const toggleProductActive = async (id, isActive) => {
  return updateProduct(id, { is_active: isActive })
}

export const deleteProduct = async (id) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ── Reviews ──

export const getAllReviews = async ({ filter = 'all' } = {}) => {
  let query = supabase
    .from('reviews')
    .select('*, products(name, images)')
    .order('created_at', { ascending: false })

  if (filter === 'pending') query = query.eq('is_approved', false)
  if (filter === 'approved') query = query.eq('is_approved', true)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const approveReview = async (id) => {
  const { data, error } = await supabase
    .from('reviews')
    .update({ is_approved: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const rejectReview = async (id) => {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const bulkApproveReviews = async (ids) => {
  const { data, error } = await supabase
    .from('reviews')
    .update({ is_approved: true, updated_at: new Date().toISOString() })
    .in('id', ids)
    .select()

  if (error) throw error
  return data
}

// ── Messages (Reachout Submissions) ──

export const getAllMessages = async ({ status } = {}) => {
  let query = supabase
    .from('reachout_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const updateMessageStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('reachout_submissions')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUnreadCount = async () => {
  const { count, error } = await supabase
    .from('reachout_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  if (error) throw error
  return count || 0
}

// ── Store Settings ──

export const getStoreSettings = async () => {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error
  return data
}

export const updateStoreSettings = async (patch) => {
  const { data, error } = await supabase
    .from('store_settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Users (via admin-users edge function) ──
// auth.users can't be read with the anon key; the edge function verifies
// the caller's JWT is the admin, then lists users with the service role.
// functions.invoke auto-attaches the logged-in user's access token.

export const listAuthUsers = async () => {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'list' },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data.users || []
}

export const getAuthUser = async (userId) => {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'get', userId },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data.user
}

// ── User drill-down (client-side, under admin RLS policies) ──

export const getUserOrdersAdmin = async (userId, email) => {
  let query = supabase
    .from('orders')
    .select('*, order_items(*, products(name, images))')
    .order('created_at', { ascending: false })

  // Include pre-signup guest orders matched by email. Skip the email clause
  // if it contains characters that would break the PostgREST or-filter.
  if (email && !/[,()]/.test(email)) {
    query = query.or(`user_id.eq.${userId},customer_email.eq.${email}`)
  } else {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const getUserCartAdmin = async (userId) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, products(name, images, price)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const getUserFavoritesAdmin = async (userId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, products(name, images, price, category)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const getUserReviewsAdmin = async (userId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, products(name, images)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ── Analytics ──

/**
 * Fetch every row of a query by paging past PostgREST's row limit
 * (default 1000 per request — without this, aggregates silently truncate).
 * At current shop scale this is 1-2 requests; move the aggregation into a
 * SECURITY DEFINER RPC if orders ever exceed ~10k rows.
 */
const fetchAllRows = async (buildQuery, pageSize = 1000) => {
  const rows = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }
  return rows
}

export const getAnalyticsOrders = async ({ since } = {}) => {
  return fetchAllRows(() => {
    let query = supabase
      .from('orders')
      .select('created_at, status, total_amount, payment_status, cancelled_at, returned_at, refunded_at, updated_at, user_id, customer_email')
      .order('created_at', { ascending: true })
    if (since) query = query.gte('created_at', since)
    return query
  })
}

export const getTopProductStats = async ({ since } = {}) => {
  return fetchAllRows(() => {
    let query = supabase
      .from('order_items')
      .select('product_id, quantity, total_price, product_snapshot, products(name, category), orders!inner(status, created_at)')
      .not('orders.status', 'in', `(${REVENUE_EXCLUDED_STATUSES.join(',')})`)
    if (since) query = query.gte('orders.created_at', since)
    return query
  })
}
