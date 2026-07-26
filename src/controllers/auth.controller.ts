import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { User, UserCreateDTO, UserLoginDTO } from '../models/user.model.js';
import { validate } from 'uuid';
import { body, validationResult } from 'express-validator';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, email, password, public_key } = req.body;

      const data: UserCreateDTO = {
        username,
        email,
        password,
        public_key
      };

      const result = await this.authService.register(data);
      res.status(201).json(result);

    } catch (error) {
      if(error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ message: error.message });
        return;
      }
      if(error instanceof Error && error.message.includes('Username already taken')) {
        res.status(409).json({ message: error.message });
        return;
      }

      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password, two_factor_code } = req.body;

      const data: UserLoginDTO = {
        email, password, two_factor_code
      };

      const ipAddress = req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const result = await this.authService.login(data, ipAddress, userAgent);
      res.status(200).json(result);

    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        res.status(401).json({ message: error.message });
        return;
      }
      if (error instanceof Error && error.message === 'Invalid 2FA code') {
        res.status(401).json({ message: error.message });
        return;
      }

      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if(!refreshToken) {
        res.status(400).json({ message: 'Refresh token expired '});
        return;
      }

      await this.authService.logout(refreshToken);
      res.status(204).send();

    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid or expired refresh token')) {
        res.status(401).json({ message: error.message });
        return;
      }

      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body;
      if(!refreshToken) {
        res.status(400).json({ message: 'Refresh token expired '});
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);
      res.status(200).json(result);

    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid or expired refresh token')) {
        res.status(401).json({ message: error.message });
        return;
      }

      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if(!userId) {
        res.status(401).json({ message: 'Unauthorized '});
        return;
      }

      const user = await this.authService.getUserProfile(userId);
      if(!user) {
        res.status(404).json({ message: 'User not found '});
        return;
      }

      res.status(200).json({ user });

    } catch (error) {
      next(error);
    }
  }
}

export const registerValidation = [
  body('username').isString().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('public_key').isString().withMessage('Public key required')
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isString().withMessage('Password required'),
  body('two_factor_code').optional().isString().isLength({ min: 6, max: 6 }).withMessage('2FA must be 6 digits')
];
