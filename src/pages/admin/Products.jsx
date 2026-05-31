import React, { useState, useEffect, useRef } from 'react'
import {
  FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiSearch, FiX, FiUpload, FiImage,
} from 'react-icons/fi'
import * as adminService from '../../services/adminService'
import { uploadProductImage } from '../../utils/imageUpload'
import './Products.css'

const CATEGORIES = ['scarves', 'sweaters', 'hats', 'gloves', 'blankets', 'accessories', 'socks', 'baby']
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const MAX_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024
const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL']

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  description: '',
  difficulty: '',
  is_active: true,
}

const formatPrice = (price) => `₹${Number(price).toLocaleString('en-IN')}`

const parseCSV = (str) =>
  str
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

// ── Product Form Modal ─────────────────────────────────────────────────────────

const ProductModal = ({ product, onClose, onSave }) => {
  const isEdit = Boolean(product?.id)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(() => {
    if (!product?.id) return EMPTY_FORM
    return {
      name: product.name || '',
      category: product.category || '',
      price: product.price ?? '',
      description: product.description || '',
      difficulty: product.difficulty || '',
      is_active: product.is_active ?? true,
    }
  })

  // Sizes as array
  const [sizes, setSizes] = useState(() => product?.sizes || ['S', 'M', 'L', 'XL', 'XXL'])
  const [customSizeInput, setCustomSizeInput] = useState('')

  // Colors as array of hex strings
  const [colors, setColors] = useState(() => product?.colors || [])
  const [colorInput, setColorInput] = useState('#C4896A')

  // Images as array of URL strings + pending File uploads
  const [images, setImages] = useState(() => product?.images || [])
  const [pendingFiles, setPendingFiles] = useState([])      // { file, preview }
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => pendingFiles.forEach(pf => URL.revokeObjectURL(pf.preview))
  }, [pendingFiles])

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: val }))
    if (error) setError('')
  }

  // ── Color management ──
  const addColor = () => {
    if (!colorInput) return
    const hex = colorInput.trim()
    if (colors.includes(hex)) return
    setColors(prev => [...prev, hex])
  }

  const removeColor = (hex) => {
    setColors(prev => prev.filter(c => c !== hex))
  }

  // ── Image management ──
  const totalImageCount = images.length + pendingFiles.length

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remaining = MAX_IMAGES - totalImageCount
    if (remaining <= 0) {
      setError(`Maximum ${MAX_IMAGES} images allowed.`)
      return
    }

    const toAdd = files.slice(0, remaining)
    const errors = []

    const validFiles = toAdd.filter(file => {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        errors.push(`${file.name}: only JPEG, PNG, WebP allowed`)
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: exceeds 5MB limit`)
        return false
      }
      return true
    })

    if (errors.length) setError(errors.join('. '))

    const newPending = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setPendingFiles(prev => [...prev, ...newPending])

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeExistingImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const removePendingImage = (index) => {
    setPendingFiles(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const addImageUrl = () => {
    const url = urlInput.trim()
    if (!url) return

    try {
      new URL(url)
    } catch {
      setUrlError('Please enter a valid URL')
      return
    }

    if (!/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(url) && !url.includes('unsplash.com') && !url.includes('images.')) {
      // Soft warning — still allow it, some CDN URLs don't have extensions
    }

    if (images.includes(url)) {
      setUrlError('This URL is already added')
      return
    }

    if (totalImageCount >= MAX_IMAGES) {
      setUrlError(`Maximum ${MAX_IMAGES} images allowed`)
      return
    }

    setImages(prev => [...prev, url])
    setUrlInput('')
    setUrlError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('Name is required.')
    if (!form.category) return setError('Category is required.')
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) return setError('A valid price is required.')
    if (sizes.length === 0) return setError('At least one size is required.')
    if (images.length + pendingFiles.length === 0) return setError('At least one image is required.')

    try {
      setSaving(true)

      // For new products, create first to get an ID for image upload
      let productId = product?.id

      // Build base payload (without images — we'll add them after upload)
      const basePayload = {
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        description: form.description.trim(),
        colors,
        sizes,
        difficulty: form.difficulty || null,
        is_active: form.is_active,
      }

      if (!isEdit) {
        // Create product with existing image URLs first
        const created = await adminService.createProduct({ ...basePayload, images })
        productId = created.id
      }

      // Upload pending files
      let uploadedUrls = []
      if (pendingFiles.length > 0) {
        setUploadingImages(true)
        for (let i = 0; i < pendingFiles.length; i++) {
          setUploadProgress(`Uploading image ${i + 1} of ${pendingFiles.length}...`)
          const url = await uploadProductImage(
            pendingFiles[i].file,
            productId,
            images.length + i + 1
          )
          uploadedUrls.push(url)
        }
        setUploadingImages(false)
        setUploadProgress('')
      }

      const finalImages = [...images, ...uploadedUrls]

      if (isEdit) {
        await adminService.updateProduct(productId, { ...basePayload, images: finalImages })
      } else {
        // Update the created product with uploaded image URLs
        if (uploadedUrls.length > 0) {
          await adminService.updateProduct(productId, { images: finalImages })
        }
      }

      onSave()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setUploadingImages(false)
      setUploadProgress('')
    } finally {
      setSaving(false)
    }
  }

  const isBusy = saving || uploadingImages

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && !isBusy && onClose()}>
      <div className="adm-modal adm-products__form-modal">
        <div className="adm-modal__header">
          <h2 className="adm-modal__title">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button className="adm-modal__close" onClick={onClose} disabled={isBusy}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="adm-modal__body">
            <div className="adm-form-grid">

              {/* Name */}
              <div className="adm-form-field adm-form-field--full">
                <label className="adm-form-label">Product Name *</label>
                <input
                  className="adm-input"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Chunky Knit Scarf"
                />
              </div>

              {/* Category */}
              <div className="adm-form-field">
                <label className="adm-form-label">Category *</label>
                <select className="adm-select" value={form.category} onChange={set('category')}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="adm-form-field">
                <label className="adm-form-label">Price (₹) *</label>
                <input
                  className="adm-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={set('price')}
                  placeholder="e.g. 1499"
                />
              </div>

              {/* Difficulty */}
              <div className="adm-form-field">
                <label className="adm-form-label">Difficulty</label>
                <select className="adm-select" value={form.difficulty} onChange={set('difficulty')}>
                  <option value="">None</option>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Active */}
              <div className="adm-form-field adm-products__toggle-field">
                <label className="adm-form-label">Status</label>
                <label className="adm-products__toggle">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={set('is_active')}
                  />
                  <span className="adm-products__toggle-track" />
                  <span className="adm-products__toggle-label">
                    {form.is_active ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>

              {/* Sizes — visual pills */}
              <div className="adm-form-field adm-form-field--full">
                <label className="adm-form-label">Sizes *</label>
                <div className="adm-products__sizes-section">
                  {/* Preset size pills */}
                  <div className="adm-products__sizes-presets">
                    {PRESET_SIZES.map(s => (
                      <button
                        key={s}
                        type="button"
                        className={`adm-products__size-pill${sizes.includes(s) ? ' adm-products__size-pill--active' : ''}`}
                        onClick={() => {
                          setSizes(prev =>
                            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                          )
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Custom sizes */}
                  {sizes.filter(s => !PRESET_SIZES.includes(s)).length > 0 && (
                    <div className="adm-products__sizes-custom-list">
                      {sizes.filter(s => !PRESET_SIZES.includes(s)).map(s => (
                        <span key={s} className="adm-products__size-chip">
                          {s}
                          <button
                            type="button"
                            className="adm-products__size-chip-remove"
                            onClick={() => setSizes(prev => prev.filter(x => x !== s))}
                          >
                            <FiX />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add custom size */}
                  <div className="adm-products__size-add">
                    <input
                      className="adm-input adm-products__size-add-input"
                      value={customSizeInput}
                      onChange={e => setCustomSizeInput(e.target.value)}
                      placeholder="Custom size e.g. Free, 28, 32..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const val = customSizeInput.trim()
                          if (val && !sizes.includes(val)) {
                            setSizes(prev => [...prev, val])
                            setCustomSizeInput('')
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="adm-btn adm-btn--secondary adm-btn--sm"
                      onClick={() => {
                        const val = customSizeInput.trim()
                        if (val && !sizes.includes(val)) {
                          setSizes(prev => [...prev, val])
                          setCustomSizeInput('')
                        }
                      }}
                    >
                      <FiPlus /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Colors — visual picker */}
              <div className="adm-form-field adm-form-field--full">
                <label className="adm-form-label">Colors</label>
                <div className="adm-products__colors-section">
                  {/* Selected colors */}
                  <div className="adm-products__colors-list">
                    {colors.map((hex) => (
                      <div key={hex} className="adm-products__color-chip">
                        <span
                          className="adm-products__color-swatch"
                          style={{ background: hex }}
                        />
                        <button
                          type="button"
                          className="adm-products__color-remove"
                          onClick={() => removeColor(hex)}
                          title="Remove color"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                    {/* Add color control */}
                    <div className="adm-products__color-add">
                      <input
                        type="color"
                        className="adm-products__color-picker"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="adm-btn adm-btn--secondary adm-btn--sm"
                        onClick={addColor}
                      >
                        <FiPlus /> Add
                      </button>
                    </div>
                  </div>
                  {colors.length === 0 && (
                    <p className="adm-products__colors-hint">Pick a color and click Add</p>
                  )}
                </div>
              </div>

              {/* Images — upload + preview */}
              <div className="adm-form-field adm-form-field--full">
                <label className="adm-form-label">
                  Images * <span className="adm-products__img-count">({totalImageCount}/{MAX_IMAGES})</span>
                </label>
                <div className="adm-products__images-section">
                  {/* Existing images */}
                  {images.map((url, i) => (
                    <div key={`existing-${i}`} className="adm-products__img-card">
                      <img src={url} alt={`Product ${i + 1}`} className="adm-products__img-preview" />
                      <button
                        type="button"
                        className="adm-products__img-remove"
                        onClick={() => removeExistingImage(i)}
                        title="Remove image"
                      >
                        <FiX />
                      </button>
                      {i === 0 && <span className="adm-products__img-primary">Primary</span>}
                    </div>
                  ))}

                  {/* Pending uploads (not yet uploaded) */}
                  {pendingFiles.map((pf, i) => (
                    <div key={`pending-${i}`} className="adm-products__img-card adm-products__img-card--pending">
                      <img src={pf.preview} alt={`Upload ${i + 1}`} className="adm-products__img-preview" />
                      <button
                        type="button"
                        className="adm-products__img-remove"
                        onClick={() => removePendingImage(i)}
                        title="Remove"
                      >
                        <FiX />
                      </button>
                      <span className="adm-products__img-new">New</span>
                    </div>
                  ))}

                  {/* Upload button */}
                  {totalImageCount < MAX_IMAGES && (
                    <button
                      type="button"
                      className="adm-products__img-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FiUpload />
                      <span>Upload</span>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* URL input */}
                {totalImageCount < MAX_IMAGES && (
                  <div className="adm-products__img-url-row">
                    <span className="adm-products__img-url-or">or add by URL</span>
                    <div className="adm-products__img-url-input-wrap">
                      <FiImage className="adm-products__img-url-icon" />
                      <input
                        className="adm-input adm-products__img-url-input"
                        value={urlInput}
                        onChange={e => { setUrlInput(e.target.value); if (urlError) setUrlError('') }}
                        placeholder="https://images.unsplash.com/..."
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl() } }}
                      />
                      <button
                        type="button"
                        className="adm-btn adm-btn--secondary adm-btn--sm"
                        onClick={addImageUrl}
                      >
                        <FiPlus /> Add
                      </button>
                    </div>
                    {urlError && <span className="adm-products__img-url-error">{urlError}</span>}
                  </div>
                )}

                <p className="adm-products__img-hint">Upload files (JPEG, PNG, WebP, max 5MB) or paste image URLs. First image is the primary thumbnail.</p>
              </div>

              {/* Description */}
              <div className="adm-form-field adm-form-field--full">
                <label className="adm-form-label">Description</label>
                <textarea
                  className="adm-form-textarea"
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Describe the product…"
                  rows={4}
                />
              </div>

            </div>

            {error && <p className="adm-products__form-error">{error}</p>}
            {uploadProgress && <p className="adm-products__upload-progress">{uploadProgress}</p>}
          </div>

          <div className="adm-modal__footer">
            <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose} disabled={isBusy}>
              Cancel
            </button>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={isBusy}>
              {uploadingImages ? uploadProgress : saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────

const DeleteModal = ({ product, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await adminService.deleteProduct(product.id)
      onConfirm()
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal adm-products__confirm-modal">
        <div className="adm-modal__header">
          <h2 className="adm-modal__title">Delete Product</h2>
          <button className="adm-modal__close" onClick={onClose}><FiX /></button>
        </div>
        <div className="adm-modal__body">
          <div className="adm-confirm">
            <p className="adm-confirm__text">
              Are you sure you want to delete <strong>{product.name}</strong>?
            </p>
            <p className="adm-confirm__warning">
              This action cannot be undone. Any orders referencing this product may be affected.
            </p>
          </div>
        </div>
        <div className="adm-modal__footer">
          <button className="adm-btn adm-btn--secondary" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn--danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')

  const [editProduct, setEditProduct] = useState(null)   // null = closed, {} = new, product = edit
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await adminService.getAllProducts()
      setProducts(data)
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (product) => {
    setTogglingId(product.id)
    try {
      const updated = await adminService.toggleProductActive(product.id, !product.is_active)
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, ...updated } : p)))
    } catch (err) {
      console.error('Toggle failed:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleFormSave = async () => {
    setShowForm(false)
    setEditProduct(null)
    await load()
  }

  const handleDeleteConfirm = async () => {
    setDeleteTarget(null)
    await load()
  }

  const openAdd = () => {
    setEditProduct({})
    setShowForm(true)
  }

  const openEdit = (product) => {
    setEditProduct(product)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditProduct(null)
  }

  // ── Filtering ──
  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter
    const matchActive =
      activeFilter === 'all' ||
      (activeFilter === 'active' && p.is_active) ||
      (activeFilter === 'inactive' && !p.is_active)
    return matchSearch && matchCategory && matchActive
  })

  return (
    <div className="adm-products">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Products</h1>
          <p className="adm-page-sub">
            {products.length} total &mdash; {products.filter((p) => p.is_active).length} active
          </p>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={openAdd}>
          <FiPlus /> Add Product
        </button>
      </div>

      {/* Filter Bar */}
      <div className="adm-filters">
        <div className="adm-products__search-wrap">
          <FiSearch className="adm-products__search-icon" />
          <input
            className="adm-input adm-products__search-input"
            placeholder="Search by name or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="adm-products__search-clear" onClick={() => setSearch('')}>
              <FiX />
            </button>
          )}
        </div>

        <select
          className="adm-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>

        <select
          className="adm-select"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="adm-loading"><div className="adm-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="adm-table-wrap">
          <div className="adm-empty">
            <div className="adm-empty__icon">📦</div>
            <p className="adm-empty__text">
              {products.length === 0 ? 'No products yet. Add your first product!' : 'No products match your filters.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Sizes</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  {/* Thumbnail + Name */}
                  <td>
                    <div className="adm-products__name-cell">
                      {product.images?.[0] ? (
                        <img
                          className="adm-products__thumb"
                          src={product.images[0]}
                          alt={product.name}
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="adm-products__thumb adm-products__thumb--placeholder" />
                      )}
                      <span className="adm-products__product-name">{product.name}</span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="adm-products__category">
                    {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                  </td>

                  {/* Price */}
                  <td className="adm-products__price">{formatPrice(product.price)}</td>

                  {/* Sizes count */}
                  <td className="adm-products__sizes">
                    {product.sizes?.length ?? 0} sizes
                  </td>

                  {/* Rating */}
                  <td className="adm-products__rating">
                    {product.average_rating
                      ? `${Number(product.average_rating).toFixed(1)} (${product.review_count || 0})`
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>

                  {/* Status badge */}
                  <td>
                    <span className={`adm-badge adm-badge--${product.is_active ? 'active' : 'inactive'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="adm-products__actions">
                      <button
                        className="adm-btn adm-btn--secondary adm-btn--sm"
                        title="Edit"
                        onClick={() => openEdit(product)}
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        className={`adm-btn adm-btn--sm ${product.is_active ? 'adm-btn--secondary' : 'adm-btn--success'}`}
                        title={product.is_active ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggleActive(product)}
                        disabled={togglingId === product.id}
                      >
                        {togglingId === product.id
                          ? <span className="adm-products__mini-spinner" />
                          : product.is_active ? <FiEyeOff /> : <FiEye />}
                      </button>

                      <button
                        className="adm-btn adm-btn--danger adm-btn--sm"
                        title="Delete"
                        onClick={() => setDeleteTarget(product)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductModal
          product={editProduct}
          onClose={closeForm}
          onSave={handleFormSave}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}

export default AdminProducts
