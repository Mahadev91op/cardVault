'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import AuthModals from '@/components/AuthModals';
import CreditCard from '@/components/CreditCard';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send, 
  Copy, 
  AlertCircle, 
  ArrowLeft,
  Lock,
  ChevronRight,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import './page.css';

export default function ProfileOrders() {
  const { user, loading: authLoading } = useAuth();
  
  // Auth state
  const [authOpen, setAuthOpen] = useState(false);
  const [authType, setAuthType] = useState('signin');
  
  // Orders states
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [copySuccess, setCopySuccess] = useState(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoadingOrders(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOpenAuth = (type) => {
    setAuthType(type);
    setAuthOpen(true);
  };

  const handleToggleAuthType = (type) => {
    setAuthType(type);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const telegramLink = process.env.NEXT_PUBLIC_TELEGRAM_LINK || 'https://t.me/cardvault_admin';

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          border: '4px solid rgba(79, 70, 229, 0.1)',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          borderLeftColor: 'var(--primary)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Verifying session...</span>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Navbar onOpenAuth={handleOpenAuth} />

      <main className="container orders-page-container">
        {/* Breadcrumb / Back button */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>
        </div>

        {!user ? (
          /* Access Denied / Sign In Required state */
          <div className="orders-empty-state">
            <div className="empty-icon-wrapper" style={{ color: 'var(--accent)', background: 'rgba(244, 63, 94, 0.05)' }}>
              <Lock size={36} />
            </div>
            <h2 className="empty-title">Access Denied</h2>
            <p className="empty-desc">
              You must be logged in to view your orders. Please sign in or register a new account to access your virtual card vault.
            </p>
            <button className="btn-primary" onClick={() => handleOpenAuth('signin')}>
              Sign In Now
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="orders-header">
              <div>
                <h1 className="orders-title">My Purchased Cards</h1>
                <p className="orders-subtitle">
                  Manage and retrieve your premium virtual Visa, Mastercard, and Rupay cards.
                </p>
              </div>
              <button onClick={fetchOrders} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.9rem' }}>
                Refresh Vault
              </button>
            </div>

            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
                <div style={{
                  border: '4px solid rgba(79, 70, 229, 0.1)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  borderLeftColor: 'var(--primary)',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px auto'
                }}></div>
                Syncing card data...
              </div>
            ) : orders.length === 0 ? (
              /* Empty state: No orders yet */
              <div className="orders-empty-state">
                <div className="empty-icon-wrapper">
                  <ShoppingBag size={36} />
                </div>
                <h2 className="empty-title">No Cards Found</h2>
                <p className="empty-desc">
                  You haven't purchased any virtual credit cards yet. Once you order a card from the marketplace, it will appear here.
                </p>
                <Link href="/#marketplace" className="btn-primary">
                  Go to Marketplace
                </Link>
              </div>
            ) : (
              /* Orders List */
              <div className="orders-list">
                {orders.map((order) => {
                  const card = order.cardId;
                  if (!card) return null; // handle deleted card reference

                  const isPending = order.status === 'pending';
                  const isCompleted = order.status === 'completed';
                  const isFailed = order.status === 'failed';

                  // Determine display details based on status
                  const displayNum = isCompleted ? order.releasedCardDetails?.number : card.cardNumber;
                  const displayExpiry = isCompleted ? order.releasedCardDetails?.expiry : card.expiry;
                  const displayCvv = isCompleted ? order.releasedCardDetails?.cvv : '***';

                  return (
                    <div className="order-row-card" key={order._id}>
                      {/* Left: Card Visual */}
                      <div className="order-visual-container">
                        {isPending && (
                          <div className="card-pending-overlay">
                            <div className="overlay-status-icon">
                              <Lock size={20} />
                            </div>
                            <span className="overlay-status-text">Pending Verification</span>
                            <span className="overlay-status-desc">Awaiting screenshot check</span>
                          </div>
                        )}
                        {isFailed && (
                          <div className="card-pending-overlay" style={{ background: 'rgba(244, 63, 94, 0.75)' }}>
                            <div className="overlay-status-icon" style={{ background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                              <XCircle size={20} />
                            </div>
                            <span className="overlay-status-text">Order Rejected</span>
                            <span className="overlay-status-desc">Contact support</span>
                          </div>
                        )}
                        <CreditCard
                          type={card.type}
                          name={card.name}
                          cardNumber={displayNum}
                          cvv={displayCvv}
                          cardHolder={isCompleted ? user.username.toUpperCase() : 'VAULT HOLDER'}
                          expiry={displayExpiry}
                          gradientStart={card.gradientStart}
                          gradientEnd={card.gradientEnd}
                          isMasked={!isCompleted}
                        />
                      </div>

                      {/* Right: Order details */}
                      <div className="order-details-container">
                        <div className="order-top-bar">
                          <div className="order-metadata">
                            <span className="order-id">ORDER ID: {order._id}</span>
                            <span className="order-date">
                              Ordered on {new Date(order.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Status Pill */}
                          {isPending && (
                            <span className="status-pill status-pending">
                              <Clock size={14} /> Pending Verification
                            </span>
                          )}
                          {isCompleted && (
                            <span className="status-pill status-completed">
                              <CheckCircle size={14} /> Active / Released
                            </span>
                          )}
                          {isFailed && (
                            <span className="status-pill status-failed">
                              <XCircle size={14} /> Rejected
                            </span>
                          )}
                        </div>

                        {/* Card specification block */}
                        <div className="order-info-grid">
                          <div className="info-box">
                            <span className="info-label">Card Brand</span>
                            <span className="info-val" style={{ textTransform: 'capitalize' }}>{card.type}</span>
                          </div>
                          <div className="info-box">
                            <span className="info-label">Card Limit</span>
                            <span className="info-val">{card.limit}</span>
                          </div>
                          <div className="info-box">
                            <span className="info-label">Fee Paid</span>
                            <span className="info-val">${order.pricePaid} USD</span>
                          </div>

                          {isCompleted && (
                            <>
                              <div className="info-box" style={{ gridColumn: 'span 2' }}>
                                <span className="info-label">Card Number</span>
                                <span className="info-val" style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                  {displayNum}
                                  <button onClick={() => handleCopy(displayNum, `${order._id}-num`)} style={{ color: 'var(--primary)', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Copy Card Number">
                                    <Copy size={13} />
                                  </button>
                                  {copySuccess === `${order._id}-num` && <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 'bold' }}>Copied!</span>}
                                </span>
                              </div>
                              <div className="info-box">
                                <span className="info-label">Expiry Date</span>
                                <span className="info-val" style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>{displayExpiry}</span>
                              </div>
                              <div className="info-box">
                                <span className="info-label">CVV Code</span>
                                <span className="info-val" style={{ fontFamily: 'monospace', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {displayCvv}
                                  <button onClick={() => handleCopy(displayCvv, `${order._id}-cvv`)} style={{ color: 'var(--primary)', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Copy CVV">
                                    <Copy size={13} />
                                  </button>
                                  {copySuccess === `${order._id}-cvv` && <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 'bold' }}>Copied!</span>}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Dynamic Action instruction bar */}
                        {isPending && (
                          <div className="order-actions-bar">
                            <span className="action-instruction-text">
                              <AlertCircle size={16} color="var(--warning)" />
                              Send screenshot of transaction (${order.pricePaid} USD) to verify.
                            </span>
                            <a 
                              href={telegramLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn-row-action btn-row-telegram"
                            >
                              <Send size={14} /> Verify on Telegram
                            </a>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="order-actions-bar">
                            <span className="action-instruction-text" style={{ color: 'var(--success)' }}>
                              <ShieldCheck size={16} />
                              Your virtual card details are active and ready to use.
                            </span>
                            <button 
                              onClick={() => handleCopy(`${displayNum} | Exp: ${displayExpiry} | CVV: ${displayCvv}`, order._id)}
                              className="btn-row-action btn-row-copy"
                            >
                              <Copy size={14} /> 
                              {copySuccess === order._id ? 'Copied Details!' : 'Copy Card Credentials'}
                            </button>
                          </div>
                        )}

                        {isFailed && (
                          <div className="order-actions-bar">
                            <span className="action-instruction-text" style={{ color: 'var(--accent)' }}>
                              <AlertCircle size={16} />
                              This payment screenshot was invalid or rejected.
                            </span>
                            <a 
                              href={telegramLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn-row-action btn-row-telegram"
                              style={{ background: 'var(--text-primary)' }}
                            >
                              Ask Administrator
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <AuthModals
        isOpen={authOpen}
        type={authType}
        onClose={() => setAuthOpen(false)}
        onToggleType={handleToggleAuthType}
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
