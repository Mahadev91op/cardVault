'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import AuthModals from '@/components/AuthModals';
import CreditCard from '@/components/CreditCard';
import PaymentModal from '@/components/PaymentModal';
import {
  Shield,
  ShoppingBag,
  Lock,
  ArrowRight,
  CreditCard as CardIcon,
  Sparkles,
  Info,
  Search,
  X,
  SlidersHorizontal,
  ArrowLeft
} from 'lucide-react';

import confetti from 'canvas-confetti';
import './page.css';

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Auth Modal state
  const [authOpen, setAuthOpen] = useState(false);
  const [authType, setAuthType] = useState('signin');

  // Marketplace states
  const [cards, setCards] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [marketSearch, setMarketSearch] = useState('');
  const [sortBy, setSortBy] = useState('all');
  const [loadingCards, setLoadingCards] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [notification, setNotification] = useState(null);
  const [dynamicSettings, setDynamicSettings] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentCard, setSelectedPaymentCard] = useState(null);

  const fetchCards = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const res = await fetch('/api/cards', { 
        cache: 'no-store',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.cards)) {
          setCards(data.cards);
          try {
            sessionStorage.setItem('cv_cards_cache', JSON.stringify(data.cards));
          } catch (e) {}
        }
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    // Instant cache hydration
    try {
      const saved = sessionStorage.getItem('cv_cards_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCards(parsed);
          setLoadingCards(false);
        }
      }
    } catch (e) {}

    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDynamicSettings(data.settings);
        }
      })
      .catch((err) => console.error('Error fetching settings:', err));

    fetchCards();
  }, [fetchCards]);

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

  const handleConfirmPayment = async (paymentData) => {
    if (!selectedPaymentCard) return;

    try {
      const payload =
        typeof paymentData === 'string'
          ? { cardId: selectedPaymentCard._id, utrNumber: paymentData }
          : { cardId: selectedPaymentCard._id, ...paymentData };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        showToast('Payment submitted! Admin will verify and release details shortly.', 'success');
        setPaymentModalOpen(false);
        fetchCards();

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

  // Live brand counts
  const totalCardsCount = cards.length;
  const visaCount = cards.filter((c) => c.type?.toLowerCase() === 'visa').length;
  const mcCount = cards.filter((c) => c.type?.toLowerCase() === 'mastercard').length;
  const rupayCount = cards.filter((c) => c.type?.toLowerCase() === 'rupay').length;

  // Filter cards by selected brand, search query, and sort order
  const filteredCards = cards
    .filter((card) => {
      const matchesBrand =
        selectedType === 'all' || card.type?.toLowerCase() === selectedType.toLowerCase();
      if (!matchesBrand) return false;
      if (!marketSearch.trim()) return true;
      const q = marketSearch.toLowerCase().trim();
      return (
        (card.name && card.name.toLowerCase().includes(q)) ||
        (card.cardHolder && card.cardHolder.toLowerCase().includes(q)) ||
        (card.limit && card.limit.toLowerCase().includes(q)) ||
        (card.type && card.type.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'fee-asc') return (a.entryFee || 0) - (b.entryFee || 0);
      if (sortBy === 'fee-desc') return (b.entryFee || 0) - (a.entryFee || 0);
      return 0;
    });

  return (
    <>
      <Navbar onOpenAuth={handleOpenAuth} />

      <main className="marketplace-page-wrapper">
        {/* Marketplace Hero / Header */}
        <section className="marketplace-hero-section">
          <div className="container">
            <div className="marketplace-breadcrumb">
              <a href="/" className="back-link">
                <ArrowLeft size={16} /> Back to Home
              </a>
              <span className="live-status-pill">
                <span className="live-pulse"></span>
                <span>{totalCardsCount} Active Cards Online</span>
              </span>
            </div>

            <div className="marketplace-header-content">
              <span className="marketplace-badge">
                <Sparkles size={16} /> Complete Virtual Cards Catalog
              </span>
              <h1 className="marketplace-main-title">
                CardVault <span>Marketplace</span>
              </h1>
              <p className="marketplace-description">
                Explore all {totalCardsCount}+ active virtual cards with custom spending limits, anonymous checkout, and complete 7-factor banking credentials (Cardholder Name, DOB, 16-digit Card Number, Expiry, CVV, and ATM PIN).
              </p>
            </div>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="marketplace-catalog-section">
          <div className="container">
            {/* Search & Sort Toolbar */}
            <div className="market-toolbar">
              <div className="market-search-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="market-search-input"
                  placeholder="Search 50+ cards by bank, name, holder or limit..."
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                />
                {marketSearch && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setMarketSearch('')}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="market-sort-box">
                <SlidersHorizontal size={16} />
                <select
                  className="market-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="all">Sort: Featured</option>
                  <option value="fee-asc">Entry Fee: Low to High</option>
                  <option value="fee-desc">Entry Fee: High to Low</option>
                </select>
              </div>
            </div>

            {/* Brand Filter Tabs with Live Counts */}
            <div className="market-tabs">
              <button
                onClick={() => setSelectedType('all')}
                className={`tab-btn ${selectedType === 'all' ? 'active' : ''}`}
              >
                <Sparkles size={16} />
                All Cards <span className="tab-count-badge">{totalCardsCount}</span>
              </button>
              <button
                onClick={() => setSelectedType('visa')}
                className={`tab-btn ${selectedType === 'visa' ? 'active' : ''}`}
              >
                <CardIcon size={16} />
                Visa <span className="tab-count-badge">{visaCount}</span>
              </button>
              <button
                onClick={() => setSelectedType('mastercard')}
                className={`tab-btn ${selectedType === 'mastercard' ? 'active' : ''}`}
              >
                <CardIcon size={16} />
                Mastercard <span className="tab-count-badge">{mcCount}</span>
              </button>
              <button
                onClick={() => setSelectedType('rupay')}
                className={`tab-btn ${selectedType === 'rupay' ? 'active' : ''}`}
              >
                <CardIcon size={16} />
                RuPay <span className="tab-count-badge">{rupayCount}</span>
              </button>
            </div>

            {/* Cards Grid */}
            {loadingCards ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                <div
                  className="loading-spinner"
                  style={{
                    border: '4px solid rgba(79, 70, 229, 0.1)',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    borderLeftColor: 'var(--primary)',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px auto'
                  }}
                ></div>
                Loading full cards marketplace...
              </div>
            ) : (
              <div className="cards-grid">
                {filteredCards.length > 0 ? (
                  filteredCards.map((card) => (
                    <div className="card-showcase-box" key={card._id}>
                      {/* Visual Card Graphic */}
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

                      {/* 7-Factor Specifications */}
                      <div className="card-specs">
                        <div className="spec-info">
                          <span className="spec-name">Cardholder</span>
                          <span className="spec-value font-bold" title={card.cardHolder}>
                            {card.cardHolder || 'CARDHOLDER'}
                          </span>
                        </div>
                        <div className="spec-info">
                          <span className="spec-name">Spend Limit</span>
                          <span className="spec-value spec-limit-val">{card.limit}</span>
                        </div>
                        <div className="spec-info">
                          <span className="spec-name">Date of Birth (DOB)</span>
                          <span className="spec-value spec-masked-pill">
                            <Lock size={10} /> Unlocks on Order
                          </span>
                        </div>
                        <div className="spec-info">
                          <span className="spec-name">ATM PIN</span>
                          <span className="spec-value spec-masked-pill">
                            <Lock size={10} /> Unlocks on Order
                          </span>
                        </div>
                        <div className="spec-info">
                          <span className="spec-name">Card Number</span>
                          <span className="spec-value" style={{ fontFamily: 'monospace' }}>
                            •••• {card.cardNumber?.slice(-4) || '••••'}
                          </span>
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
                          <span
                            className="spec-value"
                            style={{ color: card.qty < 10 ? 'var(--accent)' : 'inherit' }}
                          >
                            {card.qty} units
                          </span>
                        </div>
                        <div className="spec-info">
                          <span className="spec-name">Billing Address</span>
                          <span className="spec-value">US / International</span>
                        </div>
                      </div>

                      {/* Buy Action */}
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
                  <div className="market-empty-search">
                    <ShoppingBag size={40} />
                    <h3>{cards.length === 0 ? 'Cards Loading Notice' : 'No Virtual Cards Found'}</h3>
                    <p>
                      {cards.length === 0
                        ? 'Could not load cards or network is slow. Tap Retry to reload the cards.'
                        : `No cards matched your query "${marketSearch}". Try adjusting your search or switching brands.`}
                    </p>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        if (cards.length === 0) {
                          fetchCards();
                        } else {
                          setMarketSearch('');
                          setSelectedType('all');
                        }
                      }}
                      style={{ marginTop: '12px' }}
                    >
                      {cards.length === 0 ? 'Retry Loading Cards' : 'Reset Filters'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer" style={{ marginTop: '60px' }}>
        <div className="container">
          <div className="footer-bottom" style={{ borderTop: 'none', paddingTop: 0 }}>
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
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 2000,
            background:
              notification.type === 'error'
                ? 'var(--accent)'
                : notification.type === 'warning'
                ? 'var(--warning)'
                : 'var(--success)',
            color: 'white',
            padding: '14px 24px',
            borderRadius: '12px',
            fontWeight: '700',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'modal-fade-in 0.3s ease'
          }}
        >
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
      {paymentModalOpen && selectedPaymentCard && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPaymentCard(null);
          }}
          card={selectedPaymentCard}
          upiId={dynamicSettings?.upiId}
          usdToInrRate={dynamicSettings?.usdToInrRate}
          onSubmit={handleConfirmPayment}
        />
      )}

      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
