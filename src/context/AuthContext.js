'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  checkSession: async () => {},
  resetPassword: async () => {}
});

// Client-side automatic auth token interceptor for all /api/ requests
if (typeof window !== 'undefined' && !window.__authFetchPatched) {
  window.__authFetchPatched = true;
  const originalFetch = window.fetch;
  window.fetch = async function (input, init = {}) {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input?.url || '';
      if (url.startsWith('/api/') || url.includes('/api/')) {
        const token = localStorage.getItem('cv_token');
        if (token) {
          init = { ...init };
          const headers = new Headers(init.headers || {});
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          init.headers = headers;
        }
      }
    } catch (e) {}
    return originalFetch(input, init);
  };
}

export function AuthProvider({ children }) {
  // 1. Immediately hydrate user from localStorage on mount (zero flash of logged-out state)
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cv_user');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem('cv_user')) return false;
      } catch (e) {}
    }
    return true;
  });

  const [error, setError] = useState(null);

  const checkSession = React.useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cv_token') : null;
      const headers = { 'Cache-Control': 'no-store' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/auth/me', {
        headers,
        credentials: 'include',
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          try {
            localStorage.setItem('cv_user', JSON.stringify(data.user));
          } catch (e) {}
        }
      } else if (res.status === 401) {
        // Only wipe user if server explicitly verified that token is expired / rejected
        setUser(null);
        try {
          localStorage.removeItem('cv_user');
          localStorage.removeItem('cv_token');
        } catch (e) {}
      }
      // If 500, 503, or temporary server restart, keep the existing session so user is not logged out!
    } catch (err) {
      console.warn('Verify session temporary network glitch, keeping local session:', err);
      // Do NOT clear user on network hiccup
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (loginIdentifier, password) => {
    try {
      setError(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ loginIdentifier, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.token) {
        try {
          localStorage.setItem('cv_token', data.token);
          localStorage.setItem('cv_user', JSON.stringify(data.user));
        } catch (e) {}
      }
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.token) {
        try {
          localStorage.setItem('cv_token', data.token);
          localStorage.setItem('cv_user', JSON.stringify(data.user));
        } catch (e) {}
      }
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      try {
        localStorage.removeItem('cv_user');
        localStorage.removeItem('cv_token');
      } catch (e) {}
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const resetPassword = async (username, email, newPassword) => {
    try {
      setError(null);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed');
      }
      return { success: true, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, checkSession, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
