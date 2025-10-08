/**
 * LocalStorage Utility
 *
 * Provides localStorage fallback when backend is unavailable
 * Will be used as backup until backend is fully integrated
 */

// Storage keys
export const STORAGE_KEYS = {
  CART: 'nani_ki_bunai_cart',
  FAVORITES: 'nani_ki_bunai_favorites',
  USER: 'nani_ki_bunai_user',
  AUTH_TOKEN: 'nani_ki_bunai_auth_token',
}

/**
 * Generic localStorage wrapper with error handling
 */
export const storage = {
  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Parsed value or default
   */
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error)
      return defaultValue
    }
  },

  /**
   * Set item in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
      return false
    }
  },

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error)
      return false
    }
  },

  /**
   * Clear all app-related items from localStorage
   * @returns {boolean} Success status
   */
  clear: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  },
}

/**
 * Cart-specific localStorage operations
 */
export const cartStorage = {
  get: () => storage.get(STORAGE_KEYS.CART, []),
  set: (cart) => storage.set(STORAGE_KEYS.CART, cart),
  clear: () => storage.remove(STORAGE_KEYS.CART),

  addItem: (item) => {
    const cart = cartStorage.get()
    const existingIndex = cart.findIndex(i => i.id === item.id)

    if (existingIndex !== -1) {
      cart[existingIndex] = { ...cart[existingIndex], ...item }
    } else {
      cart.push(item)
    }

    cartStorage.set(cart)
    return cart
  },

  removeItem: (productId) => {
    const cart = cartStorage.get()
    const filtered = cart.filter(item => item.id !== productId)
    cartStorage.set(filtered)
    return filtered
  },

  updateQuantity: (productId, quantity) => {
    const cart = cartStorage.get()
    const updated = cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    )
    cartStorage.set(updated)
    return updated
  },
}

/**
 * Favorites-specific localStorage operations
 */
export const favoritesStorage = {
  get: () => storage.get(STORAGE_KEYS.FAVORITES, []),
  set: (favorites) => storage.set(STORAGE_KEYS.FAVORITES, favorites),
  clear: () => storage.remove(STORAGE_KEYS.FAVORITES),

  add: (productId) => {
    const favorites = favoritesStorage.get()
    if (!favorites.includes(productId)) {
      favorites.push(productId)
      favoritesStorage.set(favorites)
    }
    return favorites
  },

  remove: (productId) => {
    const favorites = favoritesStorage.get()
    const filtered = favorites.filter(id => id !== productId)
    favoritesStorage.set(filtered)
    return filtered
  },

  toggle: (productId) => {
    const favorites = favoritesStorage.get()
    if (favorites.includes(productId)) {
      return favoritesStorage.remove(productId)
    } else {
      return favoritesStorage.add(productId)
    }
  },

  has: (productId) => {
    const favorites = favoritesStorage.get()
    return favorites.includes(productId)
  },
}

/**
 * User-specific localStorage operations
 */
export const userStorage = {
  get: () => storage.get(STORAGE_KEYS.USER, null),
  set: (user) => storage.set(STORAGE_KEYS.USER, user),
  clear: () => storage.remove(STORAGE_KEYS.USER),

  getId: () => {
    const user = userStorage.get()
    return user?.id || 'guest-user'
  },
}

export default storage
