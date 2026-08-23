/**
 * Info & legal pages: Terms, Privacy, Shipping & Returns, Help.
 * Static content on a shared editorial layout. Facts sourced from the
 * business: Nani ki Bunai, Gurugram (Haryana), info@nanikibunai.com,
 * made-to-order in 3–5 business days, free shipping over ₹500 (else ₹49),
 * 7-day returns on ready-made items, custom-sized pieces non-returnable.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import './InfoPages.css'

const LAST_UPDATED = '23 August 2026'
const CONTACT_EMAIL = 'info@nanikibunai.com'
const BUSINESS_LOCATION = 'Gurugram, Haryana, India'

const InfoLayout = ({ title, subtitle, children }) => (
  <div className="info-page">
    <header className="info-page__hero">
      <h1 className="info-page__title">{title}</h1>
      {subtitle && <p className="info-page__subtitle">{subtitle}</p>}
      <span className="info-page__updated">Last updated: {LAST_UPDATED}</span>
      <div className="info-page__stitch" />
    </header>
    <div className="info-page__body">{children}</div>
  </div>
)

/* ─────────────────────────────────────────────
   Terms & Conditions
   ───────────────────────────────────────────── */
export const TermsPage = () => (
  <InfoLayout
    title="Terms & Conditions"
    subtitle="The simple, honest rules for shopping with us"
  >
    <section>
      <h2>1. About us</h2>
      <p>
        Nani ki Bunai ("we", "us", "our") is a handcrafted clothing store operating
        from {BUSINESS_LOCATION}, selling handmade crochet and knitwear through this
        website ("the Store"). By browsing the Store or placing an order, you agree
        to these Terms &amp; Conditions. If you do not agree, please do not use the
        Store.
      </p>
    </section>

    <section>
      <h2>2. Handmade products</h2>
      <p>
        Every piece is made by hand. Minor variations in colour, stitch, texture,
        and finish are natural characteristics of handmade goods — not defects.
        Product photos are as accurate as possible, but colours may render
        differently across screens.
      </p>
    </section>

    <section>
      <h2>3. Orders &amp; acceptance</h2>
      <p>
        Your order is an offer to purchase. It is accepted when we confirm it,
        after which crafting begins. We may refuse or cancel an order — for
        example, if an item becomes unavailable, a listing contained an obvious
        pricing error, or we cannot verify order details. If we cancel a paid
        order, you receive a full refund.
      </p>
      <p>
        You may cancel an order free of charge while its status is
        <strong> Pending</strong> or <strong>Confirmed</strong> (before crafting
        and dispatch begin) from the <Link to="/orders">My Orders</Link> page or by
        writing to {CONTACT_EMAIL}.
      </p>
    </section>

    <section>
      <h2>4. Custom-sized orders</h2>
      <p>
        Pieces made to your submitted measurements are crafted exclusively for
        you. Please measure carefully — custom-sized items cannot be returned or
        exchanged except for a manufacturing defect or transit damage (see our{' '}
        <Link to="/shipping-returns">Returns policy</Link>).
      </p>
    </section>

    <section>
      <h2>5. Pricing &amp; payment</h2>
      <p>
        All prices are in Indian Rupees (₹) and include applicable product taxes
        unless shown separately at checkout. Shipping charges and taxes, where
        applicable, are displayed before you place the order.
      </p>
      <p>
        We currently accept <strong>Cash on Delivery (COD)</strong> — you pay the
        order total in cash when your piece is delivered. No advance payment is
        collected, and we never store card or banking credentials on our systems.
      </p>
    </section>

    <section>
      <h2>6. Shipping, returns &amp; refunds</h2>
      <p>
        Dispatch timelines, delivery, returns, exchanges, and refunds are governed
        by our <Link to="/shipping-returns">Shipping &amp; Returns policy</Link>,
        which forms part of these Terms.
      </p>
    </section>

    <section>
      <h2>7. Your account</h2>
      <p>
        You are responsible for the accuracy of the details you provide (including
        the delivery address and measurements) and for keeping your account
        credentials confidential. You must be at least 18 years old, or use the
        Store under the supervision of a parent or guardian.
      </p>
    </section>

    <section>
      <h2>8. Reviews &amp; content</h2>
      <p>
        By submitting a review, you grant us a non-exclusive right to display it
        on the Store. We may moderate or remove content that is unlawful, abusive,
        misleading, or unrelated to the product.
      </p>
    </section>

    <section>
      <h2>9. Intellectual property</h2>
      <p>
        The Nani ki Bunai name, designs, photographs, and website content belong
        to us. You may not copy or reuse them commercially without written
        permission.
      </p>
    </section>

    <section>
      <h2>10. Limitation of liability</h2>
      <p>
        To the extent permitted by law, our liability for any claim relating to an
        order is limited to the amount you paid for that order. Nothing in these
        Terms limits rights you hold under the Consumer Protection Act, 2019 and
        the Consumer Protection (E-Commerce) Rules, 2020.
      </p>
    </section>

    <section>
      <h2>11. Governing law &amp; disputes</h2>
      <p>
        These Terms are governed by the laws of India. Subject to applicable
        consumer-protection law, courts at Gurugram, Haryana shall have
        jurisdiction.
      </p>
    </section>

    <section>
      <h2>12. Grievances &amp; contact</h2>
      <p>
        For questions, complaints, or grievances, write to{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or use the{' '}
        <Link to="/contact">contact page</Link>. We acknowledge grievances within
        48 hours and aim to resolve them within one month, in line with the
        E-Commerce Rules, 2020.
      </p>
    </section>

    <section>
      <h2>13. Changes</h2>
      <p>
        We may update these Terms from time to time. The version published on this
        page at the time you place an order applies to that order.
      </p>
    </section>
  </InfoLayout>
)

/* ─────────────────────────────────────────────
   Privacy Policy
   ───────────────────────────────────────────── */
export const PrivacyPage = () => (
  <InfoLayout
    title="Privacy Policy"
    subtitle="What we collect, why, and your rights"
  >
    <section>
      <h2>1. Who we are</h2>
      <p>
        Nani ki Bunai, operating from {BUSINESS_LOCATION}, is the data fiduciary
        for personal data processed through this website under India's Digital
        Personal Data Protection Act, 2023 ("DPDP Act").
      </p>
    </section>

    <section>
      <h2>2. What we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> — name, email address, phone number,
          and a saved shipping address, when you create an account.
        </li>
        <li>
          <strong>Order details</strong> — items purchased, delivery address,
          phone number, email, and any notes or custom measurements you provide.
          Guest checkout collects the same order details without an account.
        </li>
        <li>
          <strong>Activity on the Store</strong> — your cart, favourites, and
          product reviews.
        </li>
        <li>
          <strong>Messages</strong> — anything you send via the contact form.
        </li>
      </ul>
      <p>
        We do not collect payment card or banking credentials — payments are
        processed by our payment partners on their own secure systems.
      </p>
    </section>

    <section>
      <h2>3. Why we use it</h2>
      <ul>
        <li>To craft, ship, and provide updates about your orders.</li>
        <li>To operate your account, cart, and favourites.</li>
        <li>To respond to messages and resolve complaints.</li>
        <li>To display reviews you choose to publish.</li>
        <li>To keep the Store secure and prevent misuse.</li>
      </ul>
      <p>We do not sell your personal data, and we do not use it for third-party advertising.</p>
    </section>

    <section>
      <h2>4. Cookies &amp; local storage</h2>
      <p>
        The Store uses browser local storage strictly to keep you signed in and to
        remember your cart and preferences on your device. We do not use
        third-party advertising or tracking cookies.
      </p>
    </section>

    <section>
      <h2>5. Who we share it with</h2>
      <p>Only service providers that make the Store work, and only what they need:</p>
      <ul>
        <li>Secure cloud infrastructure that hosts our database and website.</li>
        <li>Courier partners, who receive your name, address, and phone number to deliver orders.</li>
        <li>Payment partners, to process the payment you initiate.</li>
        <li>Authorities, where the law requires it.</li>
      </ul>
    </section>

    <section>
      <h2>6. How long we keep it</h2>
      <p>
        Order records are retained as required for accounting and tax law.
        Account data is kept while your account is active. You can ask us to
        delete your account data at any time (see Your rights).
      </p>
    </section>

    <section>
      <h2>7. Your rights</h2>
      <p>Under the DPDP Act you may:</p>
      <ul>
        <li>Request access to the personal data we hold about you.</li>
        <li>Request correction of inaccurate data (you can edit most details on your profile).</li>
        <li>Request erasure of your data, subject to legal retention duties.</li>
        <li>Raise a grievance about how your data is handled.</li>
        <li>Nominate a person to exercise these rights on your behalf.</li>
      </ul>
      <p>
        To exercise any right, email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. If unresolved,
        you may complain to the Data Protection Board of India.
      </p>
    </section>

    <section>
      <h2>8. Children</h2>
      <p>
        The Store is not directed at children. We do not knowingly process a
        child's personal data without verifiable parental consent.
      </p>
    </section>

    <section>
      <h2>9. Contact</h2>
      <p>
        Privacy questions and grievances:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ·{' '}
        {BUSINESS_LOCATION}.
      </p>
    </section>
  </InfoLayout>
)

/* ─────────────────────────────────────────────
   Shipping & Returns
   ───────────────────────────────────────────── */
export const ShippingReturnsPage = () => (
  <InfoLayout
    title="Shipping & Returns"
    subtitle="Made with love, shipped with care"
  >
    <section>
      <h2>Crafting time</h2>
      <p>
        Every piece is made to order. Crafting takes <strong>3–5 business
        days</strong> before dispatch. Custom-sized pieces may take a little
        longer — we'll keep you posted from the <Link to="/orders">My Orders</Link>{' '}
        page.
      </p>
    </section>

    <section>
      <h2>Payment — Cash on Delivery</h2>
      <p>
        You pay in cash when your order arrives — no advance payment. Please keep
        the order total ready for the delivery partner. If a COD order is refused
        at the door, it's recorded as returned with nothing charged.
      </p>
    </section>

    <section>
      <h2>Shipping</h2>
      <ul>
        <li>We ship across India through trusted courier partners.</li>
        <li>
          <strong>Free shipping on orders of ₹500 or more.</strong> Orders below
          ₹500 carry a flat ₹49 shipping charge.
        </li>
        <li>Delivery typically takes 3–7 business days after dispatch, depending on your location.</li>
        <li>
          A tracking number is added to your order as soon as it ships — you can
          follow it from My Orders.
        </li>
      </ul>
    </section>

    <section>
      <h2>Returns &amp; exchange — ready-made items</h2>
      <ul>
        <li>
          You may request a return within <strong>7 days of delivery</strong>.
        </li>
        <li>
          Items must be unused, unwashed, and in their original condition. Handmade
          items are delicate — please try them on gently.
        </li>
        <li>
          To start a return or request a replacement (e.g. a different size or
          color), open <Link to="/orders">My Orders</Link>, expand the delivered
          order, and tap <strong>Return or Replace</strong>. You'll add a couple
          of photos of the item and we'll arrange a pickup.
        </li>
        <li>
          Prefer email? Write to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with your order
          number and we'll help.
        </li>
        <li>Exchanges (for size or colour) are offered subject to availability.</li>
      </ul>
    </section>

    <section>
      <h2>Custom-sized items</h2>
      <p>
        Pieces crafted to your submitted measurements are made exclusively for you
        and <strong>cannot be returned or exchanged</strong> — except when the item
        arrives damaged or has a manufacturing defect, in which case we'll repair,
        replace, or refund it.
      </p>
    </section>

    <section>
      <h2>Damaged or incorrect items</h2>
      <p>
        If your order arrives damaged, defective, or incorrect, email us within{' '}
        <strong>48 hours of delivery</strong> with photos and your order number.
        We'll make it right with a replacement or a full refund, including
        shipping.
      </p>
    </section>

    <section>
      <h2>Refunds</h2>
      <ul>
        <li>Approved refunds are issued to the original payment method.</li>
        <li>
          Refunds are processed within <strong>7–10 business days</strong> of the
          returned item passing our quality check (or immediately for cancelled
          orders that hadn't shipped).
        </li>
      </ul>
    </section>

    <section>
      <h2>Cancellations</h2>
      <p>
        Orders can be cancelled free of charge while they're{' '}
        <strong>Pending</strong> or <strong>Confirmed</strong>. Once crafting is
        underway, cancellation isn't possible — but the 7-day return window still
        applies to ready-made items after delivery.
      </p>
    </section>
  </InfoLayout>
)

/* ─────────────────────────────────────────────
   Help: FAQ, Size Guide, Care Instructions
   ───────────────────────────────────────────── */
export const HelpPage = () => (
  <InfoLayout title="Help & Care" subtitle="FAQs, sizing, and caring for your handmade piece">
    <section>
      <h2>Frequently asked questions</h2>
      <dl className="info-page__faq">
        <dt>How long will my order take?</dt>
        <dd>
          Each piece is crafted to order in 3–5 business days, then delivered in
          3–7 business days depending on your location. You can track everything
          from <Link to="/orders">My Orders</Link>.
        </dd>
        <dt>Can I order a custom size?</dt>
        <dd>
          Yes! Choose <em>Custom</em> on any product and enter your measurements.
          Custom pieces are made exclusively for you and are non-returnable except
          for defects.
        </dd>
        <dt>How do I pay?</dt>
        <dd>
          Cash on Delivery — pay the order total in cash when your piece arrives.
          No advance payment needed.
        </dd>
        <dt>How do I return or replace an item?</dt>
        <dd>
          Within 7 days of delivery, open <Link to="/orders">My Orders</Link>,
          expand the order, and tap Return or Replace. Choose a refund or a
          different size/color, add photos of the item, and we'll arrange a
          pickup. Custom-sized pieces can't be returned.
        </dd>
        <dt>Do I need an account to order?</dt>
        <dd>
          No — guest checkout works with just your email. Creating an account later
          with the same email automatically links your past orders.
        </dd>
        <dt>Can I change or cancel my order?</dt>
        <dd>
          While your order is Pending or Confirmed, you can cancel it from My
          Orders. For changes (size, colour, address), email us quickly at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </dd>
        <dt>What if my piece doesn't fit?</dt>
        <dd>
          Ready-made items can be exchanged or returned within 7 days of delivery.
          See <Link to="/shipping-returns">Shipping &amp; Returns</Link>.
        </dd>
      </dl>
    </section>

    <section>
      <h2>Size guide</h2>
      <p>
        Every product page has a <strong>Size Chart</strong> link next to the size
        options with measurements for that garment type. Between sizes? Handmade
        knits have natural give — we suggest the smaller size for a snug fit and
        the larger for a relaxed drape. Or go <em>Custom</em> and it'll fit
        perfectly.
      </p>
    </section>

    <section>
      <h2>Caring for your piece</h2>
      <ul>
        <li><strong>Wash gently by hand</strong> in cold water with a mild detergent. Never machine-wash or wring.</li>
        <li><strong>Dry flat</strong> on a towel, reshaping while damp. Hanging stretches handmade knits.</li>
        <li><strong>Store folded</strong>, not on hangers. Keep away from direct sunlight for long periods.</li>
        <li><strong>Pilling is natural</strong> for soft yarns — remove gently with a fabric comb.</li>
        <li>For wool pieces, an occasional airing keeps them fresh between washes.</li>
      </ul>
    </section>

    <section>
      <h2>Still need help?</h2>
      <p>
        Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or use the{' '}
        <Link to="/contact">contact page</Link> — we usually reply within a day.
      </p>
    </section>
  </InfoLayout>
)
