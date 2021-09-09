/*
    interfaces for handling users and auth
*/
export interface Session {
  id: string;
  iat: number;
  exp: number;
}

export interface EncodeResult {
  token: string;
  iat: number;
  exp: number;
}

export interface InputUpdateUser {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
}

export interface UpdateUser {
  email?: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
}

export interface UserDetails {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  bio: string;
}
