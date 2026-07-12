import React, { useState, useEffect } from 'react';
import { XCircle, Clock, Copy, QrCode, Smartphone, Info, ShieldCheck, HelpCircle } from 'lucide-react';
import './PaymentModal.css';

export default function PaymentModal({
  isOpen,
  onClose,
  card,
  upiId = 'mahadevtanti191@okaxis',
  usdToInrRate = 83,
  onSubmit
}) {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'app'
  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Countdown timer logic
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(900);
      setUtrNumber('');
      setError('');
      setSubmitting(false);
      setActiveTab('qr');
    }
  }, [isOpen]);

  if (!isOpen || !card) return null;

  const inrAmount = card.entryFee;
  const upiParams = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("CardVault")}&am=${inrAmount}&cu=INR&tn=${encodeURIComponent(`Order_${card.name.replace(/\s+/g, '_')}`)}`;
  
  const upiLink = `upi://pay?${upiParams}`;
  const gpayLink = `gpay://upi/pay?${upiParams}`;
  const phonepeLink = `phonepe://pay?${upiParams}`;
  const paytmLink = `paytmmp://pay?${upiParams}`;
  const bhimLink = `bhim://pay?${upiParams}`;
  
  const qrCodeUrl = `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodeURIComponent(upiLink)}&choe=UTF-8`;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (timeLeft <= 0) {
      setError('Payment session has expired. Please close this window and try again.');
      return;
    }

    const cleanUtr = utrNumber.replace(/\s+/g, '');
    if (!cleanUtr) {
      setError('Please enter the 12-digit UPI UTR/Ref number.');
      return;
    }

    if (!/^\d{12}$/.test(cleanUtr)) {
      setError('Invalid UTR format. Must be exactly 12 numeric digits.');
      return;
    }

    const currentYearLastDigit = new Date().getFullYear().toString().slice(-1);
    if (cleanUtr[0] !== currentYearLastDigit) {
      setError(`Invalid UTR. For transactions in ${new Date().getFullYear()}, the Ref No. must start with the digit ${currentYearLastDigit}.`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit(cleanUtr);
    } catch (err) {
      setError(err.message || 'Failed to submit payment. Please verify UTR.');
      setSubmitting(false);
    }
  };

  const isExpired = timeLeft <= 0;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-modal-header">
          <div className="modal-title-group">
            <ShieldCheck size={22} className="shield-icon" />
            <h3>Secure UPI Checkout</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <XCircle size={22} />
          </button>
        </div>

        {/* Pricing breakdown & Timer */}
        <div className="payment-pricing-banner">
          <div className="price-details">
            <span className="price-label">Amount Due:</span>
            <div className="price-value-stack">
              <span className="price-usd">₹{inrAmount} INR</span>
            </div>
          </div>

          <div className={`payment-timer ${isExpired ? 'expired' : ''}`}>
            <Clock size={16} />
            <span>{isExpired ? 'Session Expired' : formatTime(timeLeft)}</span>
          </div>
        </div>

        {isExpired ? (
          <div className="expired-state-view">
            <Info size={36} color="var(--accent)" />
            <h4>Payment Window Closed</h4>
            <p>For security, checkout sessions are limited to 15 minutes. Please close this window and initiate a new order purchase.</p>
            <button className="btn-secondary" onClick={onClose} style={{ marginTop: '16px' }}>Close Window</button>
          </div>
        ) : (
          <form className="payment-modal-form" onSubmit={handleFormSubmit}>
            {/* Tabs */}
            <div className="payment-tabs-bar">
              <button 
                type="button" 
                className={`tab-trigger ${activeTab === 'qr' ? 'active' : ''}`}
                onClick={() => setActiveTab('qr')}
              >
                <QrCode size={16} /> Scan & Pay QR
              </button>
              <button 
                type="button" 
                className={`tab-trigger ${activeTab === 'app' ? 'active' : ''}`}
                onClick={() => setActiveTab('app')}
              >
                <Smartphone size={16} /> Pay via UPI App
              </button>
            </div>

            {/* Tab content 1: Scan & Pay QR */}
            {activeTab === 'qr' && (
              <div className="tab-pane-content qr-pane">
                <div className="qr-container-box">
                  <img src={qrCodeUrl} alt="UPI Payment QR Code" className="payment-qr-img" />
                  <div className="qr-overlay-text">₹{inrAmount}</div>
                </div>
                <div className="payment-instructions">
                  <p className="step-txt">1. Open GPay, PhonePe, Paytm, BHIM, or any UPI App.</p>
                  <p className="step-txt">2. Scan the QR code above and complete the payment.</p>
                  
                  <div className="upi-id-copy-row">
                    <span className="upi-id-label">UPI ID: <code>{upiId}</code></span>
                    <button type="button" onClick={handleCopyUpi} className="copy-upi-btn" title="Copy UPI ID">
                      <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab content 2: Pay via UPI App */}
            {activeTab === 'app' && (
              <div className="tab-pane-content app-pane">
                <div className="desktop-warning-info">
                  <Info size={16} />
                  <span>Tap any app below to open it and pay ₹{inrAmount}. On desktop, please use the QR Code scan tab.</span>
                </div>

                <div className="upi-apps-grid">
                  <a href={phonepeLink} className="upi-app-intent-btn app-phonepe">
                    <span className="app-dot bg-phonepe"></span>
                    <span>PhonePe</span>
                  </a>
                  <a href={gpayLink} className="upi-app-intent-btn app-gpay">
                    <span className="app-dot bg-gpay"></span>
                    <span>Google Pay</span>
                  </a>
                  <a href={paytmLink} className="upi-app-intent-btn app-paytm">
                    <span className="app-dot bg-paytm"></span>
                    <span>Paytm</span>
                  </a>
                  <a href={bhimLink} className="upi-app-intent-btn app-bhim">
                    <span className="app-dot bg-bhim ="></span>
                    <span>BHIM UPI</span>
                  </a>
                  <a href={upiLink} className="upi-app-intent-btn app-other">
                    <Smartphone size={15} />
                    <span>Other UPI App</span>
                  </a>
                </div>
              </div>
            )}

            {/* UTR Input Section */}
            <div className="utr-input-section">
              <div className="utr-label-group">
                <label htmlFor="utr-input">Enter 12-Digit UPI Ref No. / UTR</label>
                <div className="tooltip-wrapper">
                  <HelpCircle size={14} className="info-icon" />
                  <span className="tooltip-text">After paying, copy the 12-digit reference number (UTR / Ref No.) from your payment receipt and enter it here to verify your payment.</span>
                </div>
              </div>
              <input
                id="utr-input"
                type="text"
                placeholder="e.g. 6188 0912 3456"
                className="utr-text-input"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                maxLength={20}
                required
              />
            </div>

            {error && <div className="payment-form-error">{error}</div>}

            <div className="payment-modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary btn-submit-verify" disabled={submitting || !utrNumber}>
                {submitting ? 'Registering Order...' : 'Submit Payment Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
