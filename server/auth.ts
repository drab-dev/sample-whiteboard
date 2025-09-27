import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { Database } from './database.js';
import { User, AuthRequest } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  static generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async verifyToken(token: string): Promise<string | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      return null;
    }
  }
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const userId = await AuthService.verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const user = await Database.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

export const requireWhiteboardAccess = (minPermission: 'viewer' | 'commenter' | 'editor') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const whiteboardId = req.params.id;
      const userId = req.user!.id;

      // Check if user owns the whiteboard
      const whiteboard = await Database.getWhiteboard(whiteboardId);
      if (whiteboard.owner_id === userId) {
        return next();
      }

      // Check user's permission level
      const permission = await Database.getUserPermission(whiteboardId, userId);
      if (!permission) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const permissionLevels = { viewer: 1, commenter: 2, editor: 3 };
      const userLevel = permissionLevels[permission as keyof typeof permissionLevels];
      const requiredLevel = permissionLevels[minPermission];

      if (userLevel < requiredLevel) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};