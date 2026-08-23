/**
 * Cart availability — single source of truth for whether cart items can
 * actually be ordered.
 *
 * Cart data goes stale in two ways:
 *  - Guests keep a full product snapshot in localStorage from add-time
 *  - Logged-in carts join products(*), which returns NULL for products the
 *    admin has deactivated (the RLS policy only exposes is_active = true)
 *
 * hydrateCartItems() reconciles cart items against the live product list so
 * both cases surface the same flags, and validateCartAgainstLiveProducts()
 * re-checks against the database right before an order is placed.
 */

import { supabase } from '../lib/supabase'

const isCustomSize = (size) => typeof size === 'string' && size.startsWith('Custom')

const selectionOf = (item) => ({
  size: item.selectedSize || item.selected_size || null,
  color: item.selectedColor || item.selected_color || null,
})

/**
 * Compute variant availability against a live product.
 * Only flags a selection when the product explicitly defines options and the
 * selection is no longer among them. Custom sizes are always accepted.
 */
const variantIssueOf = (item, liveProduct) => {
  const { size, color } = selectionOf(item)

  const sizeGone =
    size !== null &&
    !isCustomSize(size) &&
    Array.isArray(liveProduct.sizes) &&
    liveProduct.sizes.length > 0 &&
    !liveProduct.sizes.includes(size)

  const colorGone =
    color !== null &&
    Array.isArray(liveProduct.colors) &&
    liveProduct.colors.length > 0 &&
    !liveProduct.colors.includes(color)

  if (sizeGone && colorGone) return 'size and color'
  if (sizeGone) return 'size'
  if (colorGone) return 'color'
  return null
}

/**
 * Merge cart items with the live product catalog.
 *
 * Each returned item keeps its cart identity (quantity, selections,
 * cart_item_id) and gains:
 *  - fresh name / price / images / stock fields when the product is live
 *  - unavailable: true when the product is deactivated or deleted
 *  - variantIssue: 'size' | 'color' | 'size and color' | null
 *
 * If the catalog hasn't loaded yet (empty list), items pass through
 * unchanged — an empty catalog means "unknown", not "everything is gone".
 */
export const hydrateCartItems = (cartItems, products) => {
  const items = cartItems || []
  if (!Array.isArray(products) || products.length === 0) {
    return items.map((item) => ({ ...item, unavailable: false, variantIssue: null }))
  }

  return items.map((item) => {
    const live = products.find((p) => Number(p.id) === Number(item.id))

    if (!live) {
      // Deactivated or deleted. Keep last-known display fields (guest
      // snapshots have them; logged-in items fall back to generic text)
      return {
        ...item,
        unavailable: true,
        variantIssue: null,
        name: item.name || 'Product unavailable',
        price: Number(item.price) || Number(item.price_snapshot) || 0,
      }
    }

    return {
      ...item,
      ...live,
      // cart identity must win over catalog fields
      id: item.id,
      quantity: item.quantity,
      cart_item_id: item.cart_item_id,
      unavailable: false,
      variantIssue: variantIssueOf(item, live),
    }
  })
}

/** True when this item can be ordered as-is. */
export const isItemOrderable = (item) =>
  !item.unavailable &&
  !item.variantIssue &&
  item.stock_quantity !== 0 &&
  !(item.stock_quantity !== undefined && item.quantity > item.stock_quantity)

/**
 * Categorised issues for a hydrated cart.
 * hasBlockingIssues gates both the cart's Checkout button and order submit.
 */
export const getCartIssues = (hydratedItems) => {
  const items = hydratedItems || []
  const unavailable = items.filter((i) => i.unavailable)
  const outOfStock = items.filter((i) => !i.unavailable && i.stock_quantity === 0)
  const exceedsStock = items.filter(
    (i) =>
      !i.unavailable &&
      i.stock_quantity !== undefined &&
      i.stock_quantity > 0 &&
      i.quantity > i.stock_quantity
  )
  const variantIssues = items.filter((i) => !i.unavailable && i.variantIssue)

  const messages = []
  if (unavailable.length > 0) {
    messages.push(
      `${unavailable.length === 1 ? 'One item is' : `${unavailable.length} items are`} no longer available`
    )
  }
  if (outOfStock.length > 0) {
    messages.push(
      `${outOfStock.length === 1 ? 'One item is' : `${outOfStock.length} items are`} out of stock`
    )
  }
  if (exceedsStock.length > 0) {
    messages.push('Some quantities exceed available stock')
  }
  if (variantIssues.length > 0) {
    messages.push('Some selected options are no longer offered')
  }

  return {
    unavailable,
    outOfStock,
    exceedsStock,
    variantIssues,
    hasBlockingIssues:
      unavailable.length > 0 ||
      outOfStock.length > 0 ||
      exceedsStock.length > 0 ||
      variantIssues.length > 0,
    summary: messages.join('. '),
  }
}

/** Subtotal over orderable items only — unavailable rows never count. */
export const getOrderableSubtotal = (hydratedItems) =>
  (hydratedItems || [])
    .filter((i) => !i.unavailable)
    .reduce((total, i) => total + (Number(i.price) || 0) * i.quantity, 0)

/**
 * Final gate before creating an order: re-fetch the cart's products from
 * the database and validate availability, stock, and variants against what
 * is true RIGHT NOW (the in-memory catalog can be minutes old).
 *
 * Returns { ok: true } or { ok: false, message } with a human-readable
 * reason. A network failure returns ok (graceful degradation) — blocking
 * every checkout on a blip is worse than the rare stale order, which the
 * admin can still cancel.
 */
export const validateCartAgainstLiveProducts = async (cartItems) => {
  const items = cartItems || []
  if (items.length === 0) return { ok: false, message: 'Your cart is empty.' }

  let liveProducts
  try {
    // select('*') rather than naming columns: resilient to schema drift
    // (e.g. stock columns that exist in some environments but not others)
    const ids = [...new Set(items.map((i) => Number(i.id)))]
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', ids)

    if (error) throw error
    liveProducts = data || []
  } catch (err) {
    console.error('Could not verify product availability, proceeding:', err)
    return { ok: true }
  }

  const problems = []

  items.forEach((item) => {
    const live = liveProducts.find((p) => Number(p.id) === Number(item.id))
    const label = item.name || 'An item in your cart'

    if (!live) {
      problems.push(`"${label}" is no longer available`)
      return
    }
    if (live.stock_quantity === 0) {
      problems.push(`"${live.name}" just sold out`)
      return
    }
    if (live.stock_quantity !== undefined && live.stock_quantity !== null && item.quantity > live.stock_quantity) {
      problems.push(`Only ${live.stock_quantity} of "${live.name}" ${live.stock_quantity === 1 ? 'is' : 'are'} available`)
      return
    }
    const variantIssue = variantIssueOf(item, live)
    if (variantIssue) {
      problems.push(`The selected ${variantIssue} for "${live.name}" is no longer offered`)
    }
  })

  if (problems.length > 0) {
    return {
      ok: false,
      message: `${problems.join('. ')}. Please update your bag and try again.`,
    }
  }

  return { ok: true }
}
