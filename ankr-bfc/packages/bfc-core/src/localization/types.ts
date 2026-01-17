/**
 * BFC Localization Types
 * Supports 11 Indian languages
 */

export type SupportedLanguage =
  | 'en'   // English
  | 'hi'   // Hindi
  | 'ta'   // Tamil
  | 'te'   // Telugu
  | 'kn'   // Kannada
  | 'mr'   // Marathi
  | 'bn'   // Bengali
  | 'gu'   // Gujarati
  | 'ml'   // Malayalam
  | 'pa'   // Punjabi
  | 'or';  // Odia

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  script: string;
}

export interface TranslationParams {
  [key: string]: string | number;
}

export interface LocalizationService {
  t(key: string, params?: TranslationParams): string;
  setLanguage(lang: SupportedLanguage): void;
  getLanguage(): SupportedLanguage;
  getSupportedLanguages(): LanguageInfo[];
  formatCurrency(amount: number): string;
  formatDate(date: Date): string;
  formatNumber(num: number): string;
}

// Translation keys for banking domain
export interface BankingTranslations {
  common: CommonTranslations;
  nav: NavTranslations;
  accounts: AccountTranslations;
  transactions: TransactionTranslations;
  payments: PaymentTranslations;
  loans: LoanTranslations;
  cards: CardTranslations;
  kyc: KYCTranslations;
  support: SupportTranslations;
  errors: ErrorTranslations;
}

export interface CommonTranslations {
  welcome: string;
  logout: string;
  settings: string;
  profile: string;
  help: string;
  loading: string;
  submit: string;
  cancel: string;
  confirm: string;
  save: string;
  edit: string;
  delete: string;
  search: string;
  filter: string;
  back: string;
  next: string;
  previous: string;
  viewAll: string;
  amount: string;
  date: string;
  status: string;
  success: string;
  failed: string;
  pending: string;
}

export interface NavTranslations {
  home: string;
  accounts: string;
  transactions: string;
  payments: string;
  loans: string;
  cards: string;
  offers: string;
  rewards: string;
  support: string;
}

export interface AccountTranslations {
  savings: string;
  current: string;
  fd: string;
  rd: string;
  balance: string;
  availableBalance: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  statement: string;
  miniStatement: string;
}

export interface TransactionTranslations {
  history: string;
  credit: string;
  debit: string;
  transfer: string;
  deposit: string;
  withdrawal: string;
  reference: string;
  remarks: string;
}

export interface PaymentTranslations {
  upi: string;
  neft: string;
  rtgs: string;
  imps: string;
  billPay: string;
  recharge: string;
  sendMoney: string;
  scanPay: string;
  beneficiary: string;
  addBeneficiary: string;
}

export interface LoanTranslations {
  home: string;
  personal: string;
  vehicle: string;
  gold: string;
  business: string;
  education: string;
  apply: string;
  emi: string;
  tenure: string;
  interest: string;
  principal: string;
  outstanding: string;
  repayment: string;
  foreclosure: string;
}

export interface CardTranslations {
  debit: string;
  credit: string;
  virtual: string;
  block: string;
  unblock: string;
  setPin: string;
  changePin: string;
  limit: string;
  cvv: string;
  expiry: string;
  rewards: string;
}

export interface KYCTranslations {
  aadhaar: string;
  pan: string;
  voter: string;
  passport: string;
  verify: string;
  verified: string;
  pending: string;
  upload: string;
  document: string;
  videoKyc: string;
}

export interface SupportTranslations {
  chat: string;
  call: string;
  email: string;
  ticket: string;
  faq: string;
  branchLocator: string;
  feedback: string;
  complaint: string;
}

export interface ErrorTranslations {
  networkError: string;
  sessionExpired: string;
  invalidOtp: string;
  insufficientBalance: string;
  limitExceeded: string;
  tryAgain: string;
  contactSupport: string;
}
