'use client';

import React, { useRef, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function CreditCard({ 
  type, 
  name, 
  cardNumber, 
  cvv, 
  cardHolder, 
  expiry, 
  gradientStart, 
  gradientEnd, 
  isMasked = false 
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // x coordinate inside element
      const y = e.clientY - rect.top;  // y coordinate inside element
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (centerY - y) / 14; // subtle tilt range
      const rotateY = (x - centerX) / 14;
      
      // Calculate glare position
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      card.style.setProperty('--glare-x', `${glareX}%`);
      card.style.setProperty('--glare-y', `${glareY}%`);
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      card.style.setProperty('--glare-x', '50%');
      card.style.setProperty('--glare-y', '50%');
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Format and mask card number
  const displayCardNumber = () => {
    if (!cardNumber) return '•••• •••• •••• ••••';
    
    // Clean spaces
    const cleaned = cardNumber.replace(/\s+/g, '');
    
    if (isMasked) {
      if (cleaned.length < 4) return '•••• •••• •••• ••••';
      const last4 = cleaned.slice(-4);
      return `•••• •••• •••• ${last4}`;
    }
    
    // If not masked, format in blocks of 4 digits for realistic look
    const matches = cleaned.match(/.{1,4}/g);
    return matches ? matches.join(' ') : cleaned;
  };

  // SVG representation of brand logos
  const renderLogo = () => {
    switch (type?.toLowerCase()) {
      case 'visa':
        return (
          <svg viewBox="0 0 120 40" className="card-logo" style={{ height: '22px' }}>
            <path
              fill="white"
              d="M19.3 6.1h-4.3c-.9 0-1.7.5-2.1 1.4L4.8 28.5h4.6l.9-2.5h5.6l.5 2.5h4l-3.3-16.4c-.2-1.3-.9-2-2.1-2h-.3zm-6.7 16.3l2.6-7.2 1.5 7.2H12.6zm31-16.3H39c-1.2 0-2.2.7-2.6 1.8l-7.7 18.2 4.5.1 1-2.5H40l.4 2.4h3.9L48 6.1h-4.4v0zm-7.6 12.6l2.1-5.7 1.2 5.7h-3.3zm21.3-10c-1.3-.6-3.1-1-4.9-1-5.2 0-8.9 2.8-8.9 6.8 0 2.9 2.6 4.5 4.6 5.5 2.1 1 2.8 1.6 2.8 2.5 0 1.4-1.7 2-3.2 2-2.1 0-3.3-.4-4.8-1.1l-.7-.3-.7 4.5c1.2.6 3.5 1.1 5.8 1.1 5.5 0 9.1-2.7 9.1-6.9 0-2.3-1.4-4-4.5-5.5-1.9-.9-3-1.6-3-2.5 0-.9 1-1.8 3.1-1.8 1.8 0 3 .4 4 1l.5.2.7-4.5zm-51-.7h-6.8L3.2 17.8c-.4-.9-.8-1.3-1.5-1.7l-4.5-2.4v-.6H7.1c1.1 0 2 .8 2.3 1.8L11.5 25l4.6-18.8c.2-.9.8-1.5 1.7-1.5h6.2L16.2 28.5h-4L19.2 8.1z"
            />
          </svg>
        );
      case 'mastercard':
        return (
          <svg viewBox="0 0 100 60" className="card-logo" style={{ height: '26px' }}>
            <circle cx="30" cy="30" r="28" fill="#EB001B" opacity="0.9" />
            <circle cx="70" cy="30" r="28" fill="#F79E1B" opacity="0.9" />
            <path
              fill="#FF5F00"
              d="M50 8.6c4.6 5.5 7.4 12.7 7.4 20.4 0 7.7-2.8 14.8-7.4 20.4-4.6-5.5-7.4-12.7-7.4-20.4 0-7.7 2.8-14.8 7.4-20.4z"
            />
          </svg>
        );
      case 'rupay':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1 }}>
            <span style={{ fontStyle: 'italic', fontWeight: '900', fontSize: '1.2rem', color: '#fff', letterSpacing: '0.5px' }}>
              <span style={{ color: '#0970B6' }}>Ru</span>
              <span style={{ color: '#E47B25' }}>Pay</span>
            </span>
            <span style={{ fontSize: '0.42rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              Platinum
            </span>
          </div>
        );
      default:
        return <ShieldCheck size={28} />;
    }
  };

  const cardStyle = {
    background: `linear-gradient(135deg, ${gradientStart || '#1e3c72'} 0%, ${gradientEnd || '#2a5298'} 100%)`
  };

  return (
    <div className="virtual-card" style={cardStyle} ref={cardRef}>
      {/* Glare effect */}
      <div className="card-glare"></div>
      <div className="card-texture"></div>
      
      {/* Top section: Card name and logo */}
      <div className="card-top">
        <span className="card-brand-name">{name || 'Virtual Card'}</span>
        {renderLogo()}
      </div>

      {/* Middle section: Chip & Contactless indicator */}
      <div className="card-middle-row">
        <div className="card-chip">
          <div className="chip-lines"></div>
        </div>
        
        {/* Contactless waves icon */}
        <svg viewBox="0 0 24 24" className="card-contactless" width="18" height="18">
          <path d="M2 12a10 10 0 0 1 8-9.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.25" />
          <path d="M5 12a7 7 0 0 1 5.6-6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M8 12a4 4 0 0 1 3.2-3.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.75" />
          <path d="M11 12a1 1 0 0 1 .8-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Card Number block */}
      <div className="card-number-wrapper">
        <div className="card-number-embossed">{displayCardNumber()}</div>
      </div>

      {/* Bottom section: Cardholder, Expiry, CVV & Hologram */}
      <div className="card-bottom">
        <div className="card-holder-info">
          <span className="card-label">Card Holder</span>
          <span className="card-holder-name-embossed">{cardHolder || 'CARDHOLDER'}</span>
        </div>

        <div className="card-meta-hologram-wrapper">
          <div className="card-meta">
            <div className="card-expiry-info">
              <span className="card-label">Valid Thru</span>
              <span className="card-expiry-val-embossed">{expiry || '••/••'}</span>
            </div>
            <div className="card-cvv-info">
              <span className="card-label">CVV</span>
              <span className="card-cvv-val-embossed">{cvv || '•••'}</span>
            </div>
          </div>
          
          {/* Hologram sticker for realism */}
          {type?.toLowerCase() !== 'rupay' && (
            <div className="card-hologram">
              <div className="hologram-inner"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
