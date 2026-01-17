/**
 * CBS (Core Banking System) Adapter Pattern
 *
 * Provides flexible integration with bank's CBS:
 * - Interface-based design for multiple CBS implementations
 * - Mock adapter for development/testing
 * - Real-time sync with audit trail
 *
 * Supported CBS: Finacle, Flexcube, TCS BaNCS, Temenos (via adapters)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CbsCustomer {
  cif: string;                    // Customer Information File number
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: Date;
  pan?: string;
  kycStatus: string;
  segment?: string;
  branchCode: string;
  rmId?: string;
  createdAt: Date;
}

export interface CbsAccount {
  accountNumber: string;
  cif: string;
  productCode: string;
  productName: string;
  type: 'SAVINGS' | 'CURRENT' | 'SALARY' | 'FD' | 'RD' | 'LOAN' | 'OVERDRAFT';
  status: 'ACTIVE' | 'DORMANT' | 'CLOSED' | 'FROZEN';
  balance: number;
  availableBalance: number;
  currency: string;
  branchCode: string;
  openedAt: Date;
  closedAt?: Date;
  interestRate?: number;
  maturityDate?: Date;
}

export interface CbsLoanAccount extends CbsAccount {
  sanctionedAmount: number;
  disbursedAmount: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  emiAmount: number;
  tenure: number;
  nextDueDate: Date;
  overdueAmount: number;
  dpd: number;                    // Days Past Due
  npaStatus?: string;
}

export interface CbsTransaction {
  txnId: string;
  accountNumber: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  channel: string;
  valueDate: Date;
  postingDate: Date;
  balance: number;
  referenceNumber?: string;
  merchantName?: string;
  mcc?: string;                   // Merchant Category Code
}

export interface CbsSyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: Array<{ record: string; error: string }>;
  syncedAt: Date;
}

// ============================================================================
// CBS ADAPTER INTERFACE
// ============================================================================

export interface CbsAdapter {
  readonly name: string;
  readonly version: string;

  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;

  // Customer operations
  getCustomer(cif: string): Promise<CbsCustomer | null>;
  searchCustomers(query: { phone?: string; pan?: string; name?: string }): Promise<CbsCustomer[]>;

  // Account operations
  getAccounts(cif: string): Promise<CbsAccount[]>;
  getAccount(accountNumber: string): Promise<CbsAccount | null>;
  getLoanAccount(accountNumber: string): Promise<CbsLoanAccount | null>;

  // Transaction operations
  getTransactions(
    accountNumber: string,
    from: Date,
    to: Date,
    limit?: number
  ): Promise<CbsTransaction[]>;

  // Sync operations
  syncCustomers(since?: Date): Promise<CbsSyncResult>;
  syncAccounts(cif: string): Promise<CbsSyncResult>;
  syncTransactions(accountNumber: string, since?: Date): Promise<CbsSyncResult>;
}

// ============================================================================
// MOCK CBS ADAPTER (for development)
// ============================================================================

export class MockCbsAdapter implements CbsAdapter {
  readonly name = 'MockCBS';
  readonly version = '1.0.0';

  private customers = new Map<string, CbsCustomer>();
  private accounts = new Map<string, CbsAccount>();
  private transactions = new Map<string, CbsTransaction[]>();

  constructor() {
    this.seedMockData();
  }

  async connect(): Promise<void> {
    console.log('[MockCBS] Connected');
  }

  async disconnect(): Promise<void> {
    console.log('[MockCBS] Disconnected');
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async getCustomer(cif: string): Promise<CbsCustomer | null> {
    return this.customers.get(cif) || null;
  }

  async searchCustomers(query: { phone?: string; pan?: string; name?: string }): Promise<CbsCustomer[]> {
    return Array.from(this.customers.values()).filter(c => {
      if (query.phone && c.phone !== query.phone) return false;
      if (query.pan && c.pan !== query.pan) return false;
      if (query.name && !`${c.firstName} ${c.lastName}`.toLowerCase().includes(query.name.toLowerCase())) return false;
      return true;
    });
  }

  async getAccounts(cif: string): Promise<CbsAccount[]> {
    return Array.from(this.accounts.values()).filter(a => a.cif === cif);
  }

  async getAccount(accountNumber: string): Promise<CbsAccount | null> {
    return this.accounts.get(accountNumber) || null;
  }

  async getLoanAccount(accountNumber: string): Promise<CbsLoanAccount | null> {
    const account = this.accounts.get(accountNumber);
    if (!account || account.type !== 'LOAN') return null;

    return {
      ...account,
      sanctionedAmount: 1000000,
      disbursedAmount: 1000000,
      outstandingPrincipal: 800000,
      outstandingInterest: 5000,
      emiAmount: 15000,
      tenure: 60,
      nextDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      overdueAmount: 0,
      dpd: 0,
    };
  }

  async getTransactions(
    accountNumber: string,
    from: Date,
    to: Date,
    limit = 100
  ): Promise<CbsTransaction[]> {
    const txns = this.transactions.get(accountNumber) || [];
    return txns
      .filter(t => t.valueDate >= from && t.valueDate <= to)
      .slice(0, limit);
  }

  async syncCustomers(since?: Date): Promise<CbsSyncResult> {
    return {
      success: true,
      recordsProcessed: this.customers.size,
      errors: [],
      syncedAt: new Date(),
    };
  }

  async syncAccounts(cif: string): Promise<CbsSyncResult> {
    const accounts = await this.getAccounts(cif);
    return {
      success: true,
      recordsProcessed: accounts.length,
      errors: [],
      syncedAt: new Date(),
    };
  }

  async syncTransactions(accountNumber: string, since?: Date): Promise<CbsSyncResult> {
    const txns = this.transactions.get(accountNumber) || [];
    return {
      success: true,
      recordsProcessed: txns.length,
      errors: [],
      syncedAt: new Date(),
    };
  }

  private seedMockData(): void {
    // Sample customers
    const customers: CbsCustomer[] = [
      {
        cif: 'CIF001',
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul@example.com',
        phone: '9876543210',
        dateOfBirth: new Date('1988-05-15'),
        pan: 'ABCPS1234A',
        kycStatus: 'VERIFIED',
        segment: 'AFFLUENT',
        branchCode: 'MUM001',
        createdAt: new Date('2019-01-15'),
      },
      {
        cif: 'CIF002',
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya@example.com',
        phone: '9876543211',
        dateOfBirth: new Date('1992-08-20'),
        pan: 'DEFPP5678B',
        kycStatus: 'VERIFIED',
        segment: 'MASS',
        branchCode: 'DEL001',
        createdAt: new Date('2020-06-10'),
      },
    ];

    customers.forEach(c => this.customers.set(c.cif, c));

    // Sample accounts
    const accounts: CbsAccount[] = [
      {
        accountNumber: 'SAV001001',
        cif: 'CIF001',
        productCode: 'SAV01',
        productName: 'Premium Savings',
        type: 'SAVINGS',
        status: 'ACTIVE',
        balance: 250000,
        availableBalance: 245000,
        currency: 'INR',
        branchCode: 'MUM001',
        openedAt: new Date('2019-01-15'),
        interestRate: 4.5,
      },
      {
        accountNumber: 'LN001001',
        cif: 'CIF001',
        productCode: 'HL01',
        productName: 'Home Loan',
        type: 'LOAN',
        status: 'ACTIVE',
        balance: -800000,
        availableBalance: 0,
        currency: 'INR',
        branchCode: 'MUM001',
        openedAt: new Date('2021-03-20'),
        interestRate: 8.5,
      },
    ];

    accounts.forEach(a => this.accounts.set(a.accountNumber, a));

    // Sample transactions
    const now = Date.now();
    const txns: CbsTransaction[] = [
      {
        txnId: 'TXN001',
        accountNumber: 'SAV001001',
        type: 'CREDIT',
        amount: 50000,
        currency: 'INR',
        description: 'SALARY CREDIT',
        channel: 'NEFT',
        valueDate: new Date(now - 5 * 24 * 60 * 60 * 1000),
        postingDate: new Date(now - 5 * 24 * 60 * 60 * 1000),
        balance: 250000,
        merchantName: 'ABC CORP',
      },
      {
        txnId: 'TXN002',
        accountNumber: 'SAV001001',
        type: 'DEBIT',
        amount: 5000,
        currency: 'INR',
        description: 'ATM WITHDRAWAL',
        channel: 'ATM',
        valueDate: new Date(now - 3 * 24 * 60 * 60 * 1000),
        postingDate: new Date(now - 3 * 24 * 60 * 60 * 1000),
        balance: 245000,
      },
    ];

    this.transactions.set('SAV001001', txns);
  }
}

// ============================================================================
// CBS ADAPTER FACTORY
// ============================================================================

export type CbsType = 'mock' | 'finacle' | 'flexcube' | 'bancs' | 'temenos';

export interface CbsConfig {
  type: CbsType;
  host?: string;
  port?: number;
  credentials?: {
    username: string;
    password: string;
  };
  apiKey?: string;
}

export function createCbsAdapter(config: CbsConfig): CbsAdapter {
  switch (config.type) {
    case 'mock':
      return new MockCbsAdapter();

    case 'finacle':
      // TODO: Implement FinacleAdapter
      console.warn('[CBS] Finacle adapter not implemented, using mock');
      return new MockCbsAdapter();

    case 'flexcube':
      // TODO: Implement FlexcubeAdapter
      console.warn('[CBS] Flexcube adapter not implemented, using mock');
      return new MockCbsAdapter();

    case 'bancs':
      // TODO: Implement TCSBaNCSAdapter
      console.warn('[CBS] TCS BaNCS adapter not implemented, using mock');
      return new MockCbsAdapter();

    case 'temenos':
      // TODO: Implement TemenosAdapter
      console.warn('[CBS] Temenos adapter not implemented, using mock');
      return new MockCbsAdapter();

    default:
      throw new Error(`Unknown CBS type: ${config.type}`);
  }
}

// ============================================================================
// CBS SYNC SERVICE
// ============================================================================

export class CbsSyncService {
  constructor(
    private adapter: CbsAdapter,
    private onSyncComplete?: (result: CbsSyncResult) => void
  ) {}

  /**
   * Full sync for a customer
   */
  async syncCustomer(cif: string): Promise<{
    customer: CbsCustomer | null;
    accounts: CbsAccount[];
    recentTransactions: CbsTransaction[];
  }> {
    const customer = await this.adapter.getCustomer(cif);
    if (!customer) {
      return { customer: null, accounts: [], recentTransactions: [] };
    }

    const accounts = await this.adapter.getAccounts(cif);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions: CbsTransaction[] = [];

    for (const account of accounts) {
      const txns = await this.adapter.getTransactions(
        account.accountNumber,
        thirtyDaysAgo,
        new Date(),
        50
      );
      recentTransactions.push(...txns);
    }

    return { customer, accounts, recentTransactions };
  }

  /**
   * Schedule periodic sync
   */
  startPeriodicSync(intervalMinutes: number): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        const result = await this.adapter.syncCustomers();
        this.onSyncComplete?.(result);
      } catch (error) {
        console.error('[CBS Sync] Error:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

let defaultAdapter: CbsAdapter | null = null;

export function getCbsAdapter(): CbsAdapter {
  if (!defaultAdapter) {
    defaultAdapter = createCbsAdapter({
      type: (process.env.CBS_TYPE as CbsType) || 'mock',
    });
  }
  return defaultAdapter;
}
