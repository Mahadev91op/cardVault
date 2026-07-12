'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import CreditCard from '@/components/CreditCard';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard as CardIcon,
  Users,
  Sliders,
  LogOut,
  RefreshCw,
  Lock,
  Shield,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ChevronRight,
  Info,
  DollarSign,
  AlertCircle,
  Loader2,
  Send,
  SlidersHorizontal,
  Megaphone,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './page.css';

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  
  // Auth Modal state (for nav actions)
  const [authOpen, setAuthOpen] = useState(false);
  const [authType, setAuthType] = useState('signin');

  // Active Dashboard Tab ('dashboard' | 'orders' | 'cards' | 'users' | 'settings')
  const [activeTab, setActiveTab] = useState('dashboard');

  // Search & Filter states
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [cardSearch, setCardSearch] = useState('');
  const [cardFilter, setCardFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');

  // Chart interactivity states
  const [hoveredSalesPoint, setHoveredSalesPoint] = useState(null);
  const [hoveredBrand, setHoveredBrand] = useState(null);

  // Data states
  const [stats, setStats] = useState({ totalSales: 0, totalUsers: 0, totalCards: 0, pendingOrders: 0 });
  const [orders, setOrders] = useState([]);
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({
    telegramLink: 'https://t.me/cardvault_admin',
    instagramLink: 'https://instagram.com/cardvault_admin',
    announcementText: 'Welcome to CardVault! Verify payments via Telegram support.',
    announcementActive: true,
    maintenanceMode: false,
    globalDiscount: 0
  });

  const [loadingData, setLoadingData] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals state
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardModalType, setCardModalType] = useState('add'); // 'add' | 'edit'
  const [selectedCard, setSelectedCard] = useState(null);

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Card Form State
  const [cardForm, setCardForm] = useState({
    type: 'visa',
    name: '',
    cardNumber: '',
    cvv: '',
    cardHolder: 'CARDHOLDER',
    limit: '',
    expiry: '',
    refund: '100% Refundable',
    delivery: 'Instant Delivery',
    entryFee: '',
    qty: 10,
    gradientStart: '#1e3c72',
    gradientEnd: '#2a5298'
  });

  // Verify Form State (released details)
  const [verifyForm, setVerifyForm] = useState({
    number: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    if (user && user.isAdmin) {
      loadDashboardData();
    } else {
      setLoadingData(false);
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoadingData(true);
      
      const [ordersRes, cardsRes, usersRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/orders?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/cards?t=${Date.now()}`, { cache: 'no-store' }), 
        fetch(`/api/admin/users?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' })
      ]);

      if (ordersRes.ok && cardsRes.ok && usersRes.ok && settingsRes.ok) {
        const ordersData = await ordersRes.json();
        const cardsData = await cardsRes.json();
        const usersData = await usersRes.json();
        const settingsData = await settingsRes.json();

        if (ordersData.success && cardsData.success && usersData.success && settingsData.success) {
          setOrders(ordersData.orders);
          setCards(cardsData.cards);
          setUsers(usersData.users);
          setSettings(settingsData.settings);

          // Calculate overview stats
          const totalSales = ordersData.orders
            .filter(o => o.status === 'completed')
            .reduce((acc, curr) => acc + curr.pricePaid, 0);

          const pendingOrders = ordersData.orders.filter(o => o.status === 'pending').length;

          setStats({
            totalSales,
            totalUsers: usersData.users.length,
            totalCards: cardsData.cards.length,
            pendingOrders
          });
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast('Failed to load dashboard metrics', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Settings Handlers ---
  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Site settings updated dynamically!');
        setSettings(data.settings);
      } else {
        showToast(data.error || 'Failed to update settings', 'error');
      }
    } catch (err) {
      showToast('Network error updating settings', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- Orders Handlers ---
  const handleOpenVerifyModal = (order) => {
    setSelectedOrder(order);
    setVerifyForm({
      number: order.releasedCardDetails?.number || '',
      expiry: order.releasedCardDetails?.expiry || '',
      cvv: order.releasedCardDetails?.cvv || ''
    });
    setVerifyModalOpen(true);
  };

  const handleApproveOrder = async () => {
    if (!selectedOrder) return;
    setSubmitLoading(true);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          status: 'completed',
          releasedCardDetails: verifyForm
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Payment verified and card released!');
        setVerifyModalOpen(false);
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to approve order', 'error');
      }
    } catch (err) {
      showToast('Network error occurred', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (!confirm('Are you sure you want to REJECT this payment screenshot?')) return;
    setSubmitLoading(true);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: 'failed'
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Order rejected successfully.', 'warning');
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to reject order', 'error');
      }
    } catch (err) {
      showToast('Network error occurred', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- Cards CRUD Handlers ---
  const handleOpenCardModal = (type, card = null) => {
    setCardModalType(type);
    setSelectedCard(card);

    if (type === 'edit' && card) {
      setCardForm({
        type: card.type,
        name: card.name,
        cardNumber: card.cardNumber,
        cvv: card.cvv,
        cardHolder: card.cardHolder,
        limit: card.limit,
        expiry: card.expiry,
        refund: card.refund,
        delivery: card.delivery,
        entryFee: card.entryFee,
        qty: card.qty,
        gradientStart: card.gradientStart,
        gradientEnd: card.gradientEnd
      });
    } else {
      setCardForm({
        type: 'visa',
        name: '',
        cardNumber: '',
        cvv: '***',
        cardHolder: 'CARDHOLDER',
        limit: '',
        expiry: '',
        refund: '100% Refundable',
        delivery: 'Instant Delivery',
        entryFee: '',
        qty: 10,
        gradientStart: '#1e3c72',
        gradientEnd: '#2a5298'
      });
    }
    setCardModalOpen(true);
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    const endpoint = '/api/admin/cards';
    const method = cardModalType === 'add' ? 'POST' : 'PUT';
    const bodyData = cardModalType === 'add' 
      ? cardForm 
      : { ...cardForm, cardId: selectedCard._id };

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(cardModalType === 'add' ? 'Card created successfully!' : 'Card updated successfully!');
        setCardModalOpen(false);
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to save card', 'error');
      }
    } catch (err) {
      showToast('Network error occurred', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!confirm('Are you sure you want to DELETE this virtual card from the marketplace? This cannot be undone.')) return;
    setSubmitLoading(true);

    try {
      const res = await fetch(`/api/admin/cards?cardId=${cardId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Card deleted successfully.', 'warning');
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to delete card', 'error');
      }
    } catch (err) {
      showToast('Network error occurred', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleUserAdmin = async (userId, currentAdminStatus) => {
    const action = currentAdminStatus ? 'revoke admin status for' : 'grant admin privileges to';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    setSubmitLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isAdmin: !currentAdminStatus
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || 'User role updated successfully!');
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to update user role', 'error');
      }
    } catch (err) {
      showToast('Network error occurred', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to PERMANENTLY DELETE this user account? All order history will be severed. This cannot be undone.')) return;
    setSubmitLoading(true);

    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('User account deleted successfully.', 'warning');
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to delete user', 'error');
      }
    } catch (err) {
      showToast('Network error occurred', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out from the Admin Control Panel?')) {
      await logout();
      router.push('/');
    }
  };

  // Helper: Group completed sales in the last 7 days
  const getSalesChartData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        dateKey: d.toDateString(),
        sales: 0,
        count: 0
      });
    }

    orders.forEach(o => {
      const orderDate = new Date(o.createdAt).toDateString();
      const dayMatch = last7Days.find(d => d.dateKey === orderDate);
      if (dayMatch) {
        dayMatch.count += 1;
        if (o.status === 'completed') {
          dayMatch.sales += o.pricePaid;
        }
      }
    });

    return last7Days;
  };

  // Helper: Get brand inventory counts
  const getCardDistribution = () => {
    const counts = { visa: 0, mastercard: 0, rupay: 0 };
    cards.forEach(c => {
      const type = c.type?.toLowerCase();
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });
    return counts;
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={40} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading Administration Suite...</span>
      </div>
    );
  }

  // If user is not admin, show access denied
  if (!user || !user.isAdmin) {
    return (
      <main className="denied-container">
        <div className="orders-empty-state" style={{ maxWidth: '450px', margin: '100px auto', padding: '40px 24px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div className="empty-icon-wrapper" style={{ color: 'var(--accent)', background: 'rgba(244, 63, 94, 0.05)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <Lock size={32} />
          </div>
          <h2 className="empty-title" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Access Denied</h2>
          <p className="empty-desc" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '10px 0 24px 0', lineHeight: 1.5 }}>
            You do not have administrative privileges to access this area. If you are the system administrator, please log in with correct credentials.
          </p>
          <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justify: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Back to Homepage
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      {/* 1. DESKTOP SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Shield size={22} className="logo-icon" />
          <span className="brand-text">CardVault Admin</span>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="profile-details">
            <div className="profile-name">{user.username}</div>
            <div className="profile-role">Root Administrator</div>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button onClick={() => setActiveTab('dashboard')} className={`sidebar-menu-btn ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('orders')} className={`sidebar-menu-btn ${activeTab === 'orders' ? 'active' : ''}`}>
            <ShoppingBag size={18} /> Verify Orders
            {stats.pendingOrders > 0 && <span className="sidebar-badge">{stats.pendingOrders}</span>}
          </button>
          <button onClick={() => setActiveTab('cards')} className={`sidebar-menu-btn ${activeTab === 'cards' ? 'active' : ''}`}>
            <CardIcon size={18} /> Manage Catalog
          </button>
          <button onClick={() => setActiveTab('users')} className={`sidebar-menu-btn ${activeTab === 'users' ? 'active' : ''}`}>
            <Users size={18} /> User Accounts
          </button>
          <button onClick={() => setActiveTab('settings')} className={`sidebar-menu-btn ${activeTab === 'settings' ? 'active' : ''}`}>
            <Sliders size={18} /> Global Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <Link href="/" className="sidebar-footer-btn" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Website Home
          </Link>
          <button onClick={handleLogout} className="sidebar-footer-btn logout-btn">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* 2. MOBILE HEADER APP BAR */}
      <header className="admin-mobile-topbar">
        <div className="mobile-header-left">
          <Shield size={20} className="logo-icon-mobile" />
          <h1>Admin Control</h1>
        </div>
        <div className="mobile-header-actions">
          <button onClick={loadDashboardData} className="mobile-header-icon-btn">
            <RefreshCw size={16} />
          </button>
          <button onClick={handleLogout} className="mobile-header-icon-btn mobile-logout">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* 3. MAIN SCROLLABLE CONTENT VIEWPORT */}
      <main className="admin-main-content">
        {/* Mobile Page Title banner */}
        <div className="mobile-page-banner">
          <h2>
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'orders' && 'Verify Transactions'}
            {activeTab === 'cards' && 'Card Products'}
            {activeTab === 'users' && 'Account Manager'}
            {activeTab === 'settings' && 'Global Configurations'}
          </h2>
          <button onClick={loadDashboardData} className="btn-secondary-compact desktop-only">
            <RefreshCw size={12} /> Refresh Data
          </button>
        </div>

        {loadingData ? (
          <div className="panel-loading-wrapper">
            <Loader2 size={32} className="animate-spin" />
            <span>Syncing database collections...</span>
          </div>
        ) : (
          <div className="panel-content-area">
            
            {/* TAB CONTENT: 1. DASHBOARD */}
            {activeTab === 'dashboard' && (
              <>
                {/* Metrics Overview Cards */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-info">
                      <span className="stat-card-label">Total Revenue</span>
                      <span className="stat-card-value">${stats.totalSales}</span>
                    </div>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)' }}>
                      <DollarSign size={24} />
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <span className="stat-card-label">Pending Requests</span>
                      <span className="stat-card-value">{stats.pendingOrders}</span>
                    </div>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning)' }}>
                      <AlertCircle size={24} />
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <span className="stat-card-label">Issued Cards</span>
                      <span className="stat-card-value">{orders.filter(o => o.status === 'completed').length}</span>
                    </div>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)' }}>
                      <CardIcon size={24} />
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <span className="stat-card-label">Active Users</span>
                      <span className="stat-card-value">{stats.totalUsers}</span>
                    </div>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(71, 85, 105, 0.08)', color: 'var(--text-secondary)' }}>
                      <Users size={24} />
                    </div>
                  </div>
                </div>

                {/* SVG Charts Area */}
                {(() => {
                  const salesChartData = getSalesChartData();
                  const maxSales = Math.max(...salesChartData.map(d => d.sales), 50);

                  const chartWidth = 500;
                  const chartHeight = 160;
                  const paddingX = 50;
                  const paddingY = 20;

                  const points = salesChartData.map((d, index) => {
                    const x = paddingX + (index * (chartWidth - paddingX * 2)) / (salesChartData.length - 1);
                    const y = chartHeight - paddingY - (d.sales * (chartHeight - paddingY * 2)) / maxSales;
                    return { x, y, ...d };
                  });

                  const pathD = points.length > 0 
                    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
                    : '';

                  const areaD = points.length > 0
                    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
                    : '';

                  const brandData = getCardDistribution();
                  const totalBrandCount = brandData.visa + brandData.mastercard + brandData.rupay;

                  const getDonutSegments = () => {
                    if (totalBrandCount === 0) return [];
                    const segments = [
                      { brand: 'Visa', count: brandData.visa, color: 'var(--primary)', accent: '#4f46e5' },
                      { brand: 'Mastercard', count: brandData.mastercard, color: '#ff5f00', accent: '#ea580c' },
                      { brand: 'Rupay', count: brandData.rupay, color: '#e47b25', accent: '#d97706' }
                    ];

                    let currentOffset = 0;
                    const r = 38;
                    const circ = 2 * Math.PI * r;

                    return segments.map(seg => {
                      const pct = seg.count / totalBrandCount;
                      const strokeDasharray = `${pct * circ} ${circ}`;
                      const strokeDashoffset = currentOffset;
                      currentOffset -= pct * circ;
                      return {
                        ...seg,
                        strokeDasharray,
                        strokeDashoffset,
                        percentage: Math.round(pct * 100)
                      };
                    });
                  };

                  const donutSegments = getDonutSegments();

                  return (
                    <div className="admin-analytics-grid">
                      {/* Sales & Orders Chart */}
                      <div className="analytics-card">
                        <div className="analytics-card-header">
                          <h3>Business Revenue & Order Activity</h3>
                          <p>Completed sales performance trend over past 7 days</p>
                        </div>
                        <div className="chart-container" style={{ position: 'relative' }}>
                          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="sales-svg-chart" style={{ width: '100%', height: 'auto', display: 'block' }}>
                            <defs>
                              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(79, 70, 229, 0.25)" />
                                <stop offset="100%" stopColor="rgba(79, 70, 229, 0.0)" />
                              </linearGradient>
                            </defs>
                            
                            {/* Horizontal Grid lines */}
                            <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="var(--border-color)" strokeDasharray="4 4" opacity="0.5" />
                            <line x1={paddingX} y1={(chartHeight) / 2} x2={chartWidth - paddingX} y2={(chartHeight) / 2} stroke="var(--border-color)" strokeDasharray="4 4" opacity="0.5" />
                            <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="var(--border-color)" strokeWidth="1" opacity="0.8" />

                            {/* Y-axis Labels */}
                            <text x={paddingX - 10} y={paddingY + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)" fontWeight="bold">${Math.round(maxSales)}</text>
                            <text x={paddingX - 10} y={(chartHeight) / 2 + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)" fontWeight="bold">${Math.round(maxSales / 2)}</text>
                            <text x={paddingX - 10} y={chartHeight - paddingY + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)" fontWeight="bold">$0</text>

                            {/* Chart Area Fill & Stroke */}
                            {points.length > 0 && (
                              <>
                                <path d={areaD} fill="url(#chartGradient)" />
                                <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                              </>
                            )}

                            {/* Interactivity data dots */}
                            {points.map((p, i) => (
                              <g key={i}>
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r={hoveredSalesPoint && hoveredSalesPoint.dateKey === p.dateKey ? 7 : 4}
                                  fill={hoveredSalesPoint && hoveredSalesPoint.dateKey === p.dateKey ? 'var(--primary)' : 'white'}
                                  stroke="var(--primary)"
                                  strokeWidth="2.5"
                                  style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                                  onMouseEnter={() => setHoveredSalesPoint(p)}
                                  onMouseLeave={() => setHoveredSalesPoint(null)}
                                />
                                <text
                                  x={p.x}
                                  y={chartHeight - 4}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fill="var(--text-secondary)"
                                  fontWeight="600"
                                >
                                  {p.dateStr}
                                </text>
                              </g>
                            ))}
                          </svg>
                          
                          {hoveredSalesPoint && (
                            <div className="chart-tooltip" style={{
                              position: 'absolute',
                              top: `${hoveredSalesPoint.y - 50}px`,
                              left: `${(hoveredSalesPoint.x / chartWidth) * 100}%`,
                              transform: 'translateX(-50%)',
                              background: 'var(--text-primary)',
                              color: 'var(--bg-secondary)',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              pointerEvents: 'none',
                              zIndex: 10,
                              textAlign: 'center',
                              whiteSpace: 'nowrap'
                            }}>
                              <div>{hoveredSalesPoint.dateKey}</div>
                              <div style={{ color: '#38bdf8', fontSize: '0.9rem', marginTop: '2px' }}>
                                Sales: ${hoveredSalesPoint.sales} | Orders: {hoveredSalesPoint.count}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Brand distribution */}
                      <div className="analytics-card">
                        <div className="analytics-card-header">
                          <h3>Card Brand Distribution</h3>
                          <p>Marketplace catalog cataloguing metrics</p>
                        </div>
                        <div className="brand-chart-layout">
                          <div className="donut-svg-wrapper">
                            {totalBrandCount === 0 ? (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No cards in catalog</div>
                            ) : (
                              <svg viewBox="0 0 100 100" style={{ width: '100px', height: '100px' }}>
                                <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--border-color)" strokeWidth="10" opacity="0.3" />
                                {donutSegments.map((seg, idx) => (
                                  <circle
                                    key={idx}
                                    cx="50"
                                    cy="50"
                                    r="38"
                                    fill="transparent"
                                    stroke={seg.color}
                                    strokeWidth={hoveredBrand === seg.brand ? 12 : 10}
                                    strokeDasharray={seg.strokeDasharray}
                                    strokeDashoffset={seg.strokeDashoffset}
                                    transform="rotate(-90 50 50)"
                                    strokeLinecap="round"
                                    style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                                    onMouseEnter={() => setHoveredBrand(seg.brand)}
                                    onMouseLeave={() => setHoveredBrand(null)}
                                  />
                                ))}
                                <circle cx="50" cy="50" r="28" fill="var(--bg-secondary)" />
                                <text x="50" y="47" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-secondary)">TOTAL</text>
                                <text x="50" y="60" textAnchor="middle" fontSize="13" fontWeight="900" fill="var(--text-primary)">{totalBrandCount}</text>
                              </svg>
                            )}
                          </div>

                          <div className="brand-legends">
                            {totalBrandCount === 0 ? (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No brand data.</div>
                            ) : (
                              donutSegments.map((seg, i) => (
                                <div
                                  key={i}
                                  className={`legend-item ${hoveredBrand === seg.brand ? 'highlighted' : ''}`}
                                  onMouseEnter={() => setHoveredBrand(seg.brand)}
                                  onMouseLeave={() => setHoveredBrand(null)}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '4px 8px', borderRadius: '6px', transition: 'background 0.2s ease', cursor: 'pointer' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: seg.color }}></span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'capitalize' }}>{seg.brand}</span>
                                  </div>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                                    {seg.count} ({seg.percentage}%)
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* TAB CONTENT: 2. ORDERS VERIFICATION */}
            {activeTab === 'orders' && (() => {
              const filteredOrders = orders.filter(order => {
                const searchLower = orderSearch.toLowerCase();
                const buyerUsername = order.userId?.username?.toLowerCase() || '';
                const buyerEmail = order.userId?.email?.toLowerCase() || '';
                const cardName = order.cardId?.name?.toLowerCase() || '';
                const matchesSearch = buyerUsername.includes(searchLower) || buyerEmail.includes(searchLower) || cardName.includes(searchLower);
                const matchesFilter = orderFilter === 'all' || order.status === orderFilter;
                return matchesSearch && matchesFilter;
              });

              return (
                <div>
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">Order Processing Requests</h2>
                      <span className="admin-subtitle">Verify user payment screenshots and release active credentials.</span>
                    </div>
                    
                    <div className="filter-controls-row">
                      <input
                        type="text"
                        placeholder="Search by buyer or card..."
                        className="search-input"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                      />
                      <select
                        className="filter-select"
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="orders-empty-state">
                      <ShoppingBag size={32} />
                      <p>{orders.length === 0 ? 'No orders registered on the platform yet.' : 'No orders matched your search criteria.'}</p>
                    </div>
                  ) : (
                    <>
                      {/* DESKTOP TABLE VIEW */}
                      <div className="desktop-only-table-wrapper table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Buyer</th>
                              <th>Card Product</th>
                              <th>Entry Fee</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOrders.map((order) => (
                              <tr key={order._id}>
                                <td>
                                  {new Date(order.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td>
                                  <div style={{ fontWeight: 'bold' }}>{order.userId?.username || 'Deleted User'}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.userId?.email || 'N/A'}</div>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 'bold' }}>{order.cardId?.name || 'Deleted Card'}</div>
                                  <div style={{ fontSize: '0.8rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                                    {order.cardId?.type || 'N/A'}
                                  </div>
                                </td>
                                <td style={{ fontWeight: 'bold' }}>${order.pricePaid} USD</td>
                                <td>
                                  {order.status === 'pending' && <span className="status-pill status-pending">Pending Verification</span>}
                                  {order.status === 'completed' && <span className="status-pill status-completed">Completed</span>}
                                  {order.status === 'failed' && <span className="status-pill status-failed">Rejected</span>}
                                </td>
                                <td>
                                  <div className="admin-actions">
                                    {order.status === 'pending' ? (
                                      <>
                                        <button onClick={() => handleOpenVerifyModal(order)} className="btn-admin-action btn-admin-approve">
                                          <CheckCircle size={14} /> Verify & Release
                                        </button>
                                        <button onClick={() => handleRejectOrder(order._id)} className="btn-admin-action btn-admin-reject">
                                          <XCircle size={14} /> Reject
                                        </button>
                                      </>
                                    ) : (
                                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '8px' }}>
                                        {order.status === 'completed' ? (
                                          <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                                            Released: {order.releasedCardDetails?.number?.slice(-4) || '••••'}
                                          </span>
                                        ) : (
                                          'Payment invalid'
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* MOBILE NATIVE CARD STACK VIEW */}
                      <div className="mobile-cards-view">
                        {filteredOrders.map((order) => (
                          <div className="admin-mobile-card" key={order._id}>
                            <div className="mobile-card-header">
                              <span className="mobile-card-date">
                                {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`status-pill status-${order.status}`}>
                                {order.status === 'pending' ? 'Pending' : order.status === 'completed' ? 'Completed' : 'Rejected'}
                              </span>
                            </div>
                            <div className="mobile-card-body">
                              <div className="mobile-card-row">
                                <span className="label">Buyer:</span>
                                <span className="val">{order.userId?.username || 'Deleted User'} ({order.userId?.email || 'N/A'})</span>
                              </div>
                              <div className="mobile-card-row">
                                <span className="label">Card Product:</span>
                                <span className="val">{order.cardId?.name || 'Deleted Card'} ({order.cardId?.type || 'N/A'})</span>
                              </div>
                              <div className="mobile-card-row">
                                <span className="label">Entry Fee:</span>
                                <span className="val font-bold">${order.pricePaid} USD</span>
                              </div>
                              {order.status === 'completed' && (
                                <div className="mobile-card-row release-details">
                                  <span className="label">Released Card:</span>
                                  <span className="val text-success">
                                    {order.releasedCardDetails?.number?.slice(-4) ? `•••• •••• •••• ${order.releasedCardDetails.number.slice(-4)}` : '••••'}
                                  </span>
                                </div>
                              )}
                            </div>
                            {order.status === 'pending' && (
                              <div className="mobile-card-actions">
                                <button onClick={() => handleOpenVerifyModal(order)} className="mobile-btn mobile-btn-approve">
                                  <CheckCircle size={14} /> Verify & Release
                                </button>
                                <button onClick={() => handleRejectOrder(order._id)} className="mobile-btn mobile-btn-reject">
                                  <XCircle size={14} /> Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* TAB CONTENT: 3. MANAGE CARD CATALOG */}
            {activeTab === 'cards' && (() => {
              const filteredCards = cards.filter(card => {
                const searchLower = cardSearch.toLowerCase();
                const cardName = card.name?.toLowerCase() || '';
                const matchesSearch = cardName.includes(searchLower);
                const matchesFilter = cardFilter === 'all' || card.type?.toLowerCase() === cardFilter.toLowerCase();
                return matchesSearch && matchesFilter;
              });

              return (
                <div>
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">Manage Virtual Cards Catalog</h2>
                    </div>
                    <div className="filter-controls-row">
                      <input
                        type="text"
                        placeholder="Search by card name..."
                        className="search-input"
                        value={cardSearch}
                        onChange={(e) => setCardSearch(e.target.value)}
                      />
                      <select
                        className="filter-select"
                        value={cardFilter}
                        onChange={(e) => setCardFilter(e.target.value)}
                      >
                        <option value="all">All Brands</option>
                        <option value="visa">Visa</option>
                        <option value="mastercard">Mastercard</option>
                        <option value="rupay">Rupay</option>
                      </select>
                      <button className="btn-primary" style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)' }} onClick={() => handleOpenCardModal('add')}>
                        <Plus size={16} /> Add Card
                      </button>
                    </div>
                  </div>

                  {filteredCards.length === 0 ? (
                    <div className="orders-empty-state">
                      <CardIcon size={32} />
                      <p>{cards.length === 0 ? 'No cards available. Click "Add Card" to seed the catalog.' : 'No cards matched your search criteria.'}</p>
                    </div>
                  ) : (
                    <div className="admin-cards-list">
                      {filteredCards.map((card) => (
                        <div className="admin-card-showcase" key={card._id}>
                          <CreditCard
                            type={card.type}
                            name={card.name}
                            cardNumber={card.cardNumber}
                            cvv={card.cvv}
                            cardHolder={card.cardHolder}
                            expiry={card.expiry}
                            gradientStart={card.gradientStart}
                            gradientEnd={card.gradientEnd}
                            isMasked={true}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{card.name}</div>
                            <div>Type: <strong style={{ textTransform: 'capitalize' }}>{card.type}</strong></div>
                            <div>Limit: <strong>{card.limit}</strong></div>
                            <div>Fee: <strong>${card.entryFee} USD</strong></div>
                            <div>Stock: <strong style={{ color: card.qty < 10 ? 'var(--accent)' : 'inherit' }}>{card.qty} units</strong></div>
                          </div>
                          <div className="admin-card-actions">
                            <button onClick={() => handleOpenCardModal('edit', card)} className="btn-admin-action" style={{ color: 'var(--primary)' }}>
                              <Edit size={14} /> Edit
                            </button>
                            <button onClick={() => handleDeleteCard(card._id)} className="btn-admin-action" style={{ color: 'var(--accent)' }}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TAB CONTENT: 4. USER ACCOUNTS MANAGER */}
            {activeTab === 'users' && (() => {
              const filteredUsers = users.filter(usr => {
                const searchLower = userSearch.toLowerCase();
                const username = usr.username?.toLowerCase() || '';
                const email = usr.email?.toLowerCase() || '';
                const matchesSearch = username.includes(searchLower) || email.includes(searchLower);
                const matchesFilter = userFilter === 'all' || 
                  (userFilter === 'admin' ? usr.isAdmin : !usr.isAdmin);
                return matchesSearch && matchesFilter;
              });

              return (
                <div>
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">Registered Accounts Directory</h2>
                      <span className="admin-subtitle">View usernames and administrative status parameters.</span>
                    </div>
                    <div className="filter-controls-row">
                      <input
                        type="text"
                        placeholder="Search by username/email..."
                        className="search-input"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                      <select
                        className="filter-select"
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Administrators</option>
                        <option value="user">Regular Members</option>
                      </select>
                    </div>
                  </div>

                  {filteredUsers.length === 0 ? (
                    <div className="orders-empty-state">
                      <Users size={32} />
                      <p>{users.length === 0 ? 'No registered accounts found.' : 'No users matched your search criteria.'}</p>
                    </div>
                  ) : (
                    <>
                      {/* DESKTOP TABLE VIEW */}
                      <div className="desktop-only-table-wrapper table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Joined Date</th>
                              <th>Username</th>
                              <th>Email Address</th>
                              <th>Administrative Privileges</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map((item) => (
                              <tr key={item._id}>
                                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                <td style={{ fontWeight: 'bold' }}>{item.username}</td>
                                <td>{item.email}</td>
                                <td>
                                  {item.isAdmin ? (
                                    <span className="role-badge role-admin">Administrator</span>
                                  ) : (
                                    <span className="role-badge role-user">Regular Member</span>
                                  )}
                                </td>
                                <td>
                                  <div className="admin-actions">
                                    <button
                                      onClick={() => handleToggleUserAdmin(item._id, item.isAdmin)}
                                      className={`btn-admin-action ${item.isAdmin ? 'btn-admin-reject' : 'btn-admin-approve'}`}
                                      disabled={item._id === user?.id || submitLoading}
                                      title={item._id === user?.id ? "You cannot demote yourself" : ""}
                                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                    >
                                      {item.isAdmin ? <Lock size={12} /> : <Shield size={12} />}
                                      {item.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(item._id)}
                                      className="btn-admin-action btn-admin-reject"
                                      disabled={item._id === user?.id || submitLoading}
                                      title={item._id === user?.id ? "You cannot delete yourself" : ""}
                                      style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#fff0f2', color: 'var(--accent)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                                    >
                                      <Trash2 size={12} /> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* MOBILE CARD VIEW FOR USERS */}
                      <div className="mobile-cards-view">
                        {filteredUsers.map((item) => (
                          <div className="admin-mobile-card" key={item._id}>
                            <div className="mobile-card-header">
                              <span className="mobile-card-date">Joined {new Date(item.createdAt).toLocaleDateString()}</span>
                              <span className={`role-badge ${item.isAdmin ? 'role-admin' : 'role-user'}`}>
                                {item.isAdmin ? 'Admin' : 'Member'}
                              </span>
                            </div>
                            <div className="mobile-card-body">
                              <div className="mobile-card-row">
                                <span className="label">Username:</span>
                                <span className="val font-bold">{item.username}</span>
                              </div>
                              <div className="mobile-card-row">
                                <span className="label">Email:</span>
                                <span className="val">{item.email}</span>
                              </div>
                            </div>
                            <div className="mobile-card-actions">
                              <button
                                onClick={() => handleToggleUserAdmin(item._id, item.isAdmin)}
                                className={`mobile-btn ${item.isAdmin ? 'mobile-btn-reject' : 'mobile-btn-approve'}`}
                                disabled={item._id === user?.id || submitLoading}
                              >
                                {item.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(item._id)}
                                className="mobile-btn mobile-btn-reject"
                                style={{ background: '#fff0f2', color: 'var(--accent)' }}
                                disabled={item._id === user?.id || submitLoading}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* TAB CONTENT: 5. GLOBAL SITE CONFIGURATIONS */}
            {activeTab === 'settings' && (
              <div style={{ maxWidth: '640px' }}>
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Global Site Configurations</h2>
                    <span className="admin-subtitle">Manage support links, announcement alerts, global discounts, and maintenance mode parameters.</span>
                  </div>
                </div>

                <form className="admin-form settings-form-panel" onSubmit={handleSaveSettings} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="settings-section-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                    <SlidersHorizontal size={16} color="var(--primary)" /> Support & Communication Handles
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Telegram Support Link</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={settings.telegramLink}
                      onChange={(e) => handleSettingsChange('telegramLink', e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Defines the link used by customers to verify screenshot receipts.</span>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Instagram Support Link</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={settings.instagramLink}
                      onChange={(e) => handleSettingsChange('instagramLink', e.target.value)}
                      required
                    />
                  </div>

                  <div className="settings-section-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginTop: '10px' }}>
                    <Megaphone size={16} color="var(--primary)" /> Announcement Alert Banner
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <span>Enable Global Header Announcement Alert</span>
                      <input
                        type="checkbox"
                        checked={settings.announcementActive}
                        onChange={(e) => handleSettingsChange('announcementActive', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                    </label>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Announcement Banner Text</label>
                    <textarea
                      className="admin-form-input"
                      style={{ height: '70px', resize: 'none', fontFamily: 'inherit', padding: '10px' }}
                      value={settings.announcementText}
                      onChange={(e) => handleSettingsChange('announcementText', e.target.value)}
                      disabled={!settings.announcementActive}
                      placeholder="e.g. UPI payments are working instantly! Verify via Telegram."
                    />
                  </div>

                  <div className="settings-section-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginTop: '10px' }}>
                    <Globe size={16} color="var(--primary)" /> System Switches
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <span>Activate Maintenance Mode</span>
                        <input
                          type="checkbox"
                          checked={settings.maintenanceMode}
                          onChange={(e) => handleSettingsChange('maintenanceMode', e.target.checked)}
                          style={{ width: '16px', height: '16px' }}
                        />
                      </label>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>If enabled, normal users will see a maintenance message.</span>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Global Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="admin-form-input"
                        value={settings.globalDiscount}
                        onChange={(e) => handleSettingsChange('globalDiscount', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn-primary" disabled={submitLoading} style={{ minWidth: '130px', padding: '12px 24px', borderRadius: '8px' }}>
                      {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Save Site Settings'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 4. MOBILE NATIVE BOTTOM NAVIGATION BAR */}
      <nav className="admin-bottom-nav">
        <button onClick={() => setActiveTab('dashboard')} className={`bottom-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        <button onClick={() => setActiveTab('orders')} className={`bottom-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <ShoppingBag size={20} />
            {stats.pendingOrders > 0 && <span className="bottom-nav-badge"></span>}
          </div>
          <span>Verify</span>
        </button>
        <button onClick={() => setActiveTab('cards')} className={`bottom-nav-btn ${activeTab === 'cards' ? 'active' : ''}`}>
          <CardIcon size={20} />
          <span>Catalog</span>
        </button>
        <button onClick={() => setActiveTab('users')} className={`bottom-nav-btn ${activeTab === 'users' ? 'active' : ''}`}>
          <Users size={20} />
          <span>Users</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`bottom-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}>
          <Sliders size={20} />
          <span>Settings</span>
        </button>
      </nav>

      {/* --- ADD / EDIT CARD MODAL --- */}
      {cardModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setCardModalOpen(false)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-content">
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">
                  {cardModalType === 'add' ? 'Add New Card Product' : 'Modify Card Details'}
                </h3>
                <span className="admin-modal-close" onClick={() => setCardModalOpen(false)}>
                  <XCircle size={20} />
                </span>
              </div>

              <form className="admin-form" onSubmit={handleCardSubmit}>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Card Type</label>
                    <select
                      className="admin-form-select"
                      value={cardForm.type}
                      onChange={(e) => setCardForm({ ...cardForm, type: e.target.value })}
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="rupay">Rupay</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Card Display Name</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Visa Premium Elite"
                      value={cardForm.name}
                      onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Card Face Number</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 4532 7812 9045 8823"
                      value={cardForm.cardNumber}
                      onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">CVV (Default placeholder)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 942"
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Spending Limit</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. $1,500 / month"
                      value={cardForm.limit}
                      onChange={(e) => setCardForm({ ...cardForm, limit: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 12/28"
                      value={cardForm.expiry}
                      onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Refund Policy</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={cardForm.refund}
                      onChange={(e) => setCardForm({ ...cardForm, refund: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Delivery Speed</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={cardForm.delivery}
                      onChange={(e) => setCardForm({ ...cardForm, delivery: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Entry Fee (USD Price)</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      placeholder="e.g. 15"
                      value={cardForm.entryFee}
                      onChange={(e) => setCardForm({ ...cardForm, entryFee: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">In-Stock Quantity</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      value={cardForm.qty}
                      onChange={(e) => setCardForm({ ...cardForm, qty: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Card Gradient Start Color</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. #1e3c72"
                      value={cardForm.gradientStart}
                      onChange={(e) => setCardForm({ ...cardForm, gradientStart: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Card Gradient End Color</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. #2a5298"
                      value={cardForm.gradientEnd}
                      onChange={(e) => setCardForm({ ...cardForm, gradientEnd: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-footer">
                  <button type="button" className="btn-secondary" onClick={() => setCardModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitLoading} style={{ minWidth: '100px' }}>
                    {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Save Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT VERIFY & RELEASE MODAL --- */}
      {verifyModalOpen && selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setVerifyModalOpen(false)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="admin-modal-content">
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Verify Payment & Release</h3>
                <span className="admin-modal-close" onClick={() => setVerifyModalOpen(false)}>
                  <XCircle size={20} />
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Order ID: <strong style={{ fontFamily: 'monospace' }}>{selectedOrder._id}</strong></div>
                <div>Buyer: <strong>{selectedOrder.userId?.username} ({selectedOrder.userId?.email})</strong></div>
                <div>Product: <strong>{selectedOrder.cardId?.name} ({selectedOrder.cardId?.type})</strong></div>
                <div>Due Payment: <strong style={{ color: 'var(--primary)' }}>${selectedOrder.pricePaid} USD</strong></div>
              </div>

              <div className="admin-form" style={{ gap: '14px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Card Credentials Release Form</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
                  Please enter or verify the actual credentials to be released to this user. We have pre-filled them with auto-generated safe values.
                </p>

                <div className="admin-form-group">
                  <label className="admin-form-label">Released Card Number</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={verifyForm.number}
                    onChange={(e) => setVerifyForm({ ...verifyForm, number: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 12/28"
                      value={verifyForm.expiry}
                      onChange={(e) => setVerifyForm({ ...verifyForm, expiry: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">CVV</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 981"
                      value={verifyForm.cvv}
                      onChange={(e) => setVerifyForm({ ...verifyForm, cvv: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-footer" style={{ marginTop: '16px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setVerifyModalOpen(false)}>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ background: 'var(--success)' }} 
                    onClick={handleApproveOrder}
                    disabled={submitLoading || !verifyForm.number || !verifyForm.expiry || !verifyForm.cvv}
                  >
                    {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Release'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 3000,
          background: toast.type === 'error' ? 'var(--accent)' : toast.type === 'warning' ? 'var(--warning)' : 'var(--success)',
          color: 'white',
          padding: '14px 24px',
          borderRadius: '12px',
          fontWeight: '700',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'admin-fade-in 0.3s ease'
        }}>
          <Info size={18} />
          {toast.message}
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
