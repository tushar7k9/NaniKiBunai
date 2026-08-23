/**
 * useStoreSettings Hook
 *
 * Usage:
 * import { useStoreSettings } from '../hooks/useStoreSettings'
 * const { settings, loading, ordersBlocked } = useStoreSettings()
 */

import { useContext } from 'react'
import { StoreSettingsContext } from '../contexts/StoreSettingsContext'

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext)
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider')
  }
  return context
}

export default useStoreSettings
