# BFC Security Whitepaper

**Document Version:** 1.0
**Classification:** Confidential
**Last Updated:** January 2026

---

## Executive Summary

The Banking Finance Customer (BFC) platform is designed with security as a foundational principle, meeting the stringent requirements of banking and financial institutions. This document outlines the comprehensive security controls, encryption mechanisms, access controls, and compliance measures implemented in the platform.

### Security Certifications & Compliance

| Standard | Status | Description |
|----------|--------|-------------|
| ISO 27001 | Aligned | Information Security Management |
| PCI-DSS | Compliant | Payment Card Industry Standards |
| SOC 2 Type II | Aligned | Service Organization Controls |
| RBI IT Guidelines | Compliant | Indian Banking Regulations |
| DPDP Act 2023 | Compliant | Data Protection (India) |
| GDPR | Ready | EU Data Protection |

---

## 1. Encryption Controls

### 1.1 Encryption at Rest

All sensitive data is encrypted at rest using industry-standard algorithms.

#### Database Encryption

| Data Type | Algorithm | Key Size | Implementation |
|-----------|-----------|----------|----------------|
| PII Fields | AES-256-GCM | 256-bit | Field-level encryption |
| Passwords | PBKDF2-SHA256 | 256-bit | Hashed, never stored plain |
| Documents | AES-256-GCM | 256-bit | File-level encryption |
| Backups | AES-256-GCM | 256-bit | Encrypted before storage |

```
┌─────────────────────────────────────────────────────────────┐
│                  Data at Rest Encryption                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Application Layer                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Sensitive Field → AES-256-GCM → Encrypted Field    │   │
│  │  (PAN, Aadhaar)   (Application)   (Stored in DB)    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Database Layer                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL with pgcrypto extension                 │   │
│  │  Transparent Data Encryption (TDE) available        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Storage Layer                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AWS EBS / Azure Disk Encryption                    │   │
│  │  Server-side encryption with managed keys           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Field-Level Encryption Implementation

```typescript
// @bfc/core - Encryption Service
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16;  // 128 bits
  private readonly tagLength = 16; // 128 bits

  async encrypt(plaintext: string): Promise<EncryptedData> {
    const iv = randomBytes(this.ivLength);
    const key = await this.deriveKey();

    const cipher = createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return {
      ciphertext: encrypted,
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      algorithm: this.algorithm,
    };
  }

  async decrypt(data: EncryptedData): Promise<string> {
    const key = await this.deriveKey();
    const iv = Buffer.from(data.iv, 'base64');
    const tag = Buffer.from(data.tag, 'base64');

    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(data.ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

#### Encrypted Fields

| Entity | Encrypted Fields | Encryption Level |
|--------|-----------------|------------------|
| Customer | aadhaarHash, pan (partial) | Application |
| CustomerDocument | documentNumber, storageUrl | Application |
| Staff | biometricTemplate | Application |
| Transaction | counterpartyAccount | Application |

### 1.2 Encryption in Transit

All data in transit is encrypted using TLS 1.3.

| Connection | Protocol | Cipher Suites |
|------------|----------|---------------|
| Client ↔ Load Balancer | TLS 1.3 | AES-256-GCM-SHA384 |
| Load Balancer ↔ API | TLS 1.2/1.3 | AES-256-GCM-SHA384 |
| API ↔ Database | TLS 1.2 | AES-256-GCM-SHA384 |
| API ↔ Redis | TLS 1.2 | AES-256-GCM-SHA384 |
| API ↔ External Services | TLS 1.2/1.3 | AES-256-GCM-SHA384 |

```
┌─────────────────────────────────────────────────────────────┐
│                  Data in Transit Encryption                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Mobile/Web Client                                          │
│       │                                                     │
│       │ TLS 1.3 (Certificate Pinning for Mobile)           │
│       ▼                                                     │
│  Load Balancer (SSL Termination)                           │
│       │                                                     │
│       │ TLS 1.2+ (Internal)                                │
│       ▼                                                     │
│  Application Server                                         │
│       │                                                     │
│       │ TLS 1.2 (Mutual TLS for sensitive services)        │
│       ▼                                                     │
│  Database / Redis / External APIs                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Key Management

| Key Type | Storage | Rotation | Access |
|----------|---------|----------|--------|
| Master Key | HSM / AWS KMS | Annual | Security Team only |
| Data Encryption Key | Encrypted in DB | Quarterly | Application only |
| JWT Signing Key | Vault / KMS | Monthly | Auth Service only |
| API Keys | Vault | On compromise | Service-specific |

**Key Hierarchy:**

```
Master Key (HSM)
    │
    ├── Data Encryption Key (DEK)
    │   └── Encrypts: PII, Documents
    │
    ├── Key Encryption Key (KEK)
    │   └── Encrypts: DEKs, Session Keys
    │
    └── Signing Key
        └── Signs: JWTs, API Responses
```

---

## 2. Access Control

### 2.1 Authentication

#### JWT-Based Authentication

```typescript
// Token Structure
interface JWTPayload {
  sub: string;           // User ID
  role: string;          // User role
  branchCode?: string;   // Branch restriction
  permissions: string[]; // Explicit permissions
  iat: number;           // Issued at
  exp: number;           // Expiration (24h)
  jti: string;           // Unique token ID
}

// Token Verification
async function verifyToken(token: string): Promise<JWTPayload> {
  // 1. Verify signature
  const payload = jwt.verify(token, JWT_SECRET);

  // 2. Check token not revoked (Redis blacklist)
  const isRevoked = await redis.get(`revoked:${payload.jti}`);
  if (isRevoked) throw new UnauthorizedError('Token revoked');

  // 3. Check session still valid
  const session = await redis.get(`session:${payload.sub}`);
  if (!session) throw new UnauthorizedError('Session expired');

  return payload;
}
```

#### Multi-Factor Authentication (MFA)

| User Type | MFA Methods | Enforcement |
|-----------|-------------|-------------|
| Admin | TOTP, Hardware Key | Required |
| Staff | TOTP, SMS OTP | Required for sensitive |
| Customer | SMS OTP, Biometric | Risk-based |

### 2.2 Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────────────┐
│                    RBAC Hierarchy                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SUPER_ADMIN ─────────────────────────────────────────────┐│
│       │                                                    ││
│  ADMIN ────────────────────────────────────────────────┐  ││
│       │                                                 │  ││
│  ┌────┴────┐     ┌──────────────┐     ┌─────────────┐  │  ││
│  │REGIONAL │     │ COMPLIANCE   │     │    RISK     │  │  ││
│  │MANAGER  │     │  MANAGER     │     │   MANAGER   │  │  ││
│  └────┬────┘     └──────────────┘     └─────────────┘  │  ││
│       │                                                 │  ││
│  ┌────┴────┐                                           │  ││
│  │ BRANCH  │                                           │  ││
│  │ MANAGER │                                           │  ││
│  └────┬────┘                                           │  ││
│       │                                                 │  ││
│  ┌────┴─────────────────┐                              │  ││
│  │   STAFF ROLES        │                              │  ││
│  │  ┌─────────────────┐ │                              │  ││
│  │  │ KYC_OFFICER     │ │                              │  ││
│  │  │ FIELD_AGENT     │ │                              │  ││
│  │  │ RELATIONSHIP_MGR│ │                              │  ││
│  │  └─────────────────┘ │                              │  ││
│  └──────────────────────┘                              │  ││
│                                                         │  ││
│  CUSTOMER ─────────────────────────────────────────────┘  ││
│                                                            ││
└─────────────────────────────────────────────────────────────┘
```

#### Permission Matrix

| Action | Customer | Staff | Branch Mgr | Admin |
|--------|----------|-------|------------|-------|
| View own data | ✓ | - | - | ✓ |
| View customer data | - | Branch only | Branch only | All |
| Create customer | - | ✓ | ✓ | ✓ |
| Approve loan | - | - | Up to limit | All |
| View audit logs | - | - | Branch only | All |
| Manage users | - | - | - | ✓ |
| System config | - | - | - | Super only |

### 2.3 Attribute-Based Access Control (ABAC)

ABAC provides fine-grained access control based on:

**Subject Attributes:**
- User ID, Role, Department
- Branch Code, Region Code
- Clearance Level (1-5)
- Active Status

**Resource Attributes:**
- Data Classification
- Sensitivity Level
- Owner Branch
- Contains PII

**Environment Attributes:**
- Time of Access
- IP Address
- Device Type
- Risk Score

**Example Policies:**

```typescript
// Policy: Staff can only access their branch's customers
{
  id: 'branch-restriction',
  effect: 'deny',
  condition: (subject, resource) =>
    subject.role === 'STAFF' &&
    resource.branchCode !== subject.branchCode
}

// Policy: Sensitive data requires high clearance
{
  id: 'sensitive-clearance',
  effect: 'deny',
  condition: (subject, resource) =>
    resource.sensitivityLevel === 'HIGH' &&
    subject.clearanceLevel < 3
}

// Policy: No access outside business hours for non-admins
{
  id: 'business-hours',
  effect: 'deny',
  condition: (subject, _, environment) =>
    !['ADMIN', 'SUPER_ADMIN'].includes(subject.role) &&
    !environment.isWithinBusinessHours
}
```

---

## 3. Data Protection

### 3.1 PII Handling

| PII Category | Storage | Display | Logging |
|--------------|---------|---------|---------|
| Aadhaar | Hashed only | Never shown | Never logged |
| PAN | Encrypted | Masked (XXXXX1234X) | Masked |
| Phone | Plain | Masked (XXXX3210) | Masked |
| Email | Plain | Partially masked | Masked |
| Account No | Encrypted | Masked | Masked |
| Address | Encrypted | Full (authorized) | Never logged |

### 3.2 Data Masking

```typescript
// Automatic masking based on role
class DataMasker {
  mask(data: any, userRole: Role): any {
    const rules = this.getRulesForRole(userRole);

    return this.applyRules(data, rules);
  }

  private getRulesForRole(role: Role): MaskingRules {
    switch (role) {
      case Role.CUSTOMER:
        return {
          pan: 'full',      // Own PAN visible
          aadhaar: 'last4', // Last 4 only
          phone: 'full',    // Own phone
        };

      case Role.STAFF:
        return {
          pan: 'partial',   // XXXXX1234X
          aadhaar: 'last4', // ****1234
          phone: 'partial', // +91 XXXX3210
        };

      case Role.ADMIN:
        return {
          pan: 'full',      // Full access
          aadhaar: 'last4', // Still masked
          phone: 'full',
        };
    }
  }
}
```

### 3.3 Data Retention

| Data Type | Active Retention | Archive | Deletion |
|-----------|------------------|---------|----------|
| Customer Profile | Account lifetime | 10 years | After archive |
| Transactions | 3 years | 10 years | After archive |
| Audit Logs | 3 years | 7 years | After archive |
| Session Logs | 90 days | 1 year | After archive |
| Documents | Account lifetime | 10 years | After archive |
| Analytics | 2 years | 5 years | After archive |

### 3.4 Data Residency

All data is stored within India to comply with RBI data localization requirements.

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Residency                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Primary Data Center: Mumbai (ap-south-1)                  │
│  ├── PostgreSQL Primary                                    │
│  ├── Redis Cluster                                         │
│  └── Document Storage                                      │
│                                                             │
│  DR Data Center: Hyderabad                                 │
│  ├── PostgreSQL Replica (Sync)                             │
│  ├── Redis Replica                                         │
│  └── Document Storage (Async)                              │
│                                                             │
│  NO data leaves India except:                              │
│  - Anonymized analytics (with consent)                     │
│  - Regulatory reports (to authorized parties)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Audit & Monitoring

### 4.1 Audit Logging

Every security-relevant action is logged with full context.

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;

  // Who
  actorId: string;
  actorRole: string;
  actorIp: string;
  actorDevice: string;

  // What
  action: string;        // CREATE, READ, UPDATE, DELETE
  resource: string;      // customer, loan, notification
  resourceId: string;

  // Context
  beforeState?: object;  // For updates
  afterState?: object;
  metadata?: object;

  // Result
  success: boolean;
  failureReason?: string;
}
```

**Logged Actions:**

| Category | Actions |
|----------|---------|
| Authentication | Login, Logout, MFA, Password Change |
| Authorization | Permission Denied, Role Change |
| Data Access | View PII, Export Data, Bulk Query |
| Data Modification | Create, Update, Delete Customer/Loan |
| Admin | User Management, Config Change |
| Compliance | KYC Verification, AML Alert |

### 4.2 Security Monitoring

```
┌─────────────────────────────────────────────────────────────┐
│                Security Monitoring Stack                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Real-time Alerts                                          │
│  ├── Failed login attempts (>5 in 10 min)                  │
│  ├── Unusual access patterns                               │
│  ├── Privilege escalation attempts                         │
│  ├── Data exfiltration signals                             │
│  └── API abuse detection                                   │
│                                                             │
│  SIEM Integration                                          │
│  ├── Log aggregation (ELK/Splunk)                          │
│  ├── Correlation rules                                     │
│  ├── Threat intelligence feeds                             │
│  └── Automated response playbooks                          │
│                                                             │
│  Dashboards                                                │
│  ├── Security posture overview                             │
│  ├── Access patterns                                       │
│  ├── Compliance status                                     │
│  └── Incident tracking                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Incident Response

| Severity | Response Time | Escalation |
|----------|---------------|------------|
| Critical | 15 minutes | CISO, CTO |
| High | 1 hour | Security Lead |
| Medium | 4 hours | Security Team |
| Low | 24 hours | On-call Engineer |

---

## 5. Application Security

### 5.1 Secure Development

| Practice | Implementation |
|----------|----------------|
| Code Review | Mandatory for all PRs |
| Static Analysis | SonarQube, ESLint security rules |
| Dependency Scanning | Snyk, npm audit |
| Secret Detection | GitGuardian, pre-commit hooks |
| Container Scanning | Trivy, Docker Scout |

### 5.2 OWASP Top 10 Mitigations

| Vulnerability | Mitigation |
|---------------|------------|
| Injection | Parameterized queries (Prisma), input validation |
| Broken Auth | JWT with short expiry, MFA, session management |
| Sensitive Data | Encryption at rest/transit, masking |
| XXE | XML parsing disabled, JSON only |
| Broken Access | RBAC + ABAC, resource-level checks |
| Misconfig | Hardened configs, security headers |
| XSS | Content-Security-Policy, output encoding |
| Insecure Deserial | JSON schema validation |
| Vulnerable Deps | Automated scanning, regular updates |
| Insufficient Logging | Comprehensive audit logs |

### 5.3 API Security

```typescript
// Rate Limiting
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // 100 requests per minute
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Input Validation (Zod)
const CustomerInput = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+91[0-9]{10}$/),
  email: z.string().email().optional(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/).optional(),
});

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

---

## 6. Infrastructure Security

### 6.1 Network Architecture

```
                        Internet
                            │
                    ┌───────┴───────┐
                    │   WAF/DDoS    │
                    │   Protection  │
                    └───────┬───────┘
                            │
                    ┌───────┴───────┐
                    │ Load Balancer │
                    │  (Public)     │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│  API Server   │   │  API Server   │   │  API Server   │
│  (Private)    │   │  (Private)    │   │  (Private)    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────┴───────┐
                    │  Internal LB  │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│  PostgreSQL   │   │    Redis      │   │  Document     │
│  (Isolated)   │   │  (Isolated)   │   │  Storage      │
└───────────────┘   └───────────────┘   └───────────────┘
```

### 6.2 Security Controls

| Layer | Controls |
|-------|----------|
| Edge | WAF, DDoS protection, Bot detection |
| Network | VPC isolation, Security groups, NACLs |
| Application | Container hardening, minimal images |
| Data | Encryption, access logging, backups |
| Endpoint | Vulnerability scanning, patching |

---

## 7. Compliance

### 7.1 RBI Guidelines Compliance

| Requirement | Implementation |
|-------------|----------------|
| Data Localization | All data in India |
| Encryption | AES-256 at rest, TLS 1.2+ in transit |
| Access Control | RBAC with audit trails |
| Incident Reporting | Automated alerts, 6-hour reporting |
| BCP/DR | Dual data centers, <1hr RTO |
| Audit | Quarterly internal, annual external |

### 7.2 DPDP Act 2023 Compliance

| Requirement | Implementation |
|-------------|----------------|
| Consent | Explicit consent for data collection |
| Purpose Limitation | Data used only for stated purposes |
| Data Minimization | Only necessary data collected |
| Accuracy | Customer can update their data |
| Storage Limitation | Retention policies enforced |
| Security | Encryption, access control |
| Accountability | DPO appointed, compliance documented |

### 7.3 PCI-DSS Compliance (if applicable)

| Requirement | Implementation |
|-------------|----------------|
| Req 1-2 | Network segmentation, firewall |
| Req 3 | Cardholder data encryption |
| Req 4 | Encrypted transmission |
| Req 5 | Anti-malware protection |
| Req 6 | Secure development |
| Req 7-8 | Access control, authentication |
| Req 9 | Physical security |
| Req 10 | Logging and monitoring |
| Req 11 | Security testing |
| Req 12 | Security policies |

---

## 8. Security Testing

### 8.1 Testing Schedule

| Test Type | Frequency | Scope |
|-----------|-----------|-------|
| SAST | Every commit | All code |
| DAST | Weekly | APIs, Web |
| Penetration Test | Quarterly | Full platform |
| Red Team | Annually | Organization-wide |
| Vulnerability Scan | Daily | Infrastructure |

### 8.2 Bug Bounty Program

- Scope: Production systems
- Rewards: Up to ₹5,00,000
- Response SLA: 48 hours

---

## Contact

**Security Team:** security@ankr.in
**Compliance Team:** compliance@ankr.in
**Incident Reporting:** incident@ankr.in (24/7)
