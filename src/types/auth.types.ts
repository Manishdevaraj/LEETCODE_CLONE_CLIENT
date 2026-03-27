// Extracted from: src/contexts/AuthContext.tsx

export interface AuthRole {
  id: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: AuthRole;
  permissions: string[];
  pageAccess: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}
