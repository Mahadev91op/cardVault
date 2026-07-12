'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ChevronDown, User, ShoppingBag, LogOut, Send, Shield, HelpCircle } from 'lucide-react';
import './Navbar.css';

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

export default function Navbar({ onOpenAuth }) {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [dynamicSettings, setDynamicSettings] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDynamicSettings(data.settings);
        }
      })
      .catch(err => console.error('Error fetching settings in navbar:', err));
  }, [pathname]);

  const hasAnnouncement = dynamicSettings?.announcementActive && dynamicSettings?.announcementText;
  
  useEffect(() => {
    if (hasAnnouncement) {
      document.body.classList.add('has-announcement-active');
    } else {
      document.body.classList.remove('has-announcement-active');
    }
    return () => {
      document.body.classList.remove('has-announcement-active');
    };
  }, [hasAnnouncement]);

  const handleNavClick = (e, sectionId) => {
    if (pathname === '/') {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push(`/#${sectionId}`);
    }
  };

  const telegramLink = dynamicSettings?.telegramLink || 'https://t.me/cardvault_admin';
  const instagramLink = dynamicSettings?.instagramLink || 'https://instagram.com/cardvault_admin';

  return (
    <>
      {hasAnnouncement && (
        <div className="announcement-banner">
          <div className="container announcement-content">
            <span className="announcement-badge">Notice</span>
            <span className="announcement-message">{dynamicSettings.announcementText}</span>
          </div>
        </div>
      )}
      <nav className={`navbar-container glass ${isScrolled ? 'navbar-scrolled' : ''} ${hasAnnouncement ? 'has-announcement' : ''}`}>
      <div className="container navbar-content">
        {/* Logo */}
        <Link href="/" className="logo">
          <div className="logo-icon">
            <Shield size={18} fill="white" />
          </div>
          CardVault
        </Link>

        {/* Center Navigation Links */}
        <div className="nav-links">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <a
            href="#marketplace"
            onClick={(e) => handleNavClick(e, 'marketplace')}
            className="nav-link"
          >
            Marketplace
          </a>
          <a
            href="#verify-payment"
            onClick={(e) => handleNavClick(e, 'verify-payment')}
            className="nav-link"
          >
            Verify Payment
          </a>

          {/* Contact Admin Dropdown directly in Navbar */}
          <div className="nav-dropdown">
            <span className="nav-link dropdown-trigger">
              Contact Admin <ChevronDown size={14} />
            </span>
            <div className="dropdown-menu">
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="dropdown-item"
              >
                <Send size={16} color="#0088cc" />
                Telegram Support
              </a>
              <a
                href={instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="dropdown-item"
              >
                <InstagramIcon size={16} color="#e1306c" />
                Instagram Support
              </a>
            </div>
          </div>
        </div>

        {/* Right Authentication / Profile Actions */}
        <div className="nav-actions">
          {user ? (
            <div className="nav-dropdown">
              <div className="profile-trigger">
                <div className="profile-avatar">
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="profile-name">{user.username}</span>
                <ChevronDown size={14} />
              </div>
              <div className="dropdown-menu">
                <Link href="/profile/orders" className="dropdown-item">
                  <ShoppingBag size={16} />
                  My Orders
                </Link>
                {user.isAdmin && (
                  <Link href="/admin" className="dropdown-item">
                    <Shield size={16} color="var(--primary)" />
                    Admin Panel
                  </Link>
                )}
                <div className="dropdown-divider"></div>
                <button onClick={logout} className="dropdown-item" style={{ color: 'var(--accent)' }}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <button className="btn-signin" onClick={() => onOpenAuth('signin')}>
                Sign In
              </button>
              <button className="btn-signup" onClick={() => onOpenAuth('signup')}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
    </>
  );
}
