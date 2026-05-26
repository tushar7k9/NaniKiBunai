import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiInstagram, FiTwitter } from 'react-icons/fi'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <motion.div
            className="footer-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3>Nani ki Bunai</h3>
            <p>
              Handcrafted with love, designed for comfort. Bringing you the finest
              handmade clothing that tells a story with every stitch.
            </p>
            <div className="footer-social">
              <motion.a
                href="#"
                className="social-icon"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiFacebook />
              </motion.a>
              <motion.a
                href="#"
                className="social-icon"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiInstagram />
              </motion.a>
              <motion.a
                href="#"
                className="social-icon"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiTwitter />
              </motion.a>
            </div>
          </motion.div>

          <motion.div
            className="footer-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              {/* <li><Link to="/our-story">Our Story</Link></li> */}
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </motion.div>

          <motion.div
            className="footer-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4>Customer Care</h4>
            <ul>
              <li><a href="#shipping">Shipping Info</a></li>
              <li><a href="#returns">Returns & Exchange</a></li>
              <li><a href="#sizing">Size Guide</a></li>
              <li><a href="#care">Care Instructions</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </motion.div>

          <motion.div
            className="footer-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4>Get in Touch</h4>
            <div className="footer-contact">
              <div className="contact-item">
                <FiMail />
                <span>info@nanikibunai.com</span>
              </div>
              <div className="contact-item">
                <FiPhone />
                <span>+91 98765 43210</span>
              </div>
              <div className="contact-item">
                <FiMapPin />
                <span>Jaipur, Rajasthan, India</span>
              </div>
            </div>
            <div className="newsletter">
              <h5>Subscribe to our newsletter</h5>
              <div className="newsletter-form">
                <input type="email" placeholder="Your email" />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="footer-bottom"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p>&copy; 2025 Nani ki Bunai. All rights reserved. Handcrafted with love.</p>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
