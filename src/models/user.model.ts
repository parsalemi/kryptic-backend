export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  public_key: string;
  two_factor_enabled?: boolean;
  two_factor_secret?: string | null;
  avatar_url?: string | undefined;
  status: 'online' | 'offline' | 'away' | 'busy';
  last_seen_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateDTO {
  username: string;
  email: string;
  password: string;
  public_key: string;
}

export interface UserLoginDTO {
  email: string;
  password: string;
  two_factor_code?: string;
}