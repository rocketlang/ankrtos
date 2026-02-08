import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ChallengeModel } from '../models/Challenge';
import { generateRandomChallenge, scoreResponse } from '../services/challengeGenerator';

const router = Router();

const submitSchema = z.object({
  challengeId: z.string(),
  response: z.string().min(10).max(2000)
});

// Get next challenge (or create new one)
router.get('/next', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Check if user has pending challenge
    let challenge = ChallengeModel.findPendingByUser(userId);

    // Create new challenge if none pending
    if (!challenge) {
      const { type, prompt, hint } = generateRandomChallenge();
      challenge = ChallengeModel.create(userId, type, prompt);
    }

    res.json({
      id: challenge.id,
      type: challenge.challenge_type,
      prompt: challenge.prompt,
      status: challenge.status
    });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ error: 'Failed to get challenge' });
  }
});

// Submit challenge response
router.post('/submit', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { challengeId, response } = submitSchema.parse(req.body);

    // Verify challenge belongs to user
    const challenge = ChallengeModel.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (challenge.user_id !== userId) {
      return res.status(403).json({ error: 'Not your challenge' });
    }

    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: 'Challenge already submitted' });
    }

    // Score the response
    const score = scoreResponse(challenge.challenge_type, response);
    const passed = score >= 60;

    // Update challenge
    ChallengeModel.submit(challengeId, response, score);

    res.json({
      score,
      passed,
      message: passed
        ? 'Great! You passed this challenge.'
        : 'Try again with more personal detail and authenticity.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Submit challenge error:', error);
    res.status(500).json({ error: 'Failed to submit challenge' });
  }
});

// Get user's challenge history
router.get('/history', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const challenges = ChallengeModel.getUserChallenges(userId);

    res.json({
      challenges: challenges.map(c => ({
        id: c.id,
        type: c.challenge_type,
        prompt: c.prompt,
        response: c.response,
        score: c.score,
        status: c.status,
        created_at: c.created_at,
        completed_at: c.completed_at
      }))
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get challenge history' });
  }
});

export default router;
