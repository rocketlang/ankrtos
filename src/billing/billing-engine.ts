// Billing Engine for ankrICD
// Customer management, tariffs, invoicing, demurrage, payments

import { v4 as uuidv4 } from 'uuid';
import type {
  UUID,
  OperationResult,
  PaginatedResult,
  Currency,
  Address,
} from '../types/common';
import type {
  Customer,
  CustomerType,
  Tariff,
  TariffCharge,
  ChargeType,
  Invoice,
  InvoiceType,
  InvoiceStatus,
  InvoiceLineItem,
  Payment,
  DemurrageCalculation,
  DetentionCalculation,
} from '../types/billing';
import type { ContainerSize } from '../types/container';
import { emit } from '../core';

// ============================================================================
// BILLING ENGINE
// ============================================================================

export class BillingEngine {
  private static instance: BillingEngine | null = null;

  // In-memory stores
  private customers: Map<UUID, Customer> = new Map();
  private tariffs: Map<UUID, Tariff> = new Map();
  private invoices: Map<UUID, Invoice> = new Map();
  private payments: Map<UUID, Payment> = new Map();
  private demurrageCalcs: Map<UUID, DemurrageCalculation> = new Map();
  private detentionCalcs: Map<UUID, DetentionCalculation> = new Map();

  private invoiceCounter = 0;

  private constructor() {}

  static getInstance(): BillingEngine {
    if (!BillingEngine.instance) {
      BillingEngine.instance = new BillingEngine();
    }
    return BillingEngine.instance;
  }

  static resetInstance(): void {
    BillingEngine.instance = null;
  }

  // ============================================================================
  // CUSTOMER MANAGEMENT
  // ============================================================================

  /**
   * Register a new customer
   */
  registerCustomer(input: RegisterCustomerInput): OperationResult<Customer> {
    const existing = Array.from(this.customers.values()).find(
      c => c.code === input.code && c.tenantId === input.tenantId
    );
    if (existing) {
      return {
        success: false,
        error: `Customer code ${input.code} already exists`,
        errorCode: 'DUPLICATE_CUSTOMER',
      };
    }

    const customer: Customer = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      code: input.code,
      name: input.name,
      legalName: input.legalName,
      type: input.type,
      status: 'active',
      iecCode: input.iecCode,
      gstInfo: input.gstInfo,
      panNumber: input.panNumber,
      cinNumber: input.cinNumber,
      address: input.address,
      billingAddress: input.billingAddress ?? input.address,
      contacts: input.contacts ?? [],
      email: input.email,
      phone: input.phone,
      bankDetails: input.bankDetails,
      creditLimit: input.creditLimit ?? 0,
      currentOutstanding: 0,
      paymentTerms: input.paymentTerms ?? 30,
      creditStatus: 'good',
      preferredCurrency: input.preferredCurrency ?? 'INR',
      invoiceEmail: input.invoiceEmail,
      invoiceFrequency: input.invoiceFrequency ?? 'per_container',
      totalContainersHandled: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.customers.set(customer.id, customer);

    return { success: true, data: customer };
  }

  /**
   * Get customer by ID
   */
  getCustomer(customerId: UUID): Customer | undefined {
    return this.customers.get(customerId);
  }

  /**
   * Find customer by code
   */
  findCustomerByCode(tenantId: string, code: string): Customer | undefined {
    return Array.from(this.customers.values()).find(
      c => c.code === code && c.tenantId === tenantId
    );
  }

  /**
   * List customers
   */
  listCustomers(options: CustomerQueryOptions = {}): PaginatedResult<Customer> {
    let items = Array.from(this.customers.values());

    if (options.tenantId) {
      items = items.filter(c => c.tenantId === options.tenantId);
    }
    if (options.facilityId) {
      items = items.filter(c => c.facilityId === options.facilityId);
    }
    if (options.type) {
      items = items.filter(c => c.type === options.type);
    }
    if (options.status) {
      items = items.filter(c => c.status === options.status);
    }
    if (options.creditStatus) {
      items = items.filter(c => c.creditStatus === options.creditStatus);
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      items = items.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.legalName.toLowerCase().includes(q)
      );
    }

    const total = items.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    items = items.slice(offset, offset + pageSize);

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Update customer credit
   */
  updateCreditLimit(customerId: UUID, creditLimit: number): OperationResult<Customer> {
    const customer = this.customers.get(customerId);
    if (!customer) {
      return { success: false, error: 'Customer not found', errorCode: 'NOT_FOUND' };
    }

    customer.creditLimit = creditLimit;
    customer.updatedAt = new Date();
    this._checkCreditStatus(customer);
    this.customers.set(customerId, customer);

    return { success: true, data: customer };
  }

  /**
   * Adjust outstanding balance
   */
  adjustOutstanding(customerId: UUID, amount: number): OperationResult<Customer> {
    const customer = this.customers.get(customerId);
    if (!customer) {
      return { success: false, error: 'Customer not found', errorCode: 'NOT_FOUND' };
    }

    customer.currentOutstanding += amount;
    customer.updatedAt = new Date();
    this._checkCreditStatus(customer);
    this.customers.set(customerId, customer);

    return { success: true, data: customer };
  }

  private _checkCreditStatus(customer: Customer): void {
    if (customer.creditLimit <= 0) {
      customer.creditStatus = 'good';
      return;
    }

    const ratio = customer.currentOutstanding / customer.creditLimit;
    if (ratio >= 1) {
      customer.creditStatus = 'blocked';
      emit('billing.credit_limit_exceeded', {
        customerId: customer.id,
        customerCode: customer.code,
        customerName: customer.name,
        outstanding: customer.currentOutstanding,
        creditLimit: customer.creditLimit,
      }, { tenantId: customer.tenantId });
    } else if (ratio >= 0.8) {
      customer.creditStatus = 'warning';
      emit('billing.credit_limit_warning', {
        customerId: customer.id,
        customerCode: customer.code,
        customerName: customer.name,
        outstanding: customer.currentOutstanding,
        creditLimit: customer.creditLimit,
        utilizationPercent: ratio * 100,
      }, { tenantId: customer.tenantId });
    } else {
      customer.creditStatus = 'good';
    }
  }

  // ============================================================================
  // TARIFF MANAGEMENT
  // ============================================================================

  /**
   * Create a tariff
   */
  createTariff(input: CreateTariffInput): OperationResult<Tariff> {
    const existing = Array.from(this.tariffs.values()).find(
      t => t.tariffCode === input.tariffCode && t.tenantId === input.tenantId && t.isActive
    );
    if (existing) {
      return {
        success: false,
        error: `Active tariff with code ${input.tariffCode} already exists`,
        errorCode: 'DUPLICATE_TARIFF',
      };
    }

    const tariff: Tariff = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      tariffCode: input.tariffCode,
      name: input.name,
      description: input.description,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      isActive: true,
      applicableContainerSizes: input.applicableContainerSizes,
      applicableContainerTypes: input.applicableContainerTypes,
      applicableCustomerTypes: input.applicableCustomerTypes,
      applicableCustomerIds: input.applicableCustomerIds,
      applicableCargoTypes: input.applicableCargoTypes,
      charges: input.charges.map(c => ({
        ...c,
        id: c.id ?? uuidv4(),
      })),
      termsAndConditions: input.termsAndConditions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tariffs.set(tariff.id, tariff);

    return { success: true, data: tariff };
  }

  /**
   * Get tariff by ID
   */
  getTariff(tariffId: UUID): Tariff | undefined {
    return this.tariffs.get(tariffId);
  }

  /**
   * Find applicable tariff for a charge
   */
  findApplicableTariff(
    tenantId: string,
    chargeType: ChargeType,
    _containerSize?: ContainerSize,
    customerType?: CustomerType,
    customerId?: UUID
  ): TariffCharge | undefined {
    const now = new Date();
    const activeTariffs = Array.from(this.tariffs.values()).filter(
      t => t.tenantId === tenantId &&
           t.isActive &&
           t.effectiveFrom <= now &&
           (!t.effectiveTo || t.effectiveTo >= now)
    );

    // Priority: customer-specific > customer-type > general
    for (const tariff of activeTariffs) {
      if (customerId && tariff.applicableCustomerIds?.includes(customerId)) {
        const charge = tariff.charges.find(c => c.chargeType === chargeType);
        if (charge) return charge;
      }
    }

    for (const tariff of activeTariffs) {
      if (customerType && tariff.applicableCustomerTypes?.includes(customerType)) {
        const charge = tariff.charges.find(c => c.chargeType === chargeType);
        if (charge) return charge;
      }
    }

    for (const tariff of activeTariffs) {
      if (!tariff.applicableCustomerIds?.length && !tariff.applicableCustomerTypes?.length) {
        const charge = tariff.charges.find(c => c.chargeType === chargeType);
        if (charge) return charge;
      }
    }

    return undefined;
  }

  /**
   * List tariffs
   */
  listTariffs(options: TariffQueryOptions = {}): PaginatedResult<Tariff> {
    let items = Array.from(this.tariffs.values());

    if (options.tenantId) {
      items = items.filter(t => t.tenantId === options.tenantId);
    }
    if (options.activeOnly) {
      items = items.filter(t => t.isActive);
    }
    if (options.chargeType) {
      items = items.filter(t => t.charges.some(c => c.chargeType === options.chargeType));
    }

    const total = items.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    items = items.slice(offset, offset + pageSize);

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  // ============================================================================
  // INVOICE MANAGEMENT
  // ============================================================================

  /**
   * Create an invoice
   */
  createInvoice(input: CreateInvoiceInput): OperationResult<Invoice> {
    const customer = this.customers.get(input.customerId);
    if (!customer) {
      return { success: false, error: 'Customer not found', errorCode: 'NOT_FOUND' };
    }

    this.invoiceCounter++;
    const invoiceNumber = input.invoiceNumber ??
      `INV-${input.facilityId.substring(0, 4).toUpperCase()}-${String(this.invoiceCounter).padStart(6, '0')}`;

    // Calculate totals from line items
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const lineItems: InvoiceLineItem[] = input.lineItems.map((li, idx) => {
      const amount = li.quantity * li.rate;
      const taxableAmount = li.taxable ? amount : 0;
      const gstRate = li.gstRate ?? 18;
      const cgst = li.isInterState ? 0 : taxableAmount * (gstRate / 2) / 100;
      const sgst = li.isInterState ? 0 : taxableAmount * (gstRate / 2) / 100;
      const igst = li.isInterState ? taxableAmount * gstRate / 100 : 0;
      const lineTotal = amount + cgst + sgst + igst;

      subtotal += amount;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;

      return {
        id: uuidv4(),
        lineNumber: idx + 1,
        chargeCode: li.chargeCode,
        chargeName: li.chargeName,
        chargeType: li.chargeType,
        description: li.description,
        containerId: li.containerId,
        containerNumber: li.containerNumber,
        containerSize: li.containerSize,
        periodFrom: li.periodFrom,
        periodTo: li.periodTo,
        days: li.days,
        quantity: li.quantity,
        unit: li.unit ?? 'nos',
        rate: li.rate,
        amount,
        hsnCode: li.hsnCode,
        sacCode: li.sacCode,
        taxable: li.taxable ?? true,
        gstRate: li.gstRate ?? 18,
        cgst,
        sgst,
        igst,
        lineTotal,
      };
    });

    const discountAmount = input.discountAmount ?? 0;
    const taxableAmount = subtotal - discountAmount;
    const totalTax = totalCgst + totalSgst + totalIgst;
    const totalBeforeRound = taxableAmount + totalTax;
    const roundOff = Math.round(totalBeforeRound) - totalBeforeRound;
    const totalAmount = totalBeforeRound + roundOff;

    const dueDate = input.dueDate ?? new Date(
      Date.now() + customer.paymentTerms * 24 * 60 * 60 * 1000
    );

    const invoice: Invoice = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      invoiceNumber,
      invoiceType: input.invoiceType ?? 'standard',
      status: 'draft',
      customerId: customer.id,
      customerCode: customer.code,
      customerName: customer.name,
      customerGstin: customer.gstInfo?.gstin,
      billingAddress: customer.billingAddress ?? customer.address,
      invoiceDate: input.invoiceDate ?? new Date(),
      dueDate,
      periodFrom: input.periodFrom,
      periodTo: input.periodTo,
      lineItems,
      subtotal,
      discountAmount,
      taxableAmount,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      totalTax,
      roundOff,
      totalAmount,
      currency: input.currency ?? customer.preferredCurrency,
      paidAmount: 0,
      balanceAmount: totalAmount,
      linkedInvoiceId: input.linkedInvoiceId,
      linkedInvoiceNumber: input.linkedInvoiceNumber,
      referenceNumbers: input.referenceNumbers,
      poNumber: input.poNumber,
      paymentTerms: customer.paymentTerms,
      paymentHistory: [],
      notes: input.notes,
      internalNotes: input.internalNotes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.invoices.set(invoice.id, invoice);

    emit('billing.invoice_created', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: customer.id,
      customerName: customer.name,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      lineItemCount: invoice.lineItems.length,
    }, { tenantId: invoice.tenantId });

    return { success: true, data: invoice };
  }

  /**
   * Get invoice by ID
   */
  getInvoice(invoiceId: UUID): Invoice | undefined {
    return this.invoices.get(invoiceId);
  }

  /**
   * Find invoice by number
   */
  findInvoiceByNumber(tenantId: string, invoiceNumber: string): Invoice | undefined {
    return Array.from(this.invoices.values()).find(
      i => i.invoiceNumber === invoiceNumber && i.tenantId === tenantId
    );
  }

  /**
   * Approve invoice
   */
  approveInvoice(invoiceId: UUID, approvedBy: string): OperationResult<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      return { success: false, error: 'Invoice not found', errorCode: 'NOT_FOUND' };
    }

    if (invoice.status !== 'draft' && invoice.status !== 'pending_approval') {
      return {
        success: false,
        error: `Cannot approve invoice in status ${invoice.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    invoice.status = 'approved';
    invoice.approvedAt = new Date();
    invoice.approvedBy = approvedBy;
    invoice.updatedAt = new Date();
    this.invoices.set(invoiceId, invoice);

    // Update customer outstanding
    this.adjustOutstanding(invoice.customerId, invoice.totalAmount);

    emit('billing.invoice_approved', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      totalAmount: invoice.totalAmount,
      approvedBy,
    }, { tenantId: invoice.tenantId });

    return { success: true, data: invoice };
  }

  /**
   * Send invoice
   */
  sendInvoice(invoiceId: UUID): OperationResult<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      return { success: false, error: 'Invoice not found', errorCode: 'NOT_FOUND' };
    }

    if (invoice.status !== 'approved') {
      return {
        success: false,
        error: `Cannot send invoice in status ${invoice.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    invoice.status = 'sent';
    invoice.updatedAt = new Date();
    this.invoices.set(invoiceId, invoice);

    emit('billing.invoice_sent', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      totalAmount: invoice.totalAmount,
      dueDate: invoice.dueDate,
    }, { tenantId: invoice.tenantId });

    return { success: true, data: invoice };
  }

  /**
   * Cancel invoice
   */
  cancelInvoice(invoiceId: UUID, reason: string): OperationResult<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      return { success: false, error: 'Invoice not found', errorCode: 'NOT_FOUND' };
    }

    if (['paid', 'cancelled', 'written_off'].includes(invoice.status)) {
      return {
        success: false,
        error: `Cannot cancel invoice in status ${invoice.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    // Reverse outstanding if it was approved
    if (['approved', 'sent', 'partially_paid', 'overdue', 'disputed'].includes(invoice.status)) {
      this.adjustOutstanding(invoice.customerId, -invoice.balanceAmount);
    }

    invoice.status = 'cancelled';
    invoice.internalNotes = (invoice.internalNotes ? invoice.internalNotes + '\n' : '') +
      `Cancelled: ${reason}`;
    invoice.updatedAt = new Date();
    this.invoices.set(invoiceId, invoice);

    emit('billing.invoice_cancelled', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      reason,
    }, { tenantId: invoice.tenantId });

    return { success: true, data: invoice };
  }

  /**
   * List invoices
   */
  listInvoices(options: InvoiceQueryOptions = {}): PaginatedResult<Invoice> {
    let items = Array.from(this.invoices.values());

    if (options.tenantId) {
      items = items.filter(i => i.tenantId === options.tenantId);
    }
    if (options.facilityId) {
      items = items.filter(i => i.facilityId === options.facilityId);
    }
    if (options.customerId) {
      items = items.filter(i => i.customerId === options.customerId);
    }
    if (options.status) {
      items = items.filter(i => i.status === options.status);
    }
    if (options.statuses) {
      items = items.filter(i => options.statuses!.includes(i.status));
    }
    if (options.invoiceType) {
      items = items.filter(i => i.invoiceType === options.invoiceType);
    }
    if (options.fromDate) {
      items = items.filter(i => i.invoiceDate >= options.fromDate!);
    }
    if (options.toDate) {
      items = items.filter(i => i.invoiceDate <= options.toDate!);
    }
    if (options.overdueOnly) {
      const now = new Date();
      items = items.filter(i =>
        i.balanceAmount > 0 && i.dueDate < now &&
        ['sent', 'partially_paid'].includes(i.status)
      );
    }

    // Sort by date descending
    items.sort((a, b) => b.invoiceDate.getTime() - a.invoiceDate.getTime());

    const total = items.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    items = items.slice(offset, offset + pageSize);

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  // ============================================================================
  // PAYMENT MANAGEMENT
  // ============================================================================

  /**
   * Record a payment against an invoice
   */
  recordPayment(input: RecordPaymentInput): OperationResult<Payment> {
    const invoice = this.invoices.get(input.invoiceId);
    if (!invoice) {
      return { success: false, error: 'Invoice not found', errorCode: 'NOT_FOUND' };
    }

    if (['cancelled', 'written_off', 'paid'].includes(invoice.status)) {
      return {
        success: false,
        error: `Cannot record payment for invoice in status ${invoice.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    if (input.amount > invoice.balanceAmount) {
      return {
        success: false,
        error: `Payment amount (${input.amount}) exceeds balance (${invoice.balanceAmount})`,
        errorCode: 'AMOUNT_EXCEEDED',
      };
    }

    const payment: Payment = {
      id: uuidv4(),
      invoiceId: input.invoiceId,
      paymentDate: input.paymentDate ?? new Date(),
      amount: input.amount,
      currency: invoice.currency,
      paymentMethod: input.paymentMethod,
      reference: input.reference,
      chequeNumber: input.chequeNumber,
      bankName: input.bankName,
      utrNumber: input.utrNumber,
      status: 'pending',
      notes: input.notes,
      receivedBy: input.receivedBy,
    };

    this.payments.set(payment.id, payment);
    invoice.paymentHistory.push(payment);
    invoice.updatedAt = new Date();
    this.invoices.set(invoice.id, invoice);

    emit('billing.payment_received', {
      paymentId: payment.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
    }, { tenantId: invoice.tenantId });

    return { success: true, data: payment };
  }

  /**
   * Confirm a payment
   */
  confirmPayment(paymentId: UUID): OperationResult<Payment> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return { success: false, error: 'Payment not found', errorCode: 'NOT_FOUND' };
    }

    if (payment.status !== 'pending') {
      return {
        success: false,
        error: `Cannot confirm payment in status ${payment.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    payment.status = 'confirmed';

    const invoice = this.invoices.get(payment.invoiceId);
    if (invoice) {
      invoice.paidAmount += payment.amount;
      invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;

      if (invoice.balanceAmount <= 0) {
        invoice.status = 'paid';
      } else {
        invoice.status = 'partially_paid';
      }

      invoice.updatedAt = new Date();
      this.invoices.set(invoice.id, invoice);

      // Reduce customer outstanding
      this.adjustOutstanding(invoice.customerId, -payment.amount);

      emit('billing.payment_confirmed', {
        paymentId: payment.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: payment.amount,
        invoiceStatus: invoice.status,
        remainingBalance: invoice.balanceAmount,
      }, { tenantId: invoice.tenantId });
    }

    this.payments.set(paymentId, payment);

    return { success: true, data: payment };
  }

  // ============================================================================
  // DEMURRAGE CALCULATION
  // ============================================================================

  /**
   * Calculate demurrage for a container
   */
  calculateDemurrage(input: CalculateDemurrageInput): OperationResult<DemurrageCalculation> {
    const freeDays = input.freeDays ?? 3; // Default 3 free days (India ICD standard)
    const freeTimeStart = input.freeTimeStart ?? input.arrivalDate;
    const freeTimeExpiry = new Date(freeTimeStart);
    freeTimeExpiry.setDate(freeTimeExpiry.getDate() + freeDays);

    const calcDate = input.calculationDate ?? new Date();
    const totalDays = Math.ceil(
      (calcDate.getTime() - freeTimeStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const chargeableDays = Math.max(0, totalDays - freeDays);
    const freeTimeUsed = Math.min(totalDays, freeDays);
    const freeTimeRemaining = Math.max(0, freeDays - totalDays);

    // Calculate slab-based charges
    const slabs = input.slabs ?? [
      { fromDay: 1, toDay: 3, rate: input.defaultRate ?? 100 },
      { fromDay: 4, toDay: 7, rate: (input.defaultRate ?? 100) * 1.5 },
      { fromDay: 8, toDay: 15, rate: (input.defaultRate ?? 100) * 2 },
      { fromDay: 16, toDay: null, rate: (input.defaultRate ?? 100) * 3 },
    ];

    let subtotal = 0;
    const slabBreakdown: DemurrageCalculation['slabBreakdown'] = [];
    let remainingDays = chargeableDays;

    for (const slab of slabs) {
      if (remainingDays <= 0) break;

      const slabDays = slab.toDay
        ? Math.min(remainingDays, slab.toDay - slab.fromDay + 1)
        : remainingDays;

      // Get size-specific rate
      let rate = slab.rate;
      if (input.containerSize === '40' && slab.rate40) {
        rate = slab.rate40;
      } else if (input.containerSize === '20' && slab.rate20) {
        rate = slab.rate20;
      }

      const amount = slabDays * rate;
      subtotal += amount;

      slabBreakdown.push({
        fromDay: slab.fromDay,
        toDay: slab.toDay ?? slab.fromDay + slabDays - 1,
        days: slabDays,
        rate,
        amount,
      });

      remainingDays -= slabDays;
    }

    const gstRate = input.gstRate ?? 18;
    const gst = subtotal * gstRate / 100;
    const totalDemurrage = subtotal + gst;

    const calc: DemurrageCalculation = {
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      containerSize: input.containerSize,
      arrivalDate: input.arrivalDate,
      freeTimeStart,
      freeTimeExpiry,
      calculationDate: calcDate,
      freeDays,
      freeTimeUsed,
      freeTimeRemaining,
      totalDays,
      chargeableDays,
      isOverdue: chargeableDays > 0,
      slabBreakdown,
      subtotal,
      gst,
      totalDemurrage,
      currency: input.currency ?? 'INR',
      invoiced: false,
    };

    const calcId = uuidv4();
    this.demurrageCalcs.set(calcId, calc);

    if (chargeableDays > 0) {
      emit('billing.demurrage_calculated', {
        containerId: input.containerId,
        containerNumber: input.containerNumber,
        chargeableDays,
        totalDemurrage,
        currency: calc.currency,
      }, { tenantId: input.tenantId });
    }

    // Emit free time alerts
    if (freeTimeRemaining <= 1 && freeTimeRemaining > 0) {
      emit('billing.free_time_expiring', {
        containerId: input.containerId,
        containerNumber: input.containerNumber,
        freeTimeRemaining,
        freeTimeExpiry,
      }, { tenantId: input.tenantId });
    }

    if (freeTimeRemaining <= 0 && chargeableDays === 1) {
      emit('billing.free_time_expired', {
        containerId: input.containerId,
        containerNumber: input.containerNumber,
        expiredAt: freeTimeExpiry,
      }, { tenantId: input.tenantId });
    }

    return { success: true, data: calc };
  }

  /**
   * Calculate detention for a container
   */
  calculateDetention(input: CalculateDetentionInput): OperationResult<DetentionCalculation> {
    const freeDays = input.freeDays ?? 7;
    const freeTimeExpiry = new Date(input.gateOutDate);
    freeTimeExpiry.setDate(freeTimeExpiry.getDate() + freeDays);

    const calcDate = input.returnDate ?? input.calculationDate ?? new Date();
    const totalDays = Math.ceil(
      (calcDate.getTime() - input.gateOutDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const chargeableDays = Math.max(0, totalDays - freeDays);

    const dailyRate = input.dailyRate ?? (input.containerSize === '40' ? 2000 : 1000);
    const totalDetention = chargeableDays * dailyRate;

    const calc: DetentionCalculation = {
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      containerSize: input.containerSize,
      shippingLine: input.shippingLine,
      gateOutDate: input.gateOutDate,
      freeTimeExpiry,
      returnDate: input.returnDate,
      calculationDate: calcDate,
      freeDays,
      totalDays,
      chargeableDays,
      dailyRate,
      totalDetention,
      currency: input.currency ?? 'INR',
      status: input.returnDate ? 'closed' : 'accruing',
    };

    const calcId = uuidv4();
    this.detentionCalcs.set(calcId, calc);

    return { success: true, data: calc };
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get billing statistics
   */
  getBillingStats(tenantId: string): BillingStats {
    const customers = Array.from(this.customers.values()).filter(c => c.tenantId === tenantId);
    const invoices = Array.from(this.invoices.values()).filter(i => i.tenantId === tenantId);
    const now = new Date();

    const activeInvoices = invoices.filter(i =>
      !['cancelled', 'written_off'].includes(i.status)
    );
    const overdueInvoices = invoices.filter(i =>
      i.balanceAmount > 0 && i.dueDate < now &&
      ['sent', 'partially_paid'].includes(i.status)
    );

    const totalBilled = activeInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalCollected = activeInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalOutstanding = activeInvoices.reduce((sum, i) => sum + i.balanceAmount, 0);
    const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.balanceAmount, 0);

    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      blockedCustomers: customers.filter(c => c.creditStatus === 'blocked').length,
      totalInvoices: activeInvoices.length,
      draftInvoices: invoices.filter(i => i.status === 'draft').length,
      pendingInvoices: invoices.filter(i => ['approved', 'sent'].includes(i.status)).length,
      paidInvoices: invoices.filter(i => i.status === 'paid').length,
      overdueInvoices: overdueInvoices.length,
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      collectionRate: totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0,
    };
  }
}

// ============================================================================
// SINGLETON ACCESS
// ============================================================================

let billingEngineInstance: BillingEngine | null = null;

export function getBillingEngine(): BillingEngine {
  if (!billingEngineInstance) {
    billingEngineInstance = BillingEngine.getInstance();
  }
  return billingEngineInstance;
}

export function setBillingEngine(engine: BillingEngine): void {
  billingEngineInstance = engine;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface RegisterCustomerInput {
  tenantId: string;
  facilityId: UUID;
  code: string;
  name: string;
  legalName: string;
  type: CustomerType;
  iecCode?: string;
  gstInfo?: { gstin: string; legalName: string; tradeName?: string; registeredAddress: Address; stateCode: string };
  panNumber?: string;
  cinNumber?: string;
  address: Address;
  billingAddress?: Address;
  contacts?: { name: string; email?: string; phone?: string; mobile?: string; designation?: string }[];
  email?: string;
  phone?: string;
  bankDetails?: { accountName: string; accountNumber: string; bankName: string; branchName: string; ifscCode: string; swiftCode?: string };
  creditLimit?: number;
  paymentTerms?: number;
  preferredCurrency?: Currency;
  invoiceEmail?: string;
  invoiceFrequency?: 'per_container' | 'daily' | 'weekly' | 'monthly';
}

export interface CustomerQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  type?: CustomerType;
  status?: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  creditStatus?: 'good' | 'warning' | 'blocked';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTariffInput {
  tenantId: string;
  facilityId: UUID;
  tariffCode: string;
  name: string;
  description?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  applicableContainerSizes?: ContainerSize[];
  applicableContainerTypes?: ('GP' | 'HC' | 'RF' | 'OT' | 'FR' | 'TK' | 'BU')[];
  applicableCustomerTypes?: CustomerType[];
  applicableCustomerIds?: UUID[];
  applicableCargoTypes?: string[];
  charges: (Omit<TariffCharge, 'id'> & { id?: UUID })[];
  termsAndConditions?: string;
}

export interface TariffQueryOptions {
  tenantId?: string;
  activeOnly?: boolean;
  chargeType?: ChargeType;
  page?: number;
  pageSize?: number;
}

export interface CreateInvoiceInput {
  tenantId: string;
  facilityId: UUID;
  customerId: UUID;
  invoiceNumber?: string;
  invoiceType?: InvoiceType;
  invoiceDate?: Date;
  dueDate?: Date;
  periodFrom?: Date;
  periodTo?: Date;
  lineItems: CreateInvoiceLineItemInput[];
  discountAmount?: number;
  currency?: Currency;
  linkedInvoiceId?: UUID;
  linkedInvoiceNumber?: string;
  referenceNumbers?: string[];
  poNumber?: string;
  notes?: string;
  internalNotes?: string;
}

export interface CreateInvoiceLineItemInput {
  chargeCode: string;
  chargeName: string;
  chargeType: ChargeType;
  description?: string;
  containerId?: UUID;
  containerNumber?: string;
  containerSize?: ContainerSize;
  periodFrom?: Date;
  periodTo?: Date;
  days?: number;
  quantity: number;
  unit?: string;
  rate: number;
  hsnCode?: string;
  sacCode?: string;
  taxable?: boolean;
  gstRate?: number;
  isInterState?: boolean;
}

export interface InvoiceQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  customerId?: UUID;
  status?: InvoiceStatus;
  statuses?: InvoiceStatus[];
  invoiceType?: InvoiceType;
  fromDate?: Date;
  toDate?: Date;
  overdueOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface RecordPaymentInput {
  invoiceId: UUID;
  amount: number;
  paymentDate?: Date;
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'online';
  reference?: string;
  chequeNumber?: string;
  bankName?: string;
  utrNumber?: string;
  notes?: string;
  receivedBy?: string;
}

export interface CalculateDemurrageInput {
  tenantId: string;
  containerId: UUID;
  containerNumber: string;
  containerSize: ContainerSize;
  arrivalDate: Date;
  freeTimeStart?: Date;
  calculationDate?: Date;
  freeDays?: number;
  defaultRate?: number;
  slabs?: { fromDay: number; toDay: number | null; rate: number; rate20?: number; rate40?: number }[];
  gstRate?: number;
  currency?: Currency;
}

export interface CalculateDetentionInput {
  containerId: UUID;
  containerNumber: string;
  containerSize: ContainerSize;
  shippingLine: string;
  gateOutDate: Date;
  returnDate?: Date;
  calculationDate?: Date;
  freeDays?: number;
  dailyRate?: number;
  currency?: Currency;
}

export interface BillingStats {
  totalCustomers: number;
  activeCustomers: number;
  blockedCustomers: number;
  totalInvoices: number;
  draftInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  collectionRate: number;
}
