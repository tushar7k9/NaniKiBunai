import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiHeart, FiShoppingCart, FiChevronLeft, FiChevronRight, FiStar, FiArrowLeft } from 'react-icons/fi'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../hooks/useCart'
import { useFavorites } from '../hooks/useFavorites'
import './ProductDetail.css'

// Static product data with additional details for fallback
const STATIC_PRODUCTS_DETAIL = [
  {
    id: 1,
    name: 'Cozy Winter Scarf',
    category: 'scarves',
    price: 45,
    images: [
      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800',
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800',
      'https://images.unsplash.com/photo-1606400082777-ef05f3c5cde7?w=800'
    ],
    description: 'Handmade with love and extra warmth. Perfect for chilly winter days.',
    fullDescription: 'This beautiful cozy winter scarf is handcrafted with premium quality yarn, ensuring maximum warmth and comfort during the coldest months. Each stitch is made with care and attention to detail, creating a unique piece that will keep you warm and stylish. The soft texture feels gentle against your skin while providing excellent insulation.',
    colors: ['#FFB6C1', '#E6E6FA', '#FFE4B5'],
    difficulty: 'beginner',
    materials: ['100% Merino Wool', 'Hypoallergenic', 'Machine Washable'],
    dimensions: '70" x 8"',
    weight: '150g',
    careInstructions: 'Hand wash in cold water or machine wash on gentle cycle. Lay flat to dry.',
    rating: 4.8,
    reviewCount: 24
  },
  {
    id: 2,
    name: 'Classic Cardigan',
    category: 'sweaters',
    price: 120,
    images: [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800'
    ],
    description: 'Nani\'s signature design, passed down generations. A timeless classic.',
    fullDescription: 'A timeless piece that has been passed down through generations, this classic cardigan represents the pinnacle of traditional knitting craftsmanship. Made with love and expertise, it features intricate patterns and superior construction that will last for years to come.',
    colors: ['#DEB887', '#F5DEB3', '#D2691E'],
    difficulty: 'advanced',
    materials: ['80% Cotton', '20% Cashmere', 'Premium Quality'],
    dimensions: 'Available in S, M, L, XL',
    weight: '450g',
    careInstructions: 'Dry clean only or hand wash with care.',
    rating: 4.9,
    reviewCount: 42
  },
  {
    id: 3,
    name: 'Chunky Beanie',
    category: 'hats',
    price: 35,
    images: [
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800',
      'https://images.unsplash.com/photo-1533642310407-f985136ea0b1?w=800',
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800'
    ],
    description: 'Perfect for cold mornings and warm hearts. Keeps you cozy all day.',
    fullDescription: 'This chunky beanie is your perfect companion for cold winter mornings. Featuring a thick, comfortable knit that provides excellent insulation, it keeps your head warm while looking stylish. The soft interior lining adds extra comfort.',
    colors: ['#B0E0E6', '#F0E68C', '#DDA0DD'],
    difficulty: 'beginner',
    materials: ['100% Acrylic', 'Soft Inner Lining', 'One Size Fits All'],
    dimensions: 'One Size (Stretchy)',
    weight: '80g',
    careInstructions: 'Machine wash cold, tumble dry low.',
    rating: 4.7,
    reviewCount: 18
  },
  {
    id: 4,
    name: 'Wool Mittens Pair',
    category: 'gloves',
    price: 40,
    images: [
      'https://images.unsplash.com/photo-1606400082777-ef05f3c5cde7?w=800',
      'https://images.unsplash.com/photo-1544923408-75c5cef46f14?w=800',
      'https://images.unsplash.com/photo-1610979402004-dbf5eca5cbbf?w=800'
    ],
    description: 'Connected with string so you never lose them. Made from premium wool.',
    fullDescription: 'These adorable wool mittens come connected with a string, ensuring you never lose one. Made from premium quality wool, they provide excellent warmth and comfort. Perfect for both adults and children.',
    colors: ['#FF6347', '#98FB98', '#87CEEB'],
    difficulty: 'intermediate',
    materials: ['100% Wool', 'Fleece Lined', 'Adjustable String'],
    dimensions: 'Adult Size',
    weight: '100g',
    careInstructions: 'Hand wash only, air dry.',
    rating: 4.6,
    reviewCount: 15
  },
  {
    id: 5,
    name: 'Granny Square Blanket',
    category: 'blankets',
    price: 180,
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
      'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=800'
    ],
    description: 'The coziest hug you\'ll ever receive. Hand-stitched with care.',
    fullDescription: 'This beautiful granny square blanket is a labor of love, featuring hundreds of individually crafted squares sewn together to create a warm, cozy masterpiece. Each square is carefully made and joined, resulting in a stunning heirloom-quality blanket.',
    colors: ['#FFB6C1', '#DDA0DD', '#F0E68C', '#98FB98'],
    difficulty: 'advanced',
    materials: ['Premium Acrylic Yarn', 'Hypoallergenic', 'Colorfast'],
    dimensions: '60" x 80"',
    weight: '1.2kg',
    careInstructions: 'Machine wash gentle, tumble dry low.',
    rating: 5.0,
    reviewCount: 56
  },
  {
    id: 6,
    name: 'Tea Cozy Set',
    category: 'accessories',
    price: 28,
    images: [
      'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800',
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800',
      'https://images.unsplash.com/photo-1588195538326-c5b1e5b43ce5?w=800'
    ],
    description: 'Keep your tea warm while you knit. Comes with matching coasters.',
    fullDescription: 'This charming tea cozy set includes a beautifully knitted tea cozy and four matching coasters. Perfect for tea lovers, it keeps your teapot warm for longer while adding a touch of handmade charm to your tea time.',
    colors: ['#FFE4B5', '#DEB887', '#F5DEB3'],
    difficulty: 'beginner',
    materials: ['Cotton Blend', 'Heat Resistant', 'Set of 5 pieces'],
    dimensions: 'Fits standard teapots',
    weight: '120g',
    careInstructions: 'Machine washable, air dry.',
    rating: 4.5,
    reviewCount: 12
  }
]

const reviews = {
  1: [
    { id: 1, author: 'Sarah M.', rating: 5, date: '2025-01-15', comment: 'Absolutely love this scarf! So soft and warm. Perfect for winter walks.', verified: true },
    { id: 2, author: 'Michael T.', rating: 5, date: '2025-01-10', comment: 'Great quality and beautiful colors. Exactly as described!', verified: true },
    { id: 3, author: 'Emily R.', rating: 4, date: '2025-01-05', comment: 'Very nice scarf, though a bit longer than I expected. Still love it!', verified: false },
    { id: 4, author: 'David L.', rating: 5, date: '2024-12-28', comment: 'Bought as a gift and my sister absolutely loves it. Will order more!', verified: true }
  ],
  2: [
    { id: 1, author: 'Jennifer K.', rating: 5, date: '2025-01-18', comment: 'This cardigan is a work of art! The quality is exceptional.', verified: true },
    { id: 2, author: 'Robert P.', rating: 5, date: '2025-01-12', comment: 'Worth every penny. Fits perfectly and looks amazing.', verified: true },
    { id: 3, author: 'Lisa M.', rating: 4, date: '2025-01-08', comment: 'Beautiful cardigan, runs slightly large but very comfortable.', verified: true }
  ],
  3: [
    { id: 1, author: 'Amanda S.', rating: 5, date: '2025-01-14', comment: 'Perfect beanie for cold days! Love the chunky knit.', verified: true },
    { id: 2, author: 'Chris B.', rating: 4, date: '2025-01-09', comment: 'Great quality, keeps my head warm. Could be a bit stretchier.', verified: false }
  ],
  4: [
    { id: 1, author: 'Karen W.', rating: 5, date: '2025-01-16', comment: 'These mittens are adorable and so warm! Love the connecting string.', verified: true },
    { id: 2, author: 'Tom H.', rating: 4, date: '2025-01-11', comment: 'Good quality mittens, perfect for my kids.', verified: true }
  ],
  5: [
    { id: 1, author: 'Rachel G.', rating: 5, date: '2025-01-17', comment: 'This blanket is absolutely gorgeous! Worth the investment.', verified: true },
    { id: 2, author: 'James D.', rating: 5, date: '2025-01-13', comment: 'Beautiful craftsmanship. This will be a family heirloom.', verified: true },
    { id: 3, author: 'Michelle L.', rating: 5, date: '2025-01-07', comment: 'Perfect size and so cozy! Love all the colors.', verified: true }
  ],
  6: [
    { id: 1, author: 'Susan P.', rating: 4, date: '2025-01-15', comment: 'Cute tea cozy set! Works well and looks lovely.', verified: true },
    { id: 2, author: 'Peter M.', rating: 5, date: '2025-01-10', comment: 'Great gift for tea lovers. Very well made.', verified: false }
  ]
}

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // Use context hooks
  const { products, loading: productsLoading, getProductById } = useProducts()
  const { addToCart } = useCart()
  const { favorites, toggleFavorite } = useFavorites()

  // Get product from Supabase (with fallback to static data)
  const supabaseProduct = getProductById(id)
  const staticProduct = STATIC_PRODUCTS_DETAIL.find(p => p.id === parseInt(id))
  const product = supabaseProduct || staticProduct

  const productReviews = reviews[parseInt(id)] || []

  // Check if this product is in favorites
  const isFavorite = favorites.includes(parseInt(id))

  // Debug logging
  React.useEffect(() => {
    console.log('ProductDetail - Product ID:', id)
    console.log('ProductDetail - Supabase Product:', supabaseProduct)
    console.log('ProductDetail - Final Product:', product)
  }, [id, supabaseProduct, product])

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedSize, setSelectedSize] = useState('S') // Default size is S

  // Show loading state
  if (productsLoading) {
    return (
      <div className="product-not-found">
        <h2>Loading product from Supabase...</h2>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Product not found</h2>
        <button onClick={() => navigate('/products')}>Back to Products</button>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    )
  }

  const handleAddToCart = () => {
    // Add to cart with quantity 1
    addToCart({ ...product, quantity: 1, selectedColor: product.colors[selectedColor], selectedSize })
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FiStar
        key={index}
        className={index < Math.floor(rating) ? 'star filled' : 'star'}
      />
    ))
  }

  return (
    <div className="product-detail-page">
      {/* Back Button */}
      <motion.button
        className="back-button"
        onClick={() => navigate('/products')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <FiArrowLeft /> Back to Products
      </motion.button>

      <div className="product-detail-container">
        {/* Left Side - Image Gallery */}
        <motion.div
          className="product-gallery"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="main-image-container">
            <img
              src={product.images[currentImageIndex]}
              alt={product.name}
              className="main-product-image"
            />

            {/* Navigation Arrows */}
            {product.images.length > 1 && (
              <>
                <button className="gallery-btn prev-btn" onClick={prevImage}>
                  <FiChevronLeft />
                </button>
                <button className="gallery-btn next-btn" onClick={nextImage}>
                  <FiChevronRight />
                </button>
              </>
            )}

            {/* Favorite Button */}
            <motion.button
              className={`favorite-btn-detail ${isFavorite ? 'active' : ''}`}
              onClick={() => toggleFavorite(parseInt(id))}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiHeart />
            </motion.button>
          </div>

          {/* Thumbnail Images */}
          <div className="thumbnail-container">
            {product.images.map((img, index) => (
              <motion.div
                key={index}
                className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={img} alt={`${product.name} ${index + 1}`} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Product Info */}
        <motion.div
          className="product-info-section"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="product-header">
            <h1 className="product-title">{product.name}</h1>
            <div className="product-rating">
              <div className="stars">
                {renderStars(product.rating)}
              </div>
              <span className="rating-text">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          <div className="product-price-large">${product.price}</div>

          <p className="product-description-full">{product.fullDescription}</p>

          {/* Color Selection */}
          <div className="color-selection">
            <h3>Available Colors:</h3>
            <div className="color-options">
              {product.colors.map((color, index) => (
                <motion.div
                  key={index}
                  className={`color-option ${index === selectedColor ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="size-selection">
              <h3>Select Size:</h3>
              <div className="size-options">
                {product.sizes.map((size) => (
                  <motion.button
                    key={size}
                    className={`size-option-detail ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Product Details */}
          <div className="product-specs">
            <h3>Product Details:</h3>
            <ul>
              <li><strong>Materials:</strong> {product.materials.join(', ')}</li>
              <li><strong>Dimensions:</strong> {product.dimensions}</li>
              <li><strong>Weight:</strong> {product.weight}</li>
              <li><strong>Difficulty:</strong> <span className="difficulty-badge-detail">{product.difficulty}</span></li>
            </ul>
          </div>

          {/* Care Instructions */}
          <div className="care-instructions">
            <h3>Care Instructions:</h3>
            <p>{product.careInstructions}</p>
          </div>

          {/* Add to Cart Button */}
          <motion.button
            className="add-to-cart-btn-detail"
            onClick={handleAddToCart}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiShoppingCart /> Add to Cart - ${product.price}
          </motion.button>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <motion.div
        className="reviews-section"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2>Customer Reviews</h2>
        <div className="reviews-summary">
          <div className="rating-overview">
            <div className="large-rating">{product.rating}</div>
            <div className="stars-large">
              {renderStars(product.rating)}
            </div>
            <div className="review-count-text">Based on {product.reviewCount} reviews</div>
          </div>
        </div>

        <div className="reviews-list">
          {productReviews.map((review) => (
            <motion.div
              key={review.id}
              className="review-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="review-header">
                <div className="review-author">
                  <span className="author-name">{review.author}</span>
                  {review.verified && <span className="verified-badge">✓ Verified Purchase</span>}
                </div>
                <div className="review-stars">
                  {renderStars(review.rating)}
                </div>
              </div>
              <div className="review-date">{review.date}</div>
              <p className="review-comment">{review.comment}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default ProductDetail
