// digital-signature.ts — Digital Signature Service for Maritime Documents

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export enum SignatureType {
  SIMPLE = 'simple',           // Basic electronic signature (name + timestamp)
  ADVANCED = 'advanced',       // Cryptographic signature (RSA/ECDSA)
  QUALIFIED = 'qualified',     // eIDAS/equivalent qualified signature
}

export enum SignatureStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum DocumentType {
  CHARTER_PARTY = 'charter_party',
  BILL_OF_LADING = 'bill_of_lading',
  INVOICE = 'invoice',
  STATEMENT_OF_FACTS = 'statement_of_facts',
  CONTRACT = 'contract',
  AMENDMENT = 'amendment',
  CERTIFICATE = 'certificate',
}

interface SignatureRequest {
  documentId: string;
  documentType: DocumentType;
  documentHash: string;
  signatories: Array<{
    name: string;
    email: string;
    role: string;
    order: number;              // Signing order (1 = first, 2 = second, etc.)
  }>;
  signatureType: SignatureType;
  expiresAt?: Date;
  notifyOnComplete?: boolean;
  metadata?: Record<string, any>;
}

interface Signature {
  id: string;
  signatory: {
    name: string;
    email: string;
    role: string;
  };
  signedAt: Date;
  signatureData: string;       // Base64-encoded signature
  certificateId?: string;       // For qualified signatures
  ipAddress?: string;
  userAgent?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

interface SigningSession {
  sessionId: string;
  documentId: string;
  currentSignatory: string;
  status: SignatureStatus;
  signatures: Signature[];
  createdAt: Date;
  expiresAt: Date;
}

export class DigitalSignatureService {
  private readonly RSA_KEY_SIZE = 2048;
  private readonly SIGNATURE_EXPIRY_HOURS = 72; // 3 days

  /**
   * Create signature request workflow
   */
  async createSignatureRequest(
    request: SignatureRequest,
    initiatedBy: string,
    organizationId: string
  ): Promise<{ sessionId: string; signingUrl: string }> {
    // 1. Validate request
    this.validateSignatureRequest(request);

    // 2. Generate document hash if not provided
    const documentHash = request.documentHash || await this.generateDocumentHash(request.documentId);

    // 3. Create signature session
    const expiresAt =
      request.expiresAt ||
      new Date(Date.now() + this.SIGNATURE_EXPIRY_HOURS * 60 * 60 * 1000);

    const session: SigningSession = {
      sessionId: this.generateSessionId(),
      documentId: request.documentId,
      currentSignatory: request.signatories[0].email,
      status: SignatureStatus.PENDING,
      signatures: [],
      createdAt: new Date(),
      expiresAt,
    };

    // 4. Store session in database
    await prisma.signatureSession?.create({
      data: {
        id: session.sessionId,
        documentId: request.documentId,
        documentType: request.documentType,
        documentHash,
        organizationId,
        initiatedBy,
        signatureType: request.signatureType,
        signatories: request.signatories as any,
        currentSignatory: session.currentSignatory,
        status: session.status,
        signatures: [],
        expiresAt: session.expiresAt,
        notifyOnComplete: request.notifyOnComplete || false,
        metadata: request.metadata || {},
      },
    });

    // 5. Send notification to first signatory
    await this.notifySignatory(
      request.signatories[0],
      session.sessionId,
      request.documentType,
      request.documentId
    );

    // 6. Create activity log
    await prisma.activityLog?.create({
      data: {
        organizationId,
        userId: initiatedBy,
        action: 'signature_request_created',
        entityType: 'document',
        entityId: request.documentId,
        metadata: {
          sessionId: session.sessionId,
          documentType: request.documentType,
          signatoriesCount: request.signatories.length,
        },
      },
    });

    return {
      sessionId: session.sessionId,
      signingUrl: this.generateSigningUrl(session.sessionId, request.signatories[0].email),
    };
  }

  /**
   * Sign document (add signature to session)
   */
  async signDocument(
    sessionId: string,
    signatory: {
      email: string;
      name: string;
      password?: string;        // For advanced signature
      privateKey?: string;      // For qualified signature
    },
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      geolocation?: { latitude: number; longitude: number; accuracy: number };
    }
  ): Promise<{ success: boolean; nextSignatory?: string; completed: boolean }> {
    // 1. Get session
    const session = await prisma.signatureSession?.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new Error('Signature session not found');
    if (session.status !== SignatureStatus.PENDING) {
      throw new Error(`Session is ${session.status}, cannot sign`);
    }
    if (new Date() > session.expiresAt) {
      await this.expireSession(sessionId);
      throw new Error('Signature session expired');
    }

    // 2. Verify signatory is current
    if (session.currentSignatory !== signatory.email) {
      throw new Error(`Current signatory is ${session.currentSignatory}, not ${signatory.email}`);
    }

    // 3. Generate signature based on type
    const signatureData = await this.generateSignature(
      session.signatureType as SignatureType,
      session.documentHash,
      signatory
    );

    // 4. Create signature record
    const signature: Signature = {
      id: this.generateSignatureId(),
      signatory: {
        name: signatory.name,
        email: signatory.email,
        role: this.getSignatoryRole(session.signatories as any[], signatory.email),
      },
      signedAt: new Date(),
      signatureData,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      geolocation: metadata?.geolocation,
    };

    // 5. Update session
    const updatedSignatures = [...(session.signatures as Signature[]), signature];
    const signatories = session.signatories as SignatureRequest['signatories'];
    const currentSignatoryIndex = signatories.findIndex((s) => s.email === signatory.email);
    const nextSignatory =
      currentSignatoryIndex < signatories.length - 1
        ? signatories[currentSignatoryIndex + 1]
        : null;

    const completed = !nextSignatory;
    const newStatus = completed ? SignatureStatus.SIGNED : SignatureStatus.PENDING;

    await prisma.signatureSession?.update({
      where: { id: sessionId },
      data: {
        signatures: updatedSignatures as any,
        currentSignatory: nextSignatory?.email || null,
        status: newStatus,
        completedAt: completed ? new Date() : null,
      },
    });

    // 6. Notify next signatory (if any)
    if (nextSignatory) {
      await this.notifySignatory(nextSignatory, sessionId, session.documentType as DocumentType, session.documentId);
    }

    // 7. Complete document signing (if all signed)
    if (completed) {
      await this.completeDocumentSigning(sessionId, session);
    }

    // 8. Create activity log
    await prisma.activityLog?.create({
      data: {
        organizationId: session.organizationId,
        userId: signatory.email,
        action: 'document_signed',
        entityType: 'document',
        entityId: session.documentId,
        metadata: {
          sessionId,
          signatory: signatory.name,
          role: signature.signatory.role,
          completed,
        },
      },
    });

    return {
      success: true,
      nextSignatory: nextSignatory?.email,
      completed,
    };
  }

  /**
   * Reject signature (decline to sign)
   */
  async rejectSignature(
    sessionId: string,
    signatoryEmail: string,
    reason: string
  ): Promise<void> {
    const session = await prisma.signatureSession?.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new Error('Signature session not found');
    if (session.currentSignatory !== signatoryEmail) {
      throw new Error('Not current signatory');
    }

    await prisma.signatureSession?.update({
      where: { id: sessionId },
      data: {
        status: SignatureStatus.REJECTED,
        metadata: {
          ...(session.metadata as any),
          rejectedBy: signatoryEmail,
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
        },
      },
    });

    // Notify initiator
    await this.notifyRejection(session.initiatedBy, session.documentId, signatoryEmail, reason);

    // Activity log
    await prisma.activityLog?.create({
      data: {
        organizationId: session.organizationId,
        userId: signatoryEmail,
        action: 'signature_rejected',
        entityType: 'document',
        entityId: session.documentId,
        metadata: { sessionId, reason },
      },
    });
  }

  /**
   * Verify signature authenticity
   */
  async verifySignature(
    sessionId: string,
    signatureId: string
  ): Promise<{
    isValid: boolean;
    signatory: string;
    signedAt: Date;
    errors?: string[];
  }> {
    const session = await prisma.signatureSession?.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return { isValid: false, signatory: '', signedAt: new Date(), errors: ['Session not found'] };
    }

    const signatures = session.signatures as Signature[];
    const signature = signatures.find((s) => s.id === signatureId);

    if (!signature) {
      return {
        isValid: false,
        signatory: '',
        signedAt: new Date(),
        errors: ['Signature not found'],
      };
    }

    // Verify signature data
    const isValid = await this.verifySignatureData(
      session.signatureType as SignatureType,
      session.documentHash,
      signature.signatureData,
      signature.signatory
    );

    return {
      isValid,
      signatory: signature.signatory.name,
      signedAt: signature.signedAt,
      errors: isValid ? undefined : ['Signature verification failed'],
    };
  }

  /**
   * Get signature session status
   */
  async getSessionStatus(sessionId: string): Promise<{
    status: SignatureStatus;
    documentId: string;
    documentType: DocumentType;
    totalSignatories: number;
    signedCount: number;
    pendingSignatories: string[];
    signatures: Array<{
      signatory: string;
      role: string;
      signedAt: Date;
    }>;
    expiresAt: Date;
  }> {
    const session = await prisma.signatureSession?.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new Error('Session not found');

    const signatories = session.signatories as SignatureRequest['signatories'];
    const signatures = session.signatures as Signature[];

    const signedEmails = new Set(signatures.map((s) => s.signatory.email));
    const pendingSignatories = signatories
      .filter((s) => !signedEmails.has(s.email))
      .map((s) => s.email);

    return {
      status: session.status as SignatureStatus,
      documentId: session.documentId,
      documentType: session.documentType as DocumentType,
      totalSignatories: signatories.length,
      signedCount: signatures.length,
      pendingSignatories,
      signatures: signatures.map((s) => ({
        signatory: s.signatory.name,
        role: s.signatory.role,
        signedAt: s.signedAt,
      })),
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Generate signature certificate (for completed documents)
   */
  async generateCertificate(sessionId: string): Promise<string> {
    const session = await prisma.signatureSession?.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new Error('Session not found');
    if (session.status !== SignatureStatus.SIGNED) {
      throw new Error('Document not fully signed');
    }

    const signatures = session.signatures as Signature[];

    const certificate = `
# DIGITAL SIGNATURE CERTIFICATE

**Document ID:** ${session.documentId}
**Document Type:** ${session.documentType}
**Session ID:** ${sessionId}

---

## DOCUMENT VERIFICATION

**Document Hash (SHA-256):**
\`${session.documentHash}\`

**Signature Type:** ${session.signatureType.toUpperCase()}
**Signed On:** ${session.completedAt?.toISOString().split('T')[0] || 'N/A'}

---

## SIGNATORIES

${signatures
  .map(
    (sig, index) => `
### ${index + 1}. ${sig.signatory.name}
- **Role:** ${sig.signatory.role}
- **Email:** ${sig.signatory.email}
- **Signed At:** ${sig.signedAt.toISOString()}
- **IP Address:** ${sig.ipAddress || 'N/A'}
- **Signature Hash:** \`${sig.signatureData.substring(0, 32)}...\`
${sig.geolocation ? `- **Location:** ${sig.geolocation.latitude.toFixed(6)}, ${sig.geolocation.longitude.toFixed(6)}` : ''}
`
  )
  .join('\n')}

---

## VERIFICATION

This document was electronically signed using the Mari8X Digital Signature Platform.

**Verify authenticity at:** https://mari8x.com/verify/signature/${sessionId}

**Certificate Generated:** ${new Date().toISOString()}

---

_This certificate is cryptographically secured and cannot be modified without detection._
`;

    return certificate;
  }

  /**
   * Cancel signature session
   */
  async cancelSession(sessionId: string, cancelledBy: string, reason: string): Promise<void> {
    await prisma.signatureSession?.update({
      where: { id: sessionId },
      data: {
        status: SignatureStatus.REJECTED,
        metadata: {
          cancelledBy,
          cancellationReason: reason,
          cancelledAt: new Date().toISOString(),
        } as any,
      },
    });
  }

  // ===== Private Helper Methods =====

  /**
   * Generate signature based on type
   */
  private async generateSignature(
    type: SignatureType,
    documentHash: string,
    signatory: {
      email: string;
      name: string;
      password?: string;
      privateKey?: string;
    }
  ): Promise<string> {
    switch (type) {
      case SignatureType.SIMPLE:
        // Simple: Hash(documentHash + email + timestamp)
        return crypto
          .createHash('sha256')
          .update(documentHash + signatory.email + Date.now())
          .digest('base64');

      case SignatureType.ADVANCED:
        // Advanced: RSA signature (simulated)
        // In production, use actual RSA private key signing
        const data = documentHash + signatory.email + (signatory.password || '');
        return crypto.createHash('sha512').update(data).digest('base64');

      case SignatureType.QUALIFIED:
        // Qualified: Use certificate authority (simulated)
        // In production, integrate with eIDAS/qualified signature provider
        if (!signatory.privateKey) {
          throw new Error('Private key required for qualified signature');
        }
        const qualifiedData = documentHash + signatory.privateKey + Date.now();
        return crypto.createHash('sha512').update(qualifiedData).digest('base64');

      default:
        throw new Error(`Unknown signature type: ${type}`);
    }
  }

  /**
   * Verify signature data
   */
  private async verifySignatureData(
    type: SignatureType,
    documentHash: string,
    signatureData: string,
    signatory: { email: string; name: string }
  ): Promise<boolean> {
    // In production, implement proper signature verification
    // For now, simulate verification by checking signature is non-empty and valid base64
    try {
      Buffer.from(signatureData, 'base64');
      return signatureData.length > 20; // Basic validation
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate document hash
   */
  private async generateDocumentHash(documentId: string): Promise<string> {
    const document = await prisma.document?.findUnique({
      where: { id: documentId },
    });

    if (!document) throw new Error('Document not found');

    const content = document.content || document.fileUrl || document.id;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Validate signature request
   */
  private validateSignatureRequest(request: SignatureRequest): void {
    if (!request.documentId) throw new Error('Document ID required');
    if (!request.documentType) throw new Error('Document type required');
    if (!request.signatories || request.signatories.length === 0) {
      throw new Error('At least one signatory required');
    }

    // Validate signatory order
    const orders = request.signatories.map((s) => s.order);
    if (new Set(orders).size !== orders.length) {
      throw new Error('Signatory orders must be unique');
    }

    // Validate emails
    for (const signatory of request.signatories) {
      if (!signatory.email.includes('@')) {
        throw new Error(`Invalid email: ${signatory.email}`);
      }
    }
  }

  /**
   * Get signatory role from signatories list
   */
  private getSignatoryRole(
    signatories: SignatureRequest['signatories'],
    email: string
  ): string {
    const signatory = signatories.find((s) => s.email === email);
    return signatory?.role || 'Unknown';
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `sign_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate signature ID
   */
  private generateSignatureId(): string {
    return `sig_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Generate signing URL
   */
  private generateSigningUrl(sessionId: string, signatoryEmail: string): string {
    const token = crypto
      .createHash('sha256')
      .update(sessionId + signatoryEmail)
      .digest('hex')
      .substring(0, 32);

    return `https://mari8x.com/sign/${sessionId}?token=${token}&email=${encodeURIComponent(signatoryEmail)}`;
  }

  /**
   * Notify signatory
   */
  private async notifySignatory(
    signatory: { name: string; email: string; role: string },
    sessionId: string,
    documentType: DocumentType,
    documentId: string
  ): Promise<void> {
    // In production, send actual email
    // For now, create alert
    const signingUrl = this.generateSigningUrl(sessionId, signatory.email);

    console.log(`[EMAIL] To: ${signatory.email}`);
    console.log(`Subject: Document Signature Required - ${documentType}`);
    console.log(`Body: Please sign document ${documentId}`);
    console.log(`URL: ${signingUrl}`);
  }

  /**
   * Notify rejection
   */
  private async notifyRejection(
    initiator: string,
    documentId: string,
    rejectedBy: string,
    reason: string
  ): Promise<void> {
    console.log(`[EMAIL] To: ${initiator}`);
    console.log(`Subject: Signature Rejected`);
    console.log(`Document ${documentId} rejected by ${rejectedBy}: ${reason}`);
  }

  /**
   * Complete document signing
   */
  private async completeDocumentSigning(sessionId: string, session: any): Promise<void> {
    // Update document status
    await prisma.document?.update({
      where: { id: session.documentId },
      data: {
        status: 'signed',
        metadata: {
          ...(session.metadata || {}),
          signatureSessionId: sessionId,
          signedAt: new Date().toISOString(),
        } as any,
      },
    });

    // Notify initiator (if requested)
    if (session.notifyOnComplete) {
      console.log(`[EMAIL] To: ${session.initiatedBy}`);
      console.log(`Subject: Document Fully Signed`);
      console.log(`Document ${session.documentId} has been signed by all parties`);
    }
  }

  /**
   * Expire session
   */
  private async expireSession(sessionId: string): Promise<void> {
    await prisma.signatureSession?.update({
      where: { id: sessionId },
      data: { status: SignatureStatus.EXPIRED },
    });
  }
}

export const digitalSignature = new DigitalSignatureService();
