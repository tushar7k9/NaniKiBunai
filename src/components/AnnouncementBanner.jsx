import React, { useState, useEffect, useRef } from 'react'
import { FiX } from 'react-icons/fi'
import { useStoreSettings } from '../hooks/useStoreSettings'
import './AnnouncementBanner.css'

const DISMISS_KEY = 'nkb_banner_dismissed'

/**
 * Admin-authored announcement bar pinned above the fixed header.
 *
 * The header is position:fixed with no shared offset, so the banner
 * publishes its own measured height as --banner-h on <html>; Header.css
 * and App.css shift by that variable. A ResizeObserver keeps the value
 * correct when the text wraps on narrow screens.
 *
 * Dismissal is per-session and keyed by the banner text — when the admin
 * publishes a NEW message, users who dismissed the old one see it again.
 */
const AnnouncementBanner = () => {
  const { settings } = useStoreSettings()
  const [dismissed, setDismissed] = useState(true)
  const ref = useRef(null)

  const text = (settings.banner_text || '').trim()
  const active = settings.banner_enabled && text.length > 0

  useEffect(() => {
    if (!active) return
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === text)
    } catch {
      setDismissed(false)
    }
  }, [active, text])

  const visible = active && !dismissed

  // Publish the banner height so the fixed header + page content shift down
  useEffect(() => {
    const root = document.documentElement
    if (!visible || !ref.current) {
      root.style.setProperty('--banner-h', '0px')
      return
    }
    const el = ref.current
    const update = () => root.style.setProperty('--banner-h', `${el.offsetHeight}px`)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.setProperty('--banner-h', '0px')
    }
  }, [visible, text])

  if (!visible) return null

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, text)
    } catch { /* private mode — dismiss for this render only */ }
    setDismissed(true)
  }

  return (
    <div className="announcement-banner" ref={ref} role="status">
      <span className="announcement-banner__text">{text}</span>
      <button
        className="announcement-banner__close"
        onClick={dismiss}
        aria-label="Dismiss announcement"
      >
        <FiX />
      </button>
    </div>
  )
}

export default AnnouncementBanner
