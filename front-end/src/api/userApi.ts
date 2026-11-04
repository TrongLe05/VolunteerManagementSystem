import axiosClient from "@/api/axiosClient";
import type { PageResult } from "@/types/volunteer.types";
import type {
  CreateUserPayload,
  GetUsersParams,
  RoleItem,
  UpdateUserPayload,
  UserAccount,
} from "@/types/user.types";

export const userApi = {
  getAll: async (params?: GetUsersParams): Promise<PageResult<UserAccount>> => {
    const response = await axiosClient.get<PageResult<UserAccount>>("/users", {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<UserAccount> => {
    const response = await axiosClient.get<UserAccount>(`/users/${id}`);
    return response.data;
  },

  getRoles: async (): Promise<RoleItem[]> => {
    const response = await axiosClient.get<RoleItem[]>("/users/roles");
    return response.data;
  },

  create: async (data: CreateUserPayload): Promise<{ id: string }> => {
    const response = await axiosClient.post<{ id: string }>("/users", data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserPayload): Promise<boolean> => {
    const response = await axiosClient.put<boolean>(`/users/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id: string, isActive: boolean): Promise<boolean> => {
    const response = await axiosClient.patch<boolean>(`/users/${id}/status`, {
      isActive,
    });
    return response.data;
  },

  resetPassword: async (id: string, newPassword: string): Promise<boolean> => {
    const response = await axiosClient.put<boolean>(
      `/users/${id}/reset-password`,
      { newPassword },
    );
    return response.data;
  },
};
