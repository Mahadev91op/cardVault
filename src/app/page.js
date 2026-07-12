'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import AuthModals from '@/components/AuthModals';
import CreditCard from '@/components/CreditCard';
import PaymentModal from '@/components/PaymentModal';
import {
  Shield,
  Zap,
  RefreshCw,
  ShoppingBag,
  Send,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  CreditCard as CardIcon,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

const InstagramIcon = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);
import confetti from 'canvas-confetti';
import gsap from 'gsap';
import './page.css';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Auth Modal state
  const [authOpen, setAuthOpen] = useState(false);
  const [authType, setAuthType] = useState('signin');
  
  // Marketplace states
  const [cards, setCards] = useState([]);
  const [selectedType, setSelectedType] = useState('visa');
  const [loadingCards, setLoadingCards] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [notification, setNotification] = useState(null);
  const [dynamicSettings, setDynamicSettings] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentCard, setSelectedPaymentCard] = useState(null);

  // Refs for animations
  const heroTitleRef = useRef(null);
  const heroBadgeRef = useRef(null);
  const heroDescRef = useRef(null);
  const heroButtonsRef = useRef(null);
  const heroStatsRef = useRef(null);

  useEffect(() => {
    // Fetch settings
    fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDynamicSettings(data.settings);
        }
      })
      .catch(err => console.error('Error fetching settings:', err));

    // GSAP Entrance Animations
    const ctx = gsap.context(() => {
      gsap.fromTo(heroBadgeRef.current, 
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
      gsap.fromTo(heroTitleRef.current, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
      );
      gsap.fromTo(heroDescRef.current, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: 'power3.out' }
      );
      gsap.fromTo(heroButtonsRef.current, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.6, ease: 'power3.out' }
      );
      gsap.fromTo(heroStatsRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 1, delay: 0.8, ease: 'power2.out' }
      );
    });

    // Fetch Cards from MongoDB
    fetchCards();

    return () => ctx.revert();
  }, []);

  const fetchCards = async () => {
    try {
      setLoadingCards(true);
      const res = await fetch('/api/cards');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCards(data.cards);
        }
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleOpenAuth = (type) => {
    setAuthType(type);
    setAuthOpen(true);
  };

  const handleToggleAuthType = (type) => {
    setAuthType(type);
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleBuyCard = (card) => {
    if (!user) {
      showToast('Please sign in or register to purchase cards', 'warning');
      handleOpenAuth('signin');
      return;
    }
    setSelectedPaymentCard(card);
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (utrNumber) => {
    if (!selectedPaymentCard) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: selectedPaymentCard._id,
          utrNumber: utrNumber
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Fire confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        showToast('Payment submitted! Admin will verify and release details shortly.', 'success');
        setPaymentModalOpen(false);
        fetchCards(); // refresh quantities

        // Redirect to orders profile page after 2 seconds
        setTimeout(() => {
          router.push('/profile/orders');
        }, 2200);
      } else {
        throw new Error(data.error || 'Failed to place order');
      }
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  };

  // Filter cards by selected tab
  const filteredCards = cards.filter(card => card.type === selectedType);

  const telegramLink = dynamicSettings?.telegramLink || 'https://t.me/cardvault_admin';
  const instagramLink = dynamicSettings?.instagramLink || 'https://instagram.com/cardvault_admin';

  return (
    <>
      <Navbar onOpenAuth={handleOpenAuth} />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="hero-badge" ref={heroBadgeRef}>
              <Sparkles size={16} /> Premium Virtual Card Marketplace
            </span>
            <h1 className="hero-title" ref={heroTitleRef}>
              Secure Your Online Payments With <span>CardVault</span>
            </h1>
            <p className="hero-description" ref={heroDescRef}>
              Get premium virtual Visa, Mastercard, and Rupay cards loaded with custom limits instantly. 
              Unlock global subscription billing, anonymous checkout, and advanced security without ID checks.
            </p>
            <div className="hero-buttons" ref={heroButtonsRef}>
              <a href="#marketplace" className="btn-primary">
                Browse Cards <ArrowRight size={18} />
              </a>
              <a href="#verify-payment" className="btn-secondary">
                How It Works
              </a>
            </div>
            
            <div className="hero-stats" ref={heroStatsRef}>
              <div className="stat-item">
                <span className="stat-number">10k+</span>
                <span className="stat-label">Cards Issued</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Success Rate</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">&lt; 5m</span>
                <span className="stat-label">Average Delivery</span>
              </div>
            </div>
          </div>

          <div className="hero-visuals">
            <div className="glow-effect"></div>
            <div className="floating-cards-container">
              <div className="hero-card-1">
                <CreditCard
                  type="visa"
                  name="Visa World Elite"
                  cardNumber="4532 8900 1200 4829"
                  cvv="***"
                  cardHolder="CARDVAULT MEMBER"
                  expiry="12/29"
                  gradientStart="#1e3c72"
                  gradientEnd="#2a5298"
                  isMasked={true}
                />
              </div>
              <div className="hero-card-2">
                <CreditCard
                  type="mastercard"
                  name="Mastercard Gold virtual"
                  cardNumber="5412 8890 0123 7710"
                  cvv="***"
                  cardHolder="VALUED GUEST"
                  expiry="08/28"
                  gradientStart="#ff9966"
                  gradientEnd="#ff5e62"
                  isMasked={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section id="marketplace" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Virtual Cards Catalog</span>
            <h2 className="section-title">Explore Our Virtual Marketplace</h2>
            <p className="section-desc">
              Choose from our curated collection of active virtual credit cards. Select the brand that matches 
              your vendor requirements.
            </p>
          </div>

          {/* Brand Tabs */}
          <div className="market-tabs">
            <button
              onClick={() => setSelectedType('visa')}
              className={`tab-btn ${selectedType === 'visa' ? 'active' : ''}`}
            >
              <CardIcon size={18} />
              Visa Cards
            </button>
            <button
              onClick={() => setSelectedType('mastercard')}
              className={`tab-btn ${selectedType === 'mastercard' ? 'active' : ''}`}
            >
              <CardIcon size={18} />
              Mastercards
            </button>
            <button
              onClick={() => setSelectedType('rupay')}
              className={`tab-btn ${selectedType === 'rupay' ? 'active' : ''}`}
            >
              <CardIcon size={18} />
              Rupay Cards
            </button>
          </div>

          {/* Cards Display Grid */}
          {loadingCards ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <div className="loading-spinner" style={{
                border: '4px solid rgba(79, 70, 229, 0.1)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                borderLeftColor: 'var(--primary)',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px auto'
              }}></div>
              Loading live cards catalog...
            </div>
          ) : (
            <div className="cards-grid">
              {filteredCards.length > 0 ? (
                filteredCards.map((card) => (
                  <div className="card-showcase-box" key={card._id}>
                    {/* Visual Card on Top */}
                    <div className="card-visual-wrapper">
                      <CreditCard
                        type={card.type}
                        name={card.name}
                        cardNumber={card.cardNumber}
                        cvv={card.cvv}
                        cardHolder={card.cardHolder}
                        expiry={card.expiry}
                        gradientStart={card.gradientStart}
                        gradientEnd={card.gradientEnd}
                        isMasked={true}
                      />
                    </div>

                    {/* Specifications Under Card */}
                    <div className="card-specs">
                      <div className="spec-info">
                        <span className="spec-name">Spend Limit</span>
                        <span className="spec-value">{card.limit}</span>
                      </div>
                      <div className="spec-info">
                        <span className="spec-name">Validity</span>
                        <span className="spec-value">{card.expiry}</span>
                      </div>
                      <div className="spec-info">
                        <span className="spec-name">Refunds</span>
                        <span className="spec-value">{card.refund}</span>
                      </div>
                      <div className="spec-info">
                        <span className="spec-name">Delivery</span>
                        <span className="spec-value">{card.delivery}</span>
                      </div>
                      <div className="spec-info">
                        <span className="spec-name">Quantity Left</span>
                        <span className="spec-value" style={{ color: card.qty < 10 ? 'var(--accent)' : 'inherit' }}>
                          {card.qty} units
                        </span>
                      </div>
                      <div className="spec-info">
                        <span className="spec-name">Billing Address</span>
                        <span className="spec-value">US / International</span>
                      </div>
                    </div>

                    {/* Price and Checkout Action */}
                    <div className="card-buy-action">
                      <div className="card-price-info">
                        <span className="price-label">Entry Fee</span>
                        <span className="price-val">₹{card.entryFee}</span>
                      </div>
                      <button
                        className="btn-buy"
                        onClick={() => handleBuyCard(card)}
                        disabled={purchaseLoading === card._id || card.qty <= 0}
                      >
                        {purchaseLoading === card._id ? (
                          'Ordering...'
                        ) : card.qty <= 0 ? (
                          'Sold Out'
                        ) : (
                          <>
                            Buy Card <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No active cards available in this category.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Verify Payment Section */}
      <section id="verify-payment" className="section verify-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Instant Delivery Process</span>
            <h2 className="section-title">VERIFY YOUR PAYMENT</h2>
            <p className="section-desc">
              Follow these three simple steps to complete your purchase and activate your premium virtual credit card.
            </p>
          </div>

          <div className="verify-steps-grid">
            {/* Step 1 */}
            <div className="step-card">
              <span className="step-number">01</span>
              <div className="step-icon-wrapper">
                <CardIcon size={32} />
              </div>
              <h3 className="step-title">1. Buy a Card</h3>
              <p className="step-desc">
                Select your preferred Visa, Mastercard, or Rupay card from the marketplace above and click the "Buy Card" button 
                to place a pending order.
              </p>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <span className="step-number">02</span>
              <div className="step-icon-wrapper">
                <Send size={32} />
              </div>
              <h3 className="step-title">2. Send Screenshot</h3>
              <p className="step-desc">
                Transfer the exact entry fee amount using your chosen method and send the payment transaction screenshot 
                directly to our Admin support on Telegram or Instagram.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', gap: '6px' }}>
                  <Send size={14} color="#0088cc" /> Telegram
                </a>
                <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', gap: '6px' }}>
                  <InstagramIcon size={14} color="#e1306c" /> Instagram
                </a>
              </div>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <span className="step-number">03</span>
              <div className="step-icon-wrapper">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="step-title">3. Admin Verification</h3>
              <p className="step-desc">
                Once our Admin verifies the transaction screenshot, your card details (Number, Expiry, CVV) will be instantly 
                released and visible under your Profile's "My Orders" tab.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <Shield size={20} fill="white" />
                </div>
                CardVault
              </div>
              <p className="footer-desc">
                Your premier gateway to secure, anonymous, and instant virtual card solutions. Designed with privacy in mind.
              </p>
            </div>

            <div>
              <h4 className="footer-column-title">Quick Links</h4>
              <div className="footer-links">
                <a href="#marketplace" className="footer-link">Virtual Marketplace</a>
                <a href="#verify-payment" className="footer-link">Verify Payment Flow</a>
                <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="footer-link">Telegram Admin Support</a>
                <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="footer-link">Instagram Support</a>
              </div>
            </div>

            <div>
              <h4 className="footer-column-title">Support & Security</h4>
              <p className="footer-desc" style={{ marginBottom: '12px' }}>
                Have questions or issues? Talk directly with our administrator for quick order resolution.
              </p>
              <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                <Send size={14} /> Telegram Helpdesk
              </a>
            </div>
          </div>

          <div className="footer-bottom">
            <span className="footer-copy">
              &copy; {new Date().getFullYear()} CardVault Inc. All rights reserved. Secure virtual card solutions.
            </span>
            <div className="footer-badges">
              <div className="badge-item">
                <Lock size={14} /> 256-Bit SSL Encryption
              </div>
              <div className="badge-item">
                <Shield size={14} /> PCI-DSS Compliant
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 2000,
          background: notification.type === 'error' ? 'var(--accent)' : notification.type === 'warning' ? 'var(--warning)' : 'var(--success)',
          color: 'white',
          padding: '14px 24px',
          borderRadius: '12px',
          fontWeight: '700',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          align: 'center',
          gap: '8px',
          animation: 'modal-fade-in 0.3s ease'
        }}>
          <Info size={18} />
          {notification.message}
        </div>
      )}

      {/* Auth Modals */}
      <AuthModals
        isOpen={authOpen}
        type={authType}
        onClose={() => setAuthOpen(false)}
        onToggleType={handleToggleAuthType}
      />

      {/* UPI Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        card={selectedPaymentCard}
        upiId={dynamicSettings?.upiId}
        usdToInrRate={dynamicSettings?.usdToInrRate}
        onSubmit={handleConfirmPayment}
      />

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
