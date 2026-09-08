'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
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
  Info,
  Search,
  X,
  SlidersHorizontal,
  Award,
  Star,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

import confetti from 'canvas-confetti';
import gsap from 'gsap';
import './page.css';

const TESTIMONIALS_DATA = [
  {
    name: 'Rohan Mehta',
    role: 'Fullstack Freelancer',
    city: 'Bengaluru',
    cardType: 'Visa Infinite Black',
    rating: 5,
    avatarBg: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
    quote: 'Needed an international card for OpenAI API ($20/mo) and Vercel Pro. Indian credit cards kept failing 3D Secure or RBI recurring mandates. Got the Visa Infinite card for ₹99, activated within 3 minutes. The California billing address was accepted on Stripe without a single issue. 10/10 recommended!'
  },
  {
    name: 'Pooja Deshmukh',
    role: 'Digital Marketing Agency',
    city: 'Mumbai',
    cardType: 'Mastercard World Elite',
    rating: 5,
    avatarBg: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    quote: 'We run Facebook & Google Ads for foreign clients. Regular Indian debit cards always trigger payment failed errors on Meta Ads Manager. CardVault\'s Mastercard World Elite solved all our billing limits. Customer support via Telegram is lightning fast.'
  },
  {
    name: 'Aman Singhania',
    role: 'SaaS Founder',
    city: 'Hyderabad',
    cardType: 'RuPay Select Platinum',
    rating: 5,
    avatarBg: 'linear-gradient(135deg, #10b981, #059669)',
    quote: 'Signed up for AWS US-East servers and GitHub Copilot. The instant ATM PIN and DOB provided were crucial because some merchant processors require secondary billing authentication. This is genuine banking data, not fake generators.'
  },
  {
    name: 'Kunal Sharma',
    role: 'E-commerce Dropshipper',
    city: 'Delhi NCR',
    cardType: 'Mastercard Titanium',
    rating: 5,
    avatarBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    quote: 'Shopify US app subscriptions and AliExpress payments were constantly getting rejected on my HDFC card. Purchased the ₹65 Mastercard Titanium here. Unlocked in my vault right after UPI verification. Super smooth!'
  },
  {
    name: 'Ananya Sen',
    role: 'UI/UX Designer',
    city: 'Kolkata',
    cardType: 'Visa Signature Sapphire',
    rating: 5,
    avatarBg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    quote: 'Bought Midjourney annual plan ($96) and Figma paid plugins. Process took less than 4 minutes from UPI payment to vault copy. The "Copy All Credentials" button saved me from typing errors. Love the futuristic design.'
  },
  {
    name: 'Vikramaditya Rao',
    role: 'Crypto & Forex Trader',
    city: 'Pune',
    cardType: 'RuPay Ultra Luxury',
    rating: 5,
    avatarBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    quote: 'Tried several virtual card sites before, almost all were scams or gave dead cards. CardVault is 100% legit. The 100% money-back guarantee gave me confidence, and the card worked on PayPal US instantly.'
  }
];

const FAQS_DATA = [
  {
    q: 'Where can I use these virtual credit cards?',
    a: 'Our virtual cards are accepted globally on virtually all international online merchants, including OpenAI (ChatGPT Plus/API), AWS, Google Cloud, Meta/Facebook Ads, Midjourney, Netflix US, Apple Store, Steam, Shopify, PlayStation Network, DigitalOcean, GitHub, PayPal, and international travel portals.'
  },
  {
    q: 'What exact credentials do I receive upon purchasing?',
    a: 'Every single card comes with a complete 7-factor banking kit: Full 16-digit card number, CVV security code, future expiration date (MM/YY), authentic Cardholder Name, Date of Birth (DOB), 4-digit ATM/PoS PIN, and pre-configured international billing address.'
  },
  {
    q: 'How does the UPI payment verification work?',
    a: 'When you click "Buy Card", a dynamic QR code with the exact fee is presented. After paying via any UPI app (PhonePe, GPay, Paytm, BHIM), enter your 12-digit UTR reference number and upload the receipt screenshot. Admin verifies the credit and your credentials automatically unlock in your private "My Purchased Cards" vault within 2-5 minutes.'
  },
  {
    q: 'Is there a refund guarantee if a card doesn\'t work?',
    a: 'Yes, 100% Refundable! If your card fails to activate on your desired merchant or if verification cannot be completed, you can request an instant 100% refund via Telegram support or receive a replacement card with a fresh BIN at no extra cost.'
  },
  {
    q: 'Do I need to submit Aadhaar, PAN, or KYC documents?',
    a: 'No personal KYC documents are required from you. The cards are pre-registered with legitimate international business limits, providing complete financial privacy and zero identity leakage.'
  },
  {
    q: 'Can I reload or make multiple transactions with the card?',
    a: 'Yes! Cards remain active until the pre-loaded spending limit is reached or until the card expiration date (up to 2030-2032). You can make multiple purchases across different merchants within your limit.'
  }
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Auth Modal state
  const [authOpen, setAuthOpen] = useState(false);
  const [authType, setAuthType] = useState('signin');
  
  // FAQ & Demo states
  const [openFaq, setOpenFaq] = useState(0);
  const [demoMasked, setDemoMasked] = useState(false);
  const [demoCopied, setDemoCopied] = useState(false);
  
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

  // Refs for animations
  const heroTitleRef = useRef(null);
  const heroBadgeRef = useRef(null);
  const heroDescRef = useRef(null);
  const heroButtonsRef = useRef(null);
  const heroStatsRef = useRef(null);

  const fetchCards = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const res = await fetch('/api/cards', { signal: controller.signal });
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
    // Instant cache hydration on client
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

    // Fetch settings
    fetch('/api/settings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDynamicSettings(data.settings);
        }
      })
      .catch(err => console.error('Error fetching settings:', err));

    fetchCards();

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

    return () => ctx.revert();
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

  const handleCopyDemo = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const handleCopyDemoAll = () => {
    const allData = `CARD SPECIMEN DETAILS
Card Brand: Visa Infinite Black Privilege
Cardholder Name: RAJESH KUMAR SHARMA
Date of Birth (DOB): 14/08/1992
16-Digit Card Number: 4532 8920 4410 9901
Expiry Date: 10/30
Security CVV: 842
ATM PIN: 4921
Spend Limit: ₹15,00,000 INR / $18,000 USD
Billing Address: 1044 N Brand Blvd, Suite 200, Glendale, CA 91202, United States
Status: Pre-Activated & KYC Approved`;

    navigator.clipboard.writeText(allData);
    setDemoCopied(true);
    showToast('All demo card credentials copied to clipboard!');
    setTimeout(() => setDemoCopied(false), 2500);
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
      const payload = typeof paymentData === 'string'
        ? { cardId: selectedPaymentCard._id, utrNumber: paymentData }
        : { cardId: selectedPaymentCard._id, ...paymentData };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

  // Live brand counts
  const totalCardsCount = cards.length;
  const visaCount = cards.filter(c => c.type?.toLowerCase() === 'visa').length;
  const mcCount = cards.filter(c => c.type?.toLowerCase() === 'mastercard').length;
  const rupayCount = cards.filter(c => c.type?.toLowerCase() === 'rupay').length;

  // Filter cards by selected brand, search query, and sort order
  const filteredCards = cards
    .filter(card => {
      const matchesBrand = selectedType === 'all' || card.type?.toLowerCase() === selectedType.toLowerCase();
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

  // Curate 6 featured cards (2 Visa, 2 Mastercard, 2 RuPay)
  const featuredCards = useMemo(() => {
    if (cards.length === 0) return [];
    const visas = cards.filter(c => c.type?.toLowerCase() === 'visa').slice(0, 2);
    const mastercards = cards.filter(c => c.type?.toLowerCase() === 'mastercard').slice(0, 2);
    const rupays = cards.filter(c => c.type?.toLowerCase() === 'rupay').slice(0, 2);
    const combined = [...visas, ...mastercards, ...rupays];
    return combined.length >= 6 ? combined : cards.slice(0, 6);
  }, [cards]);

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
              <Link href="/marketplace" className="btn-primary">
                Browse Marketplace <ArrowRight size={18} />
              </Link>
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

      {/* Featured Cards Section (Limited to 6 Cards) */}
      <section id="marketplace" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Featured Selections</span>
            <h2 className="section-title">Trending Virtual Cards</h2>
            <p className="section-desc">
              Hand-picked trending cards across Visa, Mastercard, and RuPay with pre-loaded spending limits.
              Browse our complete catalog of {totalCardsCount}+ cards in the dedicated marketplace.
            </p>
          </div>

          {/* Cards Display Grid (6 Cards) */}
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
              Loading featured cards...
            </div>
          ) : (
            <>
              <div className="cards-grid">
                {featuredCards.map((card) => (
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
                        <span className="spec-name">Cardholder</span>
                        <span className="spec-value font-bold" title={card.cardHolder}>{card.cardHolder || 'CARDHOLDER'}</span>
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
                ))}
              </div>

              {/* High-Impact CTA Banner to Dedicated Marketplace */}
              <div className="home-cta-banner">
                <div className="home-cta-text">
                  <div className="home-cta-badge">
                    <Sparkles size={14} /> {totalCardsCount}+ Total Virtual Cards Available
                  </div>
                  <h3 className="home-cta-title">Looking for different limits, banks, or brands?</h3>
                  <p className="home-cta-desc">
                    Visit our dedicated marketplace to search, filter, and inspect all {totalCardsCount}+ virtual cards with real-time stock and instant vault delivery.
                  </p>
                </div>
                <Link href="/marketplace" className="btn-primary home-cta-btn">
                  Explore Full Marketplace ({totalCardsCount}+ Cards) <ArrowRight size={18} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Interactive Live Demo Unlocked Specimen Showcase */}
      <section id="demo-specimen" className="section demo-specimen-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Live Specimen Preview</span>
            <h2 className="section-title">WHAT YOU RECEIVE UPON PURCHASE</h2>
            <p className="section-desc">
              Every card purchased from CardVault unlocks a 100% complete, authentic 7-factor banking dossier.
              Inspect the live specimen below to see the exact credentials unlocked in your private vault upon order approval.
            </p>
          </div>

          <div className="demo-specimen-card-container">
            {/* Left: 3D Interactive Demo Virtual Card */}
            <div className="demo-card-visual-col">
              <div className="demo-specimen-badge">
                <span className="live-pulse-dot"></span>
                <span>Live Specimen: {demoMasked ? 'Masked Pre-Order' : 'Fully Unlocked Vault'}</span>
              </div>

              <div className="demo-card-3d-wrap">
                <CreditCard
                  type="visa"
                  name="Visa Infinite Black Privilege"
                  cardNumber={demoMasked ? "•••• •••• •••• 9901" : "4532 8920 4410 9901"}
                  cvv={demoMasked ? "***" : "842"}
                  cardHolder="RAJESH KUMAR SHARMA"
                  expiry="10/30"
                  gradientStart="#090d16"
                  gradientEnd="#1e293b"
                  isMasked={demoMasked}
                />
              </div>

              <div className="demo-view-toggle">
                <span className="toggle-label">Interactive Demo Mode:</span>
                <button
                  type="button"
                  onClick={() => setDemoMasked(!demoMasked)}
                  className="btn-demo-toggle"
                >
                  {demoMasked ? (
                    <><Eye size={15} /> Reveal Full Banking Dossier</>
                  ) : (
                    <><EyeOff size={15} /> Show Pre-Order Masked View</>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Unlocked Banking Dossier Specs */}
            <div className="demo-credentials-col">
              <div className="demo-dossier-header">
                <div>
                  <div className="demo-dossier-title">
                    <ShieldCheck size={20} color="#10b981" />
                    <span>Unlocked Vault Credentials Dossier</span>
                  </div>
                  <span className="demo-dossier-sub">Specimen #CV-DEMO-9901 • Ready for Instant International Checkouts</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDemoAll}
                  className="btn-demo-copy-all"
                >
                  {demoCopied ? <><Check size={14} /> Copied Specimen!</> : <><Copy size={14} /> Copy All Credentials</>}
                </button>
              </div>

              <div className="demo-specs-grid">
                <div className="demo-spec-item">
                  <span className="demo-spec-label">Cardholder Name</span>
                  <div className="demo-spec-val-row">
                    <span className="demo-spec-val font-bold">RAJESH KUMAR SHARMA</span>
                    <button type="button" onClick={() => handleCopyDemo('RAJESH KUMAR SHARMA', 'Cardholder Name')} className="demo-copy-btn" title="Copy Cardholder">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div className="demo-spec-item">
                  <span className="demo-spec-label">Date of Birth (DOB)</span>
                  <div className="demo-spec-val-row">
                    <span className="demo-spec-val font-mono">14/08/1992</span>
                    <button type="button" onClick={() => handleCopyDemo('14/08/1992', 'Date of Birth')} className="demo-copy-btn" title="Copy DOB">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div className="demo-spec-item demo-span-2">
                  <span className="demo-spec-label">16-Digit Card Number</span>
                  <div className="demo-spec-val-row">
                    <span className="demo-spec-val font-mono font-bold" style={{ fontSize: '1.05rem', letterSpacing: '1px' }}>
                      {demoMasked ? '•••• •••• •••• 9901' : '4532 8920 4410 9901'}
                    </span>
                    <button type="button" onClick={() => handleCopyDemo('4532 8920 4410 9901', 'Card Number')} className="demo-copy-btn" title="Copy Number">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div className="demo-spec-item">
                  <span className="demo-spec-label">Expiry Date</span>
                  <div className="demo-spec-val-row">
                    <span className="demo-spec-val font-mono">10/30</span>
                    <button type="button" onClick={() => handleCopyDemo('10/30', 'Expiry Date')} className="demo-copy-btn" title="Copy Expiry">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div className="demo-spec-item">
                  <span className="demo-spec-label">Security CVV</span>
                  <div className="demo-spec-val-row">
                    <span className="demo-spec-val font-mono font-bold" style={{ color: '#0284c7' }}>{demoMasked ? '***' : '842'}</span>
                    <button type="button" onClick={() => handleCopyDemo('842', 'CVV Code')} className="demo-copy-btn" title="Copy CVV">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div className="demo-spec-item highlight-pin">
                  <span className="demo-spec-label" style={{ color: '#b45309' }}>ATM / PoS PIN</span>
                  <div className="demo-spec-val-row">
                    <span className="demo-spec-val font-mono font-bold" style={{ color: '#b45309', fontSize: '1.1rem' }}>
                      {demoMasked ? '••••' : '4921'}
                    </span>
                    <button type="button" onClick={() => handleCopyDemo('4921', 'ATM PIN')} className="demo-copy-btn" title="Copy ATM PIN">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div className="demo-spec-item">
                  <span className="demo-spec-label">Spending Limit</span>
                  <div className="demo-spec-val-row">
                    <span className="demo-spec-val font-bold" style={{ color: 'var(--success)' }}>₹15,00,000 INR / $18,000</span>
                  </div>
                </div>

                <div className="demo-spec-item demo-span-2">
                  <span className="demo-spec-label">Registered International Billing Address</span>
                  <div className="demo-spec-val-row">
                    <span className="demo-spec-val" style={{ fontSize: '0.82rem' }}>
                      1044 N Brand Blvd, Suite 200, Glendale, CA 91202, United States
                    </span>
                    <button type="button" onClick={() => handleCopyDemo('1044 N Brand Blvd, Suite 200, Glendale, CA 91202, USA', 'Billing Address')} className="demo-copy-btn" title="Copy Address">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="demo-dossier-footer">
                <div className="demo-dossier-pill">
                  <Sparkles size={14} color="var(--primary)" /> Pre-Verified KYC Active
                </div>
                <div className="demo-dossier-pill">
                  <Zap size={14} color="#10b981" /> 0-Second Instant Delivery
                </div>
                <div className="demo-dossier-pill">
                  <Lock size={14} color="#f59e0b" /> 256-Bit Encrypted Vault
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instant Delivery Process Section */}
      <section id="verify-payment" className="section verify-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Automated Fulfillment Flow</span>
            <h2 className="section-title">INSTANT DELIVERY PROCESS</h2>
            <p className="section-desc">
              Activate your virtual card in under 3 minutes with automated verification and instant vault credentials release.
            </p>
          </div>

          <div className="verify-steps-grid">
            {/* Step 1 */}
            <div className="step-card">
              <span className="step-number">01</span>
              <div className="step-icon-wrapper">
                <CardIcon size={32} />
              </div>
              <h3 className="step-title">1. Select Card &amp; Scan UPI QR</h3>
              <p className="step-desc">
                Choose from 52+ cards in the marketplace and click &quot;Buy Card&quot;. A dynamic QR code with the locked entry fee (₹15 - ₹99) opens instantly for any UPI app (PhonePe, GPay, Paytm, BHIM).
              </p>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <span className="step-number">02</span>
              <div className="step-icon-wrapper">
                <Send size={32} />
              </div>
              <h3 className="step-title">2. Submit 12-Digit UTR &amp; Receipt</h3>
              <p className="step-desc">
                After completing UPI payment, enter your 12-digit bank UTR reference number and upload your payment receipt screenshot for rapid automated fraud-prevention checks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <span className="step-number">03</span>
              <div className="step-icon-wrapper">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="step-title">3. Instant Vault Delivery (0-2 Mins)</h3>
              <p className="step-desc">
                Upon deposit check, full 16-digit card number, CVV, expiry date, Cardholder Name, DOB, and ATM PIN instantly unlock in your private &quot;My Purchased Cards&quot; dashboard with 1-click copy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges & Verified Testimonials */}
      <section id="testimonials" className="section testimonials-section">
        <div className="container">
          {/* Trust Counter Bar */}
          <div className="trust-stats-bar">
            <div className="trust-stat-box">
              <span className="trust-stat-num">12,400+</span>
              <span className="trust-stat-label">Virtual Cards Issued</span>
            </div>
            <div className="trust-stat-box">
              <span className="trust-stat-num">₹4.2 Cr+</span>
              <span className="trust-stat-label">Global Spend Settled</span>
            </div>
            <div className="trust-stat-box">
              <span className="trust-stat-num">99.8%</span>
              <span className="trust-stat-label">Payment Success Rate</span>
            </div>
            <div className="trust-stat-box">
              <span className="trust-stat-num">100%</span>
              <span className="trust-stat-label">Money-Back Guarantee</span>
            </div>
          </div>

          <div className="section-header" style={{ marginTop: '64px' }}>
            <span className="section-subtitle">Real Customer Feedback</span>
            <h2 className="section-title">TRUSTED BY 10,000+ INDIAN BUYERS</h2>
            <p className="section-desc">
              See how freelancers, marketing agencies, developers, and international shoppers use CardVault virtual cards daily for global payments.
            </p>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS_DATA.map((item, idx) => (
              <div className="testimonial-card" key={idx}>
                <div className="testimonial-rating">
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                  <span className="testimonial-tag">{item.cardType}</span>
                </div>
                <p className="testimonial-quote">&ldquo;{item.quote}&rdquo;</p>
                <div className="testimonial-author">
                  <div className="author-avatar" style={{ background: item.avatarBg }}>
                    {item.name.charAt(0)}
                  </div>
                  <div className="author-info">
                    <div className="author-name-row">
                      <span className="author-name">{item.name}</span>
                      <span className="verified-badge">
                        <CheckCircle2 size={12} /> Verified Buyer
                      </span>
                    </div>
                    <span className="author-role">{item.role} • {item.city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Accordion */}
      <section id="faq" className="section faq-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Got Questions?</span>
            <h2 className="section-title">FREQUENTLY ASKED QUESTIONS</h2>
            <p className="section-desc">
              Everything you need to know about purchasing, activating, and spending with our premium virtual credit cards.
            </p>
          </div>

          <div className="faq-accordion-container">
            {FAQS_DATA.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  className={`faq-item ${isOpen ? 'open' : ''}`} 
                  key={index}
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <div className="faq-question">
                    <span>{faq.q}</span>
                    <span className="faq-toggle-icon">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </div>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
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
                <a href="/profile/orders" className="footer-link">My Orders &amp; Receipts</a>
              </div>
            </div>

            <div>
              <h4 className="footer-column-title">Support &amp; Security</h4>
              <p className="footer-desc" style={{ marginBottom: '12px' }}>
                All transactions are protected with 256-bit SSL encryption and verified directly on the platform.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                <Shield size={16} /> Automated Verification
              </div>
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
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
