import React, { useState, useEffect } from 'react'
import {
  FiTool,
  FiPauseCircle,
  FiBell,
  FiDroplet,
  FiSave,
  FiCheck,
  FiAlertTriangle,
  FiZap,
} from 'react-icons/fi'
import * as adminService from '../../services/adminService'
import './Settings.css'

const THEMES = [
  { id: 'default', name: 'Default', desc: 'Warm terracotta', colors: ['#C4896A', '#F2D5C4', '#5C4033'] },
  { id: 'diwali', name: 'Diwali', desc: 'Festive golds', colors: ['#C98A2D', '#F6E3B4', '#E3B23C'] },
  { id: 'holiday', name: 'Holiday', desc: 'Pine & berry', colors: ['#4E7A5A', '#E4EFE7', '#C0392B'] },
]

const Settings = () => {
  const [original, setOriginal] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [confirmMaintenance, setConfirmMaintenance] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminService.getStoreSettings()
      if (!data) {
        setError('Store settings not found — run the latest migration in the Supabase SQL Editor first.')
        return
      }
      setOriginal(data)
      setForm(data)
    } catch (err) {
      console.error('Failed to load store settings:', err)
      setError(err.message || 'Failed to load store settings')
    } finally {
      setLoading(false)
    }
  }

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const enablingMaintenance = form?.maintenance_mode && !original?.maintenance_mode

  const handleSave = async () => {
    // Turning maintenance ON hides the store from every visitor — confirm once
    if (enablingMaintenance && !confirmMaintenance) {
      setConfirmMaintenance(true)
      return
    }
    try {
      setSaving(true)
      setError(null)
      const updated = await adminService.updateStoreSettings({
        maintenance_mode: form.maintenance_mode,
        maintenance_message: form.maintenance_message || '',
        orders_paused: form.orders_paused,
        orders_paused_message: form.orders_paused_message || '',
        banner_enabled: form.banner_enabled,
        banner_text: form.banner_text || '',
        theme: form.theme,
      })
      setOriginal(updated)
      setForm(updated)
      setConfirmMaintenance(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save store settings:', err)
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const isDirty =
    original && form && JSON.stringify(original) !== JSON.stringify(form)

  if (loading) {
    return <div className="adm-loading"><div className="adm-spinner" /></div>
  }

  if (error && !form) {
    return (
      <div className="adm-settings">
        <div className="adm-page-header">
          <div>
            <h1 className="adm-page-title">Store Settings</h1>
          </div>
        </div>
        <div className="adm-empty">
          <p className="adm-empty__text">{error}</p>
          <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={loadSettings}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="adm-settings">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Store Settings</h1>
          <p className="adm-page-sub">
            <FiZap style={{ verticalAlign: '-2px' }} /> Changes go live instantly for every visitor
          </p>
        </div>
      </div>

      {/* Maintenance mode */}
      <section className="set-card">
        <div className="set-card__head">
          <div className="set-card__icon" style={{ color: '#c0392b', background: '#c0392b12' }}>
            <FiTool />
          </div>
          <div className="set-card__titles">
            <h2 className="set-card__title">Maintenance Mode</h2>
            <p className="set-card__desc">
              Visitors see a full-screen "we'll be back soon" page. You stay signed in and keep
              full access to the store and this dashboard.
            </p>
          </div>
          <label className="set-toggle">
            <input
              type="checkbox"
              checked={form.maintenance_mode}
              onChange={(e) => { set('maintenance_mode', e.target.checked); setConfirmMaintenance(false) }}
            />
            <span className="set-toggle__track" />
          </label>
        </div>
        {form.maintenance_mode && (
          <textarea
            className="adm-input set-card__textarea"
            placeholder="Optional message, e.g. We're restocking with fresh handmade pieces — back on Monday!"
            maxLength={300}
            rows={2}
            value={form.maintenance_message || ''}
            onChange={(e) => set('maintenance_message', e.target.value)}
          />
        )}
      </section>

      {/* Orders paused */}
      <section className="set-card">
        <div className="set-card__head">
          <div className="set-card__icon" style={{ color: '#b8860b', background: '#b8860b12' }}>
            <FiPauseCircle />
          </div>
          <div className="set-card__titles">
            <h2 className="set-card__title">Pause Orders</h2>
            <p className="set-card__desc">
              The store stays browsable but checkout is disabled — the database also refuses
              new orders while paused. Useful for holidays.
            </p>
          </div>
          <label className="set-toggle">
            <input
              type="checkbox"
              checked={form.orders_paused}
              onChange={(e) => set('orders_paused', e.target.checked)}
            />
            <span className="set-toggle__track" />
          </label>
        </div>
        {form.orders_paused && (
          <textarea
            className="adm-input set-card__textarea"
            placeholder="Optional message, e.g. We're on a short break — orders reopen Nov 2!"
            maxLength={250}
            rows={2}
            value={form.orders_paused_message || ''}
            onChange={(e) => set('orders_paused_message', e.target.value)}
          />
        )}
      </section>

      {/* Announcement banner */}
      <section className="set-card">
        <div className="set-card__head">
          <div className="set-card__icon" style={{ color: '#5A3E85', background: '#5A3E8512' }}>
            <FiBell />
          </div>
          <div className="set-card__titles">
            <h2 className="set-card__title">Announcement Banner</h2>
            <p className="set-card__desc">
              A message bar above the store header — sales, festivals, shipping notes.
              Visitors can dismiss it; a new message reappears.
            </p>
          </div>
          <label className="set-toggle">
            <input
              type="checkbox"
              checked={form.banner_enabled}
              onChange={(e) => set('banner_enabled', e.target.checked)}
            />
            <span className="set-toggle__track" />
          </label>
        </div>
        {form.banner_enabled && (
          <>
            <textarea
              className="adm-input set-card__textarea"
              placeholder="e.g. 🪔 Diwali Sale — 20% off everything till Sunday!"
              maxLength={250}
              rows={2}
              value={form.banner_text || ''}
              onChange={(e) => set('banner_text', e.target.value)}
            />
            {(form.banner_text || '').trim() && (
              <div className="set-banner-preview">{form.banner_text}</div>
            )}
          </>
        )}
      </section>

      {/* Theme */}
      <section className="set-card">
        <div className="set-card__head">
          <div className="set-card__icon" style={{ color: '#C4896A', background: '#C4896A12' }}>
            <FiDroplet />
          </div>
          <div className="set-card__titles">
            <h2 className="set-card__title">Store Theme</h2>
            <p className="set-card__desc">
              Seasonal accent colors across the storefront. Pairs nicely with an announcement.
            </p>
          </div>
        </div>
        <div className="set-themes">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              className={`set-theme${form.theme === theme.id ? ' set-theme--active' : ''}`}
              onClick={() => set('theme', theme.id)}
            >
              <span className="set-theme__swatches">
                {theme.colors.map((c) => (
                  <span key={c} className="set-theme__swatch" style={{ background: c }} />
                ))}
              </span>
              <span className="set-theme__name">{theme.name}</span>
              <span className="set-theme__desc">{theme.desc}</span>
              {form.theme === theme.id && <FiCheck className="set-theme__check" />}
            </button>
          ))}
        </div>
      </section>

      {/* Save */}
      {error && <div className="set-error"><FiAlertTriangle /> {error}</div>}
      {confirmMaintenance && (
        <div className="set-confirm">
          <FiAlertTriangle />
          <span>
            Visitors will immediately see the maintenance screen and won't be able to browse
            or order. Continue?
          </span>
        </div>
      )}
      <div className="set-actions">
        <button
          className="adm-btn adm-btn--primary"
          onClick={handleSave}
          disabled={saving || !isDirty}
        >
          {saving ? (
            'Saving…'
          ) : confirmMaintenance ? (
            <><FiTool /> Yes, enable maintenance & save</>
          ) : saved ? (
            <><FiCheck /> Saved — live for everyone</>
          ) : (
            <><FiSave /> Save changes</>
          )}
        </button>
        {original?.updated_at && (
          <span className="set-updated">
            Last updated {new Date(original.updated_at).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  )
}

export default Settings
