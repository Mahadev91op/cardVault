'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Mail, Lock, User, AlertCircle, Loader2, CheckCircle, KeyRound, Send } from 'lucide-react';
import './AuthModals.css';

export default function AuthModals({ isOpen, type, onClose, onToggleType }) {
  const { login, register, resetPassword } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevProps, setPrevProps] = useState({ isOpen, type });

  if (prevProps.isOpen !== isOpen || prevProps.type !== type) {
    setPrevProps({ isOpen, type });
    setError('');
    setSuccessMsg('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (type === 'signup') {
        if (!username || !email || !password) {
          setError('All fields are required');
          setIsSubmitting(false);
          return;
        }
        const res = await register(username, email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Failed to sign up');
        }
      } else if (type === 'forgot') {
        if (!username || !email || !password || !confirmPassword) {
          setError('All fields are required');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsSubmitting(false);
          return;
        }

        const res = await resetPassword(username, email, password);
        if (res.success) {
          setSuccessMsg(res.message || 'Password has been reset successfully!');
        } else {
          setError(res.error || 'Failed to reset password');
        }
      } else {
        if (!email || !password) {
          setError('Email/Username and Password are required');
          setIsSubmitting(false);
          return;
        }
        const res = await login(email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Failed to sign in');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const telegramLink = process.env.NEXT_PUBLIC_TELEGRAM_LINK || 'https://t.me/cardvault_admin';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">
              {type === 'signin' 
                ? 'Welcome Back' 
                : type === 'signup' 
                ? 'Create Account' 
                : 'Reset Password'}
            </h2>
            <p className="modal-subtitle">
              {type === 'signin' 
                ? 'Sign in to access your virtual card vault' 
                : type === 'signup'
                ? 'Join CardVault and buy virtual cards instantly'
                : 'Enter your registered details to set a new password'}
            </p>
          </div>

          {successMsg ? (
            <div className="auth-success-wrapper">
              <div className="auth-success-icon">
                <CheckCircle size={48} color="#10b981" />
              </div>
              <h3 className="auth-success-title">Password Reset Complete!</h3>
              <p className="auth-success-desc">{successMsg}</p>
              <button 
                type="button" 
                className="btn-auth-submit"
                onClick={() => onToggleType('signin')}
              >
                Sign In With New Password
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              {error && (
                <div className="auth-error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {(type === 'signup' || type === 'forgot') && (
                <div className="form-group">
                  <label className="form-label" htmlFor="username">
                    {type === 'forgot' ? 'Registered Username' : 'Username'}
                  </label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={18} />
                    <input
                      id="username"
                      type="text"
                      className="form-input"
                      placeholder="e.g. john_doe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  {type === 'signin' 
                    ? 'Email or Username' 
                    : type === 'forgot'
                    ? 'Registered Email Address'
                    : 'Email Address'}
                </label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input
                    id="email"
                    type="text"
                    className="form-input"
                    placeholder={type === 'signin' ? 'john@example.com or john_doe' : 'john@example.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="password">
                    {type === 'forgot' ? 'New Password' : 'Password'}
                  </label>
                  {type === 'signin' && (
                    <button
                      type="button"
                      className="auth-forgot-link"
                      onClick={() => onToggleType('forgot')}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {type === 'forgot' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="input-wrapper">
                    <KeyRound className="input-icon" size={18} />
                    <input
                      id="confirmPassword"
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="btn-auth-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Processing...
                  </>
                ) : (
                  type === 'signin' 
                    ? 'Sign In' 
                    : type === 'signup' 
                    ? 'Sign Up' 
                    : 'Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="modal-footer">
            {type === 'signin' ? (
              <>
                Don&apos;t have an account? 
                <span className="auth-toggle-link" onClick={() => onToggleType('signup')}>Sign Up</span>
              </>
            ) : type === 'signup' ? (
              <>
                Already have an account? 
                <span className="auth-toggle-link" onClick={() => onToggleType('signin')}>Sign In</span>
              </>
            ) : (
              <div className="forgot-footer-options">
                <div>
                  Remembered your password? 
                  <span className="auth-toggle-link" onClick={() => onToggleType('signin')}>Sign In</span>
                </div>
                <div className="forgot-support-hint">
                  Need help? 
                  <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="forgot-telegram-link">
                    <Send size={12} /> Contact Admin on Telegram
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Global CSS spinner keyframe injection if needed */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
