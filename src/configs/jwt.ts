import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({path: `.env.${process.env['NODE_ENV']}`});

const JWT_SECRET = process.env['JWT_SECRET'] || '';
const JWT_RESRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || '';
const JWT_EXPIRES_IN: jwt.SignOptions['expiresIn'] = (process.env['JWT_EXPIRES_IN'] || '7d') as jwt.SignOptions['expiresIn'];
const JWT_REFRESH_EXPIRES_IN: jwt.SignOptions['expiresIn'] = (process.env['JWT_REFRESH_EXPIRES_IN'] || '30d') as jwt.SignOptions['expiresIn'];

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JWTService {
  static generateTokens(payload: TokenPayload): TokenResponse {
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '7d' });
    const refreshToken = jwt.sign(
      { userId: payload.userId },
      JWT_RESRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60
    };
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): { userId: string} {
    try {
      return jwt.verify(token, JWT_RESRESH_SECRET) as { userId: string };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      return null;
    }
  }
}
