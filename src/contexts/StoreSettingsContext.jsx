/**
 * Store Settings Context
 *
 * Admin-controlled store-wide modes (maintenance, announcement banner,
 * orders pause, festive theme) from the store_settings singleton row.
 *
 * - FAIL-OPEN: if the fetch errors or the row is missing, the store
 *   behaves normally (all modes off). A network blip must never show
 *   visitors a maintenance screen the admin didn't ask for.
 * - LIVE: subscribes to Supabase Realtime so already-open tabs update
 *   the moment the admin saves; a silent refetch on tab refocus covers
 *   dropped sockets.
 */

import React, { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export const StoreSettingsContext = createContext()

export const DEFAULT_SETTINGS = {
  maintenance_mode: false,
  maintenance_message: '',
  orders_paused: false,
  orders_paused_message: '',
  banner_enabled: false,
  banner_text: '',
  theme: 'default',
  catalog_version: 0,
  updated_at: null,
}

export const StoreSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  const loadSettings = useCallback(async (silent = true) => {
    if (!silent) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (error) throw error
      if (mountedRef.current) {
        setSettings(data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS)
      }
    } catch (err) {
      // Fail-open: table missing (migration not run yet) or network error
      // → store behaves normally
      console.error('Error loading store settings:', err.message)
      if (mountedRef.current) setSettings(DEFAULT_SETTINGS)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadSettings(false)

    // Live updates: the admin's save reaches every open tab instantly
    const channel = supabase
      .channel('store-settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'store_settings' },
        (payload) => {
          if (mountedRef.current && payload.new) {
            setSettings({ ...DEFAULT_SETTINGS, ...payload.new })
          }
        }
      )
      .subscribe()

    // Fallback for dropped realtime sockets: refetch when the tab refocuses
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadSettings(true)
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      mountedRef.current = false
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [loadSettings])

  // Apply the festive theme by flipping CSS variables site-wide
  useEffect(() => {
    if (settings.theme && settings.theme !== 'default') {
      document.documentElement.dataset.theme = settings.theme
    } else {
      delete document.documentElement.dataset.theme
    }
  }, [settings.theme])

  const value = {
    settings,
    loading,
    refreshSettings: loadSettings,
    ordersBlocked: settings.orders_paused || settings.maintenance_mode,
  }

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  )
}
