# 🔥 DODD Account - Enhancements from Fr8X

**Date:** 2026-02-11
**Source:** `/root/ankr-labs-nx/apps/fr8x/backend/prisma/schema.prisma`
**Status:** Best practices identified, ready to enhance DODD

---

## 📊 Comparison: DODD vs Fr8X Accounting

### Already in DODD ✅

| Feature | Fr8X | DODD Account | Status |
|---------|------|--------------|--------|
| **GST Fields** | cgstAmount, sgstAmount, igstAmount | ✅ Complete | ✅ |
| **E-Invoice** | irn, ackNumber, signedQrCode | ✅ irn, ackNumber, qrCode, signedInvoice | ✅ Better |
| **E-Way Bill** | ewayBillNumber, valid Until | ✅ eWayBillNumber, validTill, vehicle, distance | ✅ Better |
| **TDS** | tdsRate, tdsAmount | ✅ tdsAmount, tdsSection, threshold | ✅ Better |
| **HSN/SAC Code** | hsCode, sacCode | ✅ hsnCode | ✅ |
| **Decimal Precision** | Decimal(15,2) | ✅ Decimal(15,2) | ✅ |
| **Currency** | INR default | ✅ INR + multi-currency | ✅ Better |

### Missing in DODD ❌ (To Add)

| Feature | Fr8X Has | DODD Needs | Priority |
|---------|----------|------------|----------|
| **Place of Supply** | ✅ placeOfSupply | ❌ | HIGH - GST |
| **Seller/Buyer GSTIN** | ✅ sellerGstin, buyerGstin | ❌ | HIGH - E-Invoice |
| **Payment Gateway** | ✅ Razorpay integration | ❌ | HIGH - Online payments |
| **Wallet System** | ✅ WalletTransaction | ❌ | MEDIUM - Prepaid |
| **PDF Generation** | ✅ pdfUrl | ❌ | MEDIUM - Invoice PDF |
| **Terms & Conditions** | ✅ termsAndConditions | ❌ | LOW - Nice to have |
| **Failed Payment Tracking** | ✅ failedAt, failureReason | ❌ | HIGH - UX |
| **Gateway Response** | ✅ gatewayResponse (Json) | ❌ | HIGH - Debugging |

### DODD Has (Fr8X Missing) ✅

| Feature | DODD Has | Fr8X Missing |
|---------|----------|--------------|
| **Multi-Company** | ✅ Full MNC support | ❌ |
| **Transfer Pricing** | ✅ All methods | ❌ |
| **TDS Sections** | ✅ All sections (194C, 194J, etc.) | ❌ |
| **GST Returns** | ✅ GSTR-1, 3B, 9, 9C | ❌ |
| **TDS Returns** | ✅ 24Q, 26Q, 27Q | ❌ |
| **Fiscal Year** | ✅ April-March support | ❌ |
| **Chart of Accounts** | ✅ 5-level hierarchy | ❌ |
| **Journal Entries** | ✅ Double-entry | ❌ |
| **Bank Reconciliation** | ✅ Full system | ❌ |
| **Audit Trail** | ✅ SOX-compliant | ❌ |
| **Intercompany** | ✅ MNC transactions | ❌ |

---

## 🎯 Recommended Enhancements for DODD

### 1. Add Place of Supply (GST Critical) ✅

```prisma
model Invoice {
  // ... existing fields

  // Place of Supply (for GST)
  placeOfSupply     String? // State code (e.g., "27-Maharashtra")
  placeOfSupplyCode String? // "27" for GST matching

  // Seller/Buyer GSTIN (for E-Invoice B2B)
  sellerGstin       String? // Company GSTIN
  buyerGstin        String? // Customer GSTIN (B2B)
  supplyType        GSTSupplyType? // B2B, B2C, EXPORT, SEZ

  @@index([placeOfSupplyCode])
  @@index([supplyType])
}

enum GSTSupplyType {
  B2B          // Business to Business (GSTIN required)
  B2C_LARGE    // B2C > ₹2.5L (E-Invoice required)
  B2C_SMALL    // B2C < ₹2.5L (No E-Invoice)
  EXPORT       // Export invoice
  SEZ          // Special Economic Zone
  DEEMED_EXPORT // Deemed export
}
```

**Why:** GST law requires "Place of Supply" to determine CGST+SGST (intra-state) vs IGST (inter-state)

### 2. Add Payment Gateway Integration ✅

```prisma
model Payment {
  // ... existing fields

  // Payment Gateway (Razorpay, PayU, CCAvenue, etc.)
  gatewayName          String? // "razorpay", "payu", "ccavenue"
  gatewayTransactionId String? // Gateway's transaction ID
  gatewayOrderId       String? // Gateway's order ID
  gatewayResponse      Json?   // Full gateway response (for debugging)

  // UPI/NEFT/RTGS Details
  utrNumber            String? // Unique Transaction Reference
  bankTransactionId    String? // Bank reference

  // Failure Tracking
  failedAt             DateTime?
  failureReason        String?
  retryCount           Int @default(0)

  @@index([gatewayTransactionId])
  @@index([utrNumber])
}
```

**Why:** India uses Razorpay, PayU, CCAvenue for online payments. Need to track gateway responses.

### 3. Add Wallet System (Prepaid Balance) ✅

```prisma
model Wallet {
  id             String   @id @default(uuid())
  companyId      String?  // For company wallet
  company        Company? @relation(fields: [companyId], references: [id])

  partnerId      String?  // For customer wallet
  partner        Partner? @relation(fields: [partnerId], references: [id])

  balance        Decimal @default(0) @db.Decimal(15, 2)
  currency       String  @default("INR")

  // Limits
  creditLimit    Decimal @default(0) @db.Decimal(15, 2)
  minBalance     Decimal @default(0) @db.Decimal(15, 2)

  isActive       Boolean @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  transactions   WalletTransaction[]

  @@unique([companyId])
  @@unique([partnerId])
}

model WalletTransaction {
  id                String   @id @default(uuid())
  walletId          String
  wallet            Wallet   @relation(fields: [walletId], references: [id])

  transactionNumber String   @unique
  type              WalletTransactionType
  amount            Decimal  @db.Decimal(15, 2)

  balanceBefore     Decimal  @db.Decimal(15, 2)
  balanceAfter      Decimal  @db.Decimal(15, 2)

  description       String
  reference         String?  // Invoice ID, Payment ID, etc.
  referenceType     String?  // "invoice", "payment", "refund"

  status            String   @default("COMPLETED")

  createdAt         DateTime @default(now())
  completedAt       DateTime?

  @@index([walletId])
  @@index([transactionNumber])
  @@index([reference])
}

enum WalletTransactionType {
  CREDIT       // Money added to wallet
  DEBIT        // Money deducted from wallet
  REFUND       // Refund to wallet
  REVERSAL     // Transaction reversal
  ADJUSTMENT   // Manual adjustment
}
```

**Why:** Many India B2B companies use prepaid wallets for faster payments

### 4. Add Invoice PDF Generation ✅

```prisma
model Invoice {
  // ... existing fields

  // PDF & Documents
  pdfUrl             String?  // S3/Cloudflare URL
  pdfGeneratedAt     DateTime?

  // Attachments (supporting documents)
  attachments        Json?    // Array of {name, url, type}

  // Terms & Conditions
  termsAndConditions String?  @db.Text
  paymentTerms       String?  // "Net 30", "Advance", etc.

  // Invoice Template
  templateId         String?  // Custom invoice template
}
```

**Why:** Need to generate and store invoice PDFs for customer download and email

### 5. Enhance Payment Status Tracking ✅

```prisma
model Payment {
  // ... existing fields

  // Payment Lifecycle
  status             PaymentStatus2 @default(PENDING)

  initiatedAt        DateTime  @default(now())
  authorizedAt       DateTime? // Card authorized
  capturedAt         DateTime? // Payment captured
  settledAt          DateTime? // Settled to bank account
  failedAt           DateTime?
  cancelledAt        DateTime?

  // Retries
  retryCount         Int @default(0)
  maxRetries         Int @default(3)
  nextRetryAt        DateTime?

  // Refunds
  refundedAmount     Decimal @default(0) @db.Decimal(15, 2)
  refundedAt         DateTime?
  refundReason       String?

  @@index([status])
  @@index([nextRetryAt])
}

enum PaymentStatus2 {
  PENDING        // Payment initiated
  AUTHORIZED     // Card authorized (not captured)
  CAPTURED       // Payment captured
  SETTLED        // Settled to bank
  FAILED         // Payment failed
  CANCELLED      // Payment cancelled
  REFUNDED       // Full refund
  PARTIAL_REFUND // Partial refund
}
```

**Why:** Better payment lifecycle tracking for debugging and reporting

---

## 📋 Enhanced DODD Schema (With Fr8X Best Practices)

### Changes to Invoice Model

```prisma
model Invoice {
  // ... all existing DODD fields

  // NEW: Fr8X Enhancements
  placeOfSupply      String? // "27-Maharashtra"
  placeOfSupplyCode  String? // "27"
  sellerGstin        String? // Company GSTIN
  buyerGstin         String? // Customer GSTIN
  supplyType         GSTSupplyType? // B2B, B2C, EXPORT

  pdfUrl             String?
  pdfGeneratedAt     DateTime?
  attachments        Json?
  termsAndConditions String? @db.Text
  paymentTerms       String?
  templateId         String?

  @@index([placeOfSupplyCode])
  @@index([supplyType])
}

enum GSTSupplyType {
  B2B
  B2C_LARGE
  B2C_SMALL
  EXPORT
  SEZ
  DEEMED_EXPORT
}
```

### Changes to Payment Model

```prisma
model Payment {
  // ... all existing DODD fields

  // NEW: Gateway Integration
  gatewayName          String?
  gatewayTransactionId String?
  gatewayOrderId       String?
  gatewayResponse      Json?

  utrNumber            String?
  bankTransactionId    String?

  // NEW: Enhanced Lifecycle
  authorizedAt         DateTime?
  capturedAt           DateTime?
  settledAt            DateTime?
  failedAt             DateTime?
  cancelledAt          DateTime?

  failureReason        String?
  retryCount           Int @default(0)
  maxRetries           Int @default(3)
  nextRetryAt          DateTime?

  // NEW: Refunds
  refundedAmount       Decimal @default(0) @db.Decimal(15, 2)
  refundedAt           DateTime?
  refundReason         String?

  @@index([gatewayTransactionId])
  @@index([utrNumber])
  @@index([nextRetryAt])
}
```

### NEW Models to Add

```prisma
// NEW: Wallet System
model Wallet { ... }
model WalletTransaction { ... }

// NEW: Payment Gateway Logs
model PaymentGatewayLog {
  id          String   @id @default(uuid())
  paymentId   String
  payment     Payment  @relation(fields: [paymentId], references: [id])

  event       String   // "created", "authorized", "captured", "failed"
  request     Json     // Gateway request
  response    Json     // Gateway response
  statusCode  Int?
  errorCode   String?
  errorMessage String?

  createdAt   DateTime @default(now())

  @@index([paymentId])
  @@index([event])
}
```

---

## 🎯 Implementation Priority

### Phase 1: Critical GST Fields (Today)
1. ✅ Add placeOfSupply, placeOfSupplyCode
2. ✅ Add sellerGstin, buyerGstin
3. ✅ Add supplyType enum (B2B, B2C, EXPORT)

**Impact:** Required for GST compliance, E-Invoice generation

### Phase 2: Payment Gateway (This Week)
1. ✅ Add gateway fields to Payment
2. ✅ Create PaymentGatewayLog model
3. ✅ Add failure tracking
4. ✅ Integrate Razorpay/PayU

**Impact:** Enable online payments, better UX

### Phase 3: Wallet System (Next Week)
1. ✅ Create Wallet model
2. ✅ Create WalletTransaction model
3. ✅ Implement wallet logic

**Impact:** Prepaid payments, faster checkout

### Phase 4: PDF & Documents (Week 3)
1. ✅ Add PDF generation
2. ✅ Add terms & conditions
3. ✅ Add attachment support

**Impact:** Professional invoices, better customer experience

---

## 📊 Final Comparison

| Feature Category | Fr8X | DODD (Before) | DODD (After) | Winner |
|------------------|------|---------------|--------------|--------|
| **GST Compliance** | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent | DODD |
| **E-Invoice** | ⭐⭐⭐ Basic | ⭐⭐⭐⭐⭐ Complete | ⭐⭐⭐⭐⭐ Complete | DODD |
| **TDS** | ⭐⭐ Basic | ⭐⭐⭐⭐⭐ All sections | ⭐⭐⭐⭐⭐ All sections | DODD |
| **Payment Gateway** | ⭐⭐⭐⭐ Good | ⭐ None | ⭐⭐⭐⭐⭐ Excellent | Fr8X → DODD |
| **Wallet** | ⭐⭐⭐⭐ Good | ⭐ None | ⭐⭐⭐⭐⭐ Excellent | Fr8X → DODD |
| **Multi-Company** | ⭐ None | ⭐⭐⭐⭐⭐ MNC-grade | ⭐⭐⭐⭐⭐ MNC-grade | DODD |
| **Double-Entry** | ⭐ None | ⭐⭐⭐⭐⭐ Complete | ⭐⭐⭐⭐⭐ Complete | DODD |
| **Audit Trail** | ⭐⭐ Basic | ⭐⭐⭐⭐⭐ SOX | ⭐⭐⭐⭐⭐ SOX | DODD |

**Overall:** DODD Account (After) = **Best of Both Worlds** 🏆

---

## ✅ Recommendation

**ENHANCE DODD Account with Fr8X best practices:**

1. ✅ Add Place of Supply (GST critical)
2. ✅ Add Payment Gateway integration (Razorpay, PayU)
3. ✅ Add Wallet system (prepaid balance)
4. ✅ Add PDF generation (invoice PDFs)
5. ✅ Enhanced payment lifecycle tracking

**Result:** DODD Account becomes the **most comprehensive India accounting system**

---

**Next Step:** Update DODD Account Prisma schema with these enhancements!
