'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Mail, Lock, User, AlertCircle, Loader2, CheckCircle, KeyRound, Eye, EyeOff, ArrowRight } from 'lucide-react';
import './AuthModals.css';

export default function AuthModals({ isOpen, type, onClose, onToggleType }) {
  const { login, register, resetPassword } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (type === 'signup') {
        const cleanUser = username.trim();
        const cleanMail = email.trim().toLowerCase();

        if (!cleanUser || !cleanMail || !password) {
          setError('All fields are required. Please fill in username, email, and password.');
          setIsSubmitting(false);
          return;
        }
        if (cleanUser.length < 3) {
          setError('Username must be at least 3 characters long.');
          setIsSubmitting(false);
          return;
        }
        if (!cleanMail.includes('@') || !cleanMail.includes('.')) {
          setError('Please enter a valid email address (e.g. name@example.com).');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setIsSubmitting(false);
          return;
        }

        const res = await register(cleanUser, cleanMail, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Failed to sign up');
        }
      } else if (type === 'forgot') {
        const cleanUser = username.trim();
        const cleanMail = email.trim().toLowerCase();

        if (!cleanUser || !cleanMail || !password || !confirmPassword) {
          setError('All fields are required. Please enter registered username, email, and new password.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('New password must be at least 6 characters long.');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please ensure both password fields are identical.');
          setIsSubmitting(false);
          return;
        }

        const res = await resetPassword(cleanUser, cleanMail, password);
        if (res.success) {
          setSuccessMsg(res.message || 'Password has been reset successfully!');
        } else {
          setError(res.error || 'Failed to reset password');
        }
      } else {
        // Sign In
        const cleanIdentifier = email.trim();
        if (!cleanIdentifier) {
          setError('Please enter your registered Email address or Username.');
          setIsSubmitting(false);
          return;
        }
        if (!password) {
          setError('Please enter your account password.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 4) {
          setError('Password must be at least 4 characters long.');
          setIsSubmitting(false);
          return;
        }

        const res = await login(cleanIdentifier, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Failed to sign in. Please verify your credentials.');
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                    <span>{error}</span>
                    {type === 'signin' && (error.toLowerCase().includes('password') || error.toLowerCase().includes('forgot')) && (
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          onToggleType('forgot');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          padding: 0,
                          textAlign: 'left',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'underline'
                        }}
                      >
                        Reset your password now <ArrowRight size={12} />
                      </button>
                    )}
                    {type === 'signin' && error.toLowerCase().includes('create account') && (
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          onToggleType('signup');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          padding: 0,
                          textAlign: 'left',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'underline'
                        }}
                      >
                        Create a new account now <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
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
                      placeholder="e.g. Mahadev"
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
                    placeholder={type === 'signin' ? 'Email or Username (e.g. Mahadev)' : 'john@example.com'}
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
                    type={showPassword ? 'text' : 'password'}
                    className="form-input has-toggle"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-toggle-icon"
                    onClick={() => setShowPassword(prev => !prev)}
                    title={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {type === 'forgot' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="input-wrapper">
                    <KeyRound className="input-icon" size={18} />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input has-toggle"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="input-toggle-icon"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-auth-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Verifying Credentials...
                  </>
                ) : (
                  type === 'signin' 
                    ? 'Sign In' 
                    : type === 'signup' 
                    ? 'Create Account' 
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
