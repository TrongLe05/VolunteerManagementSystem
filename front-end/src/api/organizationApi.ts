import axiosClient from "@/api/axiosClient";
import type { Organization } from "@/types/auth.types";

export interface CreateOrganizationRequest {
  parentId?: string | null;
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateOrganizationRequest {
  id: string;
  parentId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export const organizationApi = {
  getAll: async (searchTerm?: string): Promise<Organization[]> => {
    const response = await axiosClient.get<Organization[]>("/organizations", {
      params: searchTerm ? { searchTerm } : undefined,
    });
    return response.data;
  },

  create: async (data: CreateOrganizationRequest): Promise<string> => {
    const response = await axiosClient.post<string>("/organizations", data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateOrganizationRequest,
  ): Promise<boolean> => {
    const response = await axiosClient.put<boolean>(
      `/organizations/${id}`,
      data,
    );
    return response.data;
  },

  remove: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<boolean>(`/organizations/${id}`);
    return response.data;
  },
};
