export interface UserAccount {
  id: string;
  username: string;
  email: string;
  organizationId: string;
  organizationName: string;
  isActive: boolean;
  avatarUrl: string | null;
  lastLoginAt: string;
  createdAt: string;
  roles: string[];
  fullName: string | null;
  studentCode: string | null;
  phone: string | null;
}

export interface RoleItem {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface GetUsersParams {
  searchTerm?: string;
  organizationId?: string;
  role?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  organizationId: string;
  roleCodes: string[];
  isActive?: boolean;
  fullName?: string;
  studentCode?: string;
  phone?: string;
}

export interface UpdateUserPayload {
  email: string;
  organizationId: string;
  roleCodes: string[];
  isActive: boolean;
  fullName?: string;
  studentCode?: string;
  phone?: string;
}
