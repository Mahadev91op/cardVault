'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Globe,
  Copy,
  Check,
  Eye,
  FileImage,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Layers,
  Activity
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
  const [stats, setStats] = useState({
    totalSales: 0,
    totalUsers: 0,
    customerUsers: 0,
    adminUsers: 0,
    totalCards: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    failedOrders: 0,
    averageOrderValue: 0,
    approvalRate: 100
  });
  const [orders, setOrders] = useState([]);
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({
    announcementText: 'Welcome to CardVault! Buy premium virtual cards instantly.',
    announcementActive: true,
    maintenanceMode: false,
    globalDiscount: 0,
    upiId: 'mahadevtanti191@okaxis',
    usdToInrRate: 83
  });

  const [loadingData, setLoadingData] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals state
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardModalType, setCardModalType] = useState('add'); // 'add' | 'edit'
  const [selectedCard, setSelectedCard] = useState(null);

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [bankVerified, setBankVerified] = useState(false);

  // UTR Copy State
  const [copiedUtr, setCopiedUtr] = useState('');

  // Payment Screenshot Proof Lightbox Modal
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofOrder, setProofOrder] = useState(null);

  // Order Rejection Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectOrder, setRejectOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('Payment not credited to bank account');
  const [customRejectReason, setCustomRejectReason] = useState('');

  // Card Form State
  const [cardForm, setCardForm] = useState({
    type: 'visa',
    name: '',
    cardNumber: '',
    cvv: '',
    cardHolder: 'CARDHOLDER',
    dob: '15/07/1994',
    atmPin: '1234',
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
    cvv: '',
    cardHolder: '',
    dob: '',
    atmPin: ''
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const prevAdminOrdersCountRef = useRef(null);

  const loadDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingData(true);
      
      const [ordersRes, cardsRes, usersRes, settingsRes] = await Promise.all([
        fetch('/api/admin/orders', { cache: 'no-store' }),
        fetch('/api/cards', { cache: 'no-store' }), 
        fetch('/api/admin/users', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' })
      ]);

      let fetchedOrders = [];
      let fetchedCards = [];
      let fetchedUsers = [];

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (ordersData.success && Array.isArray(ordersData.orders)) {
          fetchedOrders = ordersData.orders;
          setOrders(fetchedOrders);
        }
      }

      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        if (cardsData.success && Array.isArray(cardsData.cards)) {
          fetchedCards = cardsData.cards;
          setCards(fetchedCards);
        }
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success && Array.isArray(usersData.users)) {
          fetchedUsers = usersData.users;
          setUsers(fetchedUsers);
        }
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          setSettings(settingsData.settings);
        }
      }

      // Calculate 100% real live operational and financial metrics
      const completedOrdersList = fetchedOrders.filter(o => o.status === 'completed');
      const pendingOrdersCount = fetchedOrders.filter(o => o.status === 'pending').length;
      const failedOrdersCount = fetchedOrders.filter(o => o.status === 'failed').length;
      const totalOrdersCount = fetchedOrders.length;
      const totalSales = completedOrdersList.reduce((acc, curr) => acc + (curr.pricePaid || 0), 0);
      const averageOrderValue = completedOrdersList.length > 0 ? Math.round(totalSales / completedOrdersList.length) : 0;
      const approvalRate = totalOrdersCount > 0 ? Math.round((completedOrdersList.length / totalOrdersCount) * 100) : 100;

      const totalStockUnits = fetchedCards.reduce((acc, c) => acc + (Number(c.qty) || 0), 0);
      const lowStockCount = fetchedCards.filter(c => Number(c.qty) < 10).length;
      const adminUsersCount = fetchedUsers.filter(u => u.isAdmin).length;
      const customerUsersCount = fetchedUsers.filter(u => !u.isAdmin).length;

      setStats({
        totalSales,
        totalUsers: fetchedUsers.length,
        customerUsers: customerUsersCount,
        adminUsers: adminUsersCount,
        totalCards: fetchedCards.length,
        totalStockUnits,
        lowStockCount,
        totalOrders: totalOrdersCount,
        completedOrders: completedOrdersList.length,
        pendingOrders: pendingOrdersCount,
        failedOrders: failedOrdersCount,
        averageOrderValue,
        approvalRate
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (!isSilent) showToast('Failed to load dashboard metrics', 'error');
    } finally {
      if (!isSilent) setLoadingData(false);
    }
  }, [showToast]);

  // Initial dashboard load
  useEffect(() => {
    if (user && user.isAdmin) {
      loadDashboardData(false);
    }
  }, [user, loadDashboardData]);

  // Auto-sync polling every 12 seconds in Admin Panel
  useEffect(() => {
    if (!user || !user.isAdmin) return;

    const intervalId = setInterval(async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        try {
          const res = await fetch('/api/admin/orders', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.orders)) {
              const freshOrders = data.orders;
              const pendingCount = freshOrders.filter((o) => o.status === 'pending').length;
              if (prevAdminOrdersCountRef.current !== null && pendingCount > prevAdminOrdersCountRef.current) {
                const diff = pendingCount - prevAdminOrdersCountRef.current;
                showToast(`🔔 ${diff} new payment verification request${diff > 1 ? 's' : ''} received!`, 'warning');
              }
              prevAdminOrdersCountRef.current = pendingCount;
              setOrders(freshOrders);
              
              const freshCompleted = freshOrders.filter((o) => o.status === 'completed');
              const freshTotalSales = freshCompleted.reduce((acc, curr) => acc + (curr.pricePaid || 0), 0);
              const freshAov = freshCompleted.length > 0 ? Math.round(freshTotalSales / freshCompleted.length) : 0;
              const freshApprovalRate = freshOrders.length > 0 ? Math.round((freshCompleted.length / freshOrders.length) * 100) : 100;

              setStats((prev) => ({
                ...prev,
                pendingOrders: pendingCount,
                completedOrders: freshCompleted.length,
                failedOrders: freshOrders.filter((o) => o.status === 'failed').length,
                totalOrders: freshOrders.length,
                totalSales: freshTotalSales,
                averageOrderValue: freshAov,
                approvalRate: freshApprovalRate
              }));
            }
          }
        } catch (e) {
          console.error('Auto-sync poll error:', e);
        }
      }
    }, 12000);

    return () => clearInterval(intervalId);
  }, [user, showToast]);



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
  const handleCopyUtr = (utr, e) => {
    if (e) e.stopPropagation();
    if (!utr) return;
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    showToast('UTR copied to clipboard!');
    setTimeout(() => setCopiedUtr(''), 2000);
  };

  const handleOpenProof = (order, e) => {
    if (e) e.stopPropagation();
    setProofOrder(order);
    setProofModalOpen(true);
  };

  const handleOpenVerifyModal = (order) => {
    setSelectedOrder(order);
    setBankVerified(false);
    const card = order.cardId || {};
    setVerifyForm({
      number: order.releasedCardDetails?.number || card.cardNumber || '',
      expiry: order.releasedCardDetails?.expiry || card.expiry || '',
      cvv: order.releasedCardDetails?.cvv || card.cvv || '',
      cardHolder: order.releasedCardDetails?.cardHolder || card.cardHolder || order.userId?.username?.toUpperCase() || 'CARDHOLDER',
      dob: order.releasedCardDetails?.dob || card.dob || '15/07/1994',
      atmPin: order.releasedCardDetails?.atmPin || card.atmPin || '1234'
    });
    setVerifyModalOpen(true);
  };

  const handleApproveOrder = async () => {
    if (!selectedOrder) return;
    if (!bankVerified) {
      showToast('Please confirm bank account receipt checkbox before releasing!', 'error');
      return;
    }
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

  const handleOpenRejectModal = (order, e) => {
    if (e) e.stopPropagation();
    setRejectOrder(order);
    setRejectReason('Payment not credited to bank account');
    setCustomRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectOrder) return;
    const finalReason = rejectReason === 'Other' ? (customRejectReason.trim() || 'Payment verification failed') : rejectReason;
    setSubmitLoading(true);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: rejectOrder._id,
          status: 'failed',
          rejectionReason: finalReason
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Order rejected with reason recorded.', 'warning');
        setRejectModalOpen(false);
        setRejectOrder(null);
        if (proofModalOpen) setProofModalOpen(false);
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

  const handleRejectOrder = (orderId) => {
    const targetOrder = orders.find(o => o._id === orderId);
    if (targetOrder) {
      handleOpenRejectModal(targetOrder);
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
        cardHolder: card.cardHolder || 'CARDHOLDER',
        dob: card.dob || '15/07/1994',
        atmPin: card.atmPin || '1234',
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
        dob: '15/07/1994',
        atmPin: '1234',
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

  const handleQuickStock = async (card, delta) => {
    const newQty = Math.max(0, (Number(card.qty) || 0) + delta);
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card._id,
          qty: newQty
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Stock updated for ${card.name}: ${newQty} units`);
        loadDashboardData(true);
      } else {
        showToast(data.error || 'Failed to update stock', 'error');
      }
    } catch (err) {
      showToast('Network error updating stock', 'error');
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
                {/* Executive KPIs & Real-Time Operational Health */}
                <div className="stats-grid executive-stats-grid">
                  {/* KPI 1: Real GMV Revenue */}
                  <div className="stat-card kpi-card">
                    <div className="stat-card-top">
                      <div className="stat-info">
                        <span className="stat-card-label">Total Live Revenue</span>
                        <span className="stat-card-value">₹{(stats.totalSales || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>₹</span>
                      </div>
                    </div>
                    <div className="kpi-card-footer">
                      <span className="kpi-tag success">Settled GMV</span>
                      <span className="kpi-meta">{stats.completedOrders || 0} orders approved & fulfilled</span>
                    </div>
                  </div>

                  {/* KPI 2: Pending Verifications */}
                  <div className="stat-card kpi-card highlight-pending">
                    <div className="stat-card-top">
                      <div className="stat-info">
                        <span className="stat-card-label">Pending Verifications</span>
                        <span className="stat-card-value" style={{ color: (stats.pendingOrders || 0) > 0 ? '#f59e0b' : 'inherit' }}>
                          {stats.pendingOrders || 0}
                        </span>
                      </div>
                      <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                        <AlertCircle size={24} />
                      </div>
                    </div>
                    <div className="kpi-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="kpi-meta">Awaiting payment verification</span>
                      {(stats.pendingOrders || 0) > 0 && (
                        <button 
                          type="button"
                          className="btn-kpi-action"
                          onClick={() => {
                            setActiveTab('orders');
                            setOrderFilter('pending');
                          }}
                        >
                          Review <ArrowUpRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* KPI 3: Average Order Value (AOV) */}
                  <div className="stat-card kpi-card">
                    <div className="stat-card-top">
                      <div className="stat-info">
                        <span className="stat-card-label">Average Order Value</span>
                        <span className="stat-card-value">₹{(stats.averageOrderValue || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                        <TrendingUp size={24} />
                      </div>
                    </div>
                    <div className="kpi-card-footer">
                      <span className="kpi-tag info">Ticket Size</span>
                      <span className="kpi-meta">Based on {stats.completedOrders || 0} transactions</span>
                    </div>
                  </div>

                  {/* KPI 4: Approval / Conversion Rate */}
                  <div className="stat-card kpi-card">
                    <div className="stat-card-top">
                      <div className="stat-info">
                        <span className="stat-card-label">Approval Success Rate</span>
                        <span className="stat-card-value">{stats.approvalRate ?? 100}%</span>
                      </div>
                      <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                        <Activity size={24} />
                      </div>
                    </div>
                    <div className="kpi-card-footer">
                      <span className="kpi-meta">
                        <strong style={{ color: '#10b981' }}>{stats.completedOrders || 0}</strong> approved • <strong style={{ color: '#ef4444' }}>{stats.failedOrders || 0}</strong> rejected
                      </span>
                    </div>
                  </div>

                  {/* KPI 5: Catalog Stock Units */}
                  <div className="stat-card kpi-card">
                    <div className="stat-card-top">
                      <div className="stat-info">
                        <span className="stat-card-label">Live Inventory Units</span>
                        <span className="stat-card-value">{(stats.totalStockUnits || 0).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>units</span></span>
                      </div>
                      <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
                        <Layers size={24} />
                      </div>
                    </div>
                    <div className="kpi-card-footer">
                      <span className="kpi-tag primary">{stats.totalCards || 0} cards active</span>
                      {(stats.lowStockCount || 0) > 0 && (
                        <span className="kpi-meta" style={{ color: '#f59e0b', fontWeight: 600 }}>
                          {stats.lowStockCount} low stock (&lt;10)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KPI 6: User Accounts Directory */}
                  <div className="stat-card kpi-card">
                    <div className="stat-card-top">
                      <div className="stat-info">
                        <span className="stat-card-label">Registered Accounts</span>
                        <span className="stat-card-value">{stats.totalUsers || 0}</span>
                      </div>
                      <div className="stat-icon-wrapper" style={{ background: 'rgba(100, 116, 139, 0.12)', color: 'var(--text-secondary)' }}>
                        <Users size={24} />
                      </div>
                    </div>
                    <div className="kpi-card-footer">
                      <span className="kpi-meta">
                        <strong>{stats.customerUsers || 0}</strong> customers • <strong>{stats.adminUsers || 0}</strong> admins
                      </span>
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
                            <text x={paddingX - 10} y={paddingY + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)" fontWeight="bold">₹{Math.round(maxSales)}</text>
                            <text x={paddingX - 10} y={(chartHeight) / 2 + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)" fontWeight="bold">₹{Math.round(maxSales / 2)}</text>
                            <text x={paddingX - 10} y={chartHeight - paddingY + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)" fontWeight="bold">₹0</text>

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
                                Sales: ₹{hoveredSalesPoint.sales.toLocaleString('en-IN')} | Orders: {hoveredSalesPoint.count}
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
                              <th>Payment & Proof</th>
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
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      {order.paymentApp && (
                                        <span className="app-badge">{order.paymentApp}</span>
                                      )}
                                      {order.senderUpiId && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                          UPI: <strong style={{ color: 'var(--text-primary)' }}>{order.senderUpiId}</strong>
                                        </span>
                                      )}
                                    </div>
                                    {order.utrNumber && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <code className="utr-code-chip">{order.utrNumber}</code>
                                        <button
                                          type="button"
                                          onClick={(e) => handleCopyUtr(order.utrNumber, e)}
                                          className="btn-icon-mini"
                                          title="Copy UTR to Clipboard"
                                        >
                                          {copiedUtr === order.utrNumber ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                                        </button>
                                      </div>
                                    )}
                                    {order.paymentScreenshot ? (
                                      <button
                                        type="button"
                                        onClick={(e) => handleOpenProof(order, e)}
                                        className="btn-view-proof"
                                      >
                                        <Eye size={12} /> View Screenshot Proof
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                        No screenshot uploaded
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 'bold' }}>{order.cardId?.name || 'Deleted Card'}</div>
                                  <div style={{ fontSize: '0.8rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                                    {order.cardId?.type || 'N/A'}
                                  </div>
                                </td>
                                <td style={{ fontWeight: 'bold' }}>₹{order.pricePaid} INR</td>
                                <td>
                                  {order.status === 'pending' && <span className="status-pill status-pending">Pending Verification</span>}
                                  {order.status === 'completed' && <span className="status-pill status-completed">Completed</span>}
                                  {order.status === 'failed' && (
                                    <div>
                                      <span className="status-pill status-failed">Rejected</span>
                                      {order.rejectionReason && (
                                        <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: '4px', maxWidth: '160px', wordBreak: 'break-word', fontWeight: 600 }}>
                                          {order.rejectionReason}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <div className="admin-actions">
                                    {order.status === 'pending' ? (
                                      <>
                                        <button onClick={() => handleOpenVerifyModal(order)} className="btn-admin-action btn-admin-approve">
                                          <CheckCircle size={14} /> Verify & Release
                                        </button>
                                        <button onClick={(e) => handleOpenRejectModal(order, e)} className="btn-admin-action btn-admin-reject">
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
                                          <span style={{ color: 'var(--accent)' }}>Rejected</span>
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
                              {order.paymentApp && (
                                <div className="mobile-card-row">
                                  <span className="label">App Used:</span>
                                  <span className="val"><span className="app-badge">{order.paymentApp}</span></span>
                                </div>
                              )}
                              {order.senderUpiId && (
                                <div className="mobile-card-row">
                                  <span className="label">Sender UPI:</span>
                                  <span className="val font-bold">{order.senderUpiId}</span>
                                </div>
                              )}
                              {order.utrNumber && (
                                <div className="mobile-card-row" style={{ background: 'rgba(79, 70, 229, 0.04)', padding: '6px 8px', borderRadius: '6px', marginTop: '4px', alignItems: 'center' }}>
                                  <span className="label" style={{ color: 'var(--primary)' }}>UTR / Ref No:</span>
                                  <span className="val font-bold" style={{ color: 'var(--primary)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {order.utrNumber}
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyUtr(order.utrNumber, e)}
                                      className="btn-icon-mini"
                                      title="Copy UTR"
                                    >
                                      {copiedUtr === order.utrNumber ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                                    </button>
                                  </span>
                                </div>
                              )}
                              {order.paymentScreenshot && (
                                <div className="mobile-card-row" style={{ marginTop: '4px' }}>
                                  <span className="label">Proof:</span>
                                  <span className="val">
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenProof(order, e)}
                                      className="btn-view-proof"
                                    >
                                      <Eye size={12} /> View Screenshot Proof
                                    </button>
                                  </span>
                                </div>
                              )}
                              <div className="mobile-card-row">
                                <span className="label">Card Product:</span>
                                <span className="val">{order.cardId?.name || 'Deleted Card'} ({order.cardId?.type || 'N/A'})</span>
                              </div>
                              <div className="mobile-card-row">
                                <span className="label">Entry Fee:</span>
                                <span className="val font-bold">₹{order.pricePaid} INR</span>
                              </div>
                              {order.status === 'failed' && order.rejectionReason && (
                                <div className="mobile-card-row" style={{ background: 'rgba(244, 63, 94, 0.06)', padding: '6px 8px', borderRadius: '6px' }}>
                                  <span className="label" style={{ color: 'var(--accent)' }}>Reason:</span>
                                  <span className="val" style={{ color: 'var(--accent)', fontWeight: 600 }}>{order.rejectionReason}</span>
                                </div>
                              )}
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
                                <button onClick={(e) => handleOpenRejectModal(order, e)} className="mobile-btn mobile-btn-reject">
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
                            <div>Holder: <strong>{card.cardHolder || 'CARDHOLDER'}</strong></div>
                            <div>DOB: <strong>{card.dob || '15/07/1994'}</strong> | PIN: <strong style={{ color: 'var(--primary)' }}>{card.atmPin || '1234'}</strong></div>
                            <div>Type: <strong style={{ textTransform: 'capitalize' }}>{card.type}</strong></div>
                            <div>Limit: <strong>{card.limit}</strong></div>
                            <div>Fee: <strong>₹{card.entryFee} INR</strong></div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '6px' }}>
                              <span>Stock: <strong style={{ color: (card.qty || 0) < 10 ? '#ef4444' : 'inherit' }}>{card.qty || 0} units</strong></span>
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  title="Reduce inventory by 1"
                                  onClick={() => handleQuickStock(card, -1)}
                                  className="btn-stock-quick"
                                  disabled={(card.qty || 0) <= 0}
                                >
                                  -1
                                </button>
                                <button
                                  type="button"
                                  title="Restock inventory by +5"
                                  onClick={() => handleQuickStock(card, 5)}
                                  className="btn-stock-quick btn-stock-plus"
                                >
                                  +5
                                </button>
                              </div>
                            </div>
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

                  <div className="settings-section-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginTop: '10px' }}>
                    <Sliders size={16} color="var(--primary)" /> UPI Payment Settings
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Admin UPI ID (for QR / Intent)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={settings.upiId || ''}
                      onChange={(e) => handleSettingsChange('upiId', e.target.value)}
                      placeholder="e.g. mahadevtanti191@okaxis"
                      required
                    />
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
                    <label className="admin-form-label">Cardholder Name</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. AARAV SHARMA"
                      value={cardForm.cardHolder}
                      onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Date of Birth (DOB)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 15/07/1994"
                      value={cardForm.dob}
                      onChange={(e) => setCardForm({ ...cardForm, dob: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">ATM PIN</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 1234"
                      value={cardForm.atmPin}
                      onChange={(e) => setCardForm({ ...cardForm, atmPin: e.target.value })}
                      required
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
                    <label className="admin-form-label">Entry Fee (INR Price / ₹)</label>
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
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="admin-modal-content">
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Verify Payment &amp; Release</h3>
                <span className="admin-modal-close" onClick={() => setVerifyModalOpen(false)}>
                  <XCircle size={20} />
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '18px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Buyer: <strong>{selectedOrder.userId?.username}</strong> ({selectedOrder.userId?.email})</span>
                  {selectedOrder.paymentApp && <span className="app-badge">{selectedOrder.paymentApp}</span>}
                </div>
                <div>Product: <strong>{selectedOrder.cardId?.name} ({selectedOrder.cardId?.type})</strong></div>
                {selectedOrder.senderUpiId && (
                  <div>Sender UPI: <strong style={{ color: 'var(--text-primary)' }}>{selectedOrder.senderUpiId}</strong></div>
                )}
                <div>Due Amount: <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>₹{selectedOrder.pricePaid} INR</strong></div>
                {selectedOrder.utrNumber && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span>UTR Ref:</span>
                    <code className="utr-code-chip">{selectedOrder.utrNumber}</code>
                    <button
                      type="button"
                      onClick={(e) => handleCopyUtr(selectedOrder.utrNumber, e)}
                      className="btn-icon-mini"
                      title="Copy UTR"
                    >
                      {copiedUtr === selectedOrder.utrNumber ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
                {selectedOrder.paymentScreenshot ? (
                  <div style={{ marginTop: '8px', background: '#0f172a', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Payment Receipt Screenshot:</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedOrder.paymentScreenshot}
                      alt="Receipt"
                      style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '6px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                      onClick={(e) => handleOpenProof(selectedOrder, e)}
                      title="Click to view full screen"
                    />
                    <div style={{ marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={(e) => handleOpenProof(selectedOrder, e)}
                        className="btn-view-proof"
                      >
                        <Eye size={12} /> View Full Screen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
                    No screenshot was uploaded for this order.
                  </div>
                )}
              </div>

              {/* Anti-Fraud Bank Check Notice */}
              <div className="verify-bank-notice">
                <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: 1.4 }}>
                  <strong>Mandatory Bank Check:</strong> Check your bank/UPI app statement to confirm that ₹{selectedOrder.pricePaid} is actually credited with UTR {selectedOrder.utrNumber}.
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="bank-confirmation-checkbox">
                <input
                  type="checkbox"
                  id="bankVerifiedCheckbox"
                  checked={bankVerified}
                  onChange={(e) => setBankVerified(e.target.checked)}
                />
                <span>I confirm that ₹{selectedOrder.pricePaid} INR has been credited into my bank/UPI account.</span>
              </label>

              <div className="admin-form" style={{ gap: '14px', marginTop: '16px' }}>
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
                    <label className="admin-form-label">Cardholder Name</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. AARAV SHARMA"
                      value={verifyForm.cardHolder}
                      onChange={(e) => setVerifyForm({ ...verifyForm, cardHolder: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Date of Birth (DOB)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 15/07/1994"
                      value={verifyForm.dob}
                      onChange={(e) => setVerifyForm({ ...verifyForm, dob: e.target.value })}
                      required
                    />
                  </div>
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
                  <div className="admin-form-group">
                    <label className="admin-form-label">ATM PIN</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 1234"
                      value={verifyForm.atmPin}
                      onChange={(e) => setVerifyForm({ ...verifyForm, atmPin: e.target.value })}
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
                    disabled={submitLoading || !bankVerified || !verifyForm.number || !verifyForm.expiry || !verifyForm.cvv}
                  >
                    {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Release'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT PROOF LIGHTBOX MODAL --- */}
      {proofModalOpen && proofOrder && (
        <div className="admin-modal-overlay" onClick={() => setProofModalOpen(false)}>
          <div className="admin-modal-container proof-lightbox-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-content">
              <div className="admin-modal-header">
                <div>
                  <h3 className="admin-modal-title">Payment Screenshot Proof</h3>
                  <span className="admin-subtitle">Order #{proofOrder._id.slice(-6)} • ₹{proofOrder.pricePaid} INR</span>
                </div>
                <span className="admin-modal-close" onClick={() => setProofModalOpen(false)}>
                  <XCircle size={20} />
                </span>
              </div>

              {/* Info Badges Row */}
              <div className="proof-info-grid">
                <div className="proof-info-item">
                  <span className="proof-label">Buyer</span>
                  <span className="proof-value font-bold">{proofOrder.userId?.username} ({proofOrder.userId?.email})</span>
                </div>
                <div className="proof-info-item">
                  <span className="proof-label">Payment App</span>
                  <span className="proof-value">
                    <span className="app-badge">{proofOrder.paymentApp || 'UPI'}</span>
                  </span>
                </div>
                <div className="proof-info-item">
                  <span className="proof-label">Sender UPI / Phone</span>
                  <span className="proof-value font-bold">{proofOrder.senderUpiId || 'Not provided'}</span>
                </div>
                <div className="proof-info-item">
                  <span className="proof-label">Submitted UTR</span>
                  <span className="proof-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <code className="utr-code-chip">{proofOrder.utrNumber}</code>
                    <button
                      type="button"
                      onClick={(e) => handleCopyUtr(proofOrder.utrNumber, e)}
                      className="btn-icon-mini"
                      title="Copy UTR"
                    >
                      {copiedUtr === proofOrder.utrNumber ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    </button>
                  </span>
                </div>
              </div>

              {/* Screenshot Image Viewer */}
              <div className="proof-image-wrapper">
                {proofOrder.paymentScreenshot ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={proofOrder.paymentScreenshot}
                    alt="Payment Receipt Proof"
                    className="proof-lightbox-image"
                  />
                ) : (
                  <div className="no-proof-placeholder">
                    <FileImage size={48} color="var(--text-secondary)" />
                    <p>No payment screenshot was uploaded for this order.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="admin-form-footer" style={{ marginTop: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="btn-secondary" onClick={() => setProofModalOpen(false)}>
                  Close
                </button>
                {proofOrder.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn-admin-action btn-admin-reject"
                      onClick={(e) => {
                        setProofModalOpen(false);
                        handleOpenRejectModal(proofOrder, e);
                      }}
                    >
                      <XCircle size={14} /> Reject Payment
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ background: 'var(--success)' }}
                      onClick={() => {
                        setProofModalOpen(false);
                        handleOpenVerifyModal(proofOrder);
                      }}
                    >
                      <CheckCircle size={14} /> Proceed to Release
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ORDER REJECTION MODAL --- */}
      {rejectModalOpen && rejectOrder && (
        <div className="admin-modal-overlay" onClick={() => setRejectModalOpen(false)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="admin-modal-content">
              <div className="admin-modal-header">
                <div>
                  <h3 className="admin-modal-title" style={{ color: 'var(--accent)' }}>Reject Payment Request</h3>
                  <span className="admin-subtitle">Order #{rejectOrder._id.slice(-6)} • ₹{rejectOrder.pricePaid} INR</span>
                </div>
                <span className="admin-modal-close" onClick={() => setRejectModalOpen(false)}>
                  <XCircle size={20} />
                </span>
              </div>

              <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div>Buyer: <strong>{rejectOrder.userId?.username}</strong></div>
                <div>UTR: <code style={{ fontWeight: 'bold' }}>{rejectOrder.utrNumber}</code></div>
                <div style={{ marginTop: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Please select a reason for rejecting this payment. The reason will be displayed to the buyer in their order history so they can retry with genuine payment details.
                </div>
              </div>

              <div className="admin-form">
                <div className="admin-form-group">
                  <label className="admin-form-label">Rejection Reason</label>
                  <select
                    className="admin-form-select"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  >
                    <option value="Payment not credited to bank account">Payment not credited to bank account</option>
                    <option value="Invalid / Fake UTR number">Invalid / Fake UTR number</option>
                    <option value="Payment screenshot is blurred or unreadable">Payment screenshot is blurred or unreadable</option>
                    <option value="Amount received does not match order entry fee">Amount received does not match order entry fee</option>
                    <option value="Duplicate UTR number submitted">Duplicate UTR number submitted</option>
                    <option value="Other">Other (Type custom reason)</option>
                  </select>
                </div>

                {rejectReason === 'Other' && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Custom Reason for Buyer</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Explain why payment was rejected..."
                      value={customRejectReason}
                      onChange={(e) => setCustomRejectReason(e.target.value)}
                      maxLength={150}
                      required
                    />
                  </div>
                )}

                <div className="admin-form-footer" style={{ marginTop: '16px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setRejectModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ background: 'var(--accent)' }}
                    onClick={handleConfirmReject}
                    disabled={submitLoading || (rejectReason === 'Other' && !customRejectReason.trim())}
                  >
                    {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Rejection'}
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
