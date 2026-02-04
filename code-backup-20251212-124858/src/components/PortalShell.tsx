/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Universal Portal Shell - Mobile-First Wrapper for ALL Portals
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides consistent look & feel across:
 * - Customer Portal
 * - Vendor Portal  
 * - Driver Portal
 * 
 * Features:
 * - Mobile-first responsive design
 * - Bottom navigation on mobile
 * - Swipeable drawer
 * - Theme support (10 themes)
 * - Offline indicator
 * - Voice FAB (Hindi)
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Package, MapPin, Truck, IndianRupee, 
  User, Settings, LogOut, Menu, Bell, Search,
  HelpCircle, MessageCircle, Navigation, Camera,
  Fuel, AlertTriangle, FileText, Users, TrendingUp,
  Wallet, Globe
} from 'lucide-react';

// Import from @ankr/shell
import {
  useIsMobile,
  useOnline,
  useHaptic,
  BottomNav,
  SwipeableDrawer,
  OfflineIndicator,
  VoiceFAB,
  type NavItem,
} from '@ankr/shell';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';

// ═══════════════════════════════════════════════════════════════════════════
// PORTAL CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

type PortalType = 'customer' | 'vendor' | 'driver';

interface PortalConfig {
  title: string;
  titleHindi: string;
  icon: string;
  gradient: string;
  navItems: NavItem[];
  drawerItems: { icon: any; label: string; labelHi: string; href: string }[];
}

const PORTAL_CONFIGS: Record<PortalType, PortalConfig> = {
  customer: {
    title: 'WowTruck',
    titleHindi: 'वाउट्रक',
    icon: '📦',
    gradient: 'from-blue-600 to-purple-600',
    navItems: [
      { id: 'home', icon: <Home className="w-5 h-5" />, label: 'Home', path: '/customer-portal' },
      { id: 'orders', icon: <Package className="w-5 h-5" />, label: 'Orders', path: '/customer-portal/orders' },
      { id: 'track', icon: <MapPin className="w-5 h-5" />, label: 'Track', path: '/customer-portal/track' },
      { id: 'pay', icon: <IndianRupee className="w-5 h-5" />, label: 'Pay', path: '/customer-portal/payments' },
      { id: 'help', icon: <MessageCircle className="w-5 h-5" />, label: 'Help', path: '/customer-portal/support' },
    ],
    drawerItems: [
      { icon: Home, label: 'Dashboard', labelHi: 'डैशबोर्ड', href: '/customer-portal' },
      { icon: Package, label: 'My Orders', labelHi: 'मेरे ऑर्डर', href: '/customer-portal/orders' },
      { icon: MapPin, label: 'Track Shipment', labelHi: 'शिपमेंट ट्रैक करें', href: '/customer-portal/track' },
      { icon: FileText, label: 'Documents', labelHi: 'दस्तावेज़', href: '/customer-portal/documents' },
      { icon: IndianRupee, label: 'Payments', labelHi: 'भुगतान', href: '/customer-portal/payments' },
      { icon: HelpCircle, label: 'Support', labelHi: 'सहायता', href: '/customer-portal/support' },
    ],
  },
  vendor: {
    title: 'WowTruck Partner',
    titleHindi: 'वाउट्रक पार्टनर',
    icon: '🤝',
    gradient: 'from-teal-600 to-cyan-600',
    navItems: [
      { id: 'home', icon: <Home className="w-5 h-5" />, label: 'Home', path: '/vendor-portal' },
      { id: 'fleet', icon: <Truck className="w-5 h-5" />, label: 'Fleet', path: '/vendor-portal/fleet' },
      { id: 'loads', icon: <Package className="w-5 h-5" />, label: 'Loads', path: '/vendor-portal/loads' },
      { id: 'earnings', icon: <Wallet className="w-5 h-5" />, label: 'Earn', path: '/vendor-portal/earnings' },
      { id: 'more', icon: <Menu className="w-5 h-5" />, label: 'More', path: '/vendor-portal/settings' },
    ],
    drawerItems: [
      { icon: Home, label: 'Dashboard', labelHi: 'डैशबोर्ड', href: '/vendor-portal' },
      { icon: Truck, label: 'My Fleet', labelHi: 'मेरा फ्लीट', href: '/vendor-portal/fleet' },
      { icon: Users, label: 'My Drivers', labelHi: 'मेरे ड्राइवर', href: '/vendor-portal/drivers' },
      { icon: Package, label: 'Available Loads', labelHi: 'उपलब्ध लोड', href: '/vendor-portal/loads' },
      { icon: MapPin, label: 'Active Trips', labelHi: 'चालू ट्रिप', href: '/vendor-portal/trips' },
      { icon: TrendingUp, label: 'Earnings', labelHi: 'कमाई', href: '/vendor-portal/earnings' },
      { icon: IndianRupee, label: 'Settlements', labelHi: 'भुगतान', href: '/vendor-portal/settlements' },
      { icon: FileText, label: 'Documents', labelHi: 'दस्तावेज़', href: '/vendor-portal/documents' },
    ],
  },
  driver: {
    title: 'Driver Saathi',
    titleHindi: 'ड्राइवर साथी',
    icon: '🚛',
    gradient: 'from-slate-700 to-slate-600',
    navItems: [
      { id: 'home', icon: <Home className="w-5 h-5" />, label: 'Home', path: '/driver-app' },
      { id: 'trip', icon: <Navigation className="w-5 h-5" />, label: 'Trip', path: '/driver-app/trip' },
      { id: 'epod', icon: <Camera className="w-5 h-5" />, label: 'ePOD', path: '/driver-app/epod' },
      { id: 'fuel', icon: <Fuel className="w-5 h-5" />, label: 'Fuel', path: '/driver-app/fuel' },
      { id: 'sos', icon: <AlertTriangle className="w-5 h-5" />, label: 'SOS', path: '/driver-app/sos', badge: '!' },
    ],
    drawerItems: [
      { icon: Home, label: 'Dashboard', labelHi: 'डैशबोर्ड', href: '/driver-app' },
      { icon: Navigation, label: 'My Trip', labelHi: 'मेरी ट्रिप', href: '/driver-app/trip' },
      { icon: Camera, label: 'ePOD', labelHi: 'ePOD', href: '/driver-app/epod' },
      { icon: Fuel, label: 'Fuel Log', labelHi: 'डीज़ल', href: '/driver-app/fuel' },
      { icon: FileText, label: 'Expenses', labelHi: 'खर्चा', href: '/driver-app/expenses' },
      { icon: IndianRupee, label: 'Earnings', labelHi: 'कमाई', href: '/driver-app/earnings' },
      { icon: FileText, label: 'Documents', labelHi: 'दस्तावेज़', href: '/driver-app/documents' },
      { icon: HelpCircle, label: 'Help', labelHi: 'सहायता', href: '/driver-app/help' },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PORTAL SHELL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface PortalShellProps {
  portal: PortalType;
  children: React.ReactNode;
  showVoiceFAB?: boolean;
  userName?: string;
  userNameHindi?: string;
}

export const PortalShell: React.FC<PortalShellProps> = ({
  portal,
  children,
  showVoiceFAB = true,
  userName,
  userNameHindi,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isDesktop } = useIsMobile();
  const { isOnline, isOffline } = useOnline();
  const haptic = useHaptic();
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationCount] = useState(3);

  const config = PORTAL_CONFIGS[portal];
  
  // Get active nav item
  const activeNavId = useMemo(() => {
    const path = location.pathname;
    const item = config.navItems.find(n => n.path === path);
    return item?.id || 'home';
  }, [location.pathname, config.navItems]);

  // Handle nav click
  const handleNavClick = (item: NavItem) => {
    haptic.selection();
    if (item.path) navigate(item.path);
  };

  // Handle drawer item click
  const handleDrawerClick = (href: string) => {
    haptic.light();
    navigate(href);
    setDrawerOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    haptic.medium();
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Offline Indicator */}
      {isOffline && <OfflineIndicator />}

      {/* Mobile Header */}
      {isMobile && (
        <header className={`sticky top-0 z-40 bg-gradient-to-r ${config.gradient} px-4 py-3`}>
          <div className="flex items-center justify-between">
            {/* Menu Button */}
            <button 
              onClick={() => { haptic.light(); setDrawerOpen(true); }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Title */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <h1 className="text-lg font-bold">{config.title}</h1>
                {userName && (
                  <p className="text-xs opacity-80">🙏 नमस्ते {userNameHindi || userName}</p>
                )}
              </div>
            </div>
            
            {/* Notifications & Profile */}
            <div className="flex items-center gap-2">
              <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/10">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Desktop Header */}
      {isDesktop && (
        <header className={`sticky top-0 z-40 bg-gradient-to-r ${config.gradient} px-6 py-4`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">{config.icon}</span>
              <div>
                <h1 className="text-xl font-bold">{config.title}</h1>
                <p className="text-sm opacity-80">{config.titleHindi}</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="flex items-center gap-1">
              {config.navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    activeNavId === item.id 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            
            {/* Right Side */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeSwitcher compact />
              
              <button className="relative p-2 rounded-full bg-white/10 hover:bg-white/20">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
              
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">{userName || user?.name}</p>
                  <p className="text-xs opacity-70">{user?.role}</p>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full bg-white/10 hover:bg-red-500/50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`${isMobile ? 'pb-20' : ''}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNav
          items={config.navItems}
          activeId={activeNavId}
          onItemClick={handleNavClick}
          enableHaptics
          showLabels
        />
      )}

      {/* Swipeable Drawer */}
      <SwipeableDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        position="left"
      >
        <div className="h-full flex flex-col bg-slate-800">
          {/* Drawer Header */}
          <div className={`p-4 bg-gradient-to-r ${config.gradient}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                {config.icon}
              </div>
              <div>
                <h2 className="font-bold">{userName || user?.name || 'User'}</h2>
                <p className="text-sm opacity-80">{user?.email}</p>
              </div>
            </div>
          </div>
          
          {/* Drawer Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {config.drawerItems.map((item, i) => (
              <button
                key={i}
                onClick={() => handleDrawerClick(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.href
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <div className="text-left">
                  <span className="block">{item.label}</span>
                  <span className="text-xs opacity-60">{item.labelHi}</span>
                </div>
              </button>
            ))}
          </nav>
          
          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-700 space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-slate-400">Theme</span>
              <ThemeSwitcher compact />
            </div>
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-slate-400">Language</span>
              <LanguageSwitcher />
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </SwipeableDrawer>

      {/* Voice FAB */}
      {showVoiceFAB && (
        <VoiceFAB
          onResult={(transcript) => console.log('Voice:', transcript)}
          bottomOffset={isMobile ? 80 : 20}
          language="hi-IN"
        />
      )}
    </div>
  );
};

export default PortalShell;
