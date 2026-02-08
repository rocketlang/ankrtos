import db from '../db/database';
import { Certificate } from '../types';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';

export class CertificateModel {
  static create(userId: string, verificationLevel: 'basic' | 'advanced' | 'expert' = 'basic'): Certificate {
    const id = nanoid();
    const now = Date.now();
    const expiresAt = now + (90 * 24 * 60 * 60 * 1000); // 90 days

    // Create a cryptographic hash of the certificate
    const certificateData = `${userId}-${now}-${verificationLevel}`;
    const certificateHash = createHash('sha256').update(certificateData).digest('hex');

    const stmt = db.prepare(`
      INSERT INTO certificates (id, user_id, certificate_hash, issued_at, expires_at, status, verification_level)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `);

    stmt.run(id, userId, certificateHash, now, expiresAt, verificationLevel);

    return {
      id,
      user_id: userId,
      certificate_hash: certificateHash,
      issued_at: now,
      expires_at: expiresAt,
      status: 'active',
      verification_level: verificationLevel,
    };
  }

  static findByUserId(userId: string): Certificate | undefined {
    const stmt = db.prepare(`
      SELECT * FROM certificates
      WHERE user_id = ? AND status = 'active'
      ORDER BY issued_at DESC
      LIMIT 1
    `);
    return stmt.get(userId) as Certificate | undefined;
  }

  static findByHash(certificateHash: string): Certificate | undefined {
    const stmt = db.prepare('SELECT * FROM certificates WHERE certificate_hash = ?');
    return stmt.get(certificateHash) as Certificate | undefined;
  }

  static revoke(id: string): void {
    const stmt = db.prepare(`
      UPDATE certificates
      SET status = 'revoked'
      WHERE id = ?
    `);
    stmt.run(id);
  }

  static isValid(certificate: Certificate): boolean {
    return (
      certificate.status === 'active' &&
      certificate.expires_at > Date.now()
    );
  }
}
