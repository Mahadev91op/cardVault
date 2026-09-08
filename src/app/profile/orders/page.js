'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import AuthModals from '@/components/AuthModals';
import CreditCard from '@/components/CreditCard';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Copy, 
  AlertCircle, 
  ArrowLeft,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles
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
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [copySuccess, setCopySuccess] = useState(null);
  const [celebrationToast, setCelebrationToast] = useState(null);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const prevOrdersRef = useRef(null);

  const fetchOrders = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingOrders(true);
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          const freshOrders = data.orders;

          // Check if any pending order transitioned to completed or failed
          if (prevOrdersRef.current) {
            freshOrders.forEach((newOrder) => {
              const oldOrder = prevOrdersRef.current.find((o) => o._id === newOrder._id);
              if (oldOrder && oldOrder.status === 'pending') {
                if (newOrder.status === 'completed') {
                  setCelebrationToast({
                    type: 'completed',
                    title: '🎉 Payment Verified & Card Released!',
                    desc: `Your ${newOrder.cardId?.name || 'Virtual Card'} has been approved! Credentials are now unlocked in your vault.`
                  });
                } else if (newOrder.status === 'failed') {
                  setCelebrationToast({
                    type: 'failed',
                    title: '⚠️ Order Payment Update',
                    desc: newOrder.rejectionReason || 'Payment verification could not be completed.'
                  });
                }
              }
            });
          }

          prevOrdersRef.current = freshOrders;
          setOrders(freshOrders);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      if (!isSilent) setLoadingOrders(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchOrders(false);
    }
  }, [user, fetchOrders]);

  // Auto-dismiss notification toast after 7 seconds
  useEffect(() => {
    if (!celebrationToast) return;
    const timer = setTimeout(() => setCelebrationToast(null), 7000);
    return () => clearTimeout(timer);
  }, [celebrationToast]);

  // Background Live Polling when there are pending orders
  useEffect(() => {
    if (!user) return;

    const hasPending = orders.some((o) => o.status === 'pending');
    setIsLiveSyncing(hasPending);

    if (!hasPending) return;

    const intervalId = setInterval(() => {
      // Only poll when browser window is visible
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchOrders(true);
      }
    }, 8000);

    return () => clearInterval(intervalId);
  }, [user, orders, fetchOrders]);

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

      {/* Floating Status Notification Toast */}
      {celebrationToast && (
        <div className={`order-celebration-toast toast-${celebrationToast.type}`}>
          <div className="toast-icon-wrap">
            {celebrationToast.type === 'completed' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          </div>
          <div className="toast-content">
            <div className="toast-title">{celebrationToast.title}</div>
            <div className="toast-desc">{celebrationToast.desc}</div>
          </div>
          <button 
            type="button" 
            onClick={() => setCelebrationToast(null)} 
            className="toast-close-btn"
            aria-label="Dismiss notification"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      <main className="container orders-page-container">
        {/* Breadcrumb / Back button */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>

          {isLiveSyncing && (
            <div className="live-sync-indicator" title="Automatically checking for admin verification every 8 seconds">
              <span className="live-pulse-dot"></span>
              <span>Live Sync Active</span>
            </div>
          )}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isLiveSyncing && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={12} className="animate-spin" style={{ animation: 'spin 3s linear infinite' }} />
                    Auto-syncing
                  </span>
                )}
                <button onClick={() => fetchOrders(false)} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={14} /> Refresh Vault
                </button>
              </div>
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
                  You haven&apos;t purchased any virtual credit cards yet. Once you order a card from the marketplace, it will appear here.
                </p>
                <Link href="/marketplace" className="btn-primary">
                  Go to Marketplace
                </Link>
              </div>
            ) : (() => {
              const completedOrders = orders.filter((o) => o.status === 'completed');
              const pendingOrders = orders.filter((o) => o.status === 'pending');
              const failedOrders = orders.filter((o) => o.status === 'failed');

              const visibleOrders = orders.filter((order) => {
                if (statusFilter === 'completed') return order.status === 'completed';
                if (statusFilter === 'pending') return order.status === 'pending';
                if (statusFilter === 'failed') return order.status === 'failed';
                return true;
              });

              return (
                <div>
                  {/* Status Filter Tabs */}
                  <div className="orders-filter-bar">
                    <button 
                      type="button" 
                      className={`order-filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      All Orders ({orders.length})
                    </button>
                    <button 
                      type="button" 
                      className={`order-filter-pill ${statusFilter === 'completed' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('completed')}
                    >
                      <CheckCircle size={13} /> Active / Released ({completedOrders.length})
                    </button>
                    <button 
                      type="button" 
                      className={`order-filter-pill ${statusFilter === 'pending' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('pending')}
                    >
                      <Clock size={13} /> Pending Verification ({pendingOrders.length})
                    </button>
                    {failedOrders.length > 0 && (
                      <button 
                        type="button" 
                        className={`order-filter-pill ${statusFilter === 'failed' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('failed')}
                      >
                        <XCircle size={13} /> Rejected ({failedOrders.length})
                      </button>
                    )}
                  </div>

                  {visibleOrders.length === 0 ? (
                    <div className="orders-empty-state" style={{ padding: '40px 20px' }}>
                      <p className="empty-desc">No cards found under &quot;{statusFilter}&quot; filter.</p>
                      <button type="button" className="btn-secondary" onClick={() => setStatusFilter('all')}>
                        Show All Orders
                      </button>
                    </div>
                  ) : (
                    /* Orders List */
                    <div className="orders-list">
                      {visibleOrders.map((order) => {
                        // Safe card resolution: order.cardId -> order.cardSnapshot -> fallback
                        const card = order.cardId || order.cardSnapshot || {
                          name: order.releasedCardDetails?.cardHolder ? `${order.releasedCardDetails.cardHolder}'s Virtual Card` : 'Virtual Credit Card',
                          type: (order.releasedCardDetails?.number?.startsWith('4') ? 'visa' : order.releasedCardDetails?.number?.startsWith('5') ? 'mastercard' : 'rupay'),
                          cardNumber: order.releasedCardDetails?.number || '•••• •••• •••• ••••',
                          expiry: order.releasedCardDetails?.expiry || '12/29',
                          cvv: order.releasedCardDetails?.cvv || '***',
                          cardHolder: order.releasedCardDetails?.cardHolder || user?.username?.toUpperCase() || 'CARDHOLDER',
                          dob: order.releasedCardDetails?.dob || '15/07/1994',
                          atmPin: order.releasedCardDetails?.atmPin || '1234',
                          limit: '₹5,00,000 INR / $6,000',
                          refund: '100% Refundable',
                          delivery: 'Instant Delivery (0s)',
                          qty: 0,
                          gradientStart: '#1e3c72',
                          gradientEnd: '#2a5298'
                        };

                  const isPending = order.status === 'pending';
                  const isCompleted = order.status === 'completed';
                  const isFailed = order.status === 'failed';

                  // Determine display details based on status
                  const displayNum = isCompleted ? order.releasedCardDetails?.number : card.cardNumber;
                  const displayExpiry = isCompleted ? order.releasedCardDetails?.expiry : card.expiry;
                  const displayCvv = isCompleted ? order.releasedCardDetails?.cvv : '***';
                  const displayHolder = isCompleted 
                    ? (order.releasedCardDetails?.cardHolder || card.cardHolder || user.username.toUpperCase()) 
                    : (card.cardHolder || 'CARDHOLDER');
                  const displayDob = isCompleted 
                    ? (order.releasedCardDetails?.dob || card.dob || '15/07/1994') 
                    : '••/••/••••';
                  const displayAtmPin = isCompleted 
                    ? (order.releasedCardDetails?.atmPin || card.atmPin || '1234') 
                    : '••••';

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
                          cardHolder={displayHolder}
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
                            <span className="info-val" style={{ color: 'var(--success)', fontWeight: 800 }}>{card.limit}</span>
                          </div>
                          <div className="info-box">
                            <span className="info-label">Fee Paid</span>
                            <span className="info-val">₹{order.pricePaid} INR</span>
                          </div>

                          {isPending && (
                            <>
                              <div className="info-box">
                                <span className="info-label">Submitted UTR / Ref</span>
                                <span className="info-val" style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px' }}>
                                  {order.utrNumber || 'Under Review'}
                                </span>
                              </div>
                              <div className="info-box">
                                <span className="info-label">Sender UPI / Mobile</span>
                                <span className="info-val" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                  {order.senderUpiId || 'Verified'}
                                </span>
                              </div>
                              <div className="info-box">
                                <span className="info-label">Payment Gateway</span>
                                <span className="info-val" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                                  {order.paymentApp || 'UPI'}
                                </span>
                              </div>
                              <div className="info-box" style={{ gridColumn: 'span 2', background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)', padding: '10px 14px', borderRadius: '8px' }}>
                                <span className="info-label" style={{ color: '#b45309', fontWeight: 700 }}>Auto-Unlock Notice</span>
                                <span className="info-val" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                                  Your payment deposit is being verified by Admin. Full 16-digit card number, CVV, expiry date, and ATM PIN will automatically unlock right here in real time.
                                </span>
                              </div>
                            </>
                          )}

                          {isCompleted && (
                            <>
                              <div className="info-box">
                                <span className="info-label">Cardholder Name</span>
                                <span className="info-val" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                  {displayHolder}
                                  <button onClick={() => handleCopy(displayHolder, `${order._id}-holder`)} style={{ color: 'var(--primary)', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Copy Cardholder">
                                    <Copy size={13} />
                                  </button>
                                  {copySuccess === `${order._id}-holder` && <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 'bold' }}>Copied!</span>}
                                </span>
                              </div>
                              <div className="info-box">
                                <span className="info-label">Date of Birth (DOB)</span>
                                <span className="info-val" style={{ fontFamily: 'monospace', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {displayDob}
                                  <button onClick={() => handleCopy(displayDob, `${order._id}-dob`)} style={{ color: 'var(--primary)', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Copy DOB">
                                    <Copy size={13} />
                                  </button>
                                  {copySuccess === `${order._id}-dob` && <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 'bold' }}>Copied!</span>}
                                </span>
                              </div>
                              <div className="info-box" style={{ gridColumn: 'span 2' }}>
                                <span className="info-label">16-Digit Card Number</span>
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
                                <span className="info-val" style={{ fontFamily: 'monospace', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {displayExpiry}
                                  <button onClick={() => handleCopy(displayExpiry, `${order._id}-exp`)} style={{ color: 'var(--primary)', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Copy Expiry">
                                    <Copy size={13} />
                                  </button>
                                  {copySuccess === `${order._id}-exp` && <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 'bold' }}>Copied!</span>}
                                </span>
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
                              <div className="info-box">
                                <span className="info-label">ATM PIN</span>
                                <span className="info-val" style={{ fontFamily: 'monospace', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 800 }}>
                                  {displayAtmPin}
                                  <button onClick={() => handleCopy(displayAtmPin, `${order._id}-pin`)} style={{ color: 'var(--primary)', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Copy ATM PIN">
                                    <Copy size={13} />
                                  </button>
                                  {copySuccess === `${order._id}-pin` && <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 'bold' }}>Copied!</span>}
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
                              Payment verification in progress. Admin is checking bank deposit for ₹{order.pricePaid} INR.
                            </span>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="order-actions-bar">
                            <span className="action-instruction-text" style={{ color: 'var(--success)' }}>
                              <ShieldCheck size={16} />
                              Your virtual card credentials are active and ready to use.
                            </span>
                            <button 
                              onClick={() => handleCopy(`Cardholder: ${displayHolder}\nDOB: ${displayDob}\nCard Number: ${displayNum}\nExpiry: ${displayExpiry}\nCVV: ${displayCvv}\nATM PIN: ${displayAtmPin}\nLimit: ${card.limit}`, order._id)}
                              className="btn-row-action btn-row-copy"
                            >
                              <Copy size={14} /> 
                              {copySuccess === order._id ? 'Copied All Details!' : 'Copy All Credentials'}
                            </button>
                          </div>
                        )}

                        {isFailed && (
                          <div className="order-actions-bar" style={{ background: 'rgba(244, 63, 94, 0.06)', borderTop: '1px solid rgba(244, 63, 94, 0.2)' }}>
                            <span className="action-instruction-text" style={{ color: 'var(--accent)' }}>
                              <AlertCircle size={16} />
                              {order.rejectionReason || 'Payment verification was rejected. Please verify your UTR and retry checkout.'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
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
