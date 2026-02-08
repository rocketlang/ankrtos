import db from '../db/database';
import { Challenge, ChallengeType } from '../types';
import { nanoid } from 'nanoid';

export class ChallengeModel {
  static create(userId: string, challengeType: ChallengeType, prompt: string): Challenge {
    const id = nanoid();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO challenges (id, user_id, challenge_type, prompt, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `);

    stmt.run(id, userId, challengeType, prompt, now);

    return {
      id,
      user_id: userId,
      challenge_type: challengeType,
      prompt,
      status: 'pending',
      created_at: now,
    };
  }

  static findById(id: string): Challenge | undefined {
    const stmt = db.prepare('SELECT * FROM challenges WHERE id = ?');
    return stmt.get(id) as Challenge | undefined;
  }

  static findPendingByUser(userId: string): Challenge | undefined {
    const stmt = db.prepare(`
      SELECT * FROM challenges
      WHERE user_id = ? AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return stmt.get(userId) as Challenge | undefined;
  }

  static submit(id: string, response: string, score: number): void {
    const now = Date.now();
    const status = score >= 60 ? 'completed' : 'failed';

    const stmt = db.prepare(`
      UPDATE challenges
      SET response = ?, score = ?, status = ?, completed_at = ?
      WHERE id = ?
    `);

    stmt.run(response, score, status, now, id);
  }

  static getCompletedCount(userId: string): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM challenges
      WHERE user_id = ? AND status = 'completed'
    `);
    const result = stmt.get(userId) as { count: number };
    return result.count;
  }

  static getUserChallenges(userId: string): Challenge[] {
    const stmt = db.prepare(`
      SELECT * FROM challenges
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(userId) as Challenge[];
  }
}
