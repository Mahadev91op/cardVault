'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import './AuthModals.css';

export default function AuthModals({ isOpen, type, onClose, onToggleType }) {
  const { login, register } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset form errors and fields when modal state changes
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">
              {type === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="modal-subtitle">
              {type === 'signin' 
                ? 'Sign in to access your virtual card vault' 
                : 'Join CardVault and buy virtual cards instantly'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {type === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    id="username"
                    type="text"
                    className="form-input"
                    placeholder="john_doe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                {type === 'signin' ? 'Email or Username' : 'Email Address'}
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
              <label className="form-label" htmlFor="password">Password</label>
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

            <button type="submit" className="btn-auth-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                type === 'signin' ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>

          <div className="modal-footer">
            {type === 'signin' ? (
              <>
                Don't have an account? 
                <span className="auth-toggle-link" onClick={() => onToggleType('signup')}>Sign Up</span>
              </>
            ) : (
              <>
                Already have an account? 
                <span className="auth-toggle-link" onClick={() => onToggleType('signin')}>Sign In</span>
              </>
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
