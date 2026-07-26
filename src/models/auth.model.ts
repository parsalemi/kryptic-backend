import { TokenResponse } from "../configs/jwt.js";
import { User } from "./user.model.js";

export interface TwoFactorAuth {
  id: string;
  user_id: string;
  secret: string;
  backup_codes?: string;
  is_verified: boolean;
  verfied_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthResponse {
  user: Omit<User, 'password' | 'created_at' | 'updated_at' | 'last_seen_at'>;
  tokens: TokenResponse;
  requires_2fa?: boolean; 
  two_factor_session_id?: string;
}