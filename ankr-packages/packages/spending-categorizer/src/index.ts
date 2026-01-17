/**
 * @ankr/spending-categorizer
 *
 * AI-powered transaction categorization with pattern matching, MCC codes,
 * and Hindi language support.
 *
 * @example
 * ```typescript
 * import { SpendingCategorizer } from '@ankr/spending-categorizer';
 *
 * const categorizer = new SpendingCategorizer();
 * const result = await categorizer.categorize({
 *   id: 'txn-1',
 *   description: 'SWIGGY ORDER',
 *   amount: 450,
 *   type: 'DEBIT',
 *   date: new Date()
 * });
 * // result.category === 'FOOD_DINING'
 * ```
 *
 * @packageDocumentation
 */

// Optional AI client interface (users can implement their own)
export interface AIClient {
  complete(options: {
    model: string;
    messages: { role: string; content: string }[];
    maxTokens: number;
  }): Promise<{ content: string }>;
}

// Simple console logger (can be replaced)
const logger = {
  warn: (msg: string) => console.warn(`[SpendingCategorizer] ${msg}`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  date: string | Date;
  mode?: 'UPI' | 'CARD' | 'NEFT' | 'IMPS' | 'CASH' | 'MANDATE' | 'CHEQUE';
  merchantId?: string;
  merchantName?: string;
  mcc?: string; // Merchant Category Code
  upiHandle?: string;
  metadata?: Record<string, unknown>;
}

export interface CategorizedTransaction extends Transaction {
  category: SpendingCategory;
  subCategory?: string;
  confidence: number;
  tags: string[];
  isRecurring?: boolean;
  merchantCategory?: string;
}

export type SpendingCategory =
  | 'FOOD_DINING'
  | 'GROCERIES'
  | 'SHOPPING'
  | 'ENTERTAINMENT'
  | 'UTILITIES'
  | 'TRANSPORT'
  | 'HEALTH'
  | 'EDUCATION'
  | 'HOUSING'
  | 'INSURANCE'
  | 'INVESTMENT'
  | 'TRANSFER'
  | 'EMI_LOAN'
  | 'SUBSCRIPTION'
  | 'TRAVEL'
  | 'PERSONAL_CARE'
  | 'GIFTS_CHARITY'
  | 'INCOME'
  | 'REFUND'
  | 'ATM_WITHDRAWAL'
  | 'OTHER';

export interface CategoryPattern {
  category: SpendingCategory;
  subCategory?: string;
  patterns: RegExp[];
  mccCodes?: string[];
  keywords: string[];
  keywordsHi: string[]; // Hindi keywords
}

export interface SpendingSummary {
  period: { from: string; to: string };
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  categoryBreakdown: CategoryBreakdown[];
  topMerchants: MerchantSummary[];
  trends: SpendingTrend[];
  anomalies: SpendingAnomaly[];
  insights: SpendingInsight[];
}

export interface CategoryBreakdown {
  category: SpendingCategory;
  categoryNameHi: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  changePercent: number;
  icon: string;
}

export interface MerchantSummary {
  merchantName: string;
  category: SpendingCategory;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
}

export interface SpendingTrend {
  category: SpendingCategory;
  direction: 'UP' | 'DOWN' | 'STABLE';
  changePercent: number;
  message: string;
  messageHi: string;
}

export interface SpendingAnomaly {
  transactionId: string;
  type: 'UNUSUAL_AMOUNT' | 'NEW_MERCHANT' | 'UNUSUAL_CATEGORY' | 'UNUSUAL_TIME';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  messageHi: string;
}

export interface SpendingInsight {
  type: 'POSITIVE' | 'WARNING' | 'INFO';
  icon: string;
  message: string;
  messageHi: string;
  actionable: boolean;
  suggestedAction?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

const categoryPatterns: CategoryPattern[] = [
  // Food & Dining
  {
    category: 'FOOD_DINING',
    subCategory: 'Restaurant',
    patterns: [
      /swiggy|zomato|foodpanda|uber\s*eats|dominos|pizza\s*hut|mcdonalds|kfc|burger\s*king/i,
      /restaurant|cafe|hotel|dhaba|biryani|thali|meals/i,
      /(food|खाना|भोजन|खाने)/i,
    ],
    mccCodes: ['5812', '5814', '5811'],
    keywords: ['swiggy', 'zomato', 'restaurant', 'food', 'cafe', 'meal', 'dinner', 'lunch', 'breakfast'],
    keywordsHi: ['खाना', 'भोजन', 'रेस्तरां', 'होटल', 'ढाबा', 'बिरयानी', 'थाली'],
  },
  {
    category: 'GROCERIES',
    patterns: [
      /bigbasket|grofers|blinkit|jiomart|dmart|more|reliance\s*fresh|nature'?s\s*basket/i,
      /grocery|kirana|supermarket|vegetables|fruits|sabzi/i,
      /(सब्जी|किराना|राशन)/i,
    ],
    mccCodes: ['5411', '5422', '5441'],
    keywords: ['grocery', 'vegetables', 'fruits', 'supermarket', 'kirana', 'bigbasket', 'blinkit'],
    keywordsHi: ['सब्जी', 'किराना', 'राशन', 'फल', 'सब्जीवाला', 'दूध', 'डेयरी'],
  },
  // Shopping
  {
    category: 'SHOPPING',
    subCategory: 'Online',
    patterns: [
      /amazon|flipkart|myntra|ajio|meesho|snapdeal|shopclues|paytm\s*mall|nykaa/i,
      /shopping|purchase|order/i,
    ],
    mccCodes: ['5311', '5651', '5699', '5999'],
    keywords: ['amazon', 'flipkart', 'myntra', 'shopping', 'purchase', 'order'],
    keywordsHi: ['खरीदारी', 'ऑर्डर', 'शॉपिंग'],
  },
  {
    category: 'SHOPPING',
    subCategory: 'Electronics',
    patterns: [
      /croma|reliance\s*digital|vijay\s*sales|samsung|apple|mi|realme/i,
      /mobile|laptop|computer|electronics/i,
    ],
    mccCodes: ['5732', '5734'],
    keywords: ['mobile', 'laptop', 'electronics', 'croma', 'phone'],
    keywordsHi: ['मोबाइल', 'लैपटॉप', 'इलेक्ट्रॉनिक्स'],
  },
  // Entertainment
  {
    category: 'ENTERTAINMENT',
    patterns: [
      /netflix|prime\s*video|hotstar|spotify|gaana|youtube|zee5|sonyliv/i,
      /movie|cinema|pvr|inox|bookmyshow|gaming|playstation|xbox/i,
      /ott|streaming/i,
    ],
    mccCodes: ['7832', '7841', '7922'],
    keywords: ['netflix', 'movie', 'cinema', 'spotify', 'gaming', 'entertainment'],
    keywordsHi: ['फिल्म', 'सिनेमा', 'मनोरंजन', 'गेम'],
  },
  // Utilities
  {
    category: 'UTILITIES',
    patterns: [
      /electricity|electric|bijli|power|tata\s*power|adani|bses|discom/i,
      /water|gas|piped|jal|board/i,
      /broadband|internet|wifi|airtel|jio|vodafone|bsnl|act\s*fibernet/i,
      /mobile\s*recharge|prepaid|postpaid/i,
      /bill\s*payment|utility/i,
    ],
    mccCodes: ['4900', '4814'],
    keywords: ['electricity', 'water', 'gas', 'internet', 'bill', 'recharge', 'broadband'],
    keywordsHi: ['बिजली', 'पानी', 'गैस', 'इंटरनेट', 'बिल', 'रिचार्ज'],
  },
  // Transport
  {
    category: 'TRANSPORT',
    patterns: [
      /uber|ola|rapido|auto|taxi|cab/i,
      /petrol|diesel|fuel|hp|indian\s*oil|bharat\s*petroleum|cng/i,
      /metro|railway|irctc|redbus|bus|train|flight/i,
      /parking|toll|fastag/i,
    ],
    mccCodes: ['4111', '4121', '5541', '5542'],
    keywords: ['uber', 'ola', 'petrol', 'fuel', 'metro', 'railway', 'taxi', 'parking', 'toll'],
    keywordsHi: ['पेट्रोल', 'डीजल', 'ऑटो', 'टैक्सी', 'मेट्रो', 'रेलवे', 'बस', 'पार्किंग'],
  },
  // Health
  {
    category: 'HEALTH',
    patterns: [
      /pharmacy|pharma|medplus|apollo|netmeds|1mg|tata\s*1mg|pharm\s*easy/i,
      /hospital|clinic|doctor|dr\.|diagnostic|lab|blood\s*test|xray|scan/i,
      /medical|medicine|health|wellness/i,
      /gym|fitness|cult\.fit|curefit/i,
    ],
    mccCodes: ['5912', '8011', '8021', '8099', '7997'],
    keywords: ['pharmacy', 'medical', 'hospital', 'doctor', 'medicine', 'gym', 'fitness', 'health'],
    keywordsHi: ['दवाई', 'अस्पताल', 'डॉक्टर', 'जिम', 'फिटनेस', 'स्वास्थ्य', 'मेडिकल'],
  },
  // Education
  {
    category: 'EDUCATION',
    subCategory: 'Courses',
    patterns: [
      /udemy|coursera|unacademy|byju|vedantu|khan\s*academy|whitehat|coding/i,
      /school|college|university|tuition|coaching|education/i,
      /book|stationery|exam|test\s*prep/i,
    ],
    mccCodes: ['8211', '8220', '8299', '5942'],
    keywords: ['education', 'course', 'school', 'college', 'tuition', 'book', 'learning'],
    keywordsHi: ['शिक्षा', 'कोर्स', 'स्कूल', 'कॉलेज', 'ट्यूशन', 'किताब', 'पढ़ाई'],
  },
  // Housing
  {
    category: 'HOUSING',
    patterns: [
      /rent|किराया|landlord|housing|society|maintenance|flat\s*rent/i,
      /home\s*loan|emi|housing\s*loan/i,
      /property\s*tax|stamp\s*duty/i,
    ],
    keywords: ['rent', 'housing', 'maintenance', 'society', 'home loan'],
    keywordsHi: ['किराया', 'मकान', 'घर', 'मेंटेनेंस', 'सोसाइटी'],
  },
  // Insurance
  {
    category: 'INSURANCE',
    patterns: [
      /insurance|lic|hdfc\s*life|icici\s*prudential|max\s*life|sbi\s*life/i,
      /policy|premium|star\s*health|care\s*health|digit/i,
    ],
    mccCodes: ['6300'],
    keywords: ['insurance', 'policy', 'premium', 'life', 'health', 'car', 'bike'],
    keywordsHi: ['बीमा', 'पॉलिसी', 'प्रीमियम', 'जीवन बीमा', 'स्वास्थ्य बीमा'],
  },
  // Investment
  {
    category: 'INVESTMENT',
    patterns: [
      /mutual\s*fund|sip|groww|zerodha|upstox|paytm\s*money|kuvera|coin/i,
      /shares|stocks|nse|bse|demat|trading|investment/i,
      /fd|fixed\s*deposit|rd|recurring|ppf|nps|epf/i,
    ],
    keywords: ['mutual fund', 'sip', 'investment', 'stocks', 'shares', 'fd', 'ppf'],
    keywordsHi: ['निवेश', 'म्यूचुअल फंड', 'शेयर', 'एफडी', 'पीपीएफ'],
  },
  // EMI/Loan
  {
    category: 'EMI_LOAN',
    patterns: [
      /emi|loan|repayment|installment|bajaj\s*finserv|hdfc\s*loan|icici\s*loan/i,
      /credit\s*card\s*bill|card\s*payment/i,
    ],
    keywords: ['emi', 'loan', 'repayment', 'installment', 'credit card'],
    keywordsHi: ['ईएमआई', 'लोन', 'किस्त', 'भुगतान'],
  },
  // Subscription
  {
    category: 'SUBSCRIPTION',
    patterns: [
      /subscription|membership|annual|monthly\s*fee/i,
      /prime|plus|premium|pro\s*membership/i,
    ],
    keywords: ['subscription', 'membership', 'annual', 'monthly'],
    keywordsHi: ['सदस्यता', 'मेंबरशिप', 'सब्सक्रिप्शन'],
  },
  // Travel
  {
    category: 'TRAVEL',
    patterns: [
      /makemytrip|goibibo|cleartrip|yatra|ixigo|expedia|booking\.com/i,
      /hotel|resort|oyo|treebo|fabhotels|airbnb/i,
      /flight|airline|indigo|spicejet|air\s*india|vistara/i,
    ],
    mccCodes: ['4511', '7011', '3000'],
    keywords: ['travel', 'flight', 'hotel', 'booking', 'trip', 'vacation'],
    keywordsHi: ['यात्रा', 'उड़ान', 'होटल', 'बुकिंग', 'ट्रिप', 'छुट्टी'],
  },
  // Personal Care
  {
    category: 'PERSONAL_CARE',
    patterns: [
      /salon|parlour|spa|beauty|haircut|grooming/i,
      /urban\s*company|urban\s*clap/i,
    ],
    keywords: ['salon', 'spa', 'beauty', 'haircut', 'grooming'],
    keywordsHi: ['सैलून', 'स्पा', 'ब्यूटी', 'हेयर', 'ग्रूमिंग'],
  },
  // Gifts & Charity
  {
    category: 'GIFTS_CHARITY',
    patterns: [
      /gift|donation|charity|ngo|temple|mandir|church|mosque|gurudwara/i,
      /daan|दान|भेंट/i,
    ],
    keywords: ['gift', 'donation', 'charity', 'temple'],
    keywordsHi: ['उपहार', 'दान', 'चैरिटी', 'मंदिर'],
  },
  // Transfer
  {
    category: 'TRANSFER',
    patterns: [
      /transfer|upi|imps|neft|rtgs|p2p|send\s*money/i,
      /to\s+[a-z]+@|paid\s+to/i,
    ],
    keywords: ['transfer', 'send', 'paid to', 'upi'],
    keywordsHi: ['ट्रांसफर', 'भेजा', 'भुगतान'],
  },
  // Income
  {
    category: 'INCOME',
    patterns: [
      /salary|credited|income|refund|cashback|interest\s*credit/i,
      /dividend|bonus|reimbursement/i,
    ],
    keywords: ['salary', 'income', 'credit', 'refund', 'cashback'],
    keywordsHi: ['वेतन', 'आय', 'क्रेडिट', 'रिफंड', 'कैशबैक'],
  },
  // ATM
  {
    category: 'ATM_WITHDRAWAL',
    patterns: [/atm|cash\s*withdrawal|withdraw/i],
    keywords: ['atm', 'withdrawal', 'cash'],
    keywordsHi: ['एटीएम', 'निकासी', 'नकद'],
  },
];

// Category names in Hindi
const categoryNamesHi: Record<SpendingCategory, string> = {
  FOOD_DINING: 'खाना-पीना',
  GROCERIES: 'किराना',
  SHOPPING: 'खरीदारी',
  ENTERTAINMENT: 'मनोरंजन',
  UTILITIES: 'बिल',
  TRANSPORT: 'यातायात',
  HEALTH: 'स्वास्थ्य',
  EDUCATION: 'शिक्षा',
  HOUSING: 'घर',
  INSURANCE: 'बीमा',
  INVESTMENT: 'निवेश',
  TRANSFER: 'ट्रांसफर',
  EMI_LOAN: 'EMI/लोन',
  SUBSCRIPTION: 'सदस्यता',
  TRAVEL: 'यात्रा',
  PERSONAL_CARE: 'पर्सनल केयर',
  GIFTS_CHARITY: 'उपहार/दान',
  INCOME: 'आय',
  REFUND: 'रिफंड',
  ATM_WITHDRAWAL: 'ATM निकासी',
  OTHER: 'अन्य',
};

// Category icons
const categoryIcons: Record<SpendingCategory, string> = {
  FOOD_DINING: '🍔',
  GROCERIES: '🛒',
  SHOPPING: '🛍️',
  ENTERTAINMENT: '🎬',
  UTILITIES: '💡',
  TRANSPORT: '🚗',
  HEALTH: '🏥',
  EDUCATION: '📚',
  HOUSING: '🏠',
  INSURANCE: '🛡️',
  INVESTMENT: '📈',
  TRANSFER: '💸',
  EMI_LOAN: '💳',
  SUBSCRIPTION: '📅',
  TRAVEL: '✈️',
  PERSONAL_CARE: '💇',
  GIFTS_CHARITY: '🎁',
  INCOME: '💰',
  REFUND: '↩️',
  ATM_WITHDRAWAL: '🏧',
  OTHER: '📦',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPENDING CATEGORIZER SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class SpendingCategorizer {
  private aiClient?: AIClient;
  private merchantCache: Map<string, SpendingCategory> = new Map();

  constructor(options?: { aiClient?: AIClient }) {
    this.aiClient = options?.aiClient;
  }

  /**
   * Categorize a single transaction
   */
  async categorize(transaction: Transaction): Promise<CategorizedTransaction> {
    const description = transaction.description.toLowerCase();
    const merchantName = transaction.merchantName?.toLowerCase() || '';

    // Check merchant cache first
    if (merchantName && this.merchantCache.has(merchantName)) {
      const category = this.merchantCache.get(merchantName)!;
      return this.buildResult(transaction, category, 0.95, ['cached']);
    }

    // Check MCC code if available
    if (transaction.mcc) {
      const mccMatch = this.matchByMCC(transaction.mcc);
      if (mccMatch) {
        return this.buildResult(transaction, mccMatch.category, 0.9, ['mcc']);
      }
    }

    // Pattern matching
    for (const pattern of categoryPatterns) {
      // Check regex patterns
      for (const regex of pattern.patterns) {
        if (regex.test(description) || regex.test(merchantName)) {
          // Cache merchant
          if (merchantName) {
            this.merchantCache.set(merchantName, pattern.category);
          }
          return this.buildResult(transaction, pattern.category, 0.85, pattern.subCategory ? [pattern.subCategory.toLowerCase()] : []);
        }
      }

      // Check keywords
      const allKeywords = [...pattern.keywords, ...pattern.keywordsHi];
      for (const keyword of allKeywords) {
        if (description.includes(keyword.toLowerCase()) || merchantName.includes(keyword.toLowerCase())) {
          if (merchantName) {
            this.merchantCache.set(merchantName, pattern.category);
          }
          return this.buildResult(transaction, pattern.category, 0.75, []);
        }
      }
    }

    // Special cases
    if (transaction.type === 'CREDIT' && (description.includes('salary') || description.includes('credited'))) {
      return this.buildResult(transaction, 'INCOME', 0.9, ['salary']);
    }

    if (transaction.mode === 'MANDATE') {
      return this.buildResult(transaction, 'EMI_LOAN', 0.7, ['mandate']);
    }

    // AI fallback for uncategorized transactions
    if (this.aiClient && transaction.amount > 1000) {
      try {
        const aiCategory = await this.categorizeWithAI(transaction);
        if (aiCategory) {
          return this.buildResult(transaction, aiCategory.category, aiCategory.confidence, ['ai']);
        }
      } catch (error) {
        logger.warn(`AI categorization failed: ${error}`);
      }
    }

    // Default to OTHER
    return this.buildResult(transaction, 'OTHER', 0.3, []);
  }

  /**
   * Batch categorize transactions
   */
  async categorizeBatch(transactions: Transaction[]): Promise<CategorizedTransaction[]> {
    return Promise.all(transactions.map((t) => this.categorize(t)));
  }

  /**
   * Generate spending summary
   */
  async generateSummary(
    transactions: CategorizedTransaction[],
    previousPeriodTransactions?: CategorizedTransaction[]
  ): Promise<SpendingSummary> {
    // Filter by period
    const debitTxns = transactions.filter((t) => t.type === 'DEBIT');
    const creditTxns = transactions.filter((t) => t.type === 'CREDIT');

    const totalExpenses = debitTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalIncome = creditTxns
      .filter((t) => t.category === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Category breakdown
    const categoryTotals: Record<SpendingCategory, { amount: number; count: number }> = {} as any;
    for (const txn of debitTxns) {
      if (!categoryTotals[txn.category]) {
        categoryTotals[txn.category] = { amount: 0, count: 0 };
      }
      categoryTotals[txn.category].amount += Math.abs(txn.amount);
      categoryTotals[txn.category].count++;
    }

    // Previous period for trends
    const prevCategoryTotals: Record<SpendingCategory, number> = {} as any;
    if (previousPeriodTransactions) {
      for (const txn of previousPeriodTransactions.filter((t) => t.type === 'DEBIT')) {
        prevCategoryTotals[txn.category] = (prevCategoryTotals[txn.category] || 0) + Math.abs(txn.amount);
      }
    }

    const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryTotals)
      .map(([category, data]) => {
        const prevAmount = prevCategoryTotals[category as SpendingCategory] || data.amount;
        const changePercent = prevAmount > 0 ? ((data.amount - prevAmount) / prevAmount) * 100 : 0;

        return {
          category: category as SpendingCategory,
          categoryNameHi: categoryNamesHi[category as SpendingCategory],
          amount: data.amount,
          percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
          transactionCount: data.count,
          trend: (changePercent > 5 ? 'UP' : changePercent < -5 ? 'DOWN' : 'STABLE') as 'UP' | 'DOWN' | 'STABLE',
          changePercent: Math.round(changePercent),
          icon: categoryIcons[category as SpendingCategory],
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Top merchants
    const merchantTotals: Record<string, MerchantSummary> = {};
    for (const txn of debitTxns) {
      const name = txn.merchantName || txn.description.substring(0, 30);
      if (!merchantTotals[name]) {
        merchantTotals[name] = {
          merchantName: name,
          category: txn.category,
          totalAmount: 0,
          transactionCount: 0,
          averageAmount: 0,
        };
      }
      merchantTotals[name].totalAmount += Math.abs(txn.amount);
      merchantTotals[name].transactionCount++;
    }

    const topMerchants = Object.values(merchantTotals)
      .map((m) => ({
        ...m,
        averageAmount: m.totalAmount / m.transactionCount,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Trends
    const trends: SpendingTrend[] = categoryBreakdown
      .filter((c) => c.trend !== 'STABLE')
      .slice(0, 5)
      .map((c) => ({
        category: c.category,
        direction: c.trend,
        changePercent: c.changePercent,
        message: `${c.category.replace('_', ' ')} spending ${c.trend === 'UP' ? 'increased' : 'decreased'} by ${Math.abs(c.changePercent)}%`,
        messageHi: `${c.categoryNameHi} खर्च ${c.trend === 'UP' ? 'बढ़ा' : 'घटा'} ${Math.abs(c.changePercent)}%`,
      }));

    // Anomalies
    const anomalies: SpendingAnomaly[] = [];
    const avgByCategory: Record<string, number> = {};
    for (const txn of debitTxns) {
      if (!avgByCategory[txn.category]) {
        const catTxns = debitTxns.filter((t) => t.category === txn.category);
        avgByCategory[txn.category] = catTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0) / catTxns.length;
      }
      if (Math.abs(txn.amount) > avgByCategory[txn.category] * 3) {
        anomalies.push({
          transactionId: txn.id,
          type: 'UNUSUAL_AMOUNT',
          severity: Math.abs(txn.amount) > avgByCategory[txn.category] * 5 ? 'HIGH' : 'MEDIUM',
          message: `Unusually high ${txn.category} expense: ₹${Math.abs(txn.amount).toLocaleString()}`,
          messageHi: `असामान्य रूप से अधिक ${categoryNamesHi[txn.category]} खर्च: ₹${Math.abs(txn.amount).toLocaleString()}`,
        });
      }
    }

    // Insights
    const insights: SpendingInsight[] = this.generateInsights(categoryBreakdown, savingsRate, totalExpenses, totalIncome);

    // Period
    const dates = transactions.map((t) => new Date(t.date).getTime());
    const period = {
      from: new Date(Math.min(...dates)).toISOString().split('T')[0],
      to: new Date(Math.max(...dates)).toISOString().split('T')[0],
    };

    return {
      period,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate: Math.round(savingsRate * 10) / 10,
      categoryBreakdown,
      topMerchants,
      trends,
      anomalies,
      insights,
    };
  }

  // Private helpers

  private matchByMCC(mcc: string): CategoryPattern | null {
    return categoryPatterns.find((p) => p.mccCodes?.includes(mcc)) || null;
  }

  private buildResult(
    transaction: Transaction,
    category: SpendingCategory,
    confidence: number,
    tags: string[]
  ): CategorizedTransaction {
    return {
      ...transaction,
      category,
      confidence,
      tags,
      isRecurring: transaction.mode === 'MANDATE' || tags.includes('subscription'),
    };
  }

  private async categorizeWithAI(transaction: Transaction): Promise<{ category: SpendingCategory; confidence: number } | null> {
    if (!this.aiClient) return null;

    try {
      const response = await this.aiClient.complete({
        model: 'claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: `You are a transaction categorizer. Categorize the transaction into ONE of: ${Object.keys(categoryNamesHi).join(', ')}.
Respond only with JSON: {"category": "CATEGORY_NAME", "confidence": 0.8}`,
          },
          {
            role: 'user',
            content: `Transaction: "${transaction.description}", Amount: ₹${transaction.amount}, Mode: ${transaction.mode || 'Unknown'}`,
          },
        ],
        maxTokens: 50,
      });

      return JSON.parse(response.content);
    } catch {
      return null;
    }
  }

  private generateInsights(
    breakdown: CategoryBreakdown[],
    savingsRate: number,
    totalExpenses: number,
    totalIncome: number
  ): SpendingInsight[] {
    const insights: SpendingInsight[] = [];

    // Savings rate insight
    if (savingsRate >= 30) {
      insights.push({
        type: 'POSITIVE',
        icon: '🌟',
        message: `Great savings rate of ${savingsRate.toFixed(0)}%! You're saving more than 70% of people in your income bracket.`,
        messageHi: `शानदार बचत दर ${savingsRate.toFixed(0)}%! आप अपनी आय वर्ग में 70% लोगों से ज्यादा बचत कर रहे हैं।`,
        actionable: false,
      });
    } else if (savingsRate < 10) {
      insights.push({
        type: 'WARNING',
        icon: '⚠️',
        message: `Low savings rate of ${savingsRate.toFixed(0)}%. Consider reducing discretionary spending.`,
        messageHi: `कम बचत दर ${savingsRate.toFixed(0)}%। विवेकाधीन खर्च कम करने पर विचार करें।`,
        actionable: true,
        suggestedAction: 'Review entertainment and shopping expenses',
      });
    }

    // Top category insights
    const topCategory = breakdown[0];
    if (topCategory && topCategory.percentage > 40) {
      insights.push({
        type: 'INFO',
        icon: topCategory.icon,
        message: `${topCategory.category.replace('_', ' ')} is your biggest expense category (${topCategory.percentage.toFixed(0)}% of spending).`,
        messageHi: `${topCategory.categoryNameHi} आपकी सबसे बड़ी खर्च श्रेणी है (खर्च का ${topCategory.percentage.toFixed(0)}%)।`,
        actionable: false,
      });
    }

    // Food spending
    const foodSpending = breakdown.find((b) => b.category === 'FOOD_DINING');
    if (foodSpending && foodSpending.percentage > 25) {
      insights.push({
        type: 'WARNING',
        icon: '🍔',
        message: `Food & dining is ${foodSpending.percentage.toFixed(0)}% of your spending. Consider meal planning.`,
        messageHi: `खाना ${foodSpending.percentage.toFixed(0)}% खर्च है। भोजन योजना पर विचार करें।`,
        actionable: true,
        suggestedAction: 'Try cooking at home more often',
      });
    }

    // Subscription reminder
    const subscriptions = breakdown.find((b) => b.category === 'SUBSCRIPTION');
    if (subscriptions && subscriptions.transactionCount > 3) {
      insights.push({
        type: 'INFO',
        icon: '📅',
        message: `You have ${subscriptions.transactionCount} active subscriptions. Review if you're using all of them.`,
        messageHi: `आपके ${subscriptions.transactionCount} सक्रिय सब्सक्रिप्शन हैं। देखें कि आप सभी का उपयोग कर रहे हैं या नहीं।`,
        actionable: true,
        suggestedAction: 'Cancel unused subscriptions',
      });
    }

    return insights;
  }
}

// Export singleton factory
export function createSpendingCategorizer(options?: { aiClient?: AIClient }) {
  return new SpendingCategorizer(options);
}

/** Default spending categorizer instance (without AI) */
export const spendingCategorizer = new SpendingCategorizer();

/** Category names in Hindi (exported for UI use) */
export { categoryNamesHi };

/** Category icons (exported for UI use) */
export { categoryIcons };
