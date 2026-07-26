import { Request, Response, NextFunction } from "express";
import { JWTService, TokenPayload } from "../configs/jwt.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  }
};

export class AuthMiddleware {
  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if(!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Authorization token required' });
        return;
      }

      const token = authHeader.split(' ')[1];
      if(!token) {
        res.status(401).json({ message: 'Invalid authorization format' });
        return;
      }

      const payload: TokenPayload = JWTService.verifyAccessToken(token);
      (req as AuthenticatedRequest).user = {
        userId: payload.userId,
        email: payload.email,
        username: payload.username
      };

      next();
    } catch (error) {
      if(error instanceof Error && error.message.includes('Invalid or expired access token')) {
        res.status(401).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if(authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if(token) {
        try {
          const payload: TokenPayload = JWTService.verifyAccessToken(token);
          Promise.resolve(payload).then(p => {
            (req as AuthenticatedRequest).user = {
              userId: p.userId,
              email: p.email,
              username: p.username
            };
            next();
          }).catch(() => next());
          return;
        } catch (error) {
          next();
          return;
        }
      }
    }
    next();
  }
}
