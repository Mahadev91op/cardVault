'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  XCircle, 
  Clock, 
  Copy, 
  QrCode, 
  Smartphone, 
  Info, 
  ShieldCheck, 
  HelpCircle,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import QRCode from 'qrcode';
import { validateUtrNumber } from '@/lib/utrValidator';
import './PaymentModal.css';

export default function PaymentModal({
  isOpen,
  onClose,
  card,
  upiId = 'mahadevtanti191@okaxis',
  usdToInrRate = 83,
  onSubmit
}) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [refreshCount, setRefreshCount] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'app'
  const [utrNumber, setUtrNumber] = useState('');
  const [senderUpiId, setSenderUpiId] = useState('');
  const [paymentApp, setPaymentApp] = useState('gpay');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Countdown timer logic (ticks every 1s)
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  // Reset state on modal open
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setTimeLeft(300);
      setRefreshCount(0);
      setUtrNumber('');
      setSenderUpiId('');
      setPaymentApp('gpay');
      setPaymentScreenshot('');
      setScreenshotName('');
      setError('');
      setSubmitting(false);
      setActiveTab('qr');
    }
  }

  // Handle Refresh QR / New Session
  const handleRefreshQr = () => {
    setTimeLeft(300);
    setRefreshCount(prev => prev + 1);
  };

  const effectiveUpiId = (upiId && typeof upiId === 'string' && upiId.trim()) ? upiId.trim() : 'mahadevtanti191@okaxis';
  const inrAmount = card?.entryFee || 15;
  const cardIdentifier = card?.name ? card.name.replace(/\s+/g, '_') : 'VCC';
  // Construct standard NPCI UPI intent link with exact locked amount
  const upiParams = `pa=${encodeURIComponent(effectiveUpiId)}&pn=${encodeURIComponent("CardVault")}&am=${inrAmount}&cu=INR&tn=${encodeURIComponent(`Order_${cardIdentifier}_${refreshCount}`)}`;
  
  const upiLink = `upi://pay?${upiParams}`;
  const gpayLink = `gpay://upi/pay?${upiParams}`;
  const phonepeLink = `phonepe://pay?${upiParams}`;
  const paytmLink = `paytmmp://pay?${upiParams}`;
  const bhimLink = `bhim://pay?${upiParams}`;

  // Generate QR code offline using QRCode library (both SVG and Canvas DataURL)
  useEffect(() => {
    if (!isOpen || !card) return;
    let isCancelled = false;

    // 1. Pure SVG generation (instant, zero-canvas dependency)
    QRCode.toString(upiLink, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    }).then(svg => {
      if (!isCancelled) {
        setQrSvg(svg);
      }
    }).catch(err => {
      console.error('Failed to generate offline SVG QR:', err);
    });

    // 2. DataURL PNG as fallback
    QRCode.toDataURL(upiLink, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    }).then(url => {
      if (!isCancelled) {
        setQrDataUrl(url);
      }
    }).catch(err => {
      console.error('Failed to generate offline DataURL QR:', err);
    });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, card, upiLink, refreshCount]);

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

  // Process & compress uploaded image
  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large (max 10MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 1280px maintaining aspect ratio
        const maxDimension = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPaymentScreenshot(compressedDataUrl);
        setScreenshotName(file.name);
        setError('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const removeScreenshot = () => {
    setPaymentScreenshot('');
    setScreenshotName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (timeLeft <= 0) {
      setError('Payment session has expired. Please close this window and try again.');
      return;
    }

    const cleanUtr = utrNumber.replace(/[\s-_]/g, '');
    const utrCheck = validateUtrNumber(cleanUtr);
    if (!utrCheck.isValid) {
      setError(utrCheck.error);
      return;
    }

    const cleanSender = senderUpiId.trim();
    if (!cleanSender || cleanSender.length < 4) {
      setError('Please provide your Sender UPI ID or mobile number for verification.');
      return;
    }

    if (!paymentScreenshot) {
      setError('Payment screenshot / receipt is required to verify your transaction and release credentials.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSubmit({
        utrNumber: cleanUtr,
        senderUpiId: cleanSender,
        paymentApp,
        paymentScreenshot
      });
    } catch (err) {
      setError(err.message || 'Failed to submit payment. Please verify details.');
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <XCircle size={22} />
          </button>
        </div>

        {/* Pricing breakdown & Timer */}
        <div className="payment-pricing-banner">
          <div className="price-details">
            <span className="price-label">Entry Fee Due:</span>
            <div className="price-value-stack">
              <span className="price-usd">₹{inrAmount} INR</span>
            </div>
          </div>

          <div className={`payment-timer ${isExpired ? 'expired' : timeLeft <= 60 ? 'warning' : ''}`}>
            <Clock size={16} />
            <span>{isExpired ? 'QR Expired' : `Expires in ${formatTime(timeLeft)}`}</span>
            {isExpired && (
              <button type="button" onClick={handleRefreshQr} className="btn-timer-refresh" title="Regenerate QR">
                <RefreshCw size={12} />
              </button>
            )}
          </div>
        </div>

        <form className="payment-modal-form" onSubmit={handleFormSubmit}>
          {/* Tabs */}
          <div className="payment-tabs-bar">
            <button 
              type="button" 
              className={`tab-trigger ${activeTab === 'qr' ? 'active' : ''}`}
              onClick={() => setActiveTab('qr')}
            >
              <QrCode size={16} /> Scan &amp; Pay QR
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
                {qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrDataUrl}
                    alt="UPI Payment QR Code"
                    className={`payment-qr-img ${isExpired ? 'qr-blurred' : ''}`}
                  />
                ) : (
                  <div className="qr-loading-box">
                    <RefreshCw size={24} className="animate-spin text-primary" />
                    <span>Generating Secure QR...</span>
                  </div>
                )}
                
                {!isExpired && <div className="qr-overlay-text">₹{inrAmount}</div>}

                {isExpired && (
                  <div className="qr-expired-overlay">
                    <AlertTriangle size={26} color="#f43f5e" />
                    <span className="qr-expired-title">QR Code Expired</span>
                    <span className="qr-expired-desc">Session timed out (5 mins). Generate fresh QR code to pay.</span>
                    <button type="button" onClick={handleRefreshQr} className="btn-refresh-qr">
                      <RefreshCw size={13} /> Regenerate QR Code
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile 1-Tap Pay Direct Button */}
              <div className="mobile-direct-pay-wrap">
                <a href={upiLink} className="btn-direct-upi-mobile">
                  <Smartphone size={16} />
                  <span>Pay ₹{inrAmount} directly via UPI App</span>
                </a>
              </div>

              <div className="payment-instructions">
                <p className="step-txt">1. Open GPay, PhonePe, Paytm, BHIM, or any UPI App.</p>
                <p className="step-txt">2. Scan the QR code above. Exact amount <strong>₹{inrAmount}</strong> is locked automatically.</p>
                
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
                    <span className="app-dot bg-bhim"></span>
                    <span>BHIM UPI</span>
                  </a>
                  <a href={upiLink} className="upi-app-intent-btn app-other">
                    <Smartphone size={15} />
                    <span>Other UPI App</span>
                  </a>
                </div>
              </div>
            )}

            {/* ANTI-FRAUD PAYMENT VERIFICATION SECTION */}
            <div className="payment-anti-fraud-box">
              <div className="anti-fraud-header">
                <ShieldCheck size={16} className="text-primary" />
                <span>Anti-Fraud Payment Verification</span>
              </div>

              {/* 1. Select UPI App */}
              <div className="af-form-row">
                <label className="af-label">Which UPI app did you pay from?</label>
                <div className="af-app-chips">
                  {[
                    { id: 'gpay', label: 'Google Pay' },
                    { id: 'phonepe', label: 'PhonePe' },
                    { id: 'paytm', label: 'Paytm' },
                    { id: 'bhim', label: 'BHIM / Bank' },
                    { id: 'other', label: 'Other' }
                  ].map(app => (
                    <button
                      key={app.id}
                      type="button"
                      className={`af-chip ${paymentApp === app.id ? 'active' : ''}`}
                      onClick={() => setPaymentApp(app.id)}
                    >
                      {app.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Sender UPI ID / Phone */}
              <div className="af-form-row">
                <label className="af-label" htmlFor="sender-upi-input">
                  Your UPI ID or Mobile Number
                </label>
                <input
                  id="sender-upi-input"
                  type="text"
                  placeholder="e.g. 9876543210@paytm or 9876543210"
                  className="af-input"
                  value={senderUpiId}
                  onChange={(e) => setSenderUpiId(e.target.value)}
                  required
                />
              </div>

              {/* 3. UTR Input Section */}
              <div className="af-form-row">
                <div className="utr-label-group">
                  <label className="af-label" htmlFor="utr-input">
                    12-Digit Bank UTR / Ref Number
                  </label>
                  <div className="tooltip-wrapper">
                    <HelpCircle size={14} className="info-icon" />
                    <span className="tooltip-text">
                      Copy the exact 12-digit transaction ID / UTR from your UPI payment receipt.
                    </span>
                  </div>
                </div>
                <input
                  id="utr-input"
                  type="text"
                  placeholder="e.g. 6188 0912 3456"
                  className="af-input utr-field"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  maxLength={18}
                  required
                />
              </div>

              {/* 4. Payment Screenshot Upload */}
              <div className="af-form-row">
                <div className="utr-label-group">
                  <label className="af-label">Upload Payment Screenshot / Receipt</label>
                  <span className="af-mandatory-tag">Mandatory</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {paymentScreenshot ? (
                  <div className="af-screenshot-preview-box">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={paymentScreenshot} alt="Payment Receipt" className="af-preview-img" />
                    <div className="af-preview-info">
                      <div className="af-preview-title">
                        <CheckCircle2 size={16} color="#10b981" />
                        <span>Receipt Attached</span>
                      </div>
                      <span className="af-preview-filename">{screenshotName || 'screenshot.jpg'}</span>
                    </div>
                    <button 
                      type="button" 
                      className="af-remove-btn" 
                      onClick={removeScreenshot}
                      title="Remove screenshot"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`af-upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload size={24} className="af-upload-icon" />
                    <div className="af-upload-text">
                      <strong>Click to upload</strong> or drag & drop screenshot
                    </div>
                    <span className="af-upload-hint">PNG, JPG, WEBP (Max 10MB)</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="payment-form-error">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="payment-modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary btn-submit-verify" 
                disabled={submitting || !utrNumber || !paymentScreenshot || !senderUpiId}
              >
                {submitting ? 'Verifying & Submitting...' : 'Submit Payment Proof'}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}
