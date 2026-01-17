/**
 * BFC User Portal Configuration
 *
 * Configuration for customer-facing portal (web and mobile)
 * Features: Account overview, transactions, offers, support, self-service
 */

// =============================================================================
// PORTAL TYPES
// =============================================================================

export interface UserPortalConfig {
  // Branding
  branding: PortalBrandingConfig;

  // Pages & Navigation
  pages: PortalPageConfig[];

  // Features
  features: PortalFeatures;

  // Self-Service
  selfService: SelfServiceConfig;

  // Communication
  communication: CommunicationConfig;

  // Security
  security: PortalSecurityConfig;

  // Localization
  localization: LocalizationConfig;
}

export interface PortalBrandingConfig {
  appName: string;
  tagline: string;
  logo: string;
  logoLight: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  theme: 'light' | 'dark' | 'auto';
  supportEmail: string;
  supportPhone: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface PortalPageConfig {
  id: string;
  name: string;
  route: string;
  icon: string;
  enabled: boolean;
  showInNav: boolean;
  requiresAuth: boolean;
  subPages?: PortalSubPage[];
}

export interface PortalSubPage {
  id: string;
  name: string;
  route: string;
}

export interface PortalFeatures {
  // Account
  accountOverview: boolean;
  multiAccount: boolean;
  accountStatements: boolean;
  transactionHistory: boolean;
  transactionSearch: boolean;

  // Payments
  fundTransfer: boolean;
  billPayments: boolean;
  upiPayments: boolean;
  scheduledPayments: boolean;
  beneficiaryManagement: boolean;

  // Loans & Credit
  loanApplication: boolean;
  loanTracking: boolean;
  emiCalculator: boolean;
  preApprovedOffers: boolean;

  // Investments
  fdBooking: boolean;
  rdBooking: boolean;
  mutualFunds: boolean;
  portfolio: boolean;

  // Cards
  cardManagement: boolean;
  cardBlock: boolean;
  cardLimit: boolean;
  virtualCard: boolean;

  // Self-Service
  profileUpdate: boolean;
  kycUpdate: boolean;
  addressUpdate: boolean;
  nomineeUpdate: boolean;
  passwordChange: boolean;
  mfaSetup: boolean;

  // Offers
  personalizedOffers: boolean;
  rewards: boolean;
  referral: boolean;

  // Support
  chatSupport: boolean;
  ticketSupport: boolean;
  faq: boolean;
  branchLocator: boolean;

  // Notifications
  pushNotifications: boolean;
  emailPreferences: boolean;
  smsPreferences: boolean;

  // Security
  loginHistory: boolean;
  deviceManagement: boolean;
  securityAlerts: boolean;
}

export interface SelfServiceConfig {
  // KYC
  kyc: {
    aadhaarVerification: boolean;
    panVerification: boolean;
    videoKYC: boolean;
    digilocker: boolean;
    documentUpload: boolean;
    reKYC: boolean;
  };

  // Profile Updates
  profile: {
    email: boolean;
    phone: boolean;
    address: boolean;
    photo: boolean;
    nominee: boolean;
    preferences: boolean;
  };

  // Account Services
  account: {
    statementDownload: boolean;
    chequeBookRequest: boolean;
    stopCheque: boolean;
    accountClosure: boolean;
    dormantReactivation: boolean;
  };

  // Card Services
  card: {
    pinGeneration: boolean;
    pinChange: boolean;
    cardBlock: boolean;
    cardReplace: boolean;
    limitChange: boolean;
    internationalUsage: boolean;
  };

  // Loan Services
  loan: {
    foreclosure: boolean;
    partPayment: boolean;
    emiDateChange: boolean;
    nocRequest: boolean;
    statementDownload: boolean;
  };
}

export interface CommunicationConfig {
  // Channels
  channels: {
    push: { enabled: boolean; icon: string };
    email: { enabled: boolean; icon: string };
    sms: { enabled: boolean; icon: string };
    whatsapp: { enabled: boolean; icon: string };
    inApp: { enabled: boolean; icon: string };
  };

  // Notification Types
  types: {
    transactional: boolean;
    promotional: boolean;
    security: boolean;
    offers: boolean;
    reminders: boolean;
  };

  // Quiet Hours
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
}

export interface PortalSecurityConfig {
  // Authentication
  auth: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumber: boolean;
      requireSpecial: boolean;
      maxAge: number; // days
    };
    mfa: {
      required: boolean;
      methods: ('sms' | 'email' | 'totp' | 'biometric')[];
    };
    biometric: {
      enabled: boolean;
      faceId: boolean;
      fingerprint: boolean;
    };
    sessionTimeout: number; // minutes
    maxSessions: number;
  };

  // Transaction Security
  transaction: {
    otpRequired: boolean;
    otpMethods: ('sms' | 'email')[];
    cooldownPeriod: number; // hours for new beneficiary
    dailyLimit: number;
    perTransactionLimit: number;
  };

  // Device Management
  device: {
    deviceBinding: boolean;
    maxDevices: number;
    newDeviceVerification: boolean;
  };
}

export interface LocalizationConfig {
  defaultLanguage: string;
  supportedLanguages: LanguageConfig[];
  dateFormat: string;
  timeFormat: string;
  currency: string;
  currencySymbol: string;
  numberFormat: string;
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

// =============================================================================
// DEFAULT PORTAL CONFIGURATION
// =============================================================================

export const DEFAULT_PORTAL_CONFIG: UserPortalConfig = {
  branding: {
    appName: 'BFC Banking',
    tagline: 'Banking Made Simple',
    logo: '/assets/logo.svg',
    logoLight: '/assets/logo-light.svg',
    favicon: '/assets/favicon.ico',
    primaryColor: '#1E40AF',
    secondaryColor: '#3B82F6',
    accentColor: '#10B981',
    theme: 'auto',
    supportEmail: 'support@bfc.in',
    supportPhone: '1800-123-4567',
    socialLinks: {
      facebook: 'https://facebook.com/bfcbanking',
      twitter: 'https://twitter.com/bfcbanking',
      instagram: 'https://instagram.com/bfcbanking',
      linkedin: 'https://linkedin.com/company/bfcbanking',
    },
  },

  pages: [
    {
      id: 'home',
      name: 'Home',
      route: '/',
      icon: 'home',
      enabled: true,
      showInNav: true,
      requiresAuth: true,
    },
    {
      id: 'accounts',
      name: 'Accounts',
      route: '/accounts',
      icon: 'wallet',
      enabled: true,
      showInNav: true,
      requiresAuth: true,
      subPages: [
        { id: 'savings', name: 'Savings', route: '/accounts/savings' },
        { id: 'current', name: 'Current', route: '/accounts/current' },
        { id: 'fd', name: 'Fixed Deposits', route: '/accounts/fd' },
        { id: 'rd', name: 'Recurring Deposits', route: '/accounts/rd' },
      ],
    },
    {
      id: 'transactions',
      name: 'Transactions',
      route: '/transactions',
      icon: 'arrow-left-right',
      enabled: true,
      showInNav: true,
      requiresAuth: true,
    },
    {
      id: 'payments',
      name: 'Payments',
      route: '/payments',
      icon: 'send',
      enabled: true,
      showInNav: true,
      requiresAuth: true,
      subPages: [
        { id: 'transfer', name: 'Fund Transfer', route: '/payments/transfer' },
        { id: 'upi', name: 'UPI', route: '/payments/upi' },
        { id: 'bills', name: 'Bill Pay', route: '/payments/bills' },
        { id: 'beneficiaries', name: 'Beneficiaries', route: '/payments/beneficiaries' },
      ],
    },
    {
      id: 'loans',
      name: 'Loans',
      route: '/loans',
      icon: 'landmark',
      enabled: true,
      showInNav: true,
      requiresAuth: true,
      subPages: [
        { id: 'my-loans', name: 'My Loans', route: '/loans/my' },
        { id: 'apply', name: 'Apply Now', route: '/loans/apply' },
        { id: 'calculator', name: 'EMI Calculator', route: '/loans/calculator' },
        { id: 'offers', name: 'Pre-Approved', route: '/loans/offers' },
      ],
    },
    {
      id: 'cards',
      name: 'Cards',
      route: '/cards',
      icon: 'credit-card',
      enabled: true,
      showInNav: true,
      requiresAuth: true,
      subPages: [
        { id: 'debit', name: 'Debit Cards', route: '/cards/debit' },
        { id: 'credit', name: 'Credit Cards', route: '/cards/credit' },
        { id: 'virtual', name: 'Virtual Card', route: '/cards/virtual' },
      ],
    },
    {
      id: 'offers',
      name: 'Offers',
      route: '/offers',
      icon: 'gift',
      enabled: true,
      showInNav: true,
      requiresAuth: true,
    },
    {
      id: 'rewards',
      name: 'Rewards',
      route: '/rewards',
      icon: 'star',
      enabled: true,
      showInNav: true,
      requiresAuth: true,
    },
    {
      id: 'support',
      name: 'Support',
      route: '/support',
      icon: 'headphones',
      enabled: true,
      showInNav: true,
      requiresAuth: true,
      subPages: [
        { id: 'chat', name: 'Chat', route: '/support/chat' },
        { id: 'tickets', name: 'My Tickets', route: '/support/tickets' },
        { id: 'faq', name: 'FAQ', route: '/support/faq' },
        { id: 'branches', name: 'Branch Locator', route: '/support/branches' },
      ],
    },
    {
      id: 'profile',
      name: 'Profile',
      route: '/profile',
      icon: 'user',
      enabled: true,
      showInNav: true,
      requiresAuth: true,
      subPages: [
        { id: 'details', name: 'My Details', route: '/profile/details' },
        { id: 'kyc', name: 'KYC', route: '/profile/kyc' },
        { id: 'security', name: 'Security', route: '/profile/security' },
        { id: 'preferences', name: 'Preferences', route: '/profile/preferences' },
      ],
    },
  ],

  features: {
    // Account
    accountOverview: true,
    multiAccount: true,
    accountStatements: true,
    transactionHistory: true,
    transactionSearch: true,

    // Payments
    fundTransfer: true,
    billPayments: true,
    upiPayments: true,
    scheduledPayments: true,
    beneficiaryManagement: true,

    // Loans
    loanApplication: true,
    loanTracking: true,
    emiCalculator: true,
    preApprovedOffers: true,

    // Investments
    fdBooking: true,
    rdBooking: true,
    mutualFunds: false, // Requires additional license
    portfolio: true,

    // Cards
    cardManagement: true,
    cardBlock: true,
    cardLimit: true,
    virtualCard: true,

    // Self-Service
    profileUpdate: true,
    kycUpdate: true,
    addressUpdate: true,
    nomineeUpdate: true,
    passwordChange: true,
    mfaSetup: true,

    // Offers
    personalizedOffers: true,
    rewards: true,
    referral: true,

    // Support
    chatSupport: true,
    ticketSupport: true,
    faq: true,
    branchLocator: true,

    // Notifications
    pushNotifications: true,
    emailPreferences: true,
    smsPreferences: true,

    // Security
    loginHistory: true,
    deviceManagement: true,
    securityAlerts: true,
  },

  selfService: {
    kyc: {
      aadhaarVerification: true,
      panVerification: true,
      videoKYC: true,
      digilocker: true,
      documentUpload: true,
      reKYC: true,
    },
    profile: {
      email: true,
      phone: true,
      address: true,
      photo: true,
      nominee: true,
      preferences: true,
    },
    account: {
      statementDownload: true,
      chequeBookRequest: true,
      stopCheque: true,
      accountClosure: false, // Requires branch visit
      dormantReactivation: true,
    },
    card: {
      pinGeneration: true,
      pinChange: true,
      cardBlock: true,
      cardReplace: true,
      limitChange: true,
      internationalUsage: true,
    },
    loan: {
      foreclosure: true,
      partPayment: true,
      emiDateChange: true,
      nocRequest: true,
      statementDownload: true,
    },
  },

  communication: {
    channels: {
      push: { enabled: true, icon: 'bell' },
      email: { enabled: true, icon: 'mail' },
      sms: { enabled: true, icon: 'message-square' },
      whatsapp: { enabled: true, icon: 'message-circle' },
      inApp: { enabled: true, icon: 'inbox' },
    },
    types: {
      transactional: true,
      promotional: true,
      security: true,
      offers: true,
      reminders: true,
    },
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '07:00',
    },
  },

  security: {
    auth: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true,
        maxAge: 90,
      },
      mfa: {
        required: true,
        methods: ['sms', 'email', 'totp'],
      },
      biometric: {
        enabled: true,
        faceId: true,
        fingerprint: true,
      },
      sessionTimeout: 15,
      maxSessions: 3,
    },
    transaction: {
      otpRequired: true,
      otpMethods: ['sms', 'email'],
      cooldownPeriod: 24,
      dailyLimit: 500000,
      perTransactionLimit: 100000,
    },
    device: {
      deviceBinding: true,
      maxDevices: 3,
      newDeviceVerification: true,
    },
  },

  localization: {
    defaultLanguage: 'en',
    supportedLanguages: [
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr' },
    ],
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'hh:mm A',
    currency: 'INR',
    currencySymbol: '₹',
    numberFormat: 'en-IN',
  },
};

// =============================================================================
// PORTAL SERVICE
// =============================================================================

export class UserPortalService {
  private config: UserPortalConfig;

  constructor(config: UserPortalConfig = DEFAULT_PORTAL_CONFIG) {
    this.config = config;
  }

  getConfig(): UserPortalConfig {
    return this.config;
  }

  updateConfig(updates: Partial<UserPortalConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Navigation
  getEnabledPages(): PortalPageConfig[] {
    return this.config.pages.filter(p => p.enabled && p.showInNav);
  }

  getPageByRoute(route: string): PortalPageConfig | undefined {
    return this.config.pages.find(p => p.route === route);
  }

  // Features
  isFeatureEnabled(feature: keyof PortalFeatures): boolean {
    return this.config.features[feature] ?? false;
  }

  toggleFeature(feature: keyof PortalFeatures, enabled: boolean): void {
    this.config.features[feature] = enabled;
  }

  // Self-Service
  isSelfServiceEnabled(category: keyof SelfServiceConfig, service: string): boolean {
    const cat = this.config.selfService[category] as Record<string, boolean>;
    return cat?.[service] ?? false;
  }

  // Security
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const policy = this.config.security.auth.passwordPolicy;
    const errors: string[] = [];

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters`);
    }
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }
    if (policy.requireNumber && !/\d/.test(password)) {
      errors.push('Password must contain a number');
    }
    if (policy.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain a special character');
    }

    return { valid: errors.length === 0, errors };
  }

  // Transaction Limits
  checkTransactionLimit(amount: number, dailyTotal: number): { allowed: boolean; reason?: string } {
    const limits = this.config.security.transaction;

    if (amount > limits.perTransactionLimit) {
      return {
        allowed: false,
        reason: `Amount exceeds per-transaction limit of ₹${limits.perTransactionLimit.toLocaleString('en-IN')}`,
      };
    }

    if (dailyTotal + amount > limits.dailyLimit) {
      return {
        allowed: false,
        reason: `Amount exceeds daily limit of ₹${limits.dailyLimit.toLocaleString('en-IN')}`,
      };
    }

    return { allowed: true };
  }

  // Localization
  getSupportedLanguages(): LanguageConfig[] {
    return this.config.localization.supportedLanguages;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat(this.config.localization.numberFormat, {
      style: 'currency',
      currency: this.config.localization.currency,
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  // Communication Preferences
  isChannelEnabled(channel: keyof CommunicationConfig['channels']): boolean {
    return this.config.communication.channels[channel]?.enabled ?? false;
  }

  isQuietHours(time: Date): boolean {
    if (!this.config.communication.quietHours.enabled) return false;

    const hours = time.getHours();
    const minutes = time.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const [startH, startM] = this.config.communication.quietHours.start.split(':').map(Number);
    const [endH, endM] = this.config.communication.quietHours.end.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      // Spans midnight (e.g., 22:00 to 07:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  }
}

// Factory
export function createUserPortalService(config?: UserPortalConfig): UserPortalService {
  return new UserPortalService(config);
}

export default UserPortalService;
