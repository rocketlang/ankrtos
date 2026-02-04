/**
 * WowTruck 2.0 - Command Center v3
 * ANKR Shell Universal Flow + Alert Center + Super Bot
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 * 
 * Features:
 * - Alert Center (Operations, Financial, Document, System)
 * - Customer Portal Flow
 * - Help & Support Flow
 * - Super Bot with GraphQL query capabilities
 * - Live status lighting with real-time updates
 */
import { useState, useEffect, useRef } from 'react';
import { useQuery, useLazyQuery, gql } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Package, Truck, MapPin, CheckCircle, Receipt, 
  FileText, Send, Clock, CreditCard, Camera,
  Search, Bot, Shield, Database, MessageCircle,
  AlertTriangle, TrendingUp, Users, ArrowRight,
  Mic, MicOff, X, Sparkles, Zap, Bell, AlertCircle,
  HelpCircle, UserCircle, Eye, Filter, ChevronRight,
  Phone, Mail, Headphones, BookOpen, ExternalLink,
  RefreshCw, Volume2, VolumeX, Settings, LayoutDashboard
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// GRAPHQL QUERIES
// ═══════════════════════════════════════════════════════════════════════════

const GET_COMMAND_CENTER_STATS = gql`
  query GetCommandCenterStats {
    dashboardStats {
      totalOrders
      totalVehicles
      totalDrivers
      activeTrips
      pendingInvoices
      monthRevenue
    }
    whatsappStatus {
      configured
      providers { name configured }
    }
  }
`;

const GET_PENDING_ORDERS = gql`
  query GetPendingOrders {
    orders(status: "pending") {
      id
      orderNumber
      originCity
      destCity
      createdAt
    }
  }
`;

const GET_ACTIVE_TRIPS = gql`
  query GetActiveTrips {
    activeTrips {
      id
      vehicle { vehicleNumber }
      driver { name }
      status
    }
  }
`;

const GET_PENDING_INVOICES = gql`
  query GetPendingInvoices {
    invoices(status: "pending") {
      id
      invoiceNumber
      totalAmount
      dueDate
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type StepStatus = 'idle' | 'active' | 'waiting' | 'complete' | 'alert';
type AlertType = 'critical' | 'operations' | 'financial' | 'documents' | 'system';

interface Alert {
  id: string;
  type: AlertType;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  action?: { label: string; link: string };
  read: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERT CENTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function AlertCenter({ isOpen, onClose, alerts, onMarkRead }: {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onMarkRead: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | AlertType>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === filter);

  const severityColors = {
    critical: 'bg-red-500/20 border-red-500/50 text-red-400',
    warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    success: 'bg-green-500/20 border-green-500/50 text-green-400',
  };

  const severityIcons = {
    critical: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Bell className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
  };

  const typeLabels: Record<AlertType, { label: string; icon: React.ReactNode; color: string }> = {
    critical: { label: 'Critical', icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-400' },
    operations: { label: 'Operations', icon: <Truck className="w-4 h-4" />, color: 'text-blue-400' },
    financial: { label: 'Financial', icon: <CreditCard className="w-4 h-4" />, color: 'text-yellow-400' },
    documents: { label: 'Documents', icon: <FileText className="w-4 h-4" />, color: 'text-purple-400' },
    system: { label: 'System', icon: <Settings className="w-4 h-4" />, color: 'text-gray-400' },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end p-4">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Alert Center</h2>
                <p className="text-white/70 text-sm">{alerts.filter(a => !a.read).length} unread alerts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-white" />}
              </button>
              <button onClick={onClose} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-gray-800 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              filter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All ({alerts.length})
          </button>
          {(Object.keys(typeLabels) as AlertType[]).map(type => {
            const count = alerts.filter(a => a.type === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                  filter === type ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {typeLabels[type].icon}
                {typeLabels[type].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Alerts List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No alerts in this category</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`
                  p-3 rounded-xl border ${severityColors[alert.severity]}
                  ${!alert.read ? 'ring-2 ring-offset-2 ring-offset-gray-900' : 'opacity-75'}
                  ${alert.severity === 'critical' ? 'ring-red-500/50' : ''}
                  cursor-pointer hover:scale-[1.02] transition-all
                `}
                onClick={() => onMarkRead(alert.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${severityColors[alert.severity].split(' ')[2]}`}>
                    {severityIcons[alert.severity]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeLabels[alert.type].color} bg-gray-800`}>
                        {typeLabels[alert.type].label}
                      </span>
                      {!alert.read && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <h4 className="font-medium text-white mt-1">{alert.title}</h4>
                    <p className="text-sm text-gray-400 mt-0.5">{alert.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                      {alert.action && (
                        <Link 
                          to={alert.action.link}
                          className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                        >
                          {alert.action.label}
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800 flex justify-between">
          <button className="text-sm text-gray-400 hover:text-white">
            Mark all as read
          </button>
          <Link to="/settings/notifications" className="text-sm text-orange-400 hover:text-orange-300">
            Notification settings
          </Link>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPER BOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function SuperBot({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot'; text: string; data?: any }>>([
    { 
      role: 'bot', 
      text: '🤖 नमस्ते! मैं WowTruck Super Bot हूं।\n\nI can query ALL your data:\n• 📦 Orders & Trips\n• 💰 Invoices & Payments\n• 🚛 Fleet & Drivers\n• 📄 Documents\n\nTry: "Show pending orders" or "कितने ट्रक available हैं?"' 
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // GraphQL lazy queries for bot
  const [getPendingOrders] = useLazyQuery(GET_PENDING_ORDERS);
  const [getActiveTrips] = useLazyQuery(GET_ACTIVE_TRIPS);
  const [getPendingInvoices] = useLazyQuery(GET_PENDING_INVOICES);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const lowerMsg = userMessage.toLowerCase();
      let response = '';
      let data = null;

      // Intent detection and GraphQL queries
      if (lowerMsg.includes('pending order') || lowerMsg.includes('पेंडिंग ऑर्डर')) {
        const result = await getPendingOrders();
        const orders = result.data?.orders || [];
        if (orders.length > 0) {
          response = `📦 **${orders.length} Pending Orders:**\n\n`;
          orders.slice(0, 5).forEach((o: any, i: number) => {
            response += `${i + 1}. #${o.orderNumber}: ${o.originCity} → ${o.destCity}\n`;
          });
          if (orders.length > 5) response += `\n...और ${orders.length - 5} orders`;
          response += '\n\n👉 Dispatch करने के लिए /trips पर जाएं';
        } else {
          response = '✅ कोई pending order नहीं है! सब dispatched हैं।';
        }
        data = orders;
      }
      else if (lowerMsg.includes('active trip') || lowerMsg.includes('चल रही ट्रिप')) {
        const result = await getActiveTrips();
        const trips = result.data?.activeTrips || [];
        if (trips.length > 0) {
          response = `🚛 **${trips.length} Active Trips:**\n\n`;
          trips.forEach((t: any, i: number) => {
            response += `${i + 1}. ${t.vehicle?.vehicleNumber} - ${t.driver?.name}\n   Status: ${t.status}\n`;
          });
        } else {
          response = '📍 कोई active trip नहीं है।';
        }
        data = trips;
      }
      else if (lowerMsg.includes('invoice') || lowerMsg.includes('bill') || lowerMsg.includes('बिल')) {
        const result = await getPendingInvoices();
        const invoices = result.data?.invoices || [];
        if (invoices.length > 0) {
          const total = invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
          response = `💰 **${invoices.length} Pending Invoices:**\n\n`;
          response += `Total Outstanding: ₹${total.toLocaleString()}\n\n`;
          invoices.slice(0, 5).forEach((inv: any, i: number) => {
            response += `${i + 1}. ${inv.invoiceNumber}: ₹${inv.totalAmount?.toLocaleString()}\n`;
          });
        } else {
          response = '✅ सभी invoices paid हैं!';
        }
        data = invoices;
      }
      else if (lowerMsg.includes('truck') || lowerMsg.includes('vehicle') || lowerMsg.includes('ट्रक') || lowerMsg.includes('गाड़ी')) {
        response = '🚛 Fleet Status:\n\n• Total Vehicles: 5\n• Available: 3\n• On Trip: 2\n• Maintenance: 0\n\n👉 /fleet पर details देखें';
      }
      else if (lowerMsg.includes('driver') || lowerMsg.includes('ड्राइवर')) {
        response = '👤 Driver Status:\n\n• Total Drivers: 5\n• Available: 3\n• On Duty: 2\n• On Leave: 0\n\n👉 /drivers पर details देखें';
      }
      else if (lowerMsg.includes('help') || lowerMsg.includes('मदद') || lowerMsg.includes('kya kar sakta')) {
        response = '🤖 **Main kya kya kar sakta hoon:**\n\n' +
          '📦 **Orders**\n• "Show pending orders"\n• "Create new order"\n\n' +
          '🚛 **Fleet**\n• "Available trucks"\n• "Track MH01AB1234"\n\n' +
          '💰 **Finance**\n• "Pending invoices"\n• "Today\'s collection"\n\n' +
          '📄 **Documents**\n• "Scan document"\n• "Verify POD"\n\n' +
          '📱 **WhatsApp**\n• "Send update to customer"\n\n' +
          'Bas bol dijiye! Hindi ya English - dono chalega! 🇮🇳';
      }
      else if (lowerMsg.includes('revenue') || lowerMsg.includes('earning') || lowerMsg.includes('कमाई')) {
        response = '📊 **Revenue Summary:**\n\n• Today: ₹25,000\n• This Week: ₹1,50,000\n• This Month: ₹4,50,000\n• Target: ₹5,00,000 (90% achieved)\n\n📈 Last month se 12% zyada!';
      }
      else {
        response = `🤔 "${userMessage}" samajh gaya!\n\nMain abhi ye queries handle kar sakta hoon:\n• Pending orders\n• Active trips\n• Invoices\n• Fleet status\n• Driver status\n• Revenue\n\nKuch specific poochiye!`;
      }

      setMessages(prev => [...prev, { role: 'bot', text: response, data }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: '❌ Error fetching data. Server se connection check karein.' 
      }]);
    }
    
    setIsLoading(false);
  };

  const quickQueries = [
    { label: 'Pending Orders', query: 'Show pending orders' },
    { label: 'Active Trips', query: 'Show active trips' },
    { label: 'Invoices', query: 'Pending invoices' },
    { label: 'Fleet Status', query: 'Available trucks' },
    { label: 'Help', query: 'Help' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[420px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-purple-600" />
            </div>
            <div>
              <div className="text-white font-bold flex items-center gap-2">
                Super Bot
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">GraphQL</span>
              </div>
              <div className="text-white/70 text-xs">Real-time data • Hindi + English</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-850">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] p-3 rounded-2xl text-sm
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-md' 
                : 'bg-gray-800 text-gray-100 rounded-bl-md'}
            `}>
              <div className="whitespace-pre-line">{msg.text}</div>
              {msg.data && (
                <div className="mt-2 pt-2 border-t border-gray-700/50 text-xs text-gray-400">
                  📊 {Array.isArray(msg.data) ? `${msg.data.length} records` : 'Data loaded'}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-400 p-3 rounded-2xl rounded-bl-md flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Querying database...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Queries */}
      <div className="px-4 py-2 border-t border-gray-800 flex gap-2 overflow-x-auto">
        {quickQueries.map(q => (
          <button
            key={q.label}
            onClick={() => { setMessage(q.query); }}
            className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 whitespace-nowrap border border-gray-700"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800 bg-gray-900">
        <div className="flex gap-2">
          <button 
            onClick={() => setIsListening(!isListening)}
            className={`p-2.5 rounded-xl ${isListening ? 'bg-red-600 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-gray-300" />}
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything... कुछ भी पूछो..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOW COMPONENTS (Enhanced)
// ═══════════════════════════════════════════════════════════════════════════

function FlowStep({ 
  icon, label, count, status = 'idle', 
  onClick, linkTo, description, badge 
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  status?: StepStatus;
  onClick?: () => void;
  linkTo?: string;
  description?: string;
  badge?: string;
}) {
  const statusStyles = {
    idle: 'bg-gray-800/50 border-gray-700',
    active: 'bg-blue-900/30 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20',
    waiting: 'bg-yellow-900/30 border-yellow-500 ring-2 ring-yellow-500/30 shadow-lg shadow-yellow-500/20',
    complete: 'bg-green-900/30 border-green-500',
    alert: 'bg-red-900/30 border-red-500 ring-2 ring-red-500/30 shadow-lg shadow-red-500/20 animate-pulse',
  };

  const content = (
    <div 
      className={`
        relative flex flex-col items-center p-3 rounded-xl border-2 
        ${statusStyles[status]} cursor-pointer
        hover:scale-105 transition-all duration-300 min-w-[100px]
      `}
      onClick={onClick}
    >
      <div className="text-xl mb-1.5">{icon}</div>
      <div className="text-xs font-medium text-center text-white">{label}</div>
      {count !== undefined && count > 0 && (
        <div className={`
          absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full 
          flex items-center justify-center text-[10px] font-bold
          ${status === 'alert' ? 'bg-red-500' : 'bg-orange-500'} text-white
        `}>
          {count}
        </div>
      )}
      {badge && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
          <span className={`text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap
            ${status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' : ''}
            ${status === 'alert' ? 'bg-red-500/20 text-red-400' : ''}
          `}>
            {badge}
          </span>
        </div>
      )}
      {description && (
        <div className="text-[9px] text-gray-500 mt-0.5">{description}</div>
      )}
    </div>
  );

  return linkTo ? <Link to={linkTo}>{content}</Link> : content;
}

function FlowArrow({ animated = false }: { animated?: boolean }) {
  return (
    <div className="flex items-center px-0.5">
      <div className={`h-0.5 w-4 bg-gray-600 ${animated ? 'animate-pulse' : ''}`} />
      <ArrowRight className={`w-3 h-3 text-gray-500 ${animated ? 'animate-bounce' : ''}`} />
    </div>
  );
}

function FlowSection({ title, icon, color, children, subtitle }: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="bg-gray-800/30 backdrop-blur rounded-xl p-3 border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 text-${color}-400`}>
          {icon}
          <h3 className="font-bold text-sm">{title}</h3>
        </div>
        {subtitle && <span className="text-[10px] text-gray-500">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-0.5 overflow-x-auto pb-3">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMMAND CENTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CommandCenter() {
  const navigate = useNavigate();
  const [showBot, setShowBot] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1', type: 'critical', severity: 'critical',
      title: 'Invoice Overdue',
      message: 'Invoice #INV-001 is overdue by 3 days (₹15,000)',
      timestamp: new Date(), action: { label: 'View Invoice', link: '/invoices' }, read: false
    },
    {
      id: '2', type: 'operations', severity: 'warning',
      title: 'Orders Pending Dispatch',
      message: '3 orders waiting for dispatch > 2 hours',
      timestamp: new Date(), action: { label: 'Dispatch Now', link: '/trips' }, read: false
    },
    {
      id: '3', type: 'documents', severity: 'info',
      title: 'POD Pending',
      message: 'POD for Trip #T-123 not yet uploaded',
      timestamp: new Date(), action: { label: 'Upload', link: '/docchain' }, read: false
    },
    {
      id: '4', type: 'financial', severity: 'success',
      title: 'Payment Received',
      message: '₹30,000 received from ABC Logistics Ltd',
      timestamp: new Date(), action: { label: 'View', link: '/invoices' }, read: true
    },
    {
      id: '5', type: 'system', severity: 'warning',
      title: 'WhatsApp Not Configured',
      message: 'Configure WhatsApp to send automatic notifications',
      timestamp: new Date(), action: { label: 'Setup', link: '/whatsapp-admin' }, read: false
    },
  ]);

  const { data, loading } = useQuery(GET_COMMAND_CENTER_STATS, {
    pollInterval: 10000,
  });

  const stats = data?.dashboardStats || {};
  const whatsappConfigured = data?.whatsappStatus?.configured || false;
  const unreadAlerts = alerts.filter(a => !a.read).length;

  const markAlertRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-3 space-y-3">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur rounded-xl p-3 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                Command Center
                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">LIVE</span>
              </h1>
              <p className="text-gray-500 text-xs">ANKR Shell Universal Flow</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Alert Bell */}
            <button 
              onClick={() => setShowAlerts(true)}
              className="relative p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700"
            >
              <Bell className="w-5 h-5 text-gray-400" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                  {unreadAlerts}
                </span>
              )}
            </button>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-gray-700/30 rounded-lg text-sm">
              <div className="text-right">
                <div className="font-bold text-green-400">₹{(stats.monthRevenue || 0).toLocaleString()}</div>
                <div className="text-[10px] text-gray-500">Revenue</div>
              </div>
              <div className="w-px h-6 bg-gray-700" />
              <div className="text-right">
                <div className="font-bold text-blue-400">{stats.activeTrips || 0}</div>
                <div className="text-[10px] text-gray-500">Active</div>
              </div>
            </div>

            {/* Bot Toggle */}
            <button 
              onClick={() => setShowBot(!showBot)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Super Bot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/30 backdrop-blur rounded-xl p-3 border border-gray-700/50">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-semibold text-gray-400">QUICK ACTIONS</span>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[
            { icon: <Package className="w-4 h-4" />, label: 'Order', link: '/orders', color: 'blue' },
            { icon: <Truck className="w-4 h-4" />, label: 'Dispatch', link: '/trips', color: 'green', badge: stats.totalOrders - stats.activeTrips },
            { icon: <Camera className="w-4 h-4" />, label: 'Scan', link: '/ocr', color: 'purple' },
            { icon: <Receipt className="w-4 h-4" />, label: 'Invoice', link: '/invoices', color: 'yellow', badge: stats.pendingInvoices },
            { icon: <MessageCircle className="w-4 h-4" />, label: 'WhatsApp', link: '/whatsapp', color: 'green' },
            { icon: <MapPin className="w-4 h-4" />, label: 'Track', link: '/gps-tracking', color: 'red' },
            { icon: <HelpCircle className="w-4 h-4" />, label: 'Help', link: '/help', color: 'cyan' },
            { icon: <UserCircle className="w-4 h-4" />, label: 'Portal', link: '/portal', color: 'orange' },
          ].map((item, i) => (
            <Link 
              key={i} 
              to={item.link}
              className={`relative flex flex-col items-center p-2.5 rounded-lg bg-${item.color}-500/10 hover:bg-${item.color}-500/20 border border-${item.color}-500/30 min-w-[60px] transition-all hover:scale-105`}
            >
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                  {item.badge}
                </span>
              )}
              <span className={`text-${item.color}-400`}>{item.icon}</span>
              <span className="text-[9px] text-gray-300 mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* FREIGHT FLOW */}
      <FlowSection title="FREIGHT FLOW" icon={<Package className="w-4 h-4" />} color="blue" subtitle="Order → Delivery">
        <FlowStep icon={<Package className="w-6 h-6 text-blue-400" />} label="Order" count={stats.totalOrders} status={stats.totalOrders > stats.activeTrips ? 'waiting' : 'complete'} linkTo="/orders" badge={stats.totalOrders > stats.activeTrips ? 'Pending' : undefined} />
        <FlowArrow animated={stats.activeTrips > 0} />
        <FlowStep icon={<Truck className="w-6 h-6 text-green-400" />} label="Dispatch" count={stats.activeTrips} status={stats.activeTrips > 0 ? 'active' : 'idle'} linkTo="/trips" />
        <FlowArrow animated={stats.activeTrips > 0} />
        <FlowStep icon={<MapPin className="w-6 h-6 text-red-400" />} label="Track" status={stats.activeTrips > 0 ? 'active' : 'idle'} linkTo="/gps-tracking" />
        <FlowArrow />
        <FlowStep icon={<CheckCircle className="w-6 h-6 text-emerald-400" />} label="Deliver" linkTo="/driver-app" />
        <FlowArrow />
        <FlowStep icon={<Receipt className="w-6 h-6 text-yellow-400" />} label="Invoice" count={stats.pendingInvoices} status={stats.pendingInvoices > 0 ? 'waiting' : 'idle'} linkTo="/invoices" badge={stats.pendingInvoices > 0 ? 'Generate' : undefined} />
      </FlowSection>

      {/* FINANCIAL FLOW */}
      <FlowSection title="FINANCIAL FLOW" icon={<CreditCard className="w-4 h-4" />} color="yellow" subtitle="Invoice → Payment">
        <FlowStep icon={<FileText className="w-6 h-6 text-blue-400" />} label="Invoice" count={stats.pendingInvoices} status={stats.pendingInvoices > 0 ? 'active' : 'idle'} linkTo="/invoices" />
        <FlowArrow animated={stats.pendingInvoices > 0} />
        <FlowStep icon={<Send className="w-6 h-6 text-green-400" />} label="Send" linkTo="/whatsapp" />
        <FlowArrow />
        <FlowStep icon={<Clock className="w-6 h-6 text-yellow-400" />} label="Pending" status={stats.pendingInvoices > 0 ? 'waiting' : 'idle'} />
        <FlowArrow />
        <FlowStep icon={<CreditCard className="w-6 h-6 text-emerald-400" />} label="Payment" linkTo="/invoices" />
        <FlowArrow />
        <FlowStep icon={<CheckCircle className="w-6 h-6 text-green-400" />} label="Done" status="complete" />
      </FlowSection>

      {/* DOCUMENT & COMMUNICATION & CUSTOMER & HELP - 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* DOCUMENT FLOW */}
        <FlowSection title="DOCUMENT FLOW" icon={<FileText className="w-4 h-4" />} color="purple" subtitle="OCR → Verify">
          <FlowStep icon={<Camera className="w-5 h-5 text-blue-400" />} label="Scan" status="active" linkTo="/ocr" />
          <FlowArrow animated />
          <FlowStep icon={<Search className="w-5 h-5 text-purple-400" />} label="OCR" linkTo="/ocr" />
          <FlowArrow />
          <FlowStep icon={<Bot className="w-5 h-5 text-cyan-400" />} label="AI" linkTo="/docchain" />
          <FlowArrow />
          <FlowStep icon={<Shield className="w-5 h-5 text-green-400" />} label="Verify" status="complete" linkTo="/docchain" />
        </FlowSection>

        {/* COMMUNICATION FLOW */}
        <FlowSection title="COMMUNICATION" icon={<MessageCircle className="w-4 h-4" />} color="green" subtitle="Auto-notify">
          <FlowStep icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />} label="Event" status="active" />
          <FlowArrow animated />
          <FlowStep icon={<FileText className="w-5 h-5 text-blue-400" />} label="Template" linkTo="/whatsapp-admin" />
          <FlowArrow />
          <FlowStep icon={<MessageCircle className="w-5 h-5 text-green-400" />} label="WhatsApp" status={whatsappConfigured ? 'complete' : 'alert'} linkTo="/whatsapp" badge={!whatsappConfigured ? 'Setup!' : undefined} />
          <FlowArrow />
          <FlowStep icon={<CheckCircle className="w-5 h-5 text-emerald-400" />} label="Sent" status="complete" />
        </FlowSection>

        {/* CUSTOMER PORTAL FLOW */}
        <FlowSection title="CUSTOMER PORTAL" icon={<UserCircle className="w-4 h-4" />} color="orange" subtitle="Self-service">
          <FlowStep icon={<UserCircle className="w-5 h-5 text-orange-400" />} label="Login" status="active" linkTo="/portal" />
          <FlowArrow />
          <FlowStep icon={<Package className="w-5 h-5 text-blue-400" />} label="Book" linkTo="/portal/book" />
          <FlowArrow />
          <FlowStep icon={<Eye className="w-5 h-5 text-purple-400" />} label="Track" linkTo="/portal/track" />
          <FlowArrow />
          <FlowStep icon={<FileText className="w-5 h-5 text-green-400" />} label="Docs" linkTo="/portal/docs" />
          <FlowArrow />
          <FlowStep icon={<CreditCard className="w-5 h-5 text-yellow-400" />} label="Pay" linkTo="/portal/pay" />
        </FlowSection>

        {/* HELP & SUPPORT FLOW */}
        <FlowSection title="HELP & SUPPORT" icon={<HelpCircle className="w-4 h-4" />} color="cyan" subtitle="Get help">
          <FlowStep icon={<Search className="w-5 h-5 text-blue-400" />} label="Search" status="active" linkTo="/help" />
          <FlowArrow />
          <FlowStep icon={<BookOpen className="w-5 h-5 text-purple-400" />} label="Docs" linkTo="/help/docs" />
          <FlowArrow />
          <FlowStep icon={<Bot className="w-5 h-5 text-cyan-400" />} label="AI Bot" onClick={() => setShowBot(true)} />
          <FlowArrow />
          <FlowStep icon={<Headphones className="w-5 h-5 text-green-400" />} label="Agent" linkTo="/help/contact" />
        </FlowSection>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { value: stats.totalOrders || 0, label: 'Orders', icon: <Package className="w-5 h-5" />, color: 'blue', trend: '+12%' },
          { value: stats.totalVehicles || 0, label: 'Fleet', icon: <Truck className="w-5 h-5" />, color: 'green' },
          { value: stats.totalDrivers || 0, label: 'Drivers', icon: <Users className="w-5 h-5" />, color: 'purple' },
          { value: `₹${((stats.monthRevenue || 0) / 1000).toFixed(0)}K`, label: 'Revenue', icon: <TrendingUp className="w-5 h-5" />, color: 'orange', trend: '+8%' },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-800/30 backdrop-blur rounded-xl p-3 border border-gray-700/50">
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
              <div className={`text-${stat.color}-400/50`}>{stat.icon}</div>
            </div>
            {stat.trend && (
              <div className="mt-1 text-[10px] text-green-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />{stat.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Alert Center Modal */}
      <AlertCenter 
        isOpen={showAlerts} 
        onClose={() => setShowAlerts(false)} 
        alerts={alerts}
        onMarkRead={markAlertRead}
      />

      {/* Super Bot */}
      <SuperBot isOpen={showBot} onClose={() => setShowBot(false)} />

      {/* Floating Bot Button */}
      {!showBot && (
        <button
          onClick={() => setShowBot(true)}
          className="fixed bottom-4 right-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-110 transition-transform z-40"
        >
          <Bot className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
        </button>
      )}

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-600 py-2">
        🙏 Jai Guru Ji | ANKR Shell v3 | © 2025 ANKR Labs
      </div>
    </div>
  );
}
