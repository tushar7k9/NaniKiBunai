/**
 * Order Service
 *
 * Handles all order-related operations with Supabase backend
 * Works with orders and order_items tables
 */

import { supabase } from '../lib/supabase'

/**
 * Generate a unique order number
 * Format: ORD-YYYYMMDD-XXXXX
 */
const generateOrderNumber = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
  return `ORD-${year}${month}${day}-${random}`
}

export const orderService = {
  /**
   * Create a new order with order items
   * @param {Object} orderData - Order information
   * @param {Object} orderData.shippingAddress - Shipping address details
   * @param {Object} orderData.billingAddress - Billing address details (optional)
   * @param {string} orderData.customerEmail - Customer email
   * @param {string} orderData.customerPhone - Customer phone
   * @param {Array} orderData.items - Cart items to be ordered
   * @param {number} orderData.subtotal - Order subtotal
   * @param {number} orderData.shippingCost - Shipping cost
   * @param {number} orderData.taxAmount - Tax amount
   * @param {number} orderData.totalAmount - Total order amount
   * @param {string} orderData.customerNotes - Customer notes (optional)
   * @param {Object} orderData.productInstructions - Per-product instructions (optional)
   * @returns {Promise<Object>} Created order with order items
   */
  createOrder: async (orderData) => {
    try {
      // Get current user (may be null for guest checkout)
      const { data: { user } } = await supabase.auth.getUser()

      // Generate unique order number
      const orderNumber = generateOrderNumber()

      // Generate the order id client-side: guests have no SELECT access to
      // orders (RLS), so INSERT ... RETURNING would come back empty — with a
      // known id we never need to read the row back
      const orderId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
          })

      // Prepare order data for insertion
      const order = {
        id: orderId,
        order_number: orderNumber,
        user_id: user?.id || null,
        status: 'pending',
        subtotal: orderData.subtotal,
        shipping_cost: orderData.shippingCost || 0,
        tax_amount: orderData.taxAmount || 0,
        discount_amount: orderData.discountAmount || 0,
        total_amount: orderData.totalAmount,
        shipping_address: orderData.shippingAddress,
        billing_address: orderData.billingAddress || orderData.shippingAddress,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone,
        payment_status: 'pending', // Will be updated when payment is integrated
        payment_method: orderData.paymentMethod || null,
        customer_notes: orderData.customerNotes || null,
      }

      // Insert order into database — no .select(): guests can't read
      // orders back under RLS, and we already know every field locally
      const { error: orderError } = await supabase
        .from('orders')
        .insert([order])

      if (orderError) {
        console.error('Error creating order:', orderError)
        throw orderError
      }

      const createdOrder = { ...order, created_at: new Date().toISOString() }

      // Prepare order items with product instructions
      const orderItems = orderData.items.map((item, index) => {
        // Create product snapshot with full product details
        const productSnapshot = {
          id: item.id,
          name: item.name,
          description: item.description || '',
          images: item.images || [item.image],
          category: item.category || '',
          base_price: item.price,
          // Include any special instructions for this product
          customer_instructions: orderData.productInstructions?.[index] || null,
        }

        return {
          order_id: createdOrder.id,
          product_id: item.id,
          product_snapshot: productSnapshot,
          quantity: item.quantity,
          price_per_unit: item.price,
          total_price: item.price * item.quantity,
          selected_color: item.selectedColor || item.selected_color || null,
          selected_size: item.selectedSize || item.selected_size || null,
        }
      })

      // Insert order items — same as above, no .select() needed
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Error creating order items:', itemsError)
        // Rollback: Delete the order if items creation fails
        await supabase.from('orders').delete().eq('id', createdOrder.id)
        throw itemsError
      }

      const createdOrderItems = orderItems

      return {
        order: createdOrder,
        items: createdOrderItems,
      }
    } catch (error) {
      console.error('Error in createOrder:', error)
      throw error
    }
  },

  /**
   * Get order by ID with all order items
   * @param {string} orderId - Order UUID
   * @returns {Promise<Object>} Order with items
   */
  getOrderById: async (orderId) => {
    try {
      // Fetch order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) {
        console.error('Error fetching order:', orderError)
        throw orderError
      }

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)

      if (itemsError) {
        console.error('Error fetching order items:', itemsError)
        throw itemsError
      }

      return {
        ...order,
        items,
      }
    } catch (error) {
      console.error('Error in getOrderById:', error)
      throw error
    }
  },

  /**
   * Get order by order number
   * @param {string} orderNumber - Order number (e.g., ORD-20241012-12345)
   * @returns {Promise<Object>} Order with items
   */
  getOrderByNumber: async (orderNumber) => {
    try {
      // Fetch order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single()

      if (orderError) {
        console.error('Error fetching order:', orderError)
        throw orderError
      }

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)

      if (itemsError) {
        console.error('Error fetching order items:', itemsError)
        throw itemsError
      }

      return {
        ...order,
        items,
      }
    } catch (error) {
      console.error('Error in getOrderByNumber:', error)
      throw error
    }
  },

  /**
   * Get all orders for a user
   * @param {string} userId - User UUID (optional, uses current user if not provided)
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit results
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.status - Filter by status
   * @param {boolean} options.includeGuestOrders - Include orders placed as guest with same email
   * @returns {Promise<Array>} Array of orders with items
   */
  getUserOrders: async (userId = null, options = {}) => {
    try {
      let targetUserId = userId
      let userEmail = null

      // If no userId provided, get current user
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('No authenticated user found')
        }
        targetUserId = user.id
        userEmail = user.email
      }

      // Explicit columns: customers don't need admin_notes,
      // payment_intent_id, or billing_address on their dashboard
      const CUSTOMER_ORDER_COLUMNS =
        'id, order_number, user_id, status, subtotal, shipping_cost, tax_amount, ' +
        'discount_amount, total_amount, shipping_address, customer_email, customer_phone, ' +
        'payment_status, payment_method, tracking_number, customer_notes, cancellation_reason, customer_note, ' +
        'shipped_at, delivered_at, cancelled_at, returned_at, refunded_at, created_at, updated_at, ' +
        'replacement_for, return_requests!return_requests_order_id_fkey(*)'

      // Build query for orders linked to user
      let query = supabase
        .from('orders')
        .select(CUSTOMER_ORDER_COLUMNS)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data: orders, error: ordersError } = await query

      if (ordersError) {
        console.error('Error fetching user orders:', ordersError)
        throw ordersError
      }

      let allOrders = orders || []

      // Also fetch guest orders with same email if option is enabled
      if (options.includeGuestOrders !== false && userEmail) {
        const { data: guestOrders } = await supabase
          .from('orders')
          .select(CUSTOMER_ORDER_COLUMNS)
          .eq('customer_email', userEmail)
          .is('user_id', null)
          .order('created_at', { ascending: false })

        if (guestOrders && guestOrders.length > 0) {
          allOrders = [...allOrders, ...guestOrders]
          // Sort by created_at descending
          allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }
      }

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        allOrders.map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)

          if (itemsError) {
            console.error('Error fetching order items:', itemsError)
            return { ...order, items: [] }
          }

          return { ...order, items }
        })
      )

      return ordersWithItems
    } catch (error) {
      console.error('Error in getUserOrders:', error)
      throw error
    }
  },

  /**
   * Cancel an order via the atomic cancel_my_order RPC.
   * The database enforces ownership AND the pending/confirmed gate in a
   * single statement (customers have no direct UPDATE rights on orders),
   * which also eliminates the cancel-vs-ship race.
   * @param {string} orderId - Order UUID
   * @param {string} reason - Optional cancellation reason (max 300 chars)
   * @returns {Promise<Object>} The updated order row
   */
  cancelOrder: async (orderId, reason = null) => {
    try {
      const { data, error } = await supabase.rpc('cancel_my_order', {
        p_order_id: orderId,
        p_reason: reason,
      })

      if (error) {
        if (/ORDER_NOT_CANCELLABLE/.test(error.message)) {
          throw new Error(
            'This order can no longer be cancelled — it may already be in crafting. Please contact us and we\'ll help.'
          )
        }
        console.error('Error cancelling order:', error)
        throw error
      }

      // RPC returns SETOF orders — a single-row array
      return Array.isArray(data) ? data[0] : data
    } catch (error) {
      console.error('Error in cancelOrder:', error)
      throw error
    }
  },

  /**
   * Fetch the audit timeline for an order (RLS limits access to the
   * order's owner and the admin).
   * @param {string} orderId - Order UUID
   * @returns {Promise<Array>} Events, oldest first
   */
  /**
   * Request a return (refund or replacement) for specific items of a
   * delivered, paid order. All rules are enforced by the DB function;
   * this maps its error codes to friendly messages.
   * @param {string} orderId
   * @param {Object} payload - { type, reason, description, photos, items }
   * @returns {Promise<Object>} the created return request row
   */
  requestReturn: async (orderId, { type, reason, description, photos, items }) => {
    const { data, error } = await supabase.rpc('request_return', {
      p_order_id: orderId,
      p_type: type,
      p_reason: reason,
      p_description: description || null,
      p_photos: photos,
      p_items: items,
    })

    if (error) {
      const friendly = {
        RETURN_ORDER_NOT_FOUND: 'We could not find this order on your account.',
        RETURN_NOT_ELIGIBLE_REPLACEMENT: 'Replacement orders cannot be returned. Please contact us if something is wrong.',
        RETURN_NOT_DELIVERED: 'Returns can be requested once the order is delivered.',
        RETURN_NOT_PAID: 'Returns can be requested once payment is completed.',
        RETURN_WINDOW_EXPIRED: 'The 7-day return window for this order has ended.',
        RETURN_ITEM_CUSTOM: 'Custom-made items cannot be returned.',
        RETURN_ITEM_ALREADY_REQUESTED: 'A return was already requested for one of these items — each item has a single return chance.',
        RETURN_PHOTOS_REQUIRED: 'Please add at least one photo of the item.',
        RETURN_NO_ITEMS: 'Please select at least one item to return.',
      }
      const code = Object.keys(friendly).find((k) => error.message?.includes(k))
      throw new Error(code ? friendly[code] : 'Could not submit the return request. Please try again.')
    }
    return Array.isArray(data) ? data[0] : data
  },

  /**
   * Client-side mirror of the return eligibility rules (the DB enforces
   * them authoritatively) — used to decide whether to show the button.
   * @returns {{ eligible: boolean, daysLeft: number, eligibleItems: Array, reason?: string }}
   */
  getReturnEligibility: (order) => {
    const none = (reason) => ({ eligible: false, daysLeft: 0, eligibleItems: [], reason })
    if (order.replacement_for) return none('replacement')
    if (!['delivered', 'completed'].includes(order.status)) return none('not_delivered')
    if (order.payment_status !== 'paid') return none('not_paid')
    if (!order.delivered_at) return none('not_delivered')
    const msLeft = new Date(order.delivered_at).getTime() + 7 * 86400000 - Date.now()
    if (msLeft <= 0) return none('window_expired')

    // One chance per item: ANY prior request — even a rejected one —
    // consumes that item's single return opportunity
    const requestedItemIds = new Set(
      (order.return_requests || []).flatMap((r) => (r.items || []).map((i) => i.order_item_id))
    )
    const eligibleItems = (order.items || []).filter(
      (item) =>
        item.selected_size !== 'Custom' &&
        !item.product_snapshot?.customer_instructions &&
        !requestedItemIds.has(item.id)
    )
    if (eligibleItems.length === 0) return none('no_eligible_items')
    return { eligible: true, daysLeft: Math.ceil(msLeft / 86400000), eligibleItems }
  },

  getOrderEvents: async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('order_events')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching order events:', error)
      return []
    }
  },

  /**
   * Get orders by email (for guest checkout)
   * @param {string} email - Customer email
   * @returns {Promise<Array>} Array of orders
   */
  getOrdersByEmail: async (email) => {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching orders by email:', ordersError)
        throw ordersError
      }

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)

          return { ...order, items: items || [] }
        })
      )

      return ordersWithItems
    } catch (error) {
      console.error('Error in getOrdersByEmail:', error)
      throw error
    }
  },

  /**
   * Link guest orders to user account
   * Should be called when a user signs up or logs in
   * @param {string} email - User email
   * @param {string} userId - User ID to link orders to
   * @returns {Promise<Array>} Updated orders
   */
  linkGuestOrdersToUser: async (email, userId) => {
    try {
      // Find all guest orders (orders with matching email but no user_id)
      const { data: guestOrders, error: findError } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_email', email)
        .is('user_id', null)

      if (findError) {
        console.error('Error finding guest orders:', findError)
        throw findError
      }

      if (!guestOrders || guestOrders.length === 0) {
        return []
      }

      // Update all guest orders to link them to the user
      const orderIds = guestOrders.map(order => order.id)
      const { data: updatedOrders, error: updateError } = await supabase
        .from('orders')
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .in('id', orderIds)
        .select()

      if (updateError) {
        console.error('Error linking guest orders to user:', updateError)
        throw updateError
      }

      console.log(`Linked ${updatedOrders.length} guest orders to user ${userId}`)
      return updatedOrders
    } catch (error) {
      console.error('Error in linkGuestOrdersToUser:', error)
      throw error
    }
  },
}

export default orderService
