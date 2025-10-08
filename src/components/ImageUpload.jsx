/**
 * Image Upload Component for Product Images
 *
 * Use this component to upload images to Supabase Storage
 * Can be integrated into admin panel or product management UI
 */

import React, { useState } from 'react'
import { uploadProductImage, uploadProductImages } from '../utils/imageUpload'
import './ImageUpload.css'

const ImageUpload = ({ productId, onUploadSuccess, multiple = false }) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [uploadedUrls, setUploadedUrls] = useState([])

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files)

    if (files.length === 0) return

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      let urls

      if (multiple) {
        // Upload multiple images
        urls = await uploadProductImages(files, productId)
      } else {
        // Upload single image
        const url = await uploadProductImage(files[0], productId, 1)
        urls = [url]
      }

      setUploadedUrls(urls)
      setProgress(100)

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(urls)
      }

      console.log('Upload successful:', urls)
    } catch (err) {
      setError(err.message)
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="image-upload">
      <div className="upload-area">
        <label htmlFor="image-upload-input" className="upload-label">
          {uploading ? (
            <>
              <div className="spinner"></div>
              <span>Uploading... {progress}%</span>
            </>
          ) : (
            <>
              <svg
                className="upload-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="upload-text">
                {multiple ? 'Click to upload images' : 'Click to upload image'}
              </span>
              <span className="upload-hint">
                JPEG, PNG, or WebP (Max 5MB each)
              </span>
            </>
          )}
        </label>

        <input
          id="image-upload-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={uploading}
          className="upload-input"
        />
      </div>

      {error && (
        <div className="error-message">
          <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {uploadedUrls.length > 0 && (
        <div className="uploaded-images">
          <h4>Uploaded Images:</h4>
          <div className="image-grid">
            {uploadedUrls.map((url, index) => (
              <div key={index} className="image-preview">
                <img src={url} alt={`Uploaded ${index + 1}`} />
                <p className="image-url">{url}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
