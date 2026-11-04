export type RoleType = "SUPER_ADMIN" | "ORGANIZATION_ADMIN" | "VOLUNTEER";

export interface UserInfo {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  roles: string[];
  organizationId?: string;
  organizationName: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserInfo;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  organizationId: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface Organization {
  id: string;
  parentId: string | null;
  parentName: string | null;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}
