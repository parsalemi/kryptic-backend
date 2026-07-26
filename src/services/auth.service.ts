import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import jwt from 'jsonwebtoken';
import { JWTService, TokenPayload, TokenResponse } from "../configs/jwt.js";
import { UserLoginDTO, UserCreateDTO, User } from "../models/user.model.js";
import { AuthResponse } from "../models/auth.model.js";
import userDB from "../db/queries/user.queries.js"
import sessionDB from "../db/queries/session.queries.js";
import knex from "../db/knex.js";

export class AuthService {
  private readonly SALT_ROUNDS = 12;

  async register(data: UserCreateDTO): Promise<Omit<AuthResponse, 'tokens'>> {
    const existingUser = await userDB.getUserByEmail(data.email);
    if(existingUser) {
      throw new Error('User with this email already exists');
    }

    const existingUsername = await userDB.getUserByUsername(data.username);
    if(existingUsername) {
      throw new Error('Username already taken');
    }

    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);
    const userId = uuidv4();

    await userDB.registerUser({
      id: userId,
      username: data.username,
      email: data.email,
      password: passwordHash,
      public_key: data.public_key,
      status: 'online',
      last_seen_at: knex('users').client.raw('NOW()'),
      created_at: knex('users').client.raw('NOW()'),
      updated_at: knex('users').client.raw('NOW()')
    });

    const user = await userDB.getUserById(userId);
    if(!user) {
      throw new Error('Failed to create user');
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        public_key: user.public_key,
        avatar_url: user.avatar_url || '',
        status: user.status,
        two_factor_enabled: user.two_factor_enabled || false,
      }
    }
  };

  async login(data: UserLoginDTO, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await userDB.getUserByEmail(data.email);
    if(!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if(!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if(user.two_factor_enabled) {
      if(!data.two_factor_code) {
        const sessionId = uuidv4();

        return {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            public_key: user.public_key,
            avatar_url: user.avatar_url || '',
            status: user.status,
            two_factor_enabled: user.two_factor_enabled,
          },
          tokens: {
            accessToken: '',
            refreshToken: '',
            expiresIn: 0
          },
          requires_2fa: true,
          two_factor_session_id: sessionId
        }
      }
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username
    };

    const tokens = JWTService.generateTokens(payload);

    await sessionDB.insertSession({
      id: uuidv4(),
      user_id: user.id,
      token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      ip_address: ipAddress || '',
      user_agent: userAgent || '',
      expires_at: knex('sessions').client.raw(`NOW() + INTERVAL '7 days'`),
      is_revoked: false,
      created_at: knex('sessions').client.raw(`NOW()`),
      updated_at: knex('sessions').client.raw(`NOW()`)
    });

    await userDB.updateStatus(user, 'online');

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        public_key: user.public_key,
        avatar_url: user.avatar_url,
        status: 'online',
        two_factor_enabled: user.two_factor_enabled || false,
      },
      tokens
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const session = await sessionDB.isSessionExistsAndValid(refreshToken);
    if(session) {
      await sessionDB.revokeSession(refreshToken);
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string}> {
    const payload = JWTService.verifyRefreshToken(refreshToken);

    const session = await sessionDB.isSessionExistsAndValid(refreshToken);
    if(!session) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await userDB.getUserById(payload.userId);
    if(!user) {
      throw new Error('User not found');
    }

    const newPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username
    };

    const newAccessToken = jwt.sign(
      newPayload, 
      (process.env['JWT_SECRET'] as string), 
      { expiresIn: process.env['JWT_EXPIRES_IN'] as jwt.SignOptions['expiresIn'] || '7d'}
    );

    return { accessToken: newAccessToken };
  }

  async getUserProfile(userId: string): Promise<Omit<User, 'password' | 'created_at' | 'updated_at'> | null> {
    const user = await userDB.getUserById(userId);
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      public_key: user.public_key,
      two_factor_enabled: user.two_factor_enabled || false,
      two_factor_secret: user.two_factor_secret || null,
      avatar_url: user.avatar_url || '',
      status: user.status,
      last_seen_at: user.last_seen_at
    };
  }
}
