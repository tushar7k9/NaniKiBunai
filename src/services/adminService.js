import { supabase } from '../lib/supabase'

// ── Dashboard Stats ──

export const getStats = async () => {
  const [orders, products, reviews, messages] = await Promise.all([
    supabase.from('orders').select('total_amount, status', { count: 'exact' }),
    supabase.from('products').select('id, is_active', { count: 'exact' }),
    supabase.from('reviews').select('id, is_approved', { count: 'exact' }),
    supabase.from('reachout_submissions').select('id, status', { count: 'exact' }),
  ])

  const totalRevenue = (orders.data || [])
    .filter(o => !['cancelled', 'refunded'].includes(o.status))
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
