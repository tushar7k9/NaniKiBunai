/**
 * Image Upload Utilities for Supabase Storage
 *
 * Functions to handle product image uploads to Supabase Storage
 */

import { supabase } from '../lib/supabase'

/**
 * Upload a single product image to Supabase Storage
 *
 * @param {File} file - The image file to upload
 * @param {number} productId - The product ID
 * @param {number} imageIndex - The index of this image (1, 2, 3, etc.)
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export const uploadProductImage = async (file, productId, imageIndex = 1) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided')
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.')
    }

    // Create unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${productId}-image-${imageIndex}.${fileExt}`
    const filePath = `products/${fileName}`

    console.log('Uploading image:', filePath)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Replace if exists
      })

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    console.log('Upload successful:', data)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    console.log('Public URL:', publicUrl)

    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

/**
 * Upload multiple images for a product
 *
 * @param {File[]} files - Array of image files
 * @param {number} productId - The product ID
 * @returns {Promise<string[]>} Array of public URLs
 */
export const uploadProductImages = async (files, productId) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided')
    }

    console.log(`Uploading ${files.length} images for product ${productId}`)

    const uploadPromises = files.map((file, index) =>
      uploadProductImage(file, productId, index + 1)
    )

    const urls = await Promise.all(uploadPromises)

    console.log('All images uploaded:', urls)

    return urls
  } catch (error) {
    console.error('Error uploading multiple images:', error)
    throw error
  }
}

/**
 * Delete a product image from Supabase Storage
 *
 * @param {string} filePath - The path to the file (e.g., "products/1-image-1.jpg")
 * @returns {Promise<void>}
 */
export const deleteProductImage = async (filePath) => {
  try {
    console.log('Deleting image:', filePath)

    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      throw error
    }

    console.log('Image deleted successfully')
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

/**
 * Delete multiple product images
 *
 * @param {string[]} filePaths - Array of file paths
 * @returns {Promise<void>}
 */
export const deleteProductImages = async (filePaths) => {
  try {
    if (!filePaths || filePaths.length === 0) {
      return
    }

    console.log('Deleting images:', filePaths)

    const { error } = await supabase.storage
      .from('product-images')
      .remove(filePaths)

    if (error) {
      console.error('Delete error:', error)
      throw error
    }

    console.log('Images deleted successfully')
  } catch (error) {
    console.error('Error deleting images:', error)
    throw error
  }
}

/**
 * Get the file path from a full URL
 *
 * @param {string} url - The full Supabase Storage URL
 * @returns {string} The file path (e.g., "products/1-image-1.jpg")
 */
export const getFilePathFromUrl = (url) => {
  try {
    // URL format: https://xxx.supabase.co/storage/v1/object/public/product-images/products/1-image-1.jpg
    const parts = url.split('/product-images/')
    if (parts.length < 2) {
      throw new Error('Invalid storage URL')
    }
    return parts[1]
  } catch (error) {
    console.error('Error parsing URL:', error)
    return null
  }
}

/**
 * Download image from URL and upload to Supabase Storage
 * (Useful for migrating from external URLs to Supabase Storage)
 *
 * @param {string} imageUrl - The external image URL
 * @param {number} productId - The product ID
 * @param {number} imageIndex - The image index
 * @returns {Promise<string>} The new Supabase Storage URL
 */
export const migrateImageToStorage = async (imageUrl, productId, imageIndex) => {
  try {
    console.log('Migrating image:', imageUrl)

    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    // Convert to blob
    const blob = await response.blob()

    // Create file from blob
    const file = new File([blob], `image-${imageIndex}.jpg`, { type: blob.type })

    // Upload to Supabase Storage
    const storageUrl = await uploadProductImage(file, productId, imageIndex)

    console.log('Migration successful:', storageUrl)

    return storageUrl
  } catch (error) {
    console.error('Error migrating image:', error)
    throw error
  }
}

/**
 * List all images in a folder
 *
 * @param {string} folder - The folder path (e.g., "products")
 * @returns {Promise<Array>} Array of file objects
 */
export const listImages = async (folder = 'products') => {
  try {
    const { data, error } = await supabase.storage
      .from('product-images')
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('List error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error listing images:', error)
    throw error
  }
}

/**
 * Get storage usage statistics
 *
 * @returns {Promise<object>} Storage stats
 */
export const getStorageStats = async () => {
  try {
    const files = await listImages()

    const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
    const totalFiles = files.length

    return {
      totalFiles,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    }
  } catch (error) {
    console.error('Error getting storage stats:', error)
    throw error
  }
}

export default {
  uploadProductImage,
  uploadProductImages,
  deleteProductImage,
  deleteProductImages,
  getFilePathFromUrl,
  migrateImageToStorage,
  listImages,
  getStorageStats
}
