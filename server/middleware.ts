import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'paymaster_secret_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    username: string;
    role: string;
  };
}

// Authentication Middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access denied. Security token is missing.' });
    return;
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as {
      _id: string;
      username: string;
      role: string;
    };
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired security token.' });
  }
}

// Error Handling Middleware
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('Unhandled Server Error: ', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Database/Server Error';
  res.status(status).json({
    status: 'error',
    statusCode: status,
    message
  });
}
