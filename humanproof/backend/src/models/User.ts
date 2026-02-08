import db from '../db/database';
import { User } from '../types';
import { nanoid } from 'nanoid';

export class UserModel {
  static create(email: string, password_hash: string, username: string): User {
    const id = nanoid();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, username, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, email, password_hash, username, now, now);

    return {
      id,
      email,
      password_hash,
      username,
      created_at: now,
      updated_at: now,
    };
  }

  static findByEmail(email: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  }

  static findById(id: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  static findByUsername(username: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | undefined;
  }
}
