import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ChallengeModel } from '../models/Challenge';
import { CertificateModel } from '../models/Certificate';
import { UserModel } from '../models/User';

const router = Router();

// Get verification status
router.get('/status', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const completedChallenges = ChallengeModel.getCompletedCount(userId);
    const certificate = CertificateModel.findByUserId(userId);

    const isVerified = certificate && CertificateModel.isValid(certificate);

    res.json({
      verified: isVerified,
      completedChallenges,
      certificate: certificate ? {
        id: certificate.id,
        hash: certificate.certificate_hash,
        issued_at: certificate.issued_at,
        expires_at: certificate.expires_at,
        verification_level: certificate.verification_level,
        status: certificate.status
      } : null
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

// Request certificate (after completing challenges)
router.post('/request-certificate', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const completedChallenges = ChallengeModel.getCompletedCount(userId);

    // Require at least 3 completed challenges
    if (completedChallenges < 3) {
      return res.status(400).json({
        error: 'Not enough challenges completed',
        required: 3,
        completed: completedChallenges
      });
    }

    // Check if already has valid certificate
    const existingCert = CertificateModel.findByUserId(userId);
    if (existingCert && CertificateModel.isValid(existingCert)) {
      return res.status(400).json({
        error: 'You already have a valid certificate',
        certificate: {
          hash: existingCert.certificate_hash,
          expires_at: existingCert.expires_at
        }
      });
    }

    // Determine verification level based on challenges completed
    let level: 'basic' | 'advanced' | 'expert' = 'basic';
    if (completedChallenges >= 10) level = 'expert';
    else if (completedChallenges >= 6) level = 'advanced';

    // Create certificate
    const certificate = CertificateModel.create(userId, level);

    res.json({
      message: 'Certificate issued successfully!',
      certificate: {
        id: certificate.id,
        hash: certificate.certificate_hash,
        issued_at: certificate.issued_at,
        expires_at: certificate.expires_at,
        verification_level: certificate.verification_level
      }
    });
  } catch (error) {
    console.error('Request certificate error:', error);
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
});

// Public endpoint: Verify a certificate by hash
router.get('/verify/:certificateHash', (req, res) => {
  try {
    const { certificateHash } = req.params;

    const certificate = CertificateModel.findByHash(certificateHash);

    if (!certificate) {
      return res.json({
        valid: false,
        message: 'Certificate not found'
      });
    }

    const isValid = CertificateModel.isValid(certificate);
    const user = UserModel.findById(certificate.user_id);

    res.json({
      valid: isValid,
      certificate: {
        username: user?.username,
        verification_level: certificate.verification_level,
        issued_at: certificate.issued_at,
        expires_at: certificate.expires_at,
        status: certificate.status
      }
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Public endpoint: Get user's public verification badge
router.get('/badge/:username', (req, res) => {
  try {
    const { username } = req.params;

    const user = UserModel.findByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const certificate = CertificateModel.findByUserId(user.id);
    const isVerified = certificate && CertificateModel.isValid(certificate);

    res.json({
      username: user.username,
      verified: isVerified,
      level: certificate?.verification_level || null,
      certified_since: certificate?.issued_at || null
    });
  } catch (error) {
    console.error('Get badge error:', error);
    res.status(500).json({ error: 'Failed to get badge' });
  }
});

export default router;
