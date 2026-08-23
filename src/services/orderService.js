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

      // Prepare order data for insertion
      const order = {
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

      // Insert order into database
      // Note: We must use .select() to get the created order back
      // The RLS policy allows this even for guests during INSERT
      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single()

      if (orderError) {
        console.error('Error creating order:', orderError)
        throw orderError
      }

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

      // Insert order items
      const { data: createdOrderItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select()

      if (itemsError) {
        console.error('Error creating order items:', itemsError)
        // Rollback: Delete the order if items creation fails
        await supabase.from('orders').delete().eq('id', createdOrder.id)
        throw itemsError
      }

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

      // Build query for orders linked to user
      let query = supabase
        .from('orders')
        .select('*')
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
          .select('*')
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
   * Update order status
   * @param {string} orderId - Order UUID
   * @param {string} status - New status (pending, confirmed, processing, shipped, delivered, completed, cancelled, returned, refunded)
   * @returns {Promise<Object>} Success indicator
   */
  updateOrderStatus: async (orderId, status) => {
    try {
      const validStatuses = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'completed',
        'cancelled',
        'returned',
        'refunded',
      ]

      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`)
      }

      const updateData = {
        status,
        updated_at: new Date().toISOString(),
      }

      // Add timestamps for specific statuses
      if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }

      // Don't use .select() for guest users (they don't have SELECT permission after UPDATE)
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) {
        console.error('Error updating order status:', error)
        throw error
      }

      // Return success indicator instead of the updated order
      return { success: true, orderId, status }
    } catch (error) {
      console.error('Error in updateOrderStatus:', error)
      throw error
    }
  },

  /**
   * Update order payment status (simulated for now)
   * @param {string} orderId - Order UUID
   * @param {string} paymentStatus - Payment status (pending, paid, failed, refunded, partially_refunded)
   * @param {string} paymentIntentId - Payment intent ID from payment processor (optional)
   * @returns {Promise<Object>} Updated order (or null for guest orders)
   */
  updatePaymentStatus: async (orderId, paymentStatus, paymentIntentId = null) => {
    try {
      const validStatuses = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded']

      if (!validStatuses.includes(paymentStatus)) {
        throw new Error(`Invalid payment status: ${paymentStatus}`)
      }

      const updateData = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      }

      if (paymentIntentId) {
        updateData.payment_intent_id = paymentIntentId
      }

      // Don't use .select() for guest users (they don't have SELECT permission after UPDATE)
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) {
        console.error('Error updating payment status:', error)
        throw error
      }

      // Return success indicator instead of the updated order
      return { success: true, orderId, paymentStatus }
    } catch (error) {
      console.error('Error in updatePaymentStatus:', error)
      throw error
    }
  },

  /**
   * Add tracking number to order
   * @param {string} orderId - Order UUID
   * @param {string} trackingNumber - Tracking number
   * @returns {Promise<Object>} Success indicator
   */
  addTrackingNumber: async (orderId, trackingNumber) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: trackingNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (error) {
        console.error('Error adding tracking number:', error)
        throw error
      }

      return { success: true, orderId, trackingNumber }
    } catch (error) {
      console.error('Error in addTrackingNumber:', error)
      throw error
    }
  },

  /**
   * Cancel an order (only if status is pending or confirmed)
   * @param {string} orderId - Order UUID
   * @param {string} reason - Cancellation reason (optional)
   * @returns {Promise<Object>} Success indicator
   */
  cancelOrder: async (orderId, reason = null) => {
    try {
      // First check current status (guests can't do this, only for authenticated users)
      const { data: order } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single()

      if (!order) {
        throw new Error('Order not found')
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        throw new Error('Order cannot be cancelled at this stage')
      }

      const updateData = {
        status: 'cancelled',
        admin_notes: reason || 'Order cancelled by customer',
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) {
        console.error('Error cancelling order:', error)
        throw error
      }

      return { success: true, orderId, status: 'cancelled' }
    } catch (error) {
      console.error('Error in cancelOrder:', error)
      throw error
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
